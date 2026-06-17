import React, { useState, useEffect } from 'react';
import type { Proveedor } from '../../types/Proveedor';

interface ProveedorUbicacionModalProps {
  show: boolean;
  proveedor: Proveedor | null;
  onClose: () => void;
  onSaveUbicacion: (proveedorActualizado: Proveedor) => void;
}

export const ProveedorUbicacionModal: React.FC<ProveedorUbicacionModalProps> = ({
  show,
  proveedor,
  onClose,
  onSaveUbicacion
}) => {
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [direccion, setDireccion] = useState({
    calle: '',
    numero: '',
    piso: '',
    departamento: '',
    codigoPostal: '',
    ciudad: '',
    provincia: '',
    pais: 'Argentina'
  });

  useEffect(() => {
    if (show && proveedor) {
      setIsEditable(false);
      setDireccion({
        calle: proveedor.direccion?.calle || '',
        numero: proveedor.direccion?.numero || '',
        piso: proveedor.direccion?.piso || '',
        departamento: proveedor.direccion?.departamento || '',
        codigoPostal: proveedor.direccion?.codigoPostal || '',
        ciudad: proveedor.direccion?.ciudad || '',
        provincia: proveedor.direccion?.provincia || '',
        pais: proveedor.direccion?.pais || 'Argentina'
  });
    }
  }, [show, proveedor]);

  if (!show || !proveedor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const proveedorActualizado: Proveedor = {
      ...proveedor,
      direccion: {
        ...proveedor.direccion,
        ...direccion
      }
    };
    onSaveUbicacion(proveedorActualizado);
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1055 }}>
      <div className="modal-dialog modal-md modal-dialog-centered">
        <div className="modal-content text-white font-monospace border-warning" style={{ backgroundColor: '#18181b', border: '1px solid' }}>
          
          <div className="modal-header border-bottom border-secondary">
            <h6 className="modal-title text-warning fw-bold">
              <i className="bi bi-house-door me-2"></i>Localización — ID {proveedor.idProveedor}
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-2 text-white-50 small">
                Empresa: <span className="text-white fw-bold">{proveedor.nombreComercial}</span>
              </div>
              <hr className="border-secondary my-3" />

              <div className="row g-3 mb-3">
                <div className="col-md-8">
                  <label className="form-label small text-white-50 mb-1">Calle:</label>
                  <input 
                    type="text" required readOnly={!isEditable}
                    className={`form-control form-control-sm text-white ${isEditable ? 'bg-dark border-secondary' : 'bg-transparent border-0 ps-0 text-warning fw-bold fs-6'}`}
                    style={!isEditable ? { pointerEvents: 'none' } : {}}
                    value={direccion.calle}
                    onChange={(e) => setDireccion({ ...direccion, calle: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small text-white-50 mb-1">Número:</label>
                  <input 
                    type="text" required readOnly={!isEditable}
                    className={`form-control form-control-sm text-white ${isEditable ? 'bg-dark border-secondary' : 'bg-transparent border-0 ps-0 text-warning fw-bold fs-6'}`}
                    style={!isEditable ? { pointerEvents: 'none' } : {}}
                    value={direccion.numero}
                    onChange={(e) => setDireccion({ ...direccion, numero: e.target.value })}
                  />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label small text-white-50 mb-1">Piso:</label>
                  <input 
                    type="text" readOnly={!isEditable}
                    className={`form-control form-control-sm text-white ${isEditable ? 'bg-dark border-secondary' : 'bg-transparent border-0 ps-0 text-white fw-semibold'}`}
                    style={!isEditable ? { pointerEvents: 'none' } : {}}
                    placeholder={isEditable ? 'Opcional' : '—'}
                    value={direccion.piso}
                    onChange={(e) => setDireccion({ ...direccion, piso: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small text-white-50 mb-1">Depto:</label>
                  <input 
                    type="text" readOnly={!isEditable}
                    className={`form-control form-control-sm text-white ${isEditable ? 'bg-dark border-secondary' : 'bg-transparent border-0 ps-0 text-white fw-semibold'}`}
                    style={!isEditable ? { pointerEvents: 'none' } : {}}
                    placeholder={isEditable ? 'Opcional' : '—'}
                    value={direccion.departamento}
                    onChange={(e) => setDireccion({ ...direccion, departamento: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small text-white-50 mb-1">Cód. Postal:</label>
                  <input 
                    type="text" required readOnly={!isEditable}
                    className={`form-control form-control-sm text-white ${isEditable ? 'bg-dark border-secondary' : 'bg-transparent border-0 ps-0 text-white fw-semibold'}`}
                    style={!isEditable ? { pointerEvents: 'none' } : {}}
                    value={direccion.codigoPostal}
                    onChange={(e) => setDireccion({ ...direccion, codigoPostal: e.target.value })}
                  />
                </div>
              </div>

              <div className="row g-3 mb-2">
                <div className="col-md-4">
                  <label className="form-label small text-white-50 mb-1">Ciudad:</label>
                  <input 
                    type="text" required readOnly={!isEditable}
                    className={`form-control form-control-sm text-white ${isEditable ? 'bg-dark border-secondary' : 'bg-transparent border-0 ps-0 text-white fw-semibold'}`}
                    style={!isEditable ? { pointerEvents: 'none' } : {}}
                    value={direccion.ciudad}
                    onChange={(e) => setDireccion({ ...direccion, ciudad: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small text-white-50 mb-1">Provincia:</label>
                  <input 
                    type="text" required readOnly={!isEditable}
                    className={`form-control form-control-sm text-white ${isEditable ? 'bg-dark border-secondary' : 'bg-transparent border-0 ps-0 text-white fw-semibold'}`}
                    style={!isEditable ? { pointerEvents: 'none' } : {}}
                    value={direccion.provincia}
                    onChange={(e) => setDireccion({ ...direccion, provincia: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small text-white-50 mb-1">País:</label>
                  <input 
                    type="text" required readOnly={!isEditable}
                    className={`form-control form-control-sm text-white ${isEditable ? 'bg-dark border-secondary' : 'bg-transparent border-0 ps-0 text-white fw-semibold'}`}
                    style={!isEditable ? { pointerEvents: 'none' } : {}}
                    value={direccion.pais}
                    onChange={(e) => setDireccion({ ...direccion, pais: e.target.value })}
                  />
                </div>
              </div>

            </div>
            
            <div className="modal-footer border-top border-secondary d-flex justify-content-between py-2">
              <div>
                {!isEditable && (
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-warning fw-bold px-3"
                    onClick={() => setIsEditable(true)}
                  >
                    <i className="bi bi-pencil-fill me-1"></i> Modificar Ubicación
                  </button>
                )}
              </div>
              <div className="d-flex gap-2">
                <button style={{ backgroundColor: '#b91c1c', border: 'none' }} type="button" className="btn btn-sm btn-secondary px-3" onClick={onClose}>
                  {isEditable ? 'Cancelar' : 'Cerrar'}
                </button>
                {isEditable && (
                  <button type="submit" className="btn btn-sm btn-warning text-dark fw-bold px-3">
                    Guardar Cambios
                  </button>
                )}
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};