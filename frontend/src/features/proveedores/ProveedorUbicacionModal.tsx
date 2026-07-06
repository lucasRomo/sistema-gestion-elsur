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
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [datosAEnviar, setDatosAEnviar] = useState<Proveedor | null>(null);
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
      ...proveedor!,
      direccion: {
        ...proveedor!.direccion,
        ...direccion
      }
    };
    setDatosAEnviar(proveedorActualizado);
    setMostrarConfirmacion(true);
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1055 }}>
      <div className="modal-dialog modal-md modal-dialog-centered">
        <div className="modal-content bg-dark border-secondary p-4 text-white" style={{ border: '1px solid #3f3f46' }}>
          
          <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
            <h4 className="m-0 fw-bold text-warning">
              <i className={`bi ${isEditable ? 'bi-geo-alt-fill text-info' : 'bi-house-door'} me-2`}></i>
              {isEditable ? 'Modificar Ubicación' : 'Ubicación del Proveedor'}
            </h4>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {[
                { label: 'Calle', field: 'calle', col: 'col-md-8', pattern: "[A-Za-zÁ-Úá-ú\\s]+", msg: "Calle solo debe contener letras" },
                { label: 'Número', field: 'numero', col: 'col-md-4', pattern: "[0-9]+", msg: "Solo se permiten números" },
                { label: 'Piso', field: 'piso', col: 'col-md-3', pattern: null, msg: "" },
                { label: 'Depto', field: 'departamento', col: 'col-md-3', pattern: null, msg: "" },
                { label: 'Cód. Postal', field: 'codigoPostal', col: 'col-md-6', pattern: "[0-9]+", msg: "Solo se permiten números" },
                { label: 'Ciudad', field: 'ciudad', col: 'col-md-4', pattern: "[A-Za-zÁ-Úá-ú\\s]+", msg: "Solo letras" },
                { label: 'Provincia', field: 'provincia', col: 'col-md-4', pattern: "[A-Za-zÁ-Úá-ú\\s]+", msg: "Solo letras" },
                { label: 'País', field: 'pais', col: 'col-md-4', pattern: "[A-Za-zÁ-Úá-ú\\s]+", msg: "Solo letras" }
              ].map((item) => (
                <div key={item.field} className={item.col}>
                  <label className="form-label small text-secondary m-0">{item.label}</label>
                  {isEditable ? (
                    <input 
                      type="text" 
                      className="form-control form-control-sm bg-dark border-secondary text-white" 
                      value={(direccion as any)[item.field]}
                      onChange={(e) => setDireccion({ ...direccion, [item.field]: e.target.value })}
                      required={item.pattern !== null}
                      pattern={item.pattern || undefined}
                      onInvalid={(e: any) => e.target.setCustomValidity(e.target.validity.valueMissing ? `El campo ${item.label} es obligatorio` : item.msg)}
                      onInput={(e: any) => e.target.setCustomValidity("")}
                    />
                  ) : (
                    <div className="p-2 rounded bg-black border border-secondary text-light">{(direccion as any)[item.field] || '—'}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-between gap-2 mt-4 pt-3 border-top border-secondary">
              <div>
                {!isEditable ? (
                  <button type="button" className="btn btn-outline-info btn-sm px-3" onClick={() => setIsEditable(true)}>
                    <i className="bi bi-pencil-square me-1"></i>Habilitar Edición
                  </button>
                ) : (
                  <button type="button" className="btn btn-outline-secondary btn-sm px-3" onClick={() => setIsEditable(false)}>Cancelar Edición</button>
                )}
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary btn-sm px-4" onClick={onClose}>Cerrar</button>
                {isEditable && <button type="submit" className="btn btn-info btn-sm px-4 fw-semibold text-dark">Confirmar</button>}
              </div>
            </div>
          </form>
        </div>
      </div>

      {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content p-4 text-white text-center" style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px' }}>
              <i className="bi bi-exclamation-circle fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Modificar Ubicación?</h5>
              <p className="small text-secondary">Se actualizará la dirección asociada de forma permanente.</p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-outline-light btn-sm px-3" onClick={() => setMostrarConfirmacion(false)}>Volver</button>
                <button className="btn btn-sm px-3 text-white fw-bold" style={{ backgroundColor: '#2e9225' }} onClick={() => { if (datosAEnviar) onSaveUbicacion(datosAEnviar); setMostrarConfirmacion(false); onClose(); }}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};