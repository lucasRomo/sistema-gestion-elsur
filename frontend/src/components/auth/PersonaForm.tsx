import React, { useState } from 'react';

interface PersonaFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSiguiente: (e: React.FormEvent) => void;
  onVolver: () => void;
}

export const PersonaForm: React.FC<PersonaFormProps> = ({ formData, setFormData, onSiguiente, onVolver }) => {
  const [errores, setErrores] = useState<any>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    // Limpiar error al editar
    if (errores[field]) setErrores((prev: any) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validar Email contra el backend
    try {
      const resEmail = await fetch(`http://localhost:8080/api/usuarios/exists?email=${formData.email}`);
      const existeEmail = await resEmail.json();
      
      // 2. Validar DNI contra el backend
      const resDni = await fetch(`http://localhost:8080/api/usuarios/exists?dni=${formData.numeroDocumento}`);
      const existeDni = await resDni.json();

      if (existeEmail || existeDni) {
        setErrores({
          email: existeEmail ? "Este email ya está registrado" : null,
          numeroDocumento: existeDni ? "Este DNI ya está registrado" : null
        });
        return; // Detenemos el envío
      }

      // Si todo está ok, continuamos
      onSiguiente(e);
    } catch (error) {
      console.error("Error validando duplicados:", error);
      alert("Error al conectar con el servidor para validar datos.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-white text-center mb-4 fw-semibold">Registro de Usuario</h3>
      
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label text-light">Nombre:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Nombre" value={formData.nombre} onChange={e => handleChange('nombre', e.target.value)} required />
        </div>
        <div className="col-md-6">
          <label className="form-label text-light">Apellido:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Apellido" value={formData.apellido} onChange={e => handleChange('apellido', e.target.value)} required />
        </div>

        <div className="col-md-6">
          <label className="form-label text-light">Tipo de Documento:</label>
          <select className="form-select bg-dark text-white border-secondary" value={formData.tipoDocumento} onChange={e => handleChange('tipoDocumento', e.target.value)} required>
            <option value="">Seleccione Un Tipo</option>
            <option value="1">DNI</option>
            <option value="2">Pasaporte</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label text-light">N° de Documento:</label>
          <input type="text" className={`form-control bg-dark text-white border-secondary ${errores.numeroDocumento ? 'is-invalid' : ''}`} placeholder="N° de Documento" value={formData.numeroDocumento} onChange={e => handleChange('numeroDocumento', e.target.value)} required />
          {errores.numeroDocumento && <div className="text-danger small mt-1">{errores.numeroDocumento}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label text-light">Email:</label>
          <input type="email" className={`form-control bg-dark text-white border-secondary ${errores.email ? 'is-invalid' : ''}`} placeholder="Email@example.com" value={formData.email} onChange={e => handleChange('email', e.target.value)} required />
          {errores.email && <div className="text-danger small mt-1">{errores.email}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label text-light">Teléfono:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Teléfono" value={formData.telefono} onChange={e => handleChange('telefono', e.target.value)} />
        </div>

        <div className="col-md-8">
          <label className="form-label text-light">Calle:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Calle" value={formData.calle} onChange={e => handleChange('calle', e.target.value)} required />
        </div>
        <div className="col-md-4">
          <label className="form-label text-light">Número:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Número" value={formData.numero} onChange={e => handleChange('numero', e.target.value)} required />
        </div>

        <div className="col-md-6">
          <label className="form-label text-light">Piso:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Piso (opcional)" value={formData.piso} onChange={e => handleChange('piso', e.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label text-light">Departamento:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Departamento (Opcional)" value={formData.depto} onChange={e => handleChange('depto', e.target.value)} />
        </div>

        <div className="col-md-6">
          <label className="form-label text-light">Cód.Postal:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Código Postal" value={formData.codPostal} onChange={e => handleChange('codPostal', e.target.value)} required />
        </div>
        <div className="col-md-6">
          <label className="form-label text-light">Ciudad:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Ciudad (Opcional)" value={formData.ciudad} onChange={e => handleChange('ciudad', e.target.value)} />
        </div>

        <div className="col-md-6">
          <label className="form-label text-light">Provincia:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Provincia (Opcional)" value={formData.provincia} onChange={e => handleChange('provincia', e.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label text-light">País:</label>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="País (Opcional)" value={formData.pais} onChange={e => handleChange('pais', e.target.value)} />
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4">
        <button type="button" className="btn btn-danger px-5" onClick={onVolver} style={{ backgroundColor: '#a13b3b', border: 'none' }}>Volver</button>
        <button type="submit" className="btn btn-success px-5" style={{ backgroundColor: '#3b7a44', border: 'none' }}>Siguiente</button>
      </div>
    </form>
  );
};