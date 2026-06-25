import React, { useState, useEffect } from 'react';

interface PersonaFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSiguiente: (e: React.FormEvent) => void;
  onVolver: () => void;
}

export const PersonaForm: React.FC<PersonaFormProps> = ({ formData, setFormData, onSiguiente, onVolver }) => {
  const [errores, setErrores] = useState<any>({});
  // Lista dinámica de tipos de documento traída de la API de Java
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
        // Fallback de emergencia idéntico al del modal de edición
        setTiposDocumento([
          { idTipoDocumento: 1, nombre: 'DNI' },
          { idTipoDocumento: 2, nombre: 'CUIT' },
          { idTipoDocumento: 3, nombre: 'CUIL' },
          { idTipoDocumento: 4, nombre: 'PASAPORTE' }
        ]);
      });
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    // Limpiar error al editar el campo correspondiente
    if (errores[field]) setErrores((prev: any) => ({ ...prev, [field]: null }));
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
      <h3 className="text-white text-center mb-4 fw-bold text-info">
        <i className="bi bi-person-plus-fill me-2"></i>Registrar Nuevo Cliente
      </h3>
      
      <div className="row g-3 mx-0">
        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Nombre:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Nombre" value={formData.nombre} onChange={e => handleChange('nombre', e.target.value)} required />
        </div>
        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Apellido:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Apellido" value={formData.apellido} onChange={e => handleChange('apellido', e.target.value)} required />
        </div>

        {/* Selector Dinámico Vinculado al idTipoDocumento */}
        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Tipo de Documento:</label>
          <select 
            className="form-select bg-dark text-white border-secondary" 
            value={formData.tipoDocumento || ""} 
            onChange={e => handleChange('tipoDocumento', e.target.value)} 
            required
          >
            <option value="" style={{ backgroundColor: '#1a1a1c' }}>Seleccione Un Tipo</option>
            {tiposDocumento.map((t: any) => (
              <option key={t.idTipoDocumento} value={t.idTipoDocumento} style={{ backgroundColor: '#1a1a1c' }}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>N° de Documento / CUIT:</label>
          <input type="text" className={`form-control bg-dark text-white border-secondary ${errores.numeroDocumento ? 'is-invalid' : ''}`} placeholder="N° de Documento" value={formData.numeroDocumento} onChange={e => handleChange('numeroDocumento', e.target.value)} required />
          {errores.numeroDocumento && <div className="text-danger small mt-1"><i className="bi bi-exclamation-circle me-1"></i>{errores.numeroDocumento}</div>}
        </div>

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Email:</label>
          <input type="email" className={`form-control bg-dark text-white border-secondary ${errores.email ? 'is-invalid' : ''}`} placeholder="Email@example.com" value={formData.email} onChange={e => handleChange('email', e.target.value)} required />
          {errores.email && <div className="text-danger small mt-1"><i className="bi bi-exclamation-circle me-1"></i>{errores.email}</div>}
        </div>
        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Teléfono:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Teléfono" value={formData.telefono} onChange={e => handleChange('telefono', e.target.value)} />
        </div>

        <div className="col-md-8 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Calle:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Calle" value={formData.calle} onChange={e => handleChange('calle', e.target.value)} required />
        </div>
        <div className="col-md-4 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Número:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Número" value={formData.numero} onChange={e => handleChange('numero', e.target.value)} required />
        </div>

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Piso:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Piso (opcional)" value={formData.piso} onChange={e => handleChange('piso', e.target.value)} />
        </div>
        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Departamento:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Departamento (Opcional)" value={formData.depto} onChange={e => handleChange('depto', e.target.value)} />
        </div>

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Cód. Postal:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Código Postal" value={formData.codPostal} onChange={e => handleChange('codPostal', e.target.value)} required />
        </div>
        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Ciudad:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Ciudad (Opcional)" value={formData.ciudad} onChange={e => handleChange('ciudad', e.target.value)} />
        </div>

        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Provincia:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Provincia (Opcional)" value={formData.provincia} onChange={e => handleChange('provincia', e.target.value)} />
        </div>
        <div className="col-md-6 px-1">
          <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>País:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="País (Opcional)" value={formData.pais} onChange={e => handleChange('pais', e.target.value)} />
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4 border-top pt-3 mx-1" style={{ borderColor: '#3f3f46' }}>
        <button type="button" className="btn btn-danger px-5 fw-semibold" onClick={onVolver} style={{ backgroundColor: '#b91c1c', border: 'none', borderRadius: '8px' }}>Volver</button>
        <button type="submit" className="btn btn-success px-5 fw-semibold" style={{ backgroundColor: '#16a34a', border: 'none', borderRadius: '8px' }}>Siguiente</button>
      </div>
    </form>
  );
};