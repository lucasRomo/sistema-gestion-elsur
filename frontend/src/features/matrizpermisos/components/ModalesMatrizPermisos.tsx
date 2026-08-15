import React from 'react';
import type { Usuario } from '../service/matrizPermisosService';

interface Props {
  mostrarModalNuevoRol: boolean;
  setMostrarModalNuevoRol: (val: boolean) => void;
  nuevoRolNombre: string;
  setNuevoRolNombre: (val: string) => void;
  handleCrearRol: () => void;

  mostrarModalConfirmacion: boolean;
  setMostrarModalConfirmacion: (val: boolean) => void;
  confirmarGuardado: () => void;
  usuarioEditar: Usuario | null;

  mostrarModalExito: boolean;
  setMostrarModalExito: (val: boolean) => void;
  mensajeExitoTexto: string;

  mostrarModalBloqueo: boolean;
  setMostrarModalBloqueo: (val: boolean) => void;
  mensajeBloqueoTexto: string;
}

export const ModalesMatrizPermisos: React.FC<Props> = ({
  mostrarModalNuevoRol,
  setMostrarModalNuevoRol,
  nuevoRolNombre,
  setNuevoRolNombre,
  handleCrearRol,
  mostrarModalConfirmacion,
  setMostrarModalConfirmacion,
  confirmarGuardado,
  usuarioEditar,
  mostrarModalExito,
  setMostrarModalExito,
  mensajeExitoTexto,
  mostrarModalBloqueo,
  setMostrarModalBloqueo,
  mensajeBloqueoTexto
}) => {
  return (
    <>
      {/* Modal Nuevo Rol */}
      {mostrarModalNuevoRol && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #8e45e0', borderRadius: '12px' }}>
              <h5 className="fw-bold mb-3 text-center" style={{ color: '#8e45e0', fontSize: '1rem' }}>Crear Nuevo Perfil Global</h5>
              <div className="mb-3">
                <label className="text-secondary mb-1 small" style={{ fontSize: '0.75rem' }}>Nombre del Perfil (Ej: CAJERO)</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm bg-dark text-white border-secondary" 
                  value={nuevoRolNombre}
                  onChange={(e) => setNuevoRolNombre(e.target.value)}
                  placeholder="Escriba aquí..."
                />
              </div>
              <div className="d-flex justify-content-between gap-2">
                <button className="btn btn-sm w-50 fw-bold text-white" style={{ backgroundColor: '#a52a2a' }} onClick={() => setMostrarModalNuevoRol(false)}>Cancelar</button>
                <button className="btn btn-sm w-50 fw-bold text-white" style={{ backgroundColor: '#2b7a3e' }} onClick={handleCrearRol}>Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación */}
      {mostrarModalConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #8e45e0', borderRadius: '12px' }}>
              <div className="modal-body text-center py-2">
                <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '2.5rem' }}></i>
                <h5 className="mt-2 fw-bold">¡Atención!</h5>
                <p className="text-secondary mt-1 small" style={{ fontSize: '0.75rem' }}>
                  {usuarioEditar 
                    ? `Estás modificando la configuración de permisos para ${usuarioEditar.nombreUsuario}.`
                    : `Estás modificando la plantilla del Perfil Global.`}
                </p>
                <div className="d-flex justify-content-center gap-2 mt-3">
                  <button className="btn btn-sm px-3 fw-bold w-50" style={{ backgroundColor: '#a52a2a', color: '#ffffff', border: 'none' }} onClick={() => setMostrarModalConfirmacion(false)}>Cancelar</button>
                  <button className="btn btn-sm px-3 fw-bold w-50" style={{ backgroundColor: '#2b7a3e', color: '#ffffff', border: 'none' }} onClick={confirmarGuardado}>Confirmar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Éxito */}
      {mostrarModalExito && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #20c997', borderRadius: '12px' }}>
              <div className="modal-body text-center py-3">
                <div className="d-flex justify-content-center mb-2">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: 'transparent', border: '2px solid #20c997' }}>
                    <i className="bi bi-check-lg text-success" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
                <h6 className="fw-bold my-2 text-white">{mensajeExitoTexto}</h6>
                <button className="btn btn-sm px-4 fw-bold mt-2" style={{ backgroundColor: '#a52a2a', color: '#ffffff', borderRadius: '6px', border: 'none' }} onClick={() => setMostrarModalExito(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bloqueo / Advertencia */}
      {mostrarModalBloqueo && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #ffc107', borderRadius: '12px' }}>
              <div className="modal-body text-center py-2">
                <div className="d-flex justify-content-center mb-2">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '2px solid #ffc107' }}>
                    <i className="bi bi-lock-fill text-warning" style={{ fontSize: '1.8rem' }}></i>
                  </div>
                </div>
                <p className="fw-bold mb-2 text-white px-1 small" style={{ fontSize: '0.8rem' }}>{mensajeBloqueoTexto}</p>
                <button className="btn btn-sm px-4 fw-bold text-white mt-1" style={{ backgroundColor: '#a52a2a', borderRadius: '6px' }} onClick={() => setMostrarModalBloqueo(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};