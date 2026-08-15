// src/components/EmpleadoModal.tsx
import React from 'react';
import logoGesta from '../../../assets/logo-gestaprog.png'; // Ajusta la ruta a tu carpeta de assets

interface EmpleadoModalProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onRegistrar: (e: React.FormEvent) => void;
  onCerrar: () => void;
}

export const EmpleadoModal: React.FC<EmpleadoModalProps> = ({ formData, setFormData, onRegistrar, onCerrar }) => {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleValidarUsuario = async (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    const valor = input.value.trim();

    if (valor.length > 0) {
      try {
        const response = await fetch(`http://localhost:8080/api/usuarios/exists?nombreUsuario=${encodeURIComponent(valor)}`);
        if (response.ok) {
          const existe = await response.json();
          if (existe) {
            // Asignamos el mensaje personalizado y mostramos el globito flotante
            input.setCustomValidity("Usuario ya Registrado, Intente con uno Nuevo");
            input.reportValidity();
          } else {
            input.setCustomValidity("");
          }
        }
      } catch (error) {
        console.error("Error al validar nombre de usuario:", error);
      }
    }
  };

  return (
    <div className="modal d-block position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1040 }}>
      <div className="modal-dialog w-100 p-3" style={{ maxWidth: '440px' }}>
        <div className="modal-content p-4 rounded-4 border-secondary position-relative" style={{ backgroundColor: '#1e1e22', border: '1px solid #3f3f46' }}>
          

          <div className="position-absolute top-50 start-50 translate-middle opacity-5 text-center pointer-events-none" style={{ zIndex: 0 }}>
          </div>


          <div className="position-relative" style={{ zIndex: 1 }}>
            <form onSubmit={onRegistrar}>
              <h4 className="text-white text-center mb-4 fw-semibold">Datos Específicos del Empleado</h4>
              
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label text-light small">Usuario:</label>
                  <input 
                    type="text" 
                    className="form-control bg-dark text-white border-secondary" 
                    placeholder="Ingrese un Nombre de Usuario" 
                    value={formData.nombreUsuario} 
                    onChange={e => {
                      e.target.setCustomValidity("");
                      handleChange('nombreUsuario', e.target.value);
                    }} 
                    onBlur={handleValidarUsuario}
                    required 
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-light small">Contraseña:</label>
                  <input type="password" className="form-control bg-dark text-white border-secondary" placeholder="Ingrese una Contraseña" value={formData.password} onChange={e => handleChange('password', e.target.value)} required />
                </div>

                <div className="col-12">
                  <label className="form-label text-light small" >Fecha de Contratación:</label>
                  <input type="date" className="form-control bg-dark text-white border-secondary" style={{ colorScheme: 'dark' }} value={formData.fechaContratacion} onChange={e => handleChange('fechaContratacion', e.target.value)} required />
                </div>


                <div className="col-12">
                  <label className="form-label text-light small">Cargo:</label>
                  <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Ingrese el Cargo" value={formData.cargo} onChange={e => handleChange('cargo', e.target.value)} required pattern="[A-Za-zÁ-Úá-ú\s]+" 
                  onInvalid={(e: any) => {
                  if (e.target.validity.valueMissing) e.target.setCustomValidity("Completa este campo");
                  else e.target.setCustomValidity("El Campo Cargo solo debe contener letras");
                  }}
                  onInput={(e: any) => e.target.setCustomValidity("")}/>
                </div>


                <div className="col-12 mb-4">
                 <label className="form-label text-light small">Salario:</label>
                 <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Ingrese el Salario" value={formData.salario} onChange={(e) => { const value = e.target.value;
                 if (value === "" || /^\d*\.?\d*$/.test(value)) {
                 handleChange('salario', value);}}}
                 required/>
                </div>
                
              </div>

              <div className="d-flex flex-column gap-2 mt-2">
                <button type="submit" className="btn btn-success w-100 py-2 fw-semibold" style={{ backgroundColor: '#3b7a44', border: 'none' }}>Registrar Nuevo Empleado</button>
                <button type="button" className="btn btn-secondary w-100 py-2" onClick={onCerrar} style={{ border: 'none' }}>Volver</button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};