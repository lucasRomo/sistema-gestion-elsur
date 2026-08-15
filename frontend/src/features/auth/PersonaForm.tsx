import React, { useState, useEffect } from 'react';
import { useTheme } from '../../Context/ThemeContext';

interface PersonaFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSiguiente: (e: React.FormEvent) => void;
  onVolver: () => void;
  titulo?: string;
}

export const PersonaForm: React.FC<PersonaFormProps> = ({ formData, setFormData, onSiguiente, onVolver, titulo = "Registrar Nuevo Cliente" }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables adaptativas de color según el tema activo
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const inputBg = isDark ? '#222226' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const inputTextColor = isDark ? '#ffffff' : '#0f172a';

  const [errores, setErrores] = useState<any>({});
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);

  // Cargamos la lista al montar el componente de registro
  useEffect(() => {
    fetch('http://localhost:8080/api/tipos-documento')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => setTiposDocumento(data))
      .catch(() => {
        // Fallback dinámico con ambas claves por compatibilidad
        setTiposDocumento([
          { idTipoDocumento: 1, nombreTipo: 'DNI', nombre: 'DNI' },
          { idTipoDocumento: 2, nombreTipo: 'CUIT', nombre: 'CUIT' },
          { idTipoDocumento: 3, nombreTipo: 'CUIL', nombre: 'CUIL' },
          { idTipoDocumento: 4, nombreTipo: 'PASAPORTE', nombre: 'PASAPORTE' }
        ]);
      });
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errores[field]) setErrores((prev: any) => ({ ...prev, [field]: null }));
  };

  const getMaxLength = () => {
    const tipo = tiposDocumento.find(t => t.idTipoDocumento.toString() === formData.tipoDocumento?.toString());
    if (!tipo) return 11;

    const nombreStr = (tipo.nombreTipo || tipo.nombre || '').toUpperCase();
    switch (nombreStr) {
      case 'DNI': return 8;
      case 'PASAPORTE': return 9;
      case 'CUIT':
      case 'CUIL': return 11;
      default: return 11;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 1. Validar Email contra el backend
      const resEmail = await fetch(`http://localhost:8080/api/usuarios/exists?email=${formData.email}`);
      const existeEmail = await resEmail.json();
      
      // 2. Validar Documento contra el backend
      const resDni = await fetch(`http://localhost:8080/api/usuarios/exists?dni=${formData.numeroDocumento}`);
      const existeDni = await resDni.json();

      if (existeEmail || existeDni) {
        setErrores({
          email: existeEmail ? "Este email ya está registrado" : null,
          numeroDocumento: existeDni ? "Este número de documento ya está registrado" : null
        });
        return; // Detiene el flujo si hay duplicados
      }

      // Si pasa los controles de duplicados, avanza al paso 2 (Datos Comerciales)
      onSiguiente(e);
    } catch (error) {
      console.error("Error validando duplicados:", error);
      alert("Error al conectar con el servidor para validar datos.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-1">
      <h3 className="text-center mb-4 fw-bold text-info">
        <i className="bi bi-person-plus-fill me-2"></i>{titulo}
      </h3>
      
      <div className="row g-3 mx-0">
        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>Nombre:</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="Nombre" 
            value={formData.nombre} 
            onChange={e => handleChange('nombre', e.target.value)} 
            required pattern="[A-Za-zÁ-Úá-ú\s]+" 
            onInvalid={(e: any) => {
              if (e.target.validity.valueMissing) {
                e.target.setCustomValidity("El Campo de Nombre No puede Estar Vacío");
              } else {
                e.target.setCustomValidity("El Campo de Nombre solo debe contener letras");
              }
            }}
            onInput={(e: any) => e.target.setCustomValidity("")}
          />
        </div>

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>Apellido:</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="Apellido" 
            value={formData.apellido} 
            onChange={e => handleChange('apellido', e.target.value)} 
            required pattern="[A-Za-zÁ-Úá-ú\s]+" 
            onInvalid={(e: any) => {
              if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Apellido No puede Estar Vacío");
              else e.target.setCustomValidity("El Campo de Apellido solo debe contener letras");
            }}
            onInput={(e: any) => e.target.setCustomValidity("")}
          />
        </div>

        {/* Selector Dinámico Vinculado al idTipoDocumento */}
        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>Tipo de Documento:</label>
          <select 
            className="form-select" 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            value={formData.tipoDocumento || ""} 
            onChange={e => handleChange('tipoDocumento', e.target.value)} 
            required
          >
            <option value="" style={{ backgroundColor: inputBg, color: inputTextColor }}>Seleccione Un Tipo</option>
            {tiposDocumento.map((t: any) => (
              <option key={t.idTipoDocumento} value={t.idTipoDocumento} style={{ backgroundColor: inputBg, color: inputTextColor }}>
                {t.nombreTipo || t.nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>N° de Documento / CUIT:</label>
          <input 
            type="text" 
            className={`form-control ${errores.numeroDocumento ? 'is-invalid' : ''}`} 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="N° de Documento" 
            value={formData.numeroDocumento || ""} 
            onChange={e => handleChange('numeroDocumento', e.target.value)}
            pattern={`[0-9]{${getMaxLength()}}`}
            onInvalid={(e: any) => {
              const tipo = tiposDocumento.find(t => t.idTipoDocumento.toString() === formData.tipoDocumento?.toString());
              const nombreTipo = tipo ? (tipo.nombreTipo || tipo.nombre) : "documento";
              const longitudRequerida = getMaxLength();

              if (e.target.validity.patternMismatch) {
                e.target.setCustomValidity(`El ${nombreTipo} debe tener ${longitudRequerida} números para continuar`);
              } else if (e.target.validity.valueMissing) {
                e.target.setCustomValidity("Este campo es obligatorio");
              }
            }}
            onInput={(e: any) => e.target.setCustomValidity("")}
            required 
          />
          {errores.numeroDocumento && <div className="text-danger small mt-1"><i className="bi bi-exclamation-circle me-1"></i>{errores.numeroDocumento}</div>}
        </div>

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>Email:</label>
          <input 
            type="email" 
            className={`form-control ${errores.email ? 'is-invalid' : ''}`} 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="Email@example.com" 
            value={formData.email} 
            onChange={e => handleChange('email', e.target.value)} 
            required 
          />
          {errores.email && <div className="text-danger small mt-1"><i className="bi bi-exclamation-circle me-1"></i>{errores.email}</div>}
        </div>

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>Teléfono:</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="Teléfono" 
            value={formData.telefono} 
            onChange={e => handleChange('telefono', e.target.value)} 
            required pattern="[0-9]+"
            onInvalid={(e: any) => {
              if (e.target.validity.valueMissing) {
                e.target.setCustomValidity("El Campo de Teléfono No puede Estar Vacío");
              } else if (e.target.validity.patternMismatch) {
                e.target.setCustomValidity("En el Campo Telefono solo se permiten números");
              }
            }}
            onInput={(e: any) => e.target.setCustomValidity("")}
          />
        </div>

        <div className="col-md-8 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>Calle:</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="Calle" 
            value={formData.calle} 
            onChange={e => handleChange('calle', e.target.value)} 
            required pattern="[A-Za-zÁ-Úá-ú\s\.]+" 
            onInvalid={(e: any) => {
              if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Calle No puede Estar Vacío");
              else e.target.setCustomValidity("El Campo de Calle solo debe contener letras");
            }}
            onInput={(e: any) => e.target.setCustomValidity("")}
          />
        </div>

        <div className="col-md-4 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>Número:</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="Número" 
            value={formData.numero} 
            onChange={e => handleChange('numero', e.target.value)} 
            required pattern="[0-9]+" 
            onInvalid={(e: any) => {
              if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Número No puede Estar Vacío");
              else e.target.setCustomValidity("El Campo de Número solo debe contener Números");
            }}
            onInput={(e: any) => e.target.setCustomValidity("")}
          />
        </div>

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>Piso:</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="Piso (opcional)" 
            value={formData.piso} 
            onChange={e => handleChange('piso', e.target.value)} 
          />
        </div>

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>Departamento:</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="Departamento (Opcional)" 
            value={formData.depto} 
            onChange={e => handleChange('depto', e.target.value)} 
          />
        </div>

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>Cód. Postal:</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="Código Postal" 
            value={formData.codPostal} 
            onChange={e => handleChange('codPostal', e.target.value)} 
            required pattern="[0-9]+" 
            onInvalid={(e: any) => {
              if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Código Postal No puede Estar Vacío");
              else e.target.setCustomValidity("El Campo de Código postal solo debe contener Números");
            }}
            onInput={(e: any) => e.target.setCustomValidity("")}
          />
        </div>

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>Ciudad:</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="Ciudad (Opcional)" 
            value={formData.ciudad} 
            onChange={e => handleChange('ciudad', e.target.value)} 
            required pattern="[A-Za-zÁ-Úá-ú\s]+" 
            onInvalid={(e: any) => {
              if (e.target.validity.valueMissing) {
                e.target.setCustomValidity("El Campo de Ciudad No puede Estar Vacío");
              } else if (e.target.validity.patternMismatch) {
                e.target.setCustomValidity("El campo de Ciudad solo debe contener letras");
              }
            }}
            onInput={(e: any) => e.target.setCustomValidity("")} 
          />
        </div>

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>Provincia:</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="Provincia (Opcional)" 
            value={formData.provincia} 
            onChange={e => handleChange('provincia', e.target.value)} 
            required pattern="[A-Za-zÁ-Úá-ú\s]+" 
            onInvalid={(e: any) => {
              if (e.target.validity.valueMissing) {
                e.target.setCustomValidity("El Campo de Província No puede Estar Vacío");
              } 
              else if (e.target.validity.patternMismatch) {
                e.target.setCustomValidity("El Campo de Província solo debe contener letras");
              }
            }}
            onInput={(e: any) => e.target.setCustomValidity("")}
          />
        </div>

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>País:</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="País (Opcional)" 
            value={formData.pais} 
            onChange={e => handleChange('pais', e.target.value)} 
            required pattern="[A-Za-zÁ-Úá-ú\s]+" 
            onInvalid={(e: any) => {
              if (e.target.validity.valueMissing) {
                e.target.setCustomValidity("El Campo de País No puede Estar Vacío");
              } 
              else if (e.target.validity.patternMismatch) {
                e.target.setCustomValidity("El Campo de País solo debe contener letras");
              }
            }}
            onInput={(e: any) => e.target.setCustomValidity("")}
          />
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4 border-top pt-3 mx-1" style={{ borderColor: inputBorder }}>
        <button 
          type="button" 
          className="btn btn-secondary px-5 fw-semibold" 
          onClick={onVolver} 
          style={{ borderRadius: '8px', color: '#ffffff' }}
        >
          Volver
        </button>
        <button 
          type="submit" 
          className="btn btn-success px-5 fw-semibold" 
          style={{ backgroundColor: '#16a34a', border: 'none', borderRadius: '8px', color: '#ffffff' }}
        >
          Siguiente
        </button>
      </div>
    </form>
  );
};