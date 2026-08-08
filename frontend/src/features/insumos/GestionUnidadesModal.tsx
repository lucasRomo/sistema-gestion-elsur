import React, { useState } from 'react';
import type { UnidadMedida } from '../../types/Insumo';
import { useTheme } from '../../Context/ThemeContext';

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
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!show) return null;

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    try {
      setCargando(true);
      setError(null);
      const res = await fetch('http://localhost:8080/api/unidades-medida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre.trim() })
      });

      if (!res.ok) throw new Error('Error al guardar la unidad de medida');

      setNuevoNombre('');
      onActualizar();
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (idUnidad?: number) => {
    if (!idUnidad) return;
    if (!window.confirm('¿Seguro que deseas eliminar esta unidad de medida?')) return;

    try {
      setCargando(true);
      setError(null);
      const res = await fetch(`http://localhost:8080/api/unidades-medida/${idUnidad}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('No se pudo eliminar la unidad. Es posible que esté asignada a un insumo.');

      onActualizar();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar');
    } finally {
      setCargando(false);
    }
  };

  return (
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
              <div className="alert alert-danger py-2 small" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
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
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  disabled={cargando}
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

            {/* Lista de unidades */}
            <label className="form-label small mb-2 fw-semibold" style={{ color: labelColor }}>Unidades Existentes</label>
            <div className="border rounded overflow-auto" style={{ maxHeight: '200px', backgroundColor: listBoxBg, borderColor: inputBorder }}>
              <ul className="list-group list-group-flush">
                {unidades.length === 0 ? (
                  <li className="list-group-item bg-transparent text-center py-3 small" style={{ color: mutedText }}>
                    No hay unidades registradas
                  </li>
                ) : (
                  unidades.map((u) => (
                    <li 
                      key={u.idUnidad ?? u.nombre} 
                      className="list-group-item bg-transparent d-flex justify-content-between align-items-center py-2"
                      style={{ borderColor: headerBorder, color: textColor }}
                    >
                      <span>{u.nombre}</span>
                      <button 
                        type="button" 
                        className="btn btn-outline-danger btn-sm border-0"
                        onClick={() => handleEliminar(u.idUnidad)}
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
              className="btn btn-danger px-4" 
              onClick={onClose}
              style={{ color: '#ffffff' }}
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};