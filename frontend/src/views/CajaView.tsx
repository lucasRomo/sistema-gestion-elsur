import React, { useState, useEffect } from 'react';
import { SidebarLayout } from '../components/layouts/SidebarLayout'; 
import { ModalNuevoIngreso } from '../features/caja/ModalNuevoIngreso';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTurno } from '../Context/TurnoContext';

export const CajaView: React.FC = () => {
  // --- LÓGICA DE ESTADOS PARA EL FLUJO DE CAJA ---
  const { cajaAbierta, setCajaAbierta } = useTurno();
  const [saldoCaja, setSaldoCaja] = useState<number>(0);
  const [ingresosTurno, setIngresosTurno] = useState<number>(0);
  const [egresosTurno, setEgresosTurno] = useState<number>(0);
  const navigate = useNavigate();
  const [turnoActual, setTurnoActual] = useState<any>(null);

  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // --- ESTADOS PARA LOS NUEVOS MODALES ---
  const [showModalApertura, setShowModalApertura] = useState<boolean>(false);
  const [montoInicialInput, setMontoInicialInput] = useState<string>('0');
  const [guardandoApertura, setGuardandoApertura] = useState<boolean>(false);

  const [showModalCierre, setShowModalCierre] = useState<boolean>(false);
  const [montoRealInput, setMontoRealInput] = useState<string>('0');
  const [guardandoCierre, setGuardandoCierre] = useState<boolean>(false);

  const fetchTotalesCaja = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/movimientos-caja/totales');
      if (res.ok) {
        const data = await res.json();
        setIngresosTurno(data.totalIngresos);
        setEgresosTurno(data.totalEgresos); 
        setSaldoCaja(data.saldoActual);
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
        // 1. Leemos la respuesta como texto primero para evitar el choque de JSON vacío
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;

        // 2. Evaluamos los datos
        if (data && data.estado === "ABIERTO") {
          setCajaAbierta(true);
          setTurnoActual(data);
          fetchMovimientosHoy();
          fetchTotalesCaja();
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
        fetchTotalesCaja();
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

  // --- CONTROLADORES DE CIERRE ---
  const handleAbrirCierreModal = () => {
    if (!turnoActual) {
      alert("No hay un turno activo para cerrar.");
      return;
    }
    setMontoRealInput('0');
    setShowModalCierre(true);
  };

  const confirmarCierreCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoReal = Number(montoRealInput);
    if (isNaN(montoReal) || montoReal < 0) {
      alert("Por favor, ingrese un monto válido.");
      return;
    }

    setGuardandoCierre(true);
    try {
      const res = await fetch(`http://localhost:8080/api/turnos/${turnoActual.idTurno}/cerrar?montoReal=${montoReal}`, {
        method: 'POST'
      });

      if (res.ok) {
        const turnoCerrado = await res.json();
        alert(`Caja cerrada con éxito.\nDiferencia de arqueo: $${turnoCerrado.diferenciaArqueo}`);
        setCajaAbierta(false);
        setTurnoActual(null);
        setMovimientos([]);
        setSaldoCaja(0);
        setIngresosTurno(0);
        setEgresosTurno(0);
        setShowModalCierre(false);
      } else {
        const errorText = await res.text();
        alert("Error al cerrar caja: " + errorText);
      }
    } catch (error) {
      console.error("Error al conectar con el servidor para cerrar caja:", error);
    } finally {
      setGuardandoCierre(false);
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

  return (
    <SidebarLayout activeItem="Caja">
      <div className="container-fluid text-white p-2 pt-5 mt-2" style={{ backgroundColor: '#1b1b1b' }}>
        
        {/* Título Principal */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fw-bold mx-auto font-monospace" style={{ fontSize: '2.8rem' }}>Caja</h1>
          <i className="bi bi-question-circle text-info fs-3" style={{ cursor: 'pointer' }}></i>
        </div>

        {/* --- SECCIÓN SUPERIOR: PANELES DE FLUJO --- */}
        <div className="row g-4 mb-4">
          {/* Tarjeta Izquierda: Saldo y Totales */}
          <div className="col-md-6">
            <div className="p-4 rounded-3 h-100" style={{ backgroundColor: '#1e1e1f', border: '1px solid #242427' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-light opacity-75 fw-medium">
                  Flujo de Caja Actual: {' '}
                  <span className={cajaAbierta ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                    {cajaAbierta ? 'Abierta' : 'Cerrado'}
                  </span>
                </span>
              </div>
              
              <div className="text-muted small font-monospace opacity-50 mb-1">Saldo de Caja Actual</div>
              
              <h1 className="fw-bold text-white mb-3" style={{ fontSize: '2.6rem' }}>
                ${cajaAbierta ? saldoCaja.toLocaleString('es-AR') : '0'}
              </h1>
              
              <div className="border-top border-secondary pt-3" style={{ borderColor: '#2d2d30 !important' }}>
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

          {/* Tarjeta Derecha: Gráfico */}
          <div className="col-md-6">
            <div className="p-4 rounded-3 h-100" style={{ backgroundColor: '#1e1e1f', border: '1px solid #242427' }}>
              <div className="p-3 rounded" style={{ backgroundColor: '#222122', borderColor: '#2d2d30', minHeight: '180px', overflowX: 'auto' }}>
                <div className="text-center small opacity-20 mb-2 font-monospace" >
                  {new Date().toLocaleDateString('es-AR')}
                </div>
                
                <div style={{ width: movimientos.length > 5 ? `${movimientos.length * 80}px` : '100%', height: '140px', minWidth: '100%' }}>
                  {cajaAbierta && movimientos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[...movimientos] .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                        .map(m => ({
                        hora: new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
                        monto: m.tipoMovimiento === 'EGRESO' ? -Math.abs(m.monto) : m.monto}))}
                        margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                        <XAxis 
                          dataKey="hora" 
                          tick={{ fill: '#aaa', fontSize: 11 }} 
                          axisLine={{ stroke: '#2d2d30' }}
                          tickLine={false}
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          tick={{ fill: '#aaa', fontSize: 11 }} 
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e1e1f', borderColor: '#2d2d30', color: '#fff', fontSize: '12px' }}
                          labelStyle={{ color: '#aaa' }}
                        />
                        <Line 
                          type="linear" 
                          dataKey="monto" 
                          stroke="#6c0beb" 
                          strokeWidth={4} 
                          dot={{ fill: '#ffffff', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
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

        {/* --- SECCIÓN INTERMEDIA: TABLA Y ACCIONES LATERALES --- */}
        <div className="row g-4 align-items-stretch mb-4">
          {/* Listado de movimientos */}
          <div className="col-lg-8 d-flex flex-column">
            <h5 className="mb-3 fw-semibold text-light">Registro de Movimientos Manuales</h5>
            
           <div className="p-3 rounded-3 d-flex flex-column" style={{ backgroundColor: '#1d1d1d', border: '1px solid #2d2d30', height: '315px' }}>
              <div className="table-responsive flex-grow-1" style={{ backgroundColor: '#1d1d1d', height: '100%', overflowY: 'auto' }}>
                <table className="table table-dark table-hover m-0 align-middle text-center" style={{ backgroundColor: '#1d1d1d' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#1d1d1d', zIndex: 1 }}>
                    <tr className="text-muted border-secondary" style={{ fontSize: '0.9rem' }}>
                      <th style={{ width: '160px' }}>Fecha/Hora</th>
                      <th style={{ width: '110px' }}>Monto</th>
                      <th style={{ width: '120px' }}>Tipo</th>
                      <th className="text-start">Descripción</th>
                      <th style={{ width: '80px' }}>Usuario</th>
                      <th style={{ width: '80px' }}>IdPedido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.length === 0 ? (
                      <tr><td colSpan={6} className="py-5">No hay movimientos registrados hoy</td></tr>
                    ) : (
                      movimientos.map((m) => (
                        <tr key={m.id_movimiento} className="border-secondary" style={{ fontSize: '0.95rem' }}>
                          <td>{new Date(m.fecha).toLocaleString('es-AR')}</td>
                          <td className="fw-bold text-white">${Number(m.monto).toFixed(2)}</td>
                          <td>
                            <span className={`badge ${m.tipoMovimiento === 'INGRESO' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                              {m.tipoMovimiento === 'INGRESO' ? 'Ganancia' : 'Egreso'}
                            </span>
                          </td> 
                          <td>
                            <div 
                              className="text-start text-light" 
                              style={{ 
                                whiteSpace: 'nowrap',      
                                overflow: 'hidden',        
                                textOverflow: 'ellipsis',  
                                display: 'block',
                                maxWidth: '350px' 
                              }}
                              title={m.descripcion || 'Sin descripción'}
                            >
                              {m.descripcion || '-'}
                            </div>
                          </td>
                          <td>{m.usuario?.idUsuario || m.usuario?.id_usuario || '1'}</td>
                          <td>{m.descripcion?.includes('Pedido #') ? m.descripcion.split('#')[1] : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Botonera de la Derecha */}
          <div className="col-lg-4 d-flex flex-column justify-content-start align-items-center gap-3 pt-0">
            <h5 className="mb-3 fw-semibold text-light align-self-start" style={{ visibility: 'hidden' }}>Acciones</h5>
            
            <button 
              className="btn btn-success py-3 d-flex justify-content-between align-items-center fw-semibold px-4" 
              style={{ fontSize: '1.15rem', width: '380px', borderRadius: '10px' }} 
              disabled={!cajaAbierta}
              onClick={() => setIsModalOpen(true)}
            >
              <span>Crear Nuevo Movimiento</span>
              <i className="bi bi-plus-lg fs-4 ms-2"></i>
            </button>
            
            <button 
              className="btn py-3 d-flex justify-content-between align-items-center fw-semibold text-white px-4" 
              style={{ backgroundColor: '#6f42c1', fontSize: '1.15rem', width: '380px', borderRadius: '10px' }} 
              disabled={!cajaAbierta}
            >
              <span>Compra de Insumos</span>
              <i className="bi bi-truck fs-4 ms-2"></i>
            </button>
            
            <button 
              className="btn btn-dark py-3 d-flex justify-content-between align-items-center fw-semibold border-secondary text-light opacity-75 px-4" 
              style={{ backgroundColor: '#2d2d30', fontSize: '1.15rem', width: '380px', borderRadius: '10px' }} 
              disabled={!cajaAbierta}
            >
              <span>Descargar PDF Caja</span>
              <i className="bi bi-download fs-4 ms-2"></i>
            </button>
          </div>
        </div>

        {/* --- SECCIÓN INFERIOR: BOTONES ACCIONES DE ARQUEO --- */}
        <div className="d-flex flex-wrap gap-3 justify-content-center w-100 mt-4 px-2 m-0 pb-3">
          <button onClick={() => navigate('/dashboard')} className="btn btn-danger px-4 py-2" style={{ backgroundColor: '#ce1515', height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }}>Volver</button>

          <button 
            className="btn btn-success d-flex align-items-center justify-content-center fw-semibold text-center text-white" 
            style={{ height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }}
            disabled={cajaAbierta}
            onClick={handleAbrirAperturaModal}
          >
            <span>Iniciar Caja del Día</span>
          </button>
          
          <button 
            className="btn d-flex align-items-center justify-content-center fw-semibold text-center" 
            style={{ backgroundColor: '#10cbd8', height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }}
            disabled={!cajaAbierta}
          >
            <span>Iniciar Arqueo Automático</span>
          </button>
          
          <button 
            className="btn btn-primary d-flex align-items-center justify-content-center fw-semibold text-center text-white" 
            style={{ backgroundColor: '#5c85d6', height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }}
            disabled={!cajaAbierta}
          >
            <span>Consultar Arqueo Anterior</span>
          </button>
          
          <button 
            className="btn btn-danger d-flex align-items-center justify-content-center fw-semibold text-center text-white" 
            style={{ backgroundColor: '#daa32d', height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }}
            disabled={!cajaAbierta}
            onClick={handleAbrirCierreModal}
          >
            <span>Cerrar Turno y Arqueo</span>
          </button>
        </div>
      </div>

      {/* --- MODAL DE APERTURA DE CAJA --- */}
      {showModalApertura && (
        <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-white" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}>
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title fw-bold">Apertura de Caja</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModalApertura(false)}></button>
              </div>
              <form onSubmit={confirmarAperturaCaja}>
                <div className="modal-body py-4">
                  <div className="mb-3">
                    <label htmlFor="montoInicial" className="form-label small text-uppercase fw-semibold">
                      Monto inicial para abrir la caja ($):
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      id="montoInicial"
                      className="form-control form-control-lg bg-dark text-white border-secondary font-monospace"
                      style={{ fontSize: '1.6rem', textAlign: 'center', color: '#10b981' }}
                      value={montoInicialInput}
                      onChange={(e) => setMontoInicialInput(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <p className="small text-center m-0">
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

      {/* --- MODAL DE CIERRE DE CAJA --- */}
      {showModalCierre && (
        <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-white" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}>
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title fw-bold">Cerrar Turno y Arqueo</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModalCierre(false)}></button>
              </div>
              <form onSubmit={confirmarCierreCaja}>
                <div className="modal-body py-4">
                  <div className="mb-3">
                    <label htmlFor="montoReal" className="form-label small text-uppercase fw-semibold">
                      Monto Real Contado Físicamente ($):
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      id="montoReal"
                      className="form-control form-control-lg bg-dark text-white border-secondary font-monospace"
                      style={{ fontSize: '1.6rem', textAlign: 'center', color: '#eab308' }}
                      value={montoRealInput}
                      onChange={(e) => setMontoRealInput(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <p className="small text-center m-0">
                    El sistema calculará automáticamente la diferencia con el saldo esperado para obtener un arqueo Final.
                  </p>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button type="button" className="btn btn-secondary px-4" onClick={() => setShowModalCierre(false)} disabled={guardandoCierre}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-warning px-4 fw-bold text-dark" disabled={guardandoCierre}>
                    {guardandoCierre ? 'Procesando...' : 'Confirmar Cierre'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo ingreso vinculado */}
      <ModalNuevoIngreso 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGuardar={handleGuardarMovimiento}
      />
    </SidebarLayout>
  );
};