import React, { useState, useEffect } from 'react';
import { SidebarLayout } from '../components/layouts/SidebarLayout'; 
import { ModalNuevoIngreso } from '../features/caja/ModalNuevoIngreso';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTurno } from '../Context/TurnoContext';
import { useTheme } from '../Context/ThemeContext';
import { ModalConsultarArqueo } from '../features/caja/ModalConsultarArqueo';
import { ModalCerrarTurno } from '../features/caja/ModalCerrarTurno';

export const CajaView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Estilos adaptativos según el tema activo
  const pageBg = isDark ? '#1b1b1b' : '#f8fafc';
  const textColor = isDark ? 'text-white' : 'text-dark';
  const cardBg = isDark ? '#1e1e1f' : '#ffffff';
  const cardBorder = isDark ? '#242427' : '#e2e8f0';
  const shadowStyle = isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
  const graphInnerBg = isDark ? '#222122' : '#f1f5f9';
  const tableWrapBg = isDark ? '#1d1d1d' : '#ffffff';
  const theadBg = isDark ? '#1d1d1d' : '#f6f9fc';

  const chartGrid = isDark ? '#2d2d30' : '#e2e8f0';
  const chartTick = isDark ? '#aaa' : '#64748b';
  const tooltipBg = isDark ? '#1e1e1f' : '#ffffff';
  const tooltipBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const tooltipText = isDark ? '#fff' : '#18181b';
  const dotColor = isDark ? '#ffffff' : '#1e1e1f';

  const { cajaAbierta, setCajaAbierta } = useTurno();
  const [saldoCaja, setSaldoCaja] = useState<number>(0);
  const [ingresosTurno, setIngresosTurno] = useState<number>(0);
  const [egresosTurno, setEgresosTurno] = useState<number>(0);
  const navigate = useNavigate();
  const [turnoActual, setTurnoActual] = useState<any>(null);

  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // --- ESTADOS DE MODALES ---
  const [showModalApertura, setShowModalApertura] = useState<boolean>(false);
  const [montoInicialInput, setMontoInicialInput] = useState<string>('0');
  const [guardandoApertura, setGuardandoApertura] = useState<boolean>(false);

  const [showModalCierre, setShowModalCierre] = useState<boolean>(false);
  const [guardandoCierre, setGuardandoCierre] = useState<boolean>(false);
  const [showModalArqueo, setShowModalArqueo] = useState<boolean>(false);
  const [datosArqueo, setDatosArqueo] = useState<any>(null);

  const fetchTotalesCaja = async (montoInicialTurno: number = 0) => {
    try {
      const res = await fetch('http://localhost:8080/api/movimientos-caja/totales');
      if (res.ok) {
        const data = await res.json();
        setIngresosTurno(data.totalIngresos);
        setEgresosTurno(data.totalEgresos); 
        setSaldoCaja(montoInicialTurno + data.saldoActual);
      }
    } catch (error) {
      console.error("Error al sintonizar totales:", error);
    }
  };
  
  const fetchMovimientosHoy = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/movimientos-caja/dia');
      if (res.ok) {
        const data = await res.json();
        setMovimientos(data);
      }
    } catch (error) {
      console.error("Error al cargar los movimientos:", error);
    }
  };

  useEffect(() => {
    const inicializarCaja = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/turnos/estado-caja');
        
        if (res.ok) {
          const text = await res.text();
          const data = text ? JSON.parse(text) : null;

          if (data && data.estado === "ABIERTO") {
            setCajaAbierta(true);
            setTurnoActual(data);
            fetchMovimientosHoy();
            fetchTotalesCaja(data.montoInicial || 0);
          } else {
            setCajaAbierta(false);
            setTurnoActual(null);
          }
        }
      } catch (error) {
        console.error("Error al inicializar la caja:", error);
      }
    };

    inicializarCaja();
  }, [setCajaAbierta]);

  // --- CONTROLADORES DE APERTURA ---
  const handleAbrirAperturaModal = () => {
    setMontoInicialInput('0');
    setShowModalApertura(true);
  };

  const confirmarAperturaCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = Number(montoInicialInput);
    if (isNaN(monto) || monto < 0) {
      alert("Por favor, ingrese un monto inicial válido.");
      return;
    }

    setGuardandoApertura(true);
    try {
      const res = await fetch('http://localhost:8080/api/turnos/abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fechaApertura: new Date().toISOString(), 
          montoInicial: monto,             
          estado: "ABIERTO"              
        })
      });

      if (res.ok) {
        const nuevoTurno = await res.json();
        setTurnoActual(nuevoTurno);
        setCajaAbierta(true);
        setSaldoCaja(monto);
        setIngresosTurno(0);
        setEgresosTurno(0);
        setMovimientos([]);
        setShowModalApertura(false);
        fetchMovimientosHoy();
        fetchTotalesCaja(nuevoTurno.montoInicial || monto);
      } else {
        const errorText = await res.text();
        alert("Error al abrir caja: " + errorText);
      }
    } catch (error) {
      console.error("No se pudo abrir la caja en el servidor:", error);
    } finally {
      setGuardandoApertura(false);
    }
  };

  const handleConsultarArqueo = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/movimientos-caja/desglose-arqueo');
      if (res.ok) {
        const data = await res.json();
        setDatosArqueo(data);
        setShowModalArqueo(true);
      }
    } catch (error) {
      console.error("Error consultando arqueo dinámico:", error);
    }
  };

  const handleGuardarMovimiento = async (data: { monto: string; concepto: string; tipoMovimiento: string; idPedido: string | null }) => {
    try {
      const usuarioGuardado = localStorage.getItem('usuario_logueado');
      const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

      if (!usuarioObj || (!usuarioObj.idUsuario && !usuarioObj.id_usuario)) {
        alert("Error: No se detectó un usuario logueado activo.");
        return;
      }

      const pad = (num: number) => String(num).padStart(2, '0');
      const ahora = new Date();
      const fechaMomentoGuardado = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;
      const nuevoMovimiento = {
        monto: Number(data.monto),
        tipoMovimiento: data.tipoMovimiento, 
        categoria: data.tipoMovimiento === 'EGRESO' ? 'VARIOS' : 'VENTA',
        descripcion: data.concepto,
        usuario: { 
          idUsuario: usuarioObj.idUsuario || usuarioObj.id_usuario 
        },
        pedido: data.idPedido ? { idPedido: Number(data.idPedido) } : null,
        fecha: fechaMomentoGuardado
      };

      const res = await fetch('http://localhost:8080/api/movimientos-caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoMovimiento)
      });

      if (res.ok) {
        setIsModalOpen(false);
        const montoNum = Number(data.monto);
        if (data.tipoMovimiento === 'INGRESO') {
          setSaldoCaja((prev) => prev + montoNum);
          setIngresosTurno((prev) => prev + montoNum);
        } else {
          setSaldoCaja((prev) => prev - montoNum);
          setEgresosTurno((prev) => prev + montoNum);
        }
        fetchMovimientosHoy();
      } else {
        const errorText = await res.text();
        console.error("Error del servidor al guardar movimiento:", errorText);
        alert("No se pudo guardar el movimiento. Error: " + errorText);
      }
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
    }
  };

  const handleAbrirCierreModal = async () => {
    if (!turnoActual) {
      alert("No hay un turno activo para cerrar.");
      return;
    }
    
    try {
      const res = await fetch('http://localhost:8080/api/movimientos-caja/desglose-arqueo');
      if (res.ok) {
        const data = await res.json();
        setDatosArqueo(data);
      }
    } catch (error) {
      console.error("Error al obtener desglose para cierre:", error);
    }

    setShowModalCierre(true);
  };

  const ejecutarCierreCaja = async (montoRealEfectivo: number, observaciones?: string) => {
    setGuardandoCierre(true);
    try {
      const url = `http://localhost:8080/api/turnos/${turnoActual.idTurno}/cerrar?montoReal=${montoRealEfectivo}${
        observaciones ? `&observaciones=${encodeURIComponent(observaciones)}` : ''
      }`;

      const res = await fetch(url, { method: 'POST' });

      if (res.ok) {
        setCajaAbierta(false);
        setTurnoActual(null);
        setMovimientos([]);
        setSaldoCaja(0);
        setIngresosTurno(0);
        setEgresosTurno(0);
        return true;
      } else {
        const errorText = await res.text();
        alert("Error al cerrar caja: " + errorText);
        return false;
      }
    } catch (error) {
      console.error("Error al cerrar caja:", error);
      return false;
    } finally {
      setGuardandoCierre(false);
    }
  };

  const renderBadgeCategoria = (m: any) => {
    if (m.categoria === 'EGRESO_MANTENIMIENTO') {
      return <span className="badge bg-warning text-dark fw-bold"><i className="bi bi-tools me-1"></i>MANTENIMIENTO</span>;
    }
    if (m.categoria === 'INSUMOS') {
      return <span className="badge bg-info text-dark fw-bold"><i className="bi bi-truck me-1"></i>INSUMOS</span>;
    }
    return (
      <span className={`badge ${m.tipoMovimiento === 'INGRESO' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
        {m.tipoMovimiento === 'INGRESO' ? 'Ganancia' : 'Egreso'}
      </span>
    );
  };

  return (
    <SidebarLayout activeItem="Caja">
      <div className={`container-fluid p-2 pt-5 mt-2 font-monospace ${textColor}`} style={{ backgroundColor: pageBg, minHeight: '100vh' }}>
        
        {/* Título Principal */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fw-bold mx-auto font-monospace" style={{ fontSize: '2.8rem' }}>Caja</h1>
          <i className="bi bi-question-circle text-info fs-3" style={{ cursor: 'pointer' }}></i>
        </div>

        {/* --- PANELES DE FLUJO --- */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="p-4 rounded-3 h-100" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="opacity-75 fw-medium">
                  Flujo de Caja Actual: {' '}
                  <span className={cajaAbierta ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                    {cajaAbierta ? 'Abierta' : 'Cerrado'}
                  </span>
                </span>
              </div>
              
              <div className="small font-monospace opacity-50 mb-1">Saldo de Caja Actual</div>
              
              <h1 className="fw-bold mb-3" style={{ fontSize: '2.6rem' }}>
                ${cajaAbierta ? saldoCaja.toLocaleString('es-AR') : '0'}
              </h1>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Inicio de Caja:</span>
                <span className="fw-bold text-info fs-6">
                  ${cajaAbierta ? (turnoActual?.montoInicial || 0).toLocaleString('es-AR') : '0'}
                </span>
              </div>
              <div className="border-top border-secondary pt-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Total de Ingresos de Turno:</span>
                  <span className="text-success fw-semibold font-monospace">
                    ${cajaAbierta ? ingresosTurno.toLocaleString('es-AR') : '0'}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Total de Egresos de Turno:</span>
                  <span className="text-danger fw-semibold font-monospace">
                    ${cajaAbierta ? egresosTurno.toLocaleString('es-AR') : '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="p-4 rounded-3 h-100" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: shadowStyle }}>
              <div className="p-3 rounded" style={{ backgroundColor: graphInnerBg, border: `1px solid ${cardBorder}`, minHeight: '180px', overflowX: 'auto' }}>
                <div className="text-center small opacity-50 mb-2 font-monospace">
                  {new Date().toLocaleDateString('es-AR')}
                </div>
                
                <div style={{ width: movimientos.length > 5 ? `${movimientos.length * 80}px` : '100%', height: '140px', minWidth: '100%' }}>
                  {cajaAbierta && movimientos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[...movimientos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                        .map(m => ({
                          hora: new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
                          monto: m.tipoMovimiento === 'EGRESO' ? -Math.abs(m.monto) : m.monto
                        }))}
                        margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                        <XAxis dataKey="hora" tick={{ fill: chartTick, fontSize: 11 }} axisLine={{ stroke: chartGrid }} tickLine={false} />
                        <YAxis domain={['auto', 'auto']} tick={{ fill: chartTick, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, fontSize: '12px' }} labelStyle={{ color: chartTick }} />
                        <Line type="linear" dataKey="monto" stroke="#6c0beb" strokeWidth={4} dot={{ fill: dotColor, stroke: dotColor, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted small opacity-50" style={{ minHeight: '140px' }}>
                      <i className="bi bi-graph-up-arrow me-2"></i> No hay datos disponibles para graficar
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- TABLA Y ACCIONES --- */}
        <div className="row g-4 align-items-stretch mb-4">
          <div className="col-lg-8 d-flex flex-column">
            <h5 className="mb-3 fw-semibold">Registro de Movimientos Manuales</h5>
            
            <div className="p-3 rounded-3 d-flex flex-column" style={{ backgroundColor: tableWrapBg, border: `1px solid ${cardBorder}`, boxShadow: shadowStyle, height: '315px' }}>
              <div className="table-responsive flex-grow-1" style={{ backgroundColor: tableWrapBg, height: '100%', overflowY: 'auto' }}>
                <table className={`table table-hover m-0 align-middle text-center ${isDark ? 'table-dark' : ''}`} style={{ backgroundColor: tableWrapBg }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: theadBg, zIndex: 1 }}>
                    <tr className="text-muted border-secondary" style={{ fontSize: '0.9rem' }}>
                      <th style={{ width: '160px' }}>Fecha/Hora</th>
                      <th style={{ width: '110px' }}>Monto</th>
                      <th style={{ width: '140px' }}>Categoría</th>
                      <th className="text-start">Descripción</th>
                      <th style={{ width: '80px' }}>Usuario</th>
                      <th style={{ width: '80px' }}>Pedido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.length === 0 ? (
                      <tr><td colSpan={6} className="py-5 opacity-50">No hay movimientos registrados hoy</td></tr>
                    ) : (
                      movimientos.map((m) => (
                        <tr key={m.id_movimiento} className="border-secondary" style={{ fontSize: '0.95rem' }}>
                          <td>{new Date(m.fecha).toLocaleString('es-AR')}</td>
                          <td className={`fw-bold ${m.tipoMovimiento === 'EGRESO' ? 'text-danger' : 'text-success'}`}>
                            {m.tipoMovimiento === 'EGRESO' ? '-' : '+'}${Number(m.monto).toFixed(2)}
                          </td>
                          <td>{renderBadgeCategoria(m)}</td>
                          <td>
                            <div 
                              className="text-start" 
                              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '280px' }}
                              title={m.descripcion || 'Sin descripción'}
                            >
                              {m.descripcion || '-'}
                            </div>
                          </td>
                          <td>{m.usuario?.idUsuario || m.usuario?.id_usuario || '1'}</td>
                          <td>{m.pedido?.idPedido || (m.descripcion?.includes('Pedido #') ? m.descripcion.split('#')[1] : '-')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-lg-4 d-flex flex-column justify-content-start align-items-center gap-3 pt-0">
            <h5 className="mb-3 fw-semibold align-self-start" style={{ visibility: 'hidden' }}>Acciones</h5>
            
            <button className="btn btn-success py-3 d-flex justify-content-between align-items-center fw-semibold px-4" style={{ fontSize: '1.15rem', width: '380px', borderRadius: '10px' }} disabled={!cajaAbierta} onClick={() => setIsModalOpen(true)}>
              <span>Crear Nuevo Movimiento</span>
              <i className="bi bi-plus-lg fs-4 ms-2"></i>
            </button>
            
            <button className="btn py-3 d-flex justify-content-between align-items-center fw-semibold text-white px-4" style={{ backgroundColor: '#6f42c1', fontSize: '1.15rem', width: '380px', borderRadius: '10px' }} disabled={!cajaAbierta}>
              <span>Compra de Insumos</span>
              <i className="bi bi-truck fs-4 ms-2"></i>
            </button>
            
            <button className="btn btn-dark py-3 d-flex justify-content-between align-items-center fw-semibold border-secondary text-light opacity-75 px-4" style={{ backgroundColor: '#2d2d30', fontSize: '1.15rem', width: '380px', borderRadius: '10px' }} disabled={!cajaAbierta}>
              <span>Descargar PDF Caja</span>
              <i className="bi bi-download fs-4 ms-2"></i>
            </button>
          </div>
        </div>

        {/* --- BOTONES INFERIORES --- */}
        <div className="d-flex flex-wrap gap-3 justify-content-center w-100 mt-4 px-2 m-0 pb-3">
          <button onClick={() => navigate('/dashboard')} className="btn btn-danger px-4 py-2" style={{ backgroundColor: '#ce1515', height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }}>Volver</button>

          <button className="btn btn-success d-flex align-items-center justify-content-center fw-semibold text-center text-white" style={{ height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }} disabled={cajaAbierta} onClick={handleAbrirAperturaModal}>
            <span>Iniciar Caja del Día</span>
          </button>
          
          <button className="btn d-flex align-items-center justify-content-center fw-semibold text-center text-dark" style={{ backgroundColor: '#10cbd8', height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }} disabled={!cajaAbierta} onClick={handleConsultarArqueo}>
            <span>Consultar Arqueo</span>
          </button>
          
          <button className="btn btn-danger d-flex align-items-center justify-content-center fw-semibold text-center text-white" style={{ backgroundColor: '#daa32d', height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }} disabled={!cajaAbierta} onClick={handleAbrirCierreModal}>
            <span>Cerrar Turno y Arqueo</span>
          </button>
        </div>
      </div>

      {/* MODAL APERTURA DE CAJA */}
      {showModalApertura && (
        <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${textColor} font-monospace`} style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', border: `1px solid ${cardBorder}`, borderRadius: '12px' }}>
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title fw-bold">Apertura de Caja</h5>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setShowModalApertura(false)}></button>
              </div>
              <form onSubmit={confirmarAperturaCaja}>
                <div className="modal-body py-4">
                  <div className="mb-3">
                    <label htmlFor="montoInicial" className="form-label small text-uppercase fw-semibold">
                      Monto inicial para abrir la caja ($):
                    </label>
                    <input 
                      type="number" step="0.01" min="0" id="montoInicial"
                      className={`form-control form-control-lg font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'} border-secondary`}
                      style={{ fontSize: '1.6rem', textAlign: 'center', color: '#10b981' }}
                      value={montoInicialInput} onChange={(e) => setMontoInicialInput(e.target.value)}
                      required autoFocus
                    />
                  </div>
                  <p className="small text-center m-0 opacity-75">
                    Este monto se guardará como saldo inicial en la base de datos PostgreSQL.
                  </p>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button type="button" className="btn btn-secondary px-4" onClick={() => setShowModalApertura(false)} disabled={guardandoApertura}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-success px-4" disabled={guardandoApertura}>
                    {guardandoApertura ? 'Abriendo...' : 'Abrir Caja'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODALES EXTERNOS DE FEATURE CAJA */}
      <ModalNuevoIngreso 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGuardar={handleGuardarMovimiento}
      />
      
      <ModalConsultarArqueo 
        isOpen={showModalArqueo}
        onClose={() => setShowModalArqueo(false)}
        datosArqueo={datosArqueo}
        montoInicial={turnoActual?.montoInicial || 0}
        movimientos={movimientos}
      />

      <ModalCerrarTurno
        isOpen={showModalCierre}
        onClose={() => setShowModalCierre(false)}
        datosArqueo={datosArqueo}
        montoInicialTurno={turnoActual?.montoInicial || 0}
        onConfirmarCierre={ejecutarCierreCaja}
        guardando={guardandoCierre}
        movimientos={movimientos}
      />
    </SidebarLayout>
  );
};