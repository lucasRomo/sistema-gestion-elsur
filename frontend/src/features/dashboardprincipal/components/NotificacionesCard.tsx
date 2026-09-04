import React, { useEffect, useState } from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { apiFetch } from '../../../config/api';
import type { PedidoNotificacion } from '../services/ventaRapidaService';

// Definición de la interfaz del Pedido obtenida del Backend
interface PedidoBackend {
  id_pedido: number;
  observaciones?: string;
  observacion?: string;
  estante?: string;
  estado?: string;
  fecha_entrega_estimada?: string;
  cliente?: {
    nombre?: string;
    razonSocial?: string;
    razon_social?: string;
    persona?: {
      nombre?: string;
      apellido?: string;
    };
  };
}

export const NotificacionesCard: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [vistaActual, setVistaActual] = useState<number>(0);
  const [cajaAbierta, setCajaAbierta] = useState<boolean | null>(null);
  const [datosTurno, setDatosTurno] = useState<any>(null);
  const [ingresosTurno, setIngresosTurno] = useState<number>(0);
  const [egresosTurno, setEgresosTurno] = useState<number>(0);

  const [pedidosUrgentes, setPedidosUrgentes] = useState<PedidoNotificacion[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const fetchNotificaciones = async () => {
    try {
      // 1. Obtener estado de la caja mediante apiFetch
      const resCaja = await apiFetch('http://localhost:8080/api/turnos/estado-caja');
      if (resCaja.ok) {
        const textRes = await resCaja.text();
        if (textRes) {
          const dataCaja = JSON.parse(textRes);
          setCajaAbierta(true);
          setDatosTurno(dataCaja);

          const resTotales = await apiFetch('http://localhost:8080/api/movimientos-caja/totales');
          if (resTotales.ok) {
            const dataTotales = await resTotales.json();
            setIngresosTurno(dataTotales.totalIngresos || 0);
            setEgresosTurno(dataTotales.totalEgresos || 0);
          }
        } else {
          setCajaAbierta(false);
          setDatosTurno(null);
          setIngresosTurno(0);
          setEgresosTurno(0);
        }
      }

      // 2. Obtener pedidos urgentes/demorados mediante apiFetch
      const resPedidos = await apiFetch('http://localhost:8080/api/pedidos');
      if (resPedidos.ok) {
        const dataPedidos: PedidoBackend[] = await resPedidos.json();
        const ahora = new Date().getTime();

        const urgentesOExcedidos: PedidoNotificacion[] = [];

        dataPedidos.forEach((p) => {
          const obs = (p.observaciones || p.observacion || '').toLowerCase();
          const esVentaRapida = obs.includes('venta rápida') || p.estante === 'Venta Rápida';
          if (esVentaRapida) return;

          const estadoUpper = (p.estado || '').toUpperCase().trim();
          if (
            !estadoUpper ||
            estadoUpper === 'PRESUPUESTO' ||
            estadoUpper === 'ENTREGADO' ||
            estadoUpper === 'CANCELADO' ||
            estadoUpper === 'FINALIZADO' ||
            estadoUpper === 'COMPLETADO'
          ) {
            return;
          }

          if (!p.fecha_entrega_estimada) return;

          const fechaEntrega = new Date(p.fecha_entrega_estimada).getTime();
          const diffMs = fechaEntrega - ahora;
          const diffMin = Math.floor(diffMs / (1000 * 60));

          const nombreCliente = p.cliente?.persona
            ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido || ''}`.trim()
            : (p.cliente?.razonSocial || p.cliente?.razon_social || p.cliente?.nombre || 'Consumidor Final');

          if (diffMin <= 0) {
            urgentesOExcedidos.push({
              id: p.id_pedido,
              cliente: nombreCliente,
              estadoTiempo: 'vencido',
              minDiferencia: Math.abs(diffMin),
            });
          } else if (diffMin <= 60) {
            urgentesOExcedidos.push({
              id: p.id_pedido,
              cliente: nombreCliente,
              estadoTiempo: 'urgente',
              minDiferencia: diffMin,
            });
          }
        });

        urgentesOExcedidos.sort((a, b) => {
          if (a.estadoTiempo === 'vencido' && b.estadoTiempo !== 'vencido') return -1;
          if (a.estadoTiempo !== 'vencido' && b.estadoTiempo === 'vencido') return 1;
          return a.minDiferencia - b.minDiferencia;
        });

        setPedidosUrgentes(urgentesOExcedidos);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  const cambiarVista = (direccion: 'next' | 'prev') => {
    if (direccion === 'next') {
      setVistaActual((prev) => (prev === 0 ? 1 : 0));
    } else {
      setVistaActual((prev) => (prev === 1 ? 0 : 1));
    }
  };

  const colorCaja = cajaAbierta ? (isDark ? '#22c55e' : '#16a34a') : '#ef4444';

  return (
    <div
      className={`card h-100 p-3 font-monospace d-flex flex-column justify-content-between position-relative ${isDark ? 'text-white' : 'text-dark'}`}
      style={{
        backgroundColor: isDark ? '#1E1E1F' : '#ffffff',
        border: isDark ? '1px solid #3f3f46' : '1px solid #e2e8f0',
        borderRadius: '12px',
        maxHeight: '220px',
        overflow: 'hidden',
        boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)'
      }}
    >
      {/* BOTONES LATERALES */}
      <button
        onClick={() => cambiarVista('prev')}
        className={`btn p-0 border-0 position-absolute opacity-75 opacity-100-hover ${isDark ? 'text-white' : 'text-secondary'}`}
        style={{
          left: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'transparent',
          zIndex: 10,
        }}
        title="Anterior"
      >
        <i className="bi bi-chevron-left fs-5"></i>
      </button>

      <button
        onClick={() => cambiarVista('next')}
        className={`btn p-0 border-0 position-absolute opacity-75 opacity-100-hover ${isDark ? 'text-white' : 'text-secondary'}`}
        style={{
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'transparent',
          zIndex: 10,
        }}
        title="Siguiente"
      >
        <i className="bi bi-chevron-right fs-5"></i>
      </button>

      {/* CONTENEDOR INTERNO */}
      <div className="d-flex flex-column justify-content-between h-100" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
        {/* CABECERA */}
        <div className="d-flex align-items-center justify-content-between mb-1">
          <h6
            className="fw-bold m-0 d-flex align-items-center gap-2"
            style={{
              fontSize: '0.88rem',
              color: vistaActual === 0 ? colorCaja : (isDark ? '#f59e0b' : '#d97706'),
            }}
          >
            <i className="bi bi-bell-fill"></i>
            {vistaActual === 0
              ? 'Notificaciones - Estado de Caja'
              : 'Notificaciones - Pedidos Demorados'}
          </h6>

          {cargando && (
            <div className="spinner-border spinner-border-sm text-secondary" role="status"></div>
          )}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-grow-1 d-flex flex-column justify-content-center">
          {/* VISTA 0: CAJA */}
          {vistaActual === 0 && (
            <div className="d-flex flex-column justify-content-between h-100 py-1 gap-1">
              {/* BLOQUE SUPERIOR: ESTADO CAJA */}
              <div
                className="p-2 rounded d-flex align-items-center justify-content-between"
                style={{
                  backgroundColor: cajaAbierta 
                    ? (isDark ? '#14532d33' : '#dcfce7') 
                    : (isDark ? '#7f1d1d33' : '#fee2e2'),
                  border: cajaAbierta 
                    ? (isDark ? '1px solid #22c55e' : '1px solid #86efac') 
                    : (isDark ? '1px solid #ef4444' : '1px solid #fca5a5'),
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <i
                    className={`bi ${cajaAbierta ? 'bi-door-open-fill text-success' : 'bi-door-closed-fill text-danger'} fs-5`}
                  ></i>
                  <div className="d-flex flex-column">
                    <span className={`fw-bold ${isDark ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.82rem' }}>
                      Caja Registradora
                    </span>
                    <span className={`small ${isDark ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.68rem' }}>
                      {cajaAbierta ? 'Turno en curso' : 'Sin turno activo'}
                    </span>
                  </div>
                </div>
                <span
                  className={`badge ${cajaAbierta ? 'bg-success' : 'bg-danger'}`}
                  style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
                >
                  {cajaAbierta === null ? 'CARGANDO...' : cajaAbierta ? 'ABIERTA' : 'CERRADA'}
                </span>
              </div>

              {/* BLOQUE INTERMEDIO: INGRESOS Y EGRESOS DEL TURNO */}
              {cajaAbierta && (
                <div className="d-flex gap-2">
                  <div
                    className="flex-fill p-1 px-2 rounded d-flex align-items-center justify-content-between"
                    style={{ 
                      backgroundColor: isDark ? '#182e21' : '#f0fdf4', 
                      border: isDark ? '1px solid #22c55e44' : '1px solid #bbf7d0' 
                    }}
                  >
                    <span className={isDark ? 'text-white-50' : 'text-muted'} style={{ fontSize: '0.68rem' }}>
                      <i className="bi bi-arrow-down-left-circle-fill text-success me-1"></i>
                      Ingresos:
                    </span>
                    <span className="fw-bold text-success" style={{ fontSize: '0.75rem' }}>
                      ${ingresosTurno.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div
                    className="flex-fill p-1 px-2 rounded d-flex align-items-center justify-content-between"
                    style={{ 
                      backgroundColor: isDark ? '#331919' : '#fef2f2', 
                      border: isDark ? '1px solid #ef444444' : '1px solid #fecaca' 
                    }}
                  >
                    <span className={isDark ? 'text-white-50' : 'text-muted'} style={{ fontSize: '0.68rem' }}>
                      <i className="bi bi-arrow-up-right-circle-fill text-danger me-1"></i>
                      Egresos:
                    </span>
                    <span className="fw-bold text-danger" style={{ fontSize: '0.75rem' }}>
                      ${egresosTurno.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* BLOQUE INFERIOR */}
              {cajaAbierta ? (
                <div
                  className={`p-1 px-2 rounded d-flex justify-content-between small align-items-center ${isDark ? 'text-white-50' : 'text-muted'}`}
                  style={{ backgroundColor: isDark ? '#27272a' : '#f1f5f9', fontSize: '0.72rem' }}
                >
                  <div>
                    Monto Inicial:{' '}
                    <span className={`fw-bold ${isDark ? 'text-white' : 'text-dark'}`}>
                      ${datosTurno?.montoInicial?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div>
                    Turno N°:{' '}
                    <span className={`fw-bold ${isDark ? 'text-white' : 'text-dark'}`}>
                      #{datosTurno?.idTurno ?? datosTurno?.id_turno ?? '-'}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="p-1 px-2 rounded text-center text-danger fw-semibold"
                  style={{ 
                    backgroundColor: isDark ? '#27272a' : '#fef2f2', 
                    fontSize: '0.70rem', 
                    border: isDark ? '1px dashed #ef444455' : '1px dashed #fca5a5' 
                  }}
                >
                  Abra la caja del día o Espere a mañana para continuar
                </div>
              )}
            </div>
          )}

          {/* VISTA 1: PEDIDOS DEMORADOS */}
          {vistaActual === 1 && (
            <div
              className="d-flex flex-column gap-2 pe-1 no-scrollbar h-100"
              style={{ overflowY: 'auto', maxHeight: '140px' }}
            >
              {pedidosUrgentes.length > 0 ? (
                pedidosUrgentes.map((ped) => (
                  <div
                    key={ped.id}
                    className="p-2 rounded d-flex align-items-center justify-content-between"
                    style={{
                      backgroundColor: isDark ? '#27272a' : '#f8fafc',
                      border: isDark ? 'none' : '1px solid #e2e8f0',
                      borderLeft: ped.estadoTiempo === 'vencido' ? '3px solid #ef4444' : '3px solid #f59e0b',
                    }}
                  >
                    <div style={{ maxWidth: '65%' }}>
                      <div
                        className={`fw-bold text-truncate ${isDark ? 'text-white' : 'text-dark'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        #{ped.id} - {ped.cliente}
                      </div>
                      <div className={`small ${isDark ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.65rem' }}>
                        {ped.estadoTiempo === 'vencido'
                          ? `Demorado por ${ped.minDiferencia} min`
                          : `Vence en ${ped.minDiferencia} min`}
                      </div>
                    </div>

                    <span
                      className={`badge ${ped.estadoTiempo === 'vencido' ? 'bg-danger' : 'bg-warning text-dark'}`}
                      style={{ fontSize: '0.62rem' }}
                    >
                      {ped.estadoTiempo === 'vencido' ? 'EXCEDIDO' : 'POR VENCER'}
                    </span>
                  </div>
                ))
              ) : (
                <div className={`d-flex flex-column align-items-center justify-content-center h-100 small ${isDark ? 'text-white-50' : 'text-muted'}`}>
                  <i className="bi bi-check2-circle text-success fs-4 mb-1"></i>
                  <span style={{ fontSize: '0.75rem' }}>No hay entregas demoradas</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PIE CON INDICADORES */}
        <div className="d-flex justify-content-center align-items-center gap-1 mt-1">
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: vistaActual === 0 ? colorCaja : (isDark ? '#52525b' : '#cbd5e1'),
              transition: 'all 0.2s',
            }}
          ></span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: vistaActual === 1 ? (isDark ? '#f59e0b' : '#d97706') : (isDark ? '#52525b' : '#cbd5e1'),
              transition: 'all 0.2s',
            }}
          ></span>
        </div>
      </div>
    </div>
  );
};