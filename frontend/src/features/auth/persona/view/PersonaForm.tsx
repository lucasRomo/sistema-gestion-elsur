import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../Context/ThemeContext';
import { personaService, type TipoDocumento } from '../service/personaService';

interface PersonaFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSiguiente: (e: React.FormEvent) => void;
  onVolver: () => void;
  titulo?: string;
  clientes?: any[];
}

export const PersonaForm: React.FC<PersonaFormProps> = ({ 
  formData, 
  setFormData, 
  onSiguiente, 
  onVolver, 
  titulo = "Registrar Nuevo Cliente", 
  clientes = [] 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables adaptativas de color según el tema activo
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const inputBg = isDark ? '#222226' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const inputTextColor = isDark ? '#ffffff' : '#0f172a';
  
  const [showTipoDoc, setShowTipoDoc] = useState(false);
  const [errores, setErrores] = useState<any>({});
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);

  // Cargar lista de tipos de documento a través del servicio
  useEffect(() => {
    let isMounted = true;
    personaService.obtenerTiposDocumento().then(data => {
      if (isMounted) setTiposDocumento(data);
    });
    return () => { isMounted = false; };
  }, []);

  // Inicialización de campos de formulario
  useEffect(() => {
    setFormData({
      nombre: '',
      apellido: '',
      tipoDocumento: '',
      numeroDocumento: '',
      email: '',
      telefono: '',
      calle: '',
      numero: '',
      piso: '',
      depto: '',
      codPostal: '',
      ciudad: '',
      provincia: '',
      pais: '',
      razonSocial: '',
      personaDeContacto: '',
      limiteCredito: '0'
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
      const target = e.target as HTMLFormElement;
      const emailInput = target.querySelector('input[type="email"]') as HTMLInputElement;
      const dniInput = target.querySelector('input[placeholder="N° de Documento"]') as HTMLInputElement;

      const emailNuevo = formData.email?.trim().toLowerCase();
      const dniNuevo = formData.numeroDocumento?.trim();

      // Validar duplicados contra la lista de clientes existente
      const existeEmail = clientes?.some((c: any) => c.persona?.email?.toLowerCase() === emailNuevo);
      const existeDni = clientes?.some((c: any) => c.persona?.numeroDocumento === dniNuevo);

      if (existeEmail && emailInput) {
        emailInput.setCustomValidity("Este email ya está registrado para otro cliente");
        emailInput.reportValidity();
        return;
      }

      if (existeDni && dniInput) {
        dniInput.setCustomValidity("Este número de documento ya está registrado");
        dniInput.reportValidity();
        return;
      }

      if (!formData.tipoDocumento) {
        alert("Por favor seleccione un Tipo de Documento");
        return;
      }

      onSiguiente(e);
    } catch (error) {
      console.error("Error validando duplicados:", error);
      alert("Error al validar los datos del cliente.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-1">
      <h3 className="text-center mb-4 fw-bold" style={{ color: isDark ? '#ffffff' : '#0dcaf0' }}>
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

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: labelColor }}>Tipo de Documento:</label>
          <div className="position-relative">
            <input
              type="text"
              readOnly
              autoComplete="off"
              className="form-control"
              style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor, cursor: 'pointer' }}
              value={
                tiposDocumento.find((t: any) => t.idTipoDocumento.toString() === formData.tipoDocumento?.toString())
                  ?.nombreTipo ||
                tiposDocumento.find((t: any) => t.idTipoDocumento.toString() === formData.tipoDocumento?.toString())
                  ?.nombre ||
                'Seleccione Un Tipo'
              }
              onFocus={() => setShowTipoDoc(true)}
              onClick={() => setShowTipoDoc(true)}
              onBlur={() => setTimeout(() => setShowTipoDoc(false), 200)}
            />
            {showTipoDoc && (
              <div
                className={`position-absolute w-100 shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
                style={{ maxHeight: '180px', zIndex: 1060, border: `1px solid ${inputBorder}`, top: '100%', left: 0 }}
              >
                {tiposDocumento.map((t: any) => {
                  const isSelected = t.idTipoDocumento.toString() === formData.tipoDocumento?.toString();
                  return (
                    <div
                      key={t.idTipoDocumento}
                      className="p-2 border-bottom text-truncate"
                      style={{
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        backgroundColor: isSelected ? '#0284c7' : (isDark ? '#27272a' : '#f8fafc'),
                        color: isSelected ? '#ffffff' : (isDark ? '#e4e4e7' : '#1e293b')
                      }}
                      onMouseDown={() => {
                        handleChange('tipoDocumento', t.idTipoDocumento);
                        setShowTipoDoc(false);
                      }}
                    >
                      <span className="fw-semibold">{t.nombreTipo || t.nombre}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
            className="form-control" 
            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
            placeholder="Email@example.com" 
            value={formData.email || ""} 
            onChange={e => handleChange('email', e.target.value)} 
            onInput={(e: any) => e.target.setCustomValidity("")}
            required 
          />
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
            value={formData.ciudad || ""} 
            onChange={e => handleChange('ciudad', e.target.value)} 
            pattern="^([A-Za-zÁ-Úá-ú\s]+)?$" 
            onInvalid={(e: any) => {
              if (e.target.validity.patternMismatch) {
                e.target.setCustomValidity("El campo de Ciudad solo puede tener letras");
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
            value={formData.provincia || ""} 
            onChange={e => handleChange('provincia', e.target.value)} 
            pattern="^([A-Za-zÁ-Úá-ú\s]+)?$" 
            onInvalid={(e: any) => {
              if (e.target.validity.patternMismatch) {
                e.target.setCustomValidity("El campo de Província solo puede tener letras");
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
            value={formData.pais || ""} 
            onChange={e => handleChange('pais', e.target.value)} 
            pattern="^([A-Za-zÁ-Úá-ú\s]+)?$" 
            onInvalid={(e: any) => {
              if (e.target.validity.patternMismatch) {
                e.target.setCustomValidity("El campo de País solo puede tener letras");
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
          style={{ backgroundColor: '#3b7a44', border: 'none', borderRadius: '8px', color: '#ffffff' }}
        >
          Siguiente
        </button>
      </div>
    </form>
  );
};