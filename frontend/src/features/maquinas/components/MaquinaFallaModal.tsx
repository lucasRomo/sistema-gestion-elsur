import React, { useState } from 'react';
import type { Maquina } from '../types/Maquina';
import { useTheme } from '../../../Context/ThemeContext';

interface Props {
  show: boolean;
  maquinas: Maquina[];
  onClose: () => void;
  onReportarFalla: (idMaquina: number, descripcion: string, prioridad: string) => Promise<void>;
}

export const MaquinaFallaModal: React.FC<Props> = ({ show, maquinas, onClose, onReportarFalla }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables de tema
  const modalBg = isDark ? '#1e1e24' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const textSubtle = isDark ? '#a1a1aa' : '#64748b';
  const inputBg = isDark ? '#121214' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';

  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('MEDIA');
  const [cargando, setCargando] = useState(false);
  const [showEquipo, setShowEquipo] = useState(false);
  const [showPrioridad, setShowPrioridad] = useState(false);

  if (!show) return null;

  const maquinasOperativas = maquinas.filter(m => m.estado === 'OPERATIVA');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !descripcion.trim()) {
      alert("Por favor complete todos los campos.");
      return;
    }

    setCargando(true);
    try {
      await onReportarFalla(Number(selectedId), descripcion.trim(), prioridad);
      setSelectedId('');
      setDescripcion('');
      setPrioridad('MEDIA');
      onClose();
    } catch (err: any) {
      alert("Error al reportar la falla: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-danger" style={{ backgroundColor: modalBg, color: textColor, borderRadius: '12px', border: `1px solid ${modalBorder}` }}>
          
          <div className="modal-header" style={{ borderBottom: `1px solid ${modalBorder}` }}>
            <h5 className="modal-title font-monospace fw-bold text-danger">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>Reportar Falla Técnica
            </h5>
            <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body font-monospace">
              <p className="small mb-3" style={{ color: textSubtle }}>
                Al registrar la incidencia, la máquina cambiará a <strong className="text-danger">"Fuera de Servicio"</strong> y el evento quedará guardado para reportes.
              </p>

              <div className="mb-3">
  <label className="form-label fw-bold" style={{ color: textColor }}>Seleccionar Equipo:</label>
  <div className="position-relative">
    <input
      type="text"
      readOnly
      autoComplete="off"
      className="form-control"
      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder, cursor: 'pointer' }}
      value={
        selectedId
          ? (() => {
              const m = maquinasOperativas.find(m => m.idMaquina === selectedId);
              return m ? `${m.nombre} (${m.estado})` : '';
            })()
          : '-- Seleccionar Equipo --'
      }
      onFocus={() => setShowEquipo(true)}
      onClick={() => setShowEquipo(true)}
      onBlur={() => setTimeout(() => setShowEquipo(false), 200)}
    />
    {showEquipo && (
      <div
        className={`position-absolute w-100 shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
        style={{ maxHeight: '180px', zIndex: 1060, border: `1px solid ${inputBorder}`, top: '100%', left: 0 }}
      >
        {maquinasOperativas.length === 0 ? (
          <div className="p-2 small text-muted text-center">No hay equipos operativos disponibles</div>
        ) : (
          maquinasOperativas.map((m) => {
            const isSelected = m.idMaquina === selectedId;
            return (
              <div
                key={m.idMaquina}
                className="p-2 border-bottom text-truncate"
                style={{
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  backgroundColor: isSelected ? '#0284c7' : (isDark ? '#27272a' : '#f8fafc'),
                  color: isSelected ? '#ffffff' : (isDark ? '#e4e4e7' : '#1e293b')
                }}
                onMouseDown={() => {
                  setSelectedId(m.idMaquina!);
                  setShowEquipo(false);
                }}
              >
                <span className="fw-semibold">{m.nombre} ({m.estado})</span>
              </div>
            );
          })
        )}
      </div>
    )}
  </div>
</div>

              <div className="mb-3">
  <label className="form-label fw-bold" style={{ color: textColor }}>Nivel de Urgencia:</label>
  <div className="position-relative">
    <input
      type="text"
      readOnly
      autoComplete="off"
      className="form-control"
      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder, cursor: 'pointer' }}
      value={prioridad === 'CRITICA' ? 'CRÍTICA' : prioridad}
      onFocus={() => setShowPrioridad(true)}
      onClick={() => setShowPrioridad(true)}
      onBlur={() => setTimeout(() => setShowPrioridad(false), 200)}
    />
    {showPrioridad && (
      <div
        className={`position-absolute w-100 shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
        style={{ maxHeight: '180px', zIndex: 1060, border: `1px solid ${inputBorder}`, top: '100%', left: 0 }}
      >
        {[
          { valor: 'BAJA', label: 'BAJA' },
          { valor: 'MEDIA', label: 'MEDIA' },
          { valor: 'ALTA', label: 'ALTA' },
          { valor: 'CRITICA', label: 'CRÍTICA' }
        ].map((opcion) => {
          const isSelected = opcion.valor === prioridad;
          return (
            <div
              key={opcion.valor}
              className="p-2 border-bottom text-truncate"
              style={{
                cursor: 'pointer',
                fontSize: '0.875rem',
                backgroundColor: isSelected ? '#0284c7' : (isDark ? '#27272a' : '#f8fafc'),
                color: isSelected ? '#ffffff' : (isDark ? '#e4e4e7' : '#1e293b')
              }}
              onMouseDown={() => {
                setPrioridad(opcion.valor);
                setShowPrioridad(false);
              }}
            >
              <span className="fw-semibold">{opcion.label}</span>
            </div>
          );
        })}
      </div>
    )}
  </div>
</div>

              <div className="mb-3">
                <label className="form-label fw-bold" style={{ color: textColor }}>Descripción del Problema / Falla:</label>
                <textarea
                  className="form-control"
                  style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                  rows={3}
                  placeholder="Ej: Desalineación de rodillo, atasco constante de papel A3, error de fusor..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: `1px solid ${modalBorder}` }}>
              <button type="button" className={`btn ${isDark ? 'btn-secondary' : 'btn-secondary'}`} onClick={onClose} disabled={cargando}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-danger fw-bold px-4" disabled={cargando || maquinasOperativas.length === 0}>
                {cargando ? 'Procesando...' : 'Registrar e Inhabilitar'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};