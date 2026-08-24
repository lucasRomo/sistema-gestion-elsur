import React, { useState, useMemo } from 'react';
import type { UnidadMedida } from '../types/Insumo';
import { useTheme } from '../../../Context/ThemeContext';

interface GestionUnidadesModalProps {
  show: boolean;
  unidades: UnidadMedida[];
  onClose: () => void;
  onActualizar: () => void;
}

export const GestionUnidadesModal: React.FC<GestionUnidadesModalProps> = ({
  show,
  unidades,
  onClose,
  onActualizar
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const modalBg = isDark ? '#18181b' : '#ffffff';
  const modalBorder = isDark ? '#f59e0b' : '#d97706';
  const headerBorder = isDark ? '#27272a' : '#e2e8f0';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const inputBg = isDark ? '#1d1d1d' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const listBoxBg = isDark ? '#27272a' : '#f8fafc';
  const mutedText = isDark ? '#a1a1aa' : '#64748b';

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para Modal de Confirmación de Eliminación
  const [idEliminar, setIdEliminar] = useState<number | null>(null);
  const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);

  // Estados para Modal de Éxito
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // Filtrado dinámico de la lista de unidades existentes
  const unidadesFiltradas = useMemo(() => {
    if (!busqueda.trim()) return unidades;
    return unidades.filter(u => 
      u.nombre?.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [unidades, busqueda]);

  if (!show) return null;

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = nuevoNombre.trim();
    if (!nombreLimpio) return;

    // Validar duplicados localmente
    const existeDuplicado = unidades.some(
      u => u.nombre?.trim().toLowerCase() === nombreLimpio.toLowerCase()
    );

    if (existeDuplicado) {
      setError(`Ya existe una unidad de medida llamada "${nombreLimpio}".`);
      return;
    }

    try {
      setCargando(true);
      setError(null);
      const res = await fetch('http://localhost:8080/api/unidades-medida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreLimpio })
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(errorMsg || 'Error al guardar la unidad de medida');
      }

      setNuevoNombre('');
      onActualizar();
      setMensajeExito("Unidad de medida agregada con éxito");
      setMostrarModalExito(true);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  // Solicitar confirmación con el modal personalizado
  const solicitarEliminar = (idUnidad?: number) => {
    if (!idUnidad) return;
    setIdEliminar(idUnidad);
    setMostrarModalConfirmar(true);
  };

  // Confirmar y procesar eliminación
  const confirmarEliminacion = async () => {
    if (!idEliminar) return;

    try {
      setCargando(true);
      setError(null);
      const res = await fetch(`http://localhost:8080/api/unidades-medida/${idEliminar}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('No se pudo eliminar la unidad. Es posible que esté asignada a un insumo.');

      setMostrarModalConfirmar(false);
      setIdEliminar(null);
      onActualizar();

      setMensajeExito("Unidad de medida eliminada con éxito");
      setMostrarModalExito(true);
    } catch (err: any) {
      setMostrarModalConfirmar(false);
      setError(err.message || 'Error al eliminar');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div 
            className="modal-content font-monospace shadow-lg" 
            style={{ 
              backgroundColor: modalBg, 
              color: textColor, 
              border: `1.5px solid ${modalBorder}`, 
              borderRadius: '12px' 
            }}
          >
            
            <div className="modal-header border-bottom" style={{ borderColor: headerBorder }}>
              <h5 className="modal-title fw-bold text-warning">
                <i className="bi bi-gear-fill me-2"></i> Gestión de Unidades de Medida
              </h5>
              <button 
                type="button" 
                className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger py-2 small d-flex align-items-center justify-content-between" role="alert">
                  <span>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </span>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white ms-2" 
                    style={{ fontSize: '0.75rem' }} 
                    onClick={() => setError(null)}
                  />
                </div>
              )}

              {/* Formulario de creación */}
              <form onSubmit={handleAgregar} className="mb-4">
                <label className="form-label small fw-semibold" style={{ color: labelColor }}>Agregar Nueva Unidad</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control shadow-none" 
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    placeholder="Ej. Gramos, Rollos, Litros"
                    pattern="^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$"
                    value={nuevoNombre}
                    onChange={(e) => {
                      setNuevoNombre(e.target.value);
                      if (error) setError(null);
                    }}
                    onInvalid={(e) => {
                      const input = e.target as HTMLInputElement;
                      if (input.validity.valueMissing) {
                        input.setCustomValidity('Completa este campo.');
                      } else if (input.validity.patternMismatch) {
                        input.setCustomValidity('No se permiten números en el nombre de la unidad.');
                      }
                    }}
                    onInput={(e) => {
                      (e.target as HTMLInputElement).setCustomValidity('');
                    }}
                    disabled={cargando}
                    required
                  />
                  <button 
                    type="submit" 
                    className="btn btn-warning fw-bold"
                    style={{ color: '#ffffff' }}
                    disabled={cargando || !nuevoNombre.trim()}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Añadir
                  </button>
                </div>
              </form>

              {/* Buscador y Lista de unidades */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label small mb-0 fw-semibold" style={{ color: labelColor }}>
                  Unidades Existentes ({unidadesFiltradas.length})
                </label>
              </div>

              <div className="mb-2">
                <input 
                  type="text" 
                  className="form-control form-control-sm shadow-none" 
                  style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                  placeholder="Buscar unidad..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <div className="border rounded overflow-auto" style={{ maxHeight: '200px', backgroundColor: listBoxBg, borderColor: inputBorder }}>
                <ul className="list-group list-group-flush">
                  {unidadesFiltradas.length === 0 ? (
                    <li className="list-group-item bg-transparent text-center py-3 small" style={{ color: mutedText }}>
                      {busqueda ? 'No hay coincidencia en la búsqueda' : 'No hay unidades registradas'}
                    </li>
                  ) : (
                    unidadesFiltradas.map((u) => (
                      <li 
                        key={u.idUnidad ?? u.nombre} 
                        className="list-group-item bg-transparent d-flex justify-content-between align-items-center py-2"
                        style={{ borderColor: headerBorder, color: textColor }}
                      >
                        <span>{u.nombre}</span>
                        <button 
                          type="button" 
                          className="btn btn-outline-danger btn-sm border-0"
                          onClick={() => solicitarEliminar(u.idUnidad)}
                          title="Eliminar unidad"
                          disabled={cargando || !u.idUnidad}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            <div className="modal-footer border-top py-2" style={{ borderColor: headerBorder }}>
              <button 
                type="button" 
                className="btn btn-secondary px-4" 
                onClick={onClose}
                style={{ color: '#ffffff' }}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* --- SUB-MODAL DE CONFIRMACIÓN DE ELIMINACIÓN --- */}
      {mostrarModalConfirmar && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1065 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content shadow-lg font-monospace text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #dc3545', borderRadius: '12px' }}>
              <div className="modal-body text-center py-3">
                <div className="d-flex justify-content-center mb-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: 'transparent', border: '2px solid #dc3545' }}>
                    <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
                <h6 className="fw-bold my-2 text-white">¿Seguro de eliminar esta unidad de medida?</h6>
                <p className="small text-white-50 mb-3">Esta acción no se puede deshacer.</p>
                
                <div className="d-flex justify-content-center gap-2">
                  <button 
                    type="button"
                    className="btn btn-sm btn-secondary px-3 fw-semibold" 
                    onClick={() => {
                      setMostrarModalConfirmar(false);
                      setIdEliminar(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    className="btn btn-sm btn-danger px-3 fw-bold" 
                    onClick={confirmarEliminacion}
                    disabled={cargando}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-MODAL DE ÉXITO --- */}
      {mostrarModalExito && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content shadow-lg font-monospace text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #7216af', borderRadius: '12px' }}>
              <div className="modal-body text-center py-3">
                <div className="d-flex justify-content-center mb-2">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: 'transparent', border: '2px solid #267c34' }}>
                    <i className="bi bi-check-lg" style={{ fontSize: '2.2rem', color: '#267c34' }}></i>
                  </div>
                </div>
                <h6 className="fw-bold my-2 text-white">{mensajeExito}</h6>
                <button 
                  type="button"
                  className="btn btn-sm px-4 fw-bold mt-2" 
                  style={{ backgroundColor: '#267c34', color: '#ffffff', borderRadius: '6px', border: 'none' }} 
                  onClick={() => setMostrarModalExito(false)}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};