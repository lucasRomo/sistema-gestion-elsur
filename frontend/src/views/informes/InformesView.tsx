import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

export const InformesView: React.FC = () => {
  const [fechaDesde, setFechaDesde] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0]);
  const [metricas, setMetricas] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  const fetchMetricas = async () => {
    setCargando(true);
    try {
      const response = await fetch(`http://localhost:8080/api/informes/dashboard?desde=${fechaDesde}&hasta=${fechaHasta}`);
      if (response.ok) {
        const data = await response.json();
        setMetricas(data);
      }
    } catch (error) {
      console.error("Error al traer informes de la BD", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchMetricas();
  }, []);

  // Mapeo dinámico de datos de la BD con fallback seguro
  const datosVentasMensuales = metricas?.ventasPorPeriodo || [
    { name: 'Semana 1', ventas: 0 }, { name: 'Semana 2', ventas: 0 },
    { name: 'Semana 3', ventas: 0 }, { name: 'Semana 4', ventas: metricas?.ventasTotales || 0 }
  ];

  const datosEmpleados = metricas?.rendimientoEmpleados || [
    { name: 'Sin datos', ventas: 0 }
  ];

  const datosTortas = metricas?.distribucionServicios || [
    { name: 'General', value: 100 }
  ];

  const COLORES_TORTA = ['#8e45e0', '#20c997', '#0dcaf0', '#ffc107', '#e22e2e'];

  if (!metricas && cargando) return <div className="text-center text-white mt-5"><div className="spinner-border text-info"></div><h4>Cargando Inteligencia de Negocio...</h4></div>;

  return (
    <div className="container-fluid text-white font-monospace pb-5">
      {/* HEADER CONTROLES */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom border-secondary gap-3" style={{ borderColor: '#2d2d30 !important' }}>
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge px-2 py-1 small" style={{ backgroundColor: '#8e45e0' }}>BUSINESS INTELLIGENCE</span>
            <h2 className="fw-bold mb-0" style={{ color: '#ffffff' }}>Métricas e Informes</h2>
          </div>
          <p className="text-white-50 mb-0 small mt-1">Análisis visual avanzado del rendimiento de El Sur</p>
        </div>

        <div className="d-flex align-items-center gap-2 p-2 rounded-3 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
          <i className="bi bi-calendar-range ms-2 text-muted"></i>
          <input type="date" className="form-control form-control-sm bg-dark text-white border-0 font-monospace" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          <span className="text-muted">→</span>
          <input type="date" className="form-control form-control-sm bg-dark text-white border-0 font-monospace" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          <button onClick={fetchMetricas} className="btn btn-sm px-3 fw-bold text-white ms-1" style={{ backgroundColor: '#8e45e0', borderRadius: '6px' }}>Analizar</button>
        </div>
      </div>

      {/* KPI CARDS GLOBALES */}
      <div className="row g-3 mb-4">
        {[
          { label: 'INGRESOS TOTALES', val: `$${metricas?.ventasTotales || 0}`, color: '#8e45e0', icon: 'bi-currency-dollar' },
          { label: 'TICKETS GENERADOS', val: metricas?.pedidosCompletados || 0, color: '#20c997', icon: 'bi-receipt' },
          { label: 'TICKET PROMEDIO', val: `$${metricas?.ticketPromedio || 0}`, color: '#0dcaf0', icon: 'bi-graph-up-arrow' },
          { label: 'MOVIMIENTOS CAJA', val: `${metricas?.cantidadMovimientos || 0} reg`, color: '#ffc107', icon: 'bi-wallet2' }
        ].map((card, idx) => (
          <div className="col-12 col-sm-6 col-xl-3" key={idx}>
            <div className="p-3 rounded-4 position-relative overflow-hidden h-100 shadow-sm transition-all" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderTop: `4px solid ${card.color}` }}>
              <div className="text-white-50 small mb-1 fw-semibold">{card.label}</div>
              <h2 className="fw-bold mb-0 text-white" style={{ fontSize: '1.8rem' }}>{card.val}</h2>
              <i className={`bi ${card.icon} position-absolute end-0 bottom-0 mb-1 me-3`} style={{ fontSize: '3.5rem', color: card.color, opacity: 0.15 }}></i>
            </div>
          </div>
        ))}
      </div>

      {/* ZONA DE GRÁFICOS */}
      <div className="row g-4">
        {/* GRÁFICO DE ÁREA: EVOLUCIÓN DE VENTAS */}
        <div className="col-12 col-xl-8">
          <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-4" style={{ color: '#a1a1aa' }}><i className="bi bi-activity me-2" style={{ color: '#8e45e0' }}></i>Evolución de Ingresos</h5>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer>
                <AreaChart data={datosVentasMensuales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8e45e0" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8e45e0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#8e45e0', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#20c997' }} />
                  <Area type="monotone" dataKey="ventas" stroke="#8e45e0" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* GRÁFICO DE TORTA: CATEGORÍAS */}
        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-4" style={{ color: '#a1a1aa' }}><i className="bi bi-pie-chart-fill me-2" style={{ color: '#20c997' }}></i>Distribución de Servicios</h5>
            <div style={{ height: '300px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={datosTortas} cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                    {datosTortas.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* GRÁFICO DE BARRAS: RENDIMIENTO EMPLEADOS */}
        <div className="col-12">
          <div className="p-4 rounded-4 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-4" style={{ color: '#a1a1aa' }}><i className="bi bi-person-badge-fill me-2" style={{ color: '#0dcaf0' }}></i>Rendimiento de Ventas por Operario</h5>
            <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={datosEmpleados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={50}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                  <RechartsTooltip cursor={{fill: '#222122'}} contentStyle={{ backgroundColor: '#18181b', borderColor: '#0dcaf0', borderRadius: '8px', color: '#fff' }} />
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