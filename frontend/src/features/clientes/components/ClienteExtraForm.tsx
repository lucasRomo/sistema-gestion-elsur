import React from 'react';

export const ClienteExtraForm = ({ formData, setFormData, onRegistrar, onCerrar }: any) => {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog">
        <div className="modal-content p-4" style={{ backgroundColor: '#1b1b1b' }}>
          <form onSubmit={onRegistrar}>
            <h4 className="text-white mb-4">Datos Comerciales del Cliente</h4>
            
            <div className="mb-3">
              <label className="text-light">Razón Social:</label>
              <input 
                className="form-control"
                style={{ backgroundColor: '#1b1b1b', borderColor: '#292929'}}  
                value={formData.razonSocial || ''} 
                onChange={e => handleChange('razonSocial', e.target.value)} 
                required 
              />
            </div>

            <div className="mb-3">
              <label className="text-light">Persona de Contacto:</label>
              <input 
                className="form-control" 
                style={{ backgroundColor: '#1b1b1b', borderColor: '#292929'}}  
                value={formData.personaDeContacto || ''} 
                onChange={e => handleChange('personaDeContacto', e.target.value)} 
              />
            </div>           

            <div className="mb-3">
              <label className="text-light">Límite de Crédito:</label>
              <input 
                type="number" 
                className="form-control" 
                style={{ backgroundColor: '#1b1b1b', borderColor: '#292929'}}  
                value={formData.limiteCredito || ''} 
                onChange={e => handleChange('limiteCredito', e.target.value)} 
                required 
              />
            </div>
            
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-secondary w-100" onClick={onCerrar}>Volver</button>
              <button type="submit" className="btn btn-success w-100">Registrar Cliente</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};