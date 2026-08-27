import { useNotificaciones } from '../hook/useNotificaciones';
import { useTheme } from '../../../Context/ThemeContext';

const COLOR_MAP = {
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#0dcaf0',
  success: '#198754',
};

export function NotificacionesView() {
  const { notificaciones, cargando, recargar } = useNotificaciones();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const cardBg = isDark ? '#18181b' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const textSubtle = isDark ? '#a1a1aa' : '#64748b';
  const borderColor = isDark ? '#3f3f46' : '#cbd5e1';

  return (
    <div className="container-fluid font-monospace py-3" style={{ color: textColor }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0"><i className="bi bi-bell-fill text-warning me-2"></i>Notificaciones</h5>
        <button className="btn btn-sm btn-outline-secondary" onClick={recargar}>
          <i className="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-5" style={{ color: textSubtle }}>
          <div className="spinner-border spinner-border-sm me-2" role="status"></div>
          Cargando novedades del día...
        </div>
      ) : notificaciones.length === 0 ? (
        <div className="text-center py-5" style={{ color: textSubtle }}>
          <i className="bi bi-check-circle fs-2 d-block mb-2"></i>
          Sin novedades por el momento.
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {notificaciones.map((n) => (
            <div
              key={n.id}
              className="p-3 rounded-3"
              style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderLeft: `4px solid ${COLOR_MAP[n.color]}` }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="d-flex align-items-center gap-2">
                  <i className={`bi ${n.icono}`} style={{ color: COLOR_MAP[n.color] }}></i>
                  <span className="fw-bold">{n.titulo}</span>
                </div>
                <small style={{ color: textSubtle }}>{new Date(n.fecha).toLocaleTimeString()}</small>
              </div>
              <p className="mb-0 mt-1 small" style={{ color: textSubtle }}>{n.descripcion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}