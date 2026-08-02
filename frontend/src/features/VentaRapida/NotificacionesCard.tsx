import React, { useEffect, useState } from 'react';

interface PedidoBackend {
  id_pedido: number;
  cliente?: {
    persona?: {
      nombre?: string;
      apellido?: string;
    };
    razonSocial?: string;
    razon_social?: string;
    nombre?: string;
  };
  fecha_entrega_estimada: string;
  estado: string;
  observaciones?: string;
  observacion?: string;
  estante?: string;
}

export const NotificacionesCard: React.FC = () => {
  // Pestaña activa: 0 = Caja, 1 = Pedidos Demorados
  const [vistaActual, setVistaActual] = useState<number>(0);

  const [cajaAbierta, setCajaAbierta] = useState<boolean | null>(null);
  const [datosTurno, setDatosTurno] = useState<any>(null);
  const [ingresosTurno, setIngresosTurno] = useState<number>(0);
  const [egresosTurno, setEgresosTurno] = useState<number>(0);

  const [pedidosUrgentes, setPedidosUrgentes] = useState<
    { id: number; cliente: string; estadoTiempo: 'vencido' | 'urgente'; minDiferencia: number }[]
  >([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const fetchNotificaciones = async () => {
    try {
      // 1. Obtener estado de Caja
      const resCaja = await fetch('http://localhost:8080/api/turnos/estado-caja');
      if (resCaja.ok) {
        const textRes = await resCaja.text();
        if (textRes) {
          const dataCaja = JSON.parse(textRes);
          setCajaAbierta(true);
          setDatosTurno(dataCaja);

          // 1.1 Obtener Totales de Caja (Ingresos y Egresos)
          const resTotales = await fetch('http://localhost:8080/api/movimientos-caja/totales');
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

      // 2. Obtener Pedidos (con la lógica exacta de filtrado)
      const resPedidos = await fetch('http://localhost:8080/api/pedidos');
      if (resPedidos.ok) {
        const dataPedidos: PedidoBackend[] = await resPedidos.json();
        const ahora = new Date().getTime();

        const urgentesOExcedidos: {
          id: number;
          cliente: string;
          estadoTiempo: 'vencido' | 'urgente';
          minDiferencia: number;
        }[] = [];

        dataPedidos.forEach((p) => {
          // Excluir Ventas Rápidas
          const obs = (p.observaciones || p.observacion || '').toLowerCase();
          const esVentaRapida = obs.includes('venta rápida') || p.estante === 'Venta Rápida';
          if (esVentaRapida) return;

          // Excluir Presupuestos y estados no activos
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

  // Color dinámico para el título de la tarjeta de Caja y su circulito indicador
  const colorCaja = cajaAbierta ? '#22c55e' : '#ef4444';

  return (
    <div
      className="card h-100 p-3 shadow-sm font-monospace text-white d-flex flex-column justify-content-between position-relative"
      style={{
        backgroundColor: '#1E1E1F',
        border: '1px solid #3f3f46',
        borderRadius: '12px',
        maxHeight: '220px',
        overflow: 'hidden',
      }}
    >
      {/* BOTONES LATERALES */}
      <button
        onClick={() => cambiarVista('prev')}
        className="btn p-0 border-0 text-white position-absolute opacity-75 opacity-100-hover"
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
        className="btn p-0 border-0 text-white position-absolute opacity-75 opacity-100-hover"
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
              color: vistaActual === 0 ? colorCaja : '#f59e0b',
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
                  backgroundColor: cajaAbierta ? '#14532d33' : '#7f1d1d33',
                  border: cajaAbierta ? '1px solid #22c55e' : '1px solid #ef4444',
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <i
                    className={`bi ${cajaAbierta ? 'bi-door-open-fill text-success' : 'bi-door-closed-fill text-danger'} fs-5`}
                  ></i>
                  <div className="d-flex flex-column">
                    <span className="fw-bold" style={{ fontSize: '0.82rem' }}>
                      Caja Registradora
                    </span>
                    <span className="small text-white-50" style={{ fontSize: '0.68rem' }}>
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

              {/* BLOQUE INTERMEDIO: INGRESOS Y EGRESOS DEL TURNO (Solo si está abierta) */}
              {cajaAbierta && (
                <div className="d-flex gap-2">
                  <div
                    className="flex-fill p-1 px-2 rounded d-flex align-items-center justify-content-between"
                    style={{ backgroundColor: '#182e21', border: '1px solid #22c55e44' }}
                  >
                    <span className="text-white-50" style={{ fontSize: '0.68rem' }}>
                      <i className="bi bi-arrow-down-left-circle-fill text-success me-1"></i>
                      Ingresos:
                    </span>
                    <span className="fw-bold text-success" style={{ fontSize: '0.75rem' }}>
                      ${ingresosTurno.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div
                    className="flex-fill p-1 px-2 rounded d-flex align-items-center justify-content-between"
                    style={{ backgroundColor: '#331919', border: '1px solid #ef444444' }}
                  >
                    <span className="text-white-50" style={{ fontSize: '0.68rem' }}>
                      <i className="bi bi-arrow-up-right-circle-fill text-danger me-1"></i>
                      Egresos:
                    </span>
                    <span className="fw-bold text-danger" style={{ fontSize: '0.75rem' }}>
                      ${egresosTurno.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* BLOQUE INFERIOR: CONDICIONAL (DATOS DEL TURNO O MENSAJE DE CAJA CERRADA) */}
              {cajaAbierta ? (
                <div
                  className="p-1 px-2 rounded d-flex justify-content-between text-white-50 small align-items-center"
                  style={{ backgroundColor: '#27272a', fontSize: '0.72rem' }}
                >
                  <div>
                    Monto Inicial:{' '}
                    <span className="text-white fw-bold">
                      ${datosTurno?.montoInicial?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div>
                    Turno N°:{' '}
                    <span className="text-white fw-bold">
                      #{datosTurno?.idTurno ?? datosTurno?.id_turno ?? '-'}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="p-1 px-2 rounded text-center text-danger fw-semibold"
                  style={{ backgroundColor: '#27272a', fontSize: '0.70rem', border: '1px dashed #ef444455' }}
                >
                  Abra la caja del dia o Espere a mañana para continuar
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
                      backgroundColor: '#27272a',
                      borderLeft:
                        ped.estadoTiempo === 'vencido'
                          ? '3px solid #ef4444'
                          : '3px solid #f59e0b',
                    }}
                  >
                    <div style={{ maxWidth: '65%' }}>
                      <div
                        className="fw-bold text-truncate"
                        style={{ fontSize: '0.75rem', color: '#f4f4f5' }}
                      >
                        #{ped.id} - {ped.cliente}
                      </div>
                      <div className="small text-white-50" style={{ fontSize: '0.65rem' }}>
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
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-white-50 small">
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
              backgroundColor: vistaActual === 0 ? colorCaja : '#52525b',
              transition: 'all 0.2s',
            }}
          ></span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: vistaActual === 1 ? '#f59e0b' : '#52525b',
              transition: 'all 0.2s',
            }}
          ></span>
        </div>
      </div>
    </div>
  );
};