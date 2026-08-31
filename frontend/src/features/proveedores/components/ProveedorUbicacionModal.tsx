import React, { useState, useEffect } from 'react';
import type { Proveedor } from '../types/Proveedor';
import { useTheme } from '../../../Context/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const modalBg = isDark ? '#1e1e24' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const titleColor = isDark ? '#f0e111' : '#f0e111';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const inputBg = isDark ? '#121214' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const readOnlyBg = isDark ? '#121214' : '#f1f5f9';

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
      ...proveedor,
      direccion: {
        ...proveedor.direccion,
        ...direccion,
        piso: direccion.piso || '',
        departamento: direccion.departamento || '',
        ciudad: direccion.ciudad || '',
        provincia: direccion.provincia || '',
        pais: direccion.pais || ''
      }
    };
    setDatosAEnviar(proveedorActualizado);
    setMostrarConfirmacion(true);
  };

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1055 }}>
        <div className="modal-dialog modal-md modal-dialog-centered">
          <div 
  className="modal-content font-monospace p-4 shadow" 
  style={{ 
    backgroundColor: modalBg, 
    border: '1.5px solid #e4c30c', 
    color: textColor 
  }}
>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: `1px solid ${modalBorder}` }}>
              <h4 className="m-0 fw-bold" style={{ color: '#e4c30c' }}>
                <i className={`bi ${isEditable ? 'bi-geo-alt-fill me-2' : 'bi-geo-alt-fill me-2'}`}></i>
                {isEditable ? 'Modificar Ubicación' : 'Ubicación del Proveedor'}
              </h4>
              <button 
                type="button" 
                className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
                onClick={onClose}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {[
                  { label: 'Calle', field: 'calle', col: 'col-md-8', pattern: "[A-Za-zÁ-Úá-ú\\s\\.]+", required: true, msg: "Calle solo debe contener letras" },
                  { label: 'Número', field: 'numero', col: 'col-md-4', pattern: "[0-9]+", required: true, msg: "Solo se permiten números" },
                  { label: 'Piso', field: 'piso', col: 'col-md-3', pattern: null, required: false, msg: "" },
                  { label: 'Depto', field: 'departamento', col: 'col-md-3', pattern: null, required: false, msg: "" },
                  { label: 'Cód. Postal', field: 'codigoPostal', col: 'col-md-6', pattern: "[0-9]+", required: true, msg: "Solo se permiten números" },
                  { label: 'Ciudad', field: 'ciudad', col: 'col-md-4', pattern: "^$|[A-Za-zÁ-Úá-ú\\s]+", required: false, msg: "Solo letras" },
                  { label: 'Provincia', field: 'provincia', col: 'col-md-4', pattern: "^$|[A-Za-zÁ-Úá-ú\\s]+", required: false, msg: "Solo letras" },
                  { label: 'País', field: 'pais', col: 'col-md-4', pattern: "^$|[A-Za-zÁ-Úá-ú\\s]+", required: false, msg: "Solo letras" }
                ].map((item) => (
                  <div key={item.field} className={item.col}>
                    <label className="form-label small fw-semibold m-0 mb-1" style={{ color: labelColor }}>
                      {item.label}
                    </label>
                    {isEditable ? (
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                        value={(direccion as any)[item.field]}
                        onChange={(e) => setDireccion({ ...direccion, [item.field]: e.target.value })}
                        required={item.required}
                        pattern={item.pattern || undefined}
                        onInvalid={(e: any) => {
                          if (e.target.validity.valueMissing) {
                            e.target.setCustomValidity(`El campo ${item.label} es obligatorio`);
                          } else if (e.target.validity.patternMismatch) {
                            e.target.setCustomValidity(item.msg);
                          }
                        }}
                        onInput={(e: any) => e.target.setCustomValidity("")}
                      />
                    ) : (
                      <div 
                        className="p-2 rounded border small" 
                        style={{ backgroundColor: readOnlyBg, borderColor: inputBorder, color: textColor }}
                      >
                        {(direccion as any)[item.field] || '—'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-between gap-2 mt-4 pt-3" style={{ borderTop: `1px solid ${modalBorder}` }}>
                <div>
                  {!isEditable ? (
                    <button type="button" className="btn btn-outline-warning btn-sm px-3" onClick={() => setIsEditable(true)}>
                      <i className="bi bi-pencil-square me-1"></i>Habilitar Edición
                    </button>
                  ) : (
                    <button type="button" className="btn btn-outline-danger btn-sm px-3" onClick={() => setIsEditable(false)}>Cancelar Edición</button>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-secondary btn-sm px-4 fw-bold" style={{ color: '#ffffff' }} onClick={onClose}>
                    Cerrar
                  </button>
                  {isEditable && (
                    <button 
                      type="submit" 
                      className="btn btn-info btn-sm px-4 fw-semibold"
                      style={{ 
                        color: isDark ? '#ffffff' : '#ffffff', 
                        backgroundColor: isDark ? '#dfbf0b' : '#dfbf0b', 
                        borderColor: 'transparent' 
                      }}
                    >
                      Confirmar
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-center shadow" 
              style={{ 
                border: '2px solid #8e45e0', 
                backgroundColor: isDark ? '#1a1a1c' : '#ffffff', 
                color: textColor,
                borderRadius: '12px' 
              }}
            >
              <i className="bi bi-exclamation-circle fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Modificar Ubicación?</h5>
              <p className="small" style={{ color: labelColor }}>Se actualizará la dirección asociada de forma permanente.</p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-outline-secondary btn-sm px-3 text-white" style={{ borderRadius: '6px', backgroundColor: '#e22e2e', borderColor: '#e62020'}} onClick={() => setMostrarConfirmacion(false)}>Volver</button>
                <button 
                  className="btn btn-sm px-3 text-white fw-bold" 
                  style={{ backgroundColor: '#2e9225', borderRadius: '6px' }} 
                  onClick={() => { 
                    if (datosAEnviar) onSaveUbicacion(datosAEnviar); 
                    setMostrarConfirmacion(false); 
                    onClose(); 
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};