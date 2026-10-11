import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { API_BASE_URL, apiFetch } from '../../../config/api';
import { formatearMonto } from '../../../utils/formato';
import { NotificacionesView } from '../../../features/notificaciones/view/NotificacionesView';

// Inicio del celular: resumen del día para el administrador (solo consulta). Junta en una
// pantalla lo que antes había que ir a buscar a Caja, Pedidos, Insumos y Máquinas.

interface Resumen {
  caja: { abierta: boolean; saldo: number; ingresos: number; egresos: number; desde?: string } | null;
  taller: number;
  atrasados: number;
  stockBajo: { nombre: string; actual: number; minimo: number }[];
  maquinasFuera: string[];
}

const pedirJson = async (ruta: string) => {
  const res = await apiFetch(`${API_BASE_URL}${ruta}`, { skipLoading: true });
  if (!res.ok) return null;
  const texto = await res.text();
  return texto ? JSON.parse(texto) : null;
};

export const InicioMovil: React.FC<{ onIrA: (tab: string) => void }> = ({ onIrA }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [turno, cola, bajoStock, maquinas] = await Promise.all([
        pedirJson('/turnos/estado-caja').catch(() => null),
        pedirJson('/pedidos/resumen-cola').catch(() => null),
        pedirJson('/insumos/bajo-stock').catch(() => null),
        pedirJson('/maquinas').catch(() => null),
      ]);
      let caja: Resumen['caja'] = null;
      if (turno?.estado === 'ABIERTO') {
        const totales = await pedirJson(`/movimientos-caja/totales/turno/${turno.idTurno}`).catch(() => null);
        const ingresos = Number(totales?.totalIngresos ?? 0);
        const egresos = Number(totales?.totalEgresos ?? 0);
        caja = { abierta: true, ingresos, egresos, saldo: Number(turno.montoInicial ?? 0) + ingresos - egresos, desde: turno.fechaApertura };
      } else {
        caja = { abierta: false, ingresos: 0, egresos: 0, saldo: 0 };
      }
      setResumen({
        caja,
        taller: Number(cola?.taller ?? 0),
        atrasados: Number(cola?.atrasados ?? 0),
        stockBajo: (Array.isArray(bajoStock) ? bajoStock : []).map((i: any) => ({
          nombre: i.nombreInsumo, actual: Number(i.stockActual ?? 0), minimo: Number(i.stockMinimo ?? 0),
        })),
        maquinasFuera: (Array.isArray(maquinas) ? maquinas : [])
          .filter((m: any) => m.estado && m.estado !== 'OPERATIVA')
          .map((m: any) => `${m.nombre} (${String(m.estado).toLowerCase()})`),
      });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const tarjetaBg = isDark ? '#18181b' : '#ffffff';
  const borde = isDark ? '#3f3f46' : '#e2e8f0';
  const texto = isDark ? '#ffffff' : '#0f172a';
  const suave = isDark ? '#a1a1aa' : '#64748b';

  const Tarjeta: React.FC<{ titulo: string; icono: string; color: string; onClick?: () => void; children: React.ReactNode }> =
    ({ titulo, icono, color, onClick, children }) => (
      <div
        className="p-3 rounded-3 h-100"
        style={{ backgroundColor: tarjetaBg, border: `1px solid ${borde}`, borderLeft: `4px solid ${color}`, cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
      >
        <div className="d-flex align-items-center gap-2 mb-1 small fw-bold" style={{ color: suave }}>
          <i className={`bi ${icono}`} style={{ color }} aria-hidden="true"></i>{titulo}
          {onClick && <i className="bi bi-chevron-right ms-auto" aria-hidden="true"></i>}
        </div>
        {children}
      </div>
    );

  const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="container-fluid font-monospace py-3" style={{ color: texto }}>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h5 className="fw-bold mb-0">Resumen del día</h5>
          <small style={{ color: suave, textTransform: 'capitalize' }}>{hoy}</small>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={cargar} aria-label="Actualizar" disabled={cargando}>
          <i className={`bi bi-arrow-clockwise ${cargando ? 'spin' : ''}`}></i>
        </button>
      </div>

      {!resumen ? (
        <div className="text-center py-5" style={{ color: suave }}>
          <div className="spinner-border spinner-border-sm me-2" role="status"></div>Cargando resumen...
        </div>
      ) : (
        <div className="row g-2">
          <div className="col-12">
            <Tarjeta titulo="Caja" icono="bi-wallet2" color={resumen.caja?.abierta ? '#22c55e' : '#dc3545'}>
              {resumen.caja?.abierta ? (
                <>
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="fs-3 fw-bold">${formatearMonto(resumen.caja.saldo)}</span>
                    <span className="badge bg-success">Abierta</span>
                  </div>
                  <div className="d-flex gap-3 small mt-1">
                    <span style={{ color: '#22c55e' }}><i className="bi bi-arrow-down-circle me-1"></i>${formatearMonto(resumen.caja.ingresos)}</span>
                    <span style={{ color: '#ef4444' }}><i className="bi bi-arrow-up-circle me-1"></i>${formatearMonto(resumen.caja.egresos)}</span>
                    {resumen.caja.desde && (
                      <span style={{ color: suave }} className="ms-auto">
                        desde {new Date(resumen.caja.desde).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold">Caja cerrada</span>
                  <span className="small" style={{ color: suave }}>Todavía no se abrió el turno de hoy.</span>
                </div>
              )}
            </Tarjeta>
          </div>

          <div className="col-6">
            <Tarjeta titulo="En taller" icono="bi-tools" color="#8e45e0" onClick={() => onIrA('pedidos')}>
              <span className="fs-3 fw-bold">{resumen.taller}</span>
              <div className="small" style={{ color: suave }}>pedidos activos</div>
            </Tarjeta>
          </div>
          <div className="col-6">
            <Tarjeta titulo="Atrasados" icono="bi-alarm" color="#dc3545" onClick={() => onIrA('pedidos:ATRASADOS')}>
              <span className="fs-3 fw-bold" style={{ color: resumen.atrasados > 0 ? '#ef4444' : undefined }}>{resumen.atrasados}</span>
              <div className="small" style={{ color: suave }}>pasados de fecha</div>
            </Tarjeta>
          </div>

          <div className="col-12">
            <Tarjeta titulo={`Stock bajo (${resumen.stockBajo.length})`} icono="bi-box-seam" color="#eab308">
              {resumen.stockBajo.length === 0 ? (
                <span className="small" style={{ color: suave }}>Todos los insumos están por encima del mínimo.</span>
              ) : (
                <ul className="list-unstyled small mb-0">
                  {resumen.stockBajo.slice(0, 4).map((i) => (
                    <li key={i.nombre} className="d-flex justify-content-between py-1" style={{ borderBottom: `1px dashed ${borde}` }}>
                      <span className="text-truncate me-2">{i.nombre}</span>
                      <span style={{ color: i.actual <= 0 ? '#ef4444' : '#eab308' }} className="text-nowrap">{i.actual} / mín. {i.minimo}</span>
                    </li>
                  ))}
                  {resumen.stockBajo.length > 4 && <li className="pt-1" style={{ color: suave }}>y {resumen.stockBajo.length - 4} más…</li>}
                </ul>
              )}
            </Tarjeta>
          </div>

          <div className="col-12">
            <Tarjeta titulo="Máquinas" icono="bi-cpu" color={resumen.maquinasFuera.length ? '#dc3545' : '#22c55e'} onClick={() => onIrA('maquinas')}>
              {resumen.maquinasFuera.length === 0 ? (
                <span className="small">Todas operativas.</span>
              ) : (
                <span className="small">{resumen.maquinasFuera.length} con problemas: {resumen.maquinasFuera.join(', ')}</span>
              )}
            </Tarjeta>
          </div>
        </div>
      )}

      <div className="mt-3">
        <NotificacionesView onIrA={onIrA} />
      </div>
    </div>
  );
};
