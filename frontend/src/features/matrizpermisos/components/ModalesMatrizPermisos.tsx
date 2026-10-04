import React from 'react';
import type { Usuario } from '../service/matrizPermisosService';
import { useTheme } from '../../../Context/ThemeContext';

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
  avisoConversionPerfil: string | null;

  mostrarModalExito: boolean;
  setMostrarModalExito: (val: boolean) => void;
  mensajeExitoTexto: string;

  mostrarModalBloqueo: boolean;
  setMostrarModalBloqueo: (val: boolean) => void;
  mensajeBloqueoTexto: string;

  mostrarModalConfirmarEliminarRol: boolean;
  setMostrarModalConfirmarEliminarRol: (val: boolean) => void;
  confirmarEliminarRol: () => void;
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
  avisoConversionPerfil,
  mostrarModalExito,
  setMostrarModalExito,
  mensajeExitoTexto,
  mostrarModalBloqueo,
  setMostrarModalBloqueo,
  mensajeBloqueoTexto,
  mostrarModalConfirmarEliminarRol,
  setMostrarModalConfirmarEliminarRol,
  confirmarEliminarRol
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const modalBg = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const mutedColor = isDark ? '#a1a1aa' : '#64748b';
  const inputClass = isDark ? 'bg-dark text-white border-secondary' : 'bg-white text-dark border-secondary-subtle';
  const caja = (borde: string): React.CSSProperties => ({ backgroundColor: modalBg, color: textColor, border: `1px solid ${borde}`, borderRadius: '12px' });
  const btnRojo: React.CSSProperties = { backgroundColor: '#dc3545', color: '#ffffff', border: 'none' };
  const btnVerde: React.CSSProperties = { backgroundColor: '#2b7a3e', color: '#ffffff', border: 'none' };
  return (
    <>
      {mostrarModalNuevoRol && (
        <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content p-3" style={caja('#8e45e0')}>
              <h5 className="fw-bold mb-3 text-center" style={{ color: '#8e45e0', fontSize: '1rem' }}>Crear Nuevo Perfil Global</h5>
              <div className="mb-3">
                <label className="mb-1 small" style={{ fontSize: '0.75rem', color: mutedColor }}>Nombre del Perfil (Ej: CAJERO)</label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${inputClass}`}
                  value={nuevoRolNombre}
                  onChange={(e) => setNuevoRolNombre(e.target.value)}
                  placeholder="Escriba aquí..."
                />
              </div>
              <div className="d-flex justify-content-between gap-2">
                <button className="btn btn-sm w-50 fw-bold" style={btnRojo} onClick={() => setMostrarModalNuevoRol(false)}>Cancelar</button>
                <button className="btn btn-sm w-50 fw-bold" style={btnVerde} onClick={handleCrearRol}>Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalConfirmacion && (
        <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px' }}>
            <div className="modal-content p-3" style={caja('#8e45e0')}>
              <div className="modal-body text-center py-2">
                <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '2.5rem' }}></i>
                <h5 className="mt-2 fw-bold">¿Guardar los cambios?</h5>
                <p className="mt-1 small" style={{ fontSize: '0.8rem', color: mutedColor }}>
                  {usuarioEditar
                    ? `Estás modificando la configuración de permisos para ${usuarioEditar.nombreUsuario}.`
                    : `Estás modificando la plantilla del Perfil Global.`}
                </p>
                {avisoConversionPerfil && (
                  <p className="small fw-bold rounded p-2 mb-0" style={{ fontSize: '0.78rem', color: isDark ? '#fde047' : '#92400e', backgroundColor: isDark ? 'rgba(234,179,8,0.12)' : '#fef3c7' }}>
                    {avisoConversionPerfil}
                  </p>
                )}
                <div className="d-flex justify-content-center gap-2 mt-3">
                  <button className="btn btn-sm px-3 fw-bold w-50" style={btnRojo} onClick={() => setMostrarModalConfirmacion(false)}>Cancelar</button>
                  <button className="btn btn-sm px-3 fw-bold w-50" style={btnVerde} onClick={confirmarGuardado}>Confirmar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalExito && (
        <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content p-3" style={caja(isDark ? '#8e45e0' : '#cbd5e1')}>
              <div className="modal-body text-center py-3">
                <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem', color: '#8e45e0' }}></i>
                <h6 className="fw-bold my-2" style={{ color: textColor }}>{mensajeExitoTexto}</h6>
                <button className="btn btn-secondary btn-sm px-4 fw-bold mt-2" style={{ borderRadius: '6px' }} onClick={() => setMostrarModalExito(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalConfirmarEliminarRol && (
        <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content p-3" style={caja('#dc3545')}>
              <div className="modal-body text-center py-2">
                <i className="bi bi-trash-fill text-danger" style={{ fontSize: '2.5rem' }}></i>
                <h5 className="mt-2 fw-bold">¿Eliminar perfil?</h5>
                <p className="mt-1 small" style={{ fontSize: '0.75rem', color: mutedColor }}>
                  Esta acción no se puede deshacer.
                </p>
                <div className="d-flex justify-content-center gap-2 mt-3">
                  <button className="btn btn-sm px-3 fw-bold w-50" style={btnRojo} onClick={() => setMostrarModalConfirmarEliminarRol(false)}>Cancelar</button>
                  <button className="btn btn-sm px-3 fw-bold w-50" style={btnVerde} onClick={confirmarEliminarRol}>Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalBloqueo && (
        <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content p-3" style={caja('#ffc107')}>
              <div className="modal-body text-center py-2">
                <i className="bi bi-lock-fill text-warning" style={{ fontSize: '2.2rem' }}></i>
                <p className="fw-bold my-2 px-1 small" style={{ fontSize: '0.8rem', color: textColor }}>{mensajeBloqueoTexto}</p>
                <button className="btn btn-secondary btn-sm px-4 fw-bold mt-1" style={{ borderRadius: '6px' }} onClick={() => setMostrarModalBloqueo(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
