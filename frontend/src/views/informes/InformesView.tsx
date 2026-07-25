import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { pedidoService } from '../../services/pedidoService';
import { cajaService, type MovimientoCaja } from '../../services/cajaService';

// Componente Tooltip Personalizado adaptativo
const CustomAreaTooltip = ({ active, payload, label, esMismoDia }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const saldoAcumulado = payload[0].value;
    const esEgreso = data.esEgreso;
    const montoMovimiento = data.montoMovimiento || 0;

    return (
      <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: `1px solid ${esEgreso ? '#e22e2e' : '#8e45e0'}`, color: '#fff', fontSize: '0.85rem' }}>
        {/* ENCABEZADO */}
        <div className="d-flex align-items-center justify-content-between gap-3 mb-2 pb-1 border-bottom border-secondary" style={{ borderColor: '#3f3f46 !important' }}>
          <span className="fw-bold text-white-50">{label}</span>
          {/* Muestra el badge con el monto puntual ÚNICAMENTE si es vista por horas (mismo día) */}
          {esMismoDia && (
            <span className={`fw-bold badge ${esEgreso ? 'bg-danger' : 'bg-success'}`}>
              {esEgreso ? `- $${Math.abs(montoMovimiento).toLocaleString('es-AR')}` : `+ $${Math.abs(montoMovimiento).toLocaleString('es-AR')}`}
            </span>
          )}
        </div>

        {/* ESTADO ACUMULADO DE CAJA */}
        <div className="d-flex align-items-center justify-content-between gap-2">
          <span className="text-white-50">Estado Caja:</span>
          <span className="fw-bold" style={{ color: '#20c997' }}>
            ${saldoAcumulado.toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const InformesView: React.FC = () => {
  const hoy = new Date().toLocaleDateString('sv-SE');

  // Estados temporales para los inputs de fecha
  const [fechaDesdeInput, setFechaDesdeInput] = useState(hoy);
  const [fechaHastaInput, setFechaHastaInput] = useState(hoy);

  // Estados confirmados con los que realmente se procesan los informes
  const [fechaDesde, setFechaDesde] = useState(hoy);
  const [fechaHasta, setFechaHasta] = useState(hoy);
  
  const [pedidosRaw, setPedidosRaw] = useState<any[]>([]);
  const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCaja[]>([]);
  const [cargando, setCargando] = useState(false);

  const [metricas, setMetricas] = useState<any>({
    ventasTotales: 0,
    ticketsGenerados: 0,
    ticketPromedio: 0,
    cantidadMovimientos: 0,
    ventasPorPeriodo: [],
    distribucionMediosPago: [],
    distribucionEstados: [],
    rendimientoEmpleados: []
  });

  // 1. CARGA SIMULTÁNEA INICIAL
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const [dataPedidos, dataCaja] = await Promise.all([
          pedidoService.obtenerTodos(),
          cajaService.obtenerMovimientosDia()
        ]);

        setPedidosRaw(dataPedidos || []);
        setMovimientosCaja(dataCaja || []);
      } catch (error) {
        console.error("Error al sincronizar datos para Informes:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  // 2. PROCESAMIENTO DE MÉTRICAS
  const procesarMetricas = (fDesde: string, fHasta: string) => {
    const desde = new Date(`${fDesde}T00:00:00`);
    const hasta = new Date(`${fHasta}T23:59:59`);

    const movimientosEnRango = movimientosCaja.filter((m) => {
      const fechaMov = new Date(m.fecha);
      return fechaMov >= desde && fechaMov <= hasta;
    });

    const esMovimientoEgreso = (m: any) => {
      const tipo = (m.tipoMovimiento || m.tipo || m.tipo_movimiento || '').toString().toUpperCase();
      const desc = (m.descripcion || '').toString().toUpperCase();
      const montoNum = Number(m.monto || 0);

      return (
        tipo === 'EGRESO' ||
        tipo === 'SALIDA' ||
        tipo === 'RETIRO' ||
        desc.includes('EGRESO') ||
        desc.includes('RETIRO DE CAJA') ||
        montoNum < 0
      );
    };

    const ingresosCaja = movimientosEnRango.filter((m) => !esMovimientoEgreso(m));
    const totalIngresosBrutos = ingresosCaja.reduce((acc, m) => acc + Math.abs(Number(m.monto || 0)), 0);

    const saldoNetoCaja = movimientosEnRango.reduce((acc, m) => {
      const esEgreso = esMovimientoEgreso(m);
      const montoAbs = Math.abs(Number(m.monto || 0));
      return esEgreso ? acc - montoAbs : acc + montoAbs;
    }, 0);

    const pedidosEnRango = (pedidosRaw || []).filter((p) => {
      const fechaPedido = new Date(p.fecha_creacion || p.fechaCreacion || p.fecha);
      return fechaPedido >= desde && fechaPedido <= hasta;
    });

    const pedidosPendientes = pedidosEnRango.filter((p) => (p.estado || '').toUpperCase() === 'PENDIENTE');

    const ticketsGenerados = pedidosEnRango.filter((p) => {
      const estado = (p.estado || '').toUpperCase();
      return estado === 'ENTREGADO' || estado === 'COMPLETADO' || estado === 'FINALIZADO';
    }).length;

    const ticketsFinales = ticketsGenerados > 0 ? ticketsGenerados : pedidosEnRango.length;

    const ticketPromedio = ticketsFinales > 0 
      ? (totalIngresosBrutos / ticketsFinales).toFixed(2) 
      : '0.00';

    const cantidadMovimientos = movimientosEnRango.length;

    // --- RECAUDACIÓN REAL + TRABAJOS PENDIENTES POR OPERARIO ---
    const mapaEmpleados: { [key: string]: number } = {};

    const obtenerNombreOperario = (empObj: any) => {
      if (!empObj) return "Sin Asignar";
      return empObj.persona 
        ? `${empObj.persona.nombre} ${empObj.persona.apellido}` 
        : (empObj.nombre || `Emp #${empObj.idEmpleado || empObj.id_empleado || empObj.idUsuario}`);
    };

    ingresosCaja.forEach((m) => {
      let nombreEmp = "Sin Asignar";

      if (m.pedido) {
        const p = m.pedido;
        const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0
          ? p.asignaciones[p.asignaciones.length - 1]
          : null;
        nombreEmp = obtenerNombreOperario(ultimaAsignacion?.empleado || p.empleado);
      } else if (m.usuario) {
        nombreEmp = obtenerNombreOperario(m.usuario);
      }

      mapaEmpleados[nombreEmp] = (mapaEmpleados[nombreEmp] || 0) + Math.abs(Number(m.monto || 0));
    });

    pedidosPendientes.forEach((p) => {
      const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0
        ? p.asignaciones[p.asignaciones.length - 1]
        : null;
      const nombreEmp = obtenerNombreOperario(ultimaAsignacion?.empleado || p.empleado);

      const montoPendiente = Number(p.monto_total || p.total || 0);
      mapaEmpleados[nombreEmp] = (mapaEmpleados[nombreEmp] || 0) + montoPendiente;
    });

    const rendimientoEmpleados = Object.keys(mapaEmpleados).map((nombre) => ({
      name: nombre,
      ventas: mapaEmpleados[nombre]
    }));

    // --- EVOLUCIÓN DE INGRESOS A CAJA (HORAS / DÍAS / MESES) ---
    let ventasPorPeriodo: { name: string; ventas: number; esEgreso: boolean; montoMovimiento: number }[] = [];
    
    // Diferencia de meses de calendario
    const diffMeses = (hasta.getFullYear() - desde.getFullYear()) * 12 + (hasta.getMonth() - desde.getMonth());

    const esUnSoloDia = fDesde === fHasta;
    const esPorMeses = diffMeses >= 1; // Si hay 1 o más meses de diferencia

    if (esUnSoloDia) {
      // 1. AGRUPACIÓN POR HORAS
      const mapaHoras: { [hora: string]: { delta: number; esEgreso: boolean } } = {};
      const movsOrdenados = [...movimientosEnRango].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

      movsOrdenados.forEach((m) => {
        const f = new Date(m.fecha);
        const horaStr = f.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
        const esEgreso = esMovimientoEgreso(m);
        const delta = esEgreso ? -Math.abs(Number(m.monto || 0)) : Math.abs(Number(m.monto || 0));

        if (!mapaHoras[horaStr]) {
          mapaHoras[horaStr] = { delta: 0, esEgreso: false };
        }

        mapaHoras[horaStr].delta += delta;
        mapaHoras[horaStr].esEgreso = mapaHoras[horaStr].delta < 0 || esEgreso;
      });

      let acumulado = 0;
      ventasPorPeriodo = Object.keys(mapaHoras).map((hora) => {
        acumulado += mapaHoras[hora].delta;
        return {
          name: hora,
          ventas: acumulado < 0 ? 0 : acumulado,
          esEgreso: mapaHoras[hora].esEgreso,
          montoMovimiento: mapaHoras[hora].delta
        };
      });

      if (ventasPorPeriodo.length === 0) {
        ventasPorPeriodo = [{ name: '00:00', ventas: 0, esEgreso: false, montoMovimiento: 0 }];
      }
    } else if (esPorMeses) {
      // 2. AGRUPACIÓN POR MESES (Ej: "Jun 2026", "Jul 2026")
      const mapaMeses: { [mes: string]: number } = {};

      let curr = new Date(desde.getFullYear(), desde.getMonth(), 1);
      const fin = new Date(hasta.getFullYear(), hasta.getMonth(), 1);

      while (curr <= fin) {
        const mesStr = curr.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
        mapaMeses[mesStr] = 0;
        curr.setMonth(curr.getMonth() + 1);
      }

      movimientosEnRango.forEach((m) => {
        const f = new Date(m.fecha);
        const mesStr = f.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
        if (mapaMeses[mesStr] !== undefined) {
          const esEgreso = esMovimientoEgreso(m);
          const delta = esEgreso ? -Math.abs(Number(m.monto || 0)) : Math.abs(Number(m.monto || 0));
          mapaMeses[mesStr] += delta;
        }
      });

      ventasPorPeriodo = Object.keys(mapaMeses).map((mes) => ({
        name: mes,
        ventas: mapaMeses[mes] < 0 ? 0 : mapaMeses[mes],
        esEgreso: false,
        montoMovimiento: mapaMeses[mes]
      }));
    } else {
      // 3. AGRUPACIÓN POR DÍAS (Diferencias dentro del mismo mes)
      const mapaDias: { [fecha: string]: number } = {};

      let curr = new Date(desde);
      while (curr <= hasta) {
        const diaStr = curr.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        mapaDias[diaStr] = 0;
        curr.setDate(curr.getDate() + 1);
      }

      movimientosEnRango.forEach((m) => {
        const f = new Date(m.fecha);
        const diaStr = f.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        if (mapaDias[diaStr] !== undefined) {
          const esEgreso = esMovimientoEgreso(m);
          const delta = esEgreso ? -Math.abs(Number(m.monto || 0)) : Math.abs(Number(m.monto || 0));
          mapaDias[diaStr] += delta;
        }
      });

      ventasPorPeriodo = Object.keys(mapaDias).map((dia) => ({
        name: dia,
        ventas: mapaDias[dia] < 0 ? 0 : mapaDias[dia],
        esEgreso: false,
        montoMovimiento: mapaDias[dia]
      }));
    }

    // --- TIPOS / MEDIOS DE PAGO Y EGRESOS ---
    const mapaPagos: { [key: string]: number } = {};

    movimientosEnRango.forEach((m: any) => {
      const esEgreso = esMovimientoEgreso(m);
      const montoAbs = Math.abs(Number(m.monto || 0));

      if (esEgreso) {
        mapaPagos['EGRESOS / SALIDAS'] = (mapaPagos['EGRESOS / SALIDAS'] || 0) + montoAbs;
      } else {
        const medioTexto = (
          m.medioPago ||
          m.medio_pago ||
          m.metodoPago ||
          m.metodo_pago ||
          m.formaPago ||
          m.forma_pago ||
          m.pedido?.medioPago ||
          m.pedido?.medio_pago ||
          m.pedido?.metodoPago ||
          m.pedido?.metodo_pago ||
          m.pedido?.formaPago ||
          m.descripcion ||
          ''
        ).toString().toUpperCase();

        const esTransferencia = 
          medioTexto.includes('TRANSFERENCIA') || 
          medioTexto.includes('MERCADOPAGO') || 
          medioTexto.includes('MP') || 
          medioTexto.includes('DEBITO') || 
          medioTexto.includes('CREDITO') || 
          medioTexto.includes('BANK') || 
          medioTexto.includes('BANCO');

        const claveMedio = esTransferencia ? 'TRANSFERENCIA' : 'EFECTIVO';
        mapaPagos[claveMedio] = (mapaPagos[claveMedio] || 0) + montoAbs;
      }
    });

    const distribucionMediosPago = Object.keys(mapaPagos).map((key) => ({
      name: key,
      value: mapaPagos[key]
    }));

    // --- DISTRIBUCIÓN POR ESTADOS ---
    const mapaEstados: { [key: string]: number } = {};
    pedidosEnRango.forEach((p) => {
      const estado = p.estado || 'PENDIENTE';
      mapaEstados[estado] = (mapaEstados[estado] || 0) + 1;
    });

    const distribucionEstados = Object.keys(mapaEstados).map((key) => ({
      name: key,
      value: mapaEstados[key]
    }));

    setMetricas({
      ventasTotales: saldoNetoCaja,
      ticketsGenerados: ticketsFinales,
      ticketPromedio,
      cantidadMovimientos,
      ventasPorPeriodo,
      distribucionMediosPago: distribucionMediosPago.length > 0 ? distribucionMediosPago : [{ name: 'EFECTIVO', value: totalIngresosBrutos }],
      distribucionEstados: distribucionEstados.length > 0 ? distribucionEstados : [{ name: 'Sin datos', value: 1 }],
      rendimientoEmpleados: rendimientoEmpleados.length > 0 ? rendimientoEmpleados : [{ name: 'Sin datos', ventas: 0 }]
    });
  };

  // Carga inicial al cargar datos
  useEffect(() => {
    if (pedidosRaw.length > 0 || movimientosCaja.length > 0) {
      procesarMetricas(fechaDesde, fechaHasta);
    }
  }, [pedidosRaw, movimientosCaja]);

  // BOTÓN ANALIZAR: Dispara manualmente el filtro
  const handleAnalizar = () => {
    setFechaDesde(fechaDesdeInput);
    setFechaHasta(fechaHastaInput);
    procesarMetricas(fechaDesdeInput, fechaHastaInput);
  };

  const COLORES_TORTA = ['#8e45e0', '#20c997', '#e22e2e', '#0dcaf0', '#ffc107'];
  const esMismoDia = fechaDesde === fechaHasta;

  if (cargando && movimientosCaja.length === 0) {
    return (
      <div className="text-center text-white mt-5">
        <div className="spinner-border text-info mb-3"></div>
        <h4>Consolidando métricas del sistema...</h4>
      </div>
    );
  }

  return (
    <div className="container-fluid text-white font-monospace pb-5">
      {/* HEADER CONTROLES */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom border-secondary gap-3" style={{ borderColor: '#2d2d30 !important' }}>
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge px-2 py-1 small" style={{ backgroundColor: '#8e45e0' }}>BUSINESS INTELLIGENCE</span>
            <h2 className="fw-bold mb-0" style={{ color: '#ffffff' }}>Métricas e Informes</h2>
          </div>
          <p className="text-white-50 mb-0 small mt-1">Análisis consolidado de caja y carga de trabajo en pedidos</p>
        </div>

        <div className="d-flex align-items-center gap-2 p-2 rounded-3 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
          <i className="bi bi-calendar-range ms-2 text-muted"></i>
          <input 
            type="date" 
            className="form-control form-control-sm bg-dark text-white border-0 font-monospace" 
            value={fechaDesdeInput} 
            onChange={(e) => setFechaDesdeInput(e.target.value)} 
          />
          <span className="text-muted">→</span>
          <input 
            type="date" 
            className="form-control form-control-sm bg-dark text-white border-0 font-monospace" 
            value={fechaHastaInput} 
            onChange={(e) => setFechaHastaInput(e.target.value)} 
          />
          <button 
            onClick={handleAnalizar} 
            className="btn btn-sm px-3 fw-bold text-white ms-1" 
            style={{ backgroundColor: '#8e45e0', borderRadius: '6px' }}
          >
            Analizar
          </button>
        </div>
      </div>

      {/* KPI CARDS GLOBALES */}
      <div className="row g-3 mb-4">
        {[
          { label: 'INGRESOS TOTALES', val: `$${metricas.ventasTotales.toLocaleString('es-AR')}`, color: '#8e45e0', icon: 'bi-currency-dollar' },
          { label: 'TICKETS GENERADOS', val: metricas.ticketsGenerados, color: '#20c997', icon: 'bi-receipt' },
          { label: 'TICKET PROMEDIO', val: `$${metricas.ticketPromedio}`, color: '#0dcaf0', icon: 'bi-graph-up-arrow' },
          { label: 'MOVIMIENTOS DE CAJA', val: `${metricas.cantidadMovimientos} reg`, color: '#ffc107', icon: 'bi-wallet2' }
        ].map((card, idx) => (
          <div className="col-12 col-sm-6 col-xl-3" key={idx}>
            <div className="p-3 rounded-4 position-relative overflow-hidden h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderTop: `4px solid ${card.color}` }}>
              <div className="text-white-50 small mb-1 fw-semibold">{card.label}</div>
              <h2 className="fw-bold mb-0 text-white" style={{ fontSize: '1.8rem' }}>{card.val}</h2>
              <i className={`bi ${card.icon} position-absolute end-0 bottom-0 mb-1 me-3`} style={{ fontSize: '3.5rem', color: card.color, opacity: 0.15 }}></i>
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN PRINCIPAL DE GRÁFICOS */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-8">
          <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-4" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-activity me-2" style={{ color: '#8e45e0' }}></i>Evolución de Ingresos a Caja
            </h5>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metricas.ventasPorPeriodo} margin={{ top: 10, right: 35, left: 0, bottom: 15 }}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8e45e0" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8e45e0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#a1a1aa" 
                    tick={{ fill: '#a1a1aa' }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={15} 
                  />
                  <YAxis 
                    stroke="#a1a1aa" 
                    tick={{ fill: '#a1a1aa' }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => `$${val >= 1000 ? val/1000 + 'k' : val}`} 
                  />
                  <RechartsTooltip content={<CustomAreaTooltip esMismoDia={esMismoDia} />} />
                  <Area type="monotone" dataKey="ventas" stroke="#8e45e0" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-4" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-pie-chart-fill me-2" style={{ color: '#20c997' }}></i>Tipos / Medios de Pago
            </h5>
            <div style={{ height: '300px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={metricas.distribucionMediosPago} cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                    {metricas.distribucionMediosPago.map((_: any, index: number) => (
                      <Cell key={`cell-pago-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR */}
      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-diagram-3-fill me-2" style={{ color: '#ffc107' }}></i>Distribución por Estados
            </h5>
            <div style={{ height: '250px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={metricas.distribucionEstados} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {metricas.distribucionEstados.map((_: any, index: number) => (
                      <Cell key={`cell-estado-${index}`} fill={COLORES_TORTA[(index + 2) % COLORES_TORTA.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-person-badge-fill me-2" style={{ color: '#0dcaf0' }}></i>Recaudación Real + Trabajos Pendientes por Operario
            </h5>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={metricas.rendimientoEmpleados} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#a1a1aa" 
                    tick={{ fill: '#a1a1aa' }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val/1000 + 'k' : val}`} />
                  <RechartsTooltip cursor={{ fill: '#222122' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#0dcaf0', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="ventas" fill="#0dcaf0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};