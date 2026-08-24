import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

import { SidebarLayout } from '../../../components/layouts/SidebarLayout';
import { useTurno } from '../../../Context/TurnoContext';
import { useTheme } from '../../../Context/ThemeContext';
import { exportarCajaExcel, exportarCajaPDF } from '../utils/ExportCajaUtils';

import { useCaja } from '../hooks/useCaja';
import { ModalNuevoIngreso } from '../components/ModalNuevoIngreso';
import { ModalConsultarArqueo } from '../components/ModalConsultarArqueo';
import { ModalCerrarTurno } from '../components/ModalCerrarTurno';
import { ModalCompraInsumos } from '../components/ModalCompraInsumos';
import type { DatosCompraInsumo } from '../components/ModalCompraInsumos';
import { VistaTicketPagoModal } from '../../../components/modals/VistaTicketPagoModal';
import type { NuevoMovimientoDTO } from '../services/cajaService';
import { renderBadgeCategoria } from '../components/RenderBadgeCategoria';

export const CajaView: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { cajaAbierta, setCajaAbierta } = useTurno();
  const isDark = theme === 'dark';

  const {
    saldoCaja,
    ingresosTurno,
    egresosTurno,
    turnoActual,
    movimientos,
    datosArqueo,
    inicializarCaja,
    abrirCaja,
    consultarArqueo,
    guardarMovimiento,
    comprarInsumo,
    ajustarMovimiento,
    cerrarCaja
  } = useCaja(setCajaAbierta);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showModalApertura, setShowModalApertura] = useState(false);
  const [montoInicialInput, setMontoInicialInput] = useState('0');
  const [guardandoApertura, setGuardandoApertura] = useState(false);
  const [showModalCierre, setShowModalCierre] = useState(false);
  const [guardandoCierre, setGuardandoCierre] = useState(false);
  const [showModalArqueo, setShowModalArqueo] = useState(false);
  const [showModalCompraInsumos, setShowModalCompraInsumos] = useState(false);

  // Estado para alertas/validaciones personalizadas
  const [avisoModal, setAvisoModal] = useState<string | null>(null);

  // Estados para tickets y comprobante
  const [ticketSeleccionado, setTicketSeleccionado] = useState<{ pedido: any; movimiento: any } | null>(null);
  const [imagenComprobanteModal, setImagenComprobanteModal] = useState<string | null>(null);

  // Estados para Ajuste / Corrección
  const [movimientoAjuste, setMovimientoAjuste] = useState<any | null>(null);
  const [montoAjuste, setMontoAjuste] = useState('');
  const [tipoAjuste, setTipoAjuste] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [metodoPagoAjuste, setMetodoPagoAjuste] = useState<string>('EFECTIVO');
  const [imagenAjuste, setImagenAjuste] = useState<string | null>(null);
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [guardandoAjuste, setGuardandoAjuste] = useState(false);

  const obtenerUrlComprobante = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const textColor = isDark ? 'text-white' : 'text-dark';
  const cardBg = isDark ? '#1e1e1f' : '#ffffff';
  const cardBorder = isDark ? '#242427' : '#e2e8f0';
  const shadowStyle = isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
  const graphInnerBg = isDark ? '#222122' : '#f1f5f9';
  const tableWrapBg = isDark ? '#1d1d1d' : '#ffffff';
  const theadBg = isDark ? '#1d1d1d' : '#f6f9fc';

  const chartGrid = isDark ? '#2d2d30' : '#e2e8f0';
  const chartTick = isDark ? '#aaa' : '#64748b';
  const dotColor = isDark ? '#ffffff' : '#1e1e1f';

  useEffect(() => {
    inicializarCaja();
  }, [inicializarCaja]);

  const handleAbrirAperturaModal = () => {
    setMontoInicialInput('0');
    setShowModalApertura(true);
  };

  const handleImagenAjusteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenAjuste(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmarAperturaCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = Number(montoInicialInput);
    if (isNaN(monto) || monto < 0) {
      setAvisoModal("Por favor, ingrese un monto inicial válido.");
      return;
    }

    setGuardandoApertura(true);
    try {
      await abrirCaja(monto);
      setShowModalApertura(false);
    } catch (error: any) {
      setAvisoModal("Error al abrir caja: " + error.message);
    } finally {
      setGuardandoApertura(false);
    }
  };

  const handleConsultarArqueo = async () => {
    try {
      await consultarArqueo();
      setShowModalArqueo(true);
    } catch (error) {
      console.error("Error consultando arqueo:", error);
    }
  };

  const handleGuardarMovimiento = async (data: NuevoMovimientoDTO) => {
    try {
      await guardarMovimiento(data);
      setIsModalOpen(false);
    } catch (error: any) {
      setAvisoModal("No se pudo guardar el movimiento: " + error.message);
    }
  };

  const handleConfirmarCompraInsumo = async (datos: DatosCompraInsumo) => {
    try {
      const resultado = await comprarInsumo(datos);
      setShowModalCompraInsumos(false);

      const movimientoInsumo = {
        id_movimiento: resultado?.idMovimiento || resultado?.id_movimiento,
        monto: datos.montoTotal,
        tipoMovimiento: 'EGRESO',
        categoria: 'INSUMOS',
        descripcion: datos.concepto,
        fecha: new Date().toISOString(),
        metodoPago: datos.metodoPago
      };

      const pedidoAdaptado = {
        id_pedido: resultado?.idCompra || resultado?.id_compra || '-',
        cliente: {
          persona: null,
          razon_social: 'Compra Insumos / Proveedor',
          nombre: 'Compra Insumos / Proveedor'
        },
        monto_total: datos.montoTotal,
        observaciones: datos.concepto
      };

      setTicketSeleccionado({
        pedido: pedidoAdaptado,
        movimiento: movimientoInsumo
      });
    } catch (error: any) {
      setAvisoModal("Error al registrar la compra: " + error.message);
    }
  };

  const handleConfirmarAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movimientoAjuste) return;

    const montoNum = Number(montoAjuste);
    if (isNaN(montoNum) || montoNum <= 0) {
      setAvisoModal("Por favor ingrese un monto válido mayor a 0.");
      return;
    }

    if (!motivoAjuste.trim()) {
      setAvisoModal("Por favor ingrese la razón o motivo del ajuste.");
      return;
    }

    setGuardandoAjuste(true);
    try {
      await ajustarMovimiento(
        movimientoAjuste, 
        montoNum, 
        tipoAjuste, 
        motivoAjuste.trim(),
        metodoPagoAjuste,
        imagenAjuste
      );
      setMovimientoAjuste(null);
      setMotivoAjuste('');
      setMontoAjuste('');
      setMetodoPagoAjuste('EFECTIVO');
      setImagenAjuste(null);
    } catch (error: any) {
      setAvisoModal("Error al procesar la corrección: " + error.message);
    } finally {
      setGuardandoAjuste(false);
    }
  };

  const handleAbrirCierreModal = async () => {
    if (!turnoActual) {
      setAvisoModal("No hay un turno activo para cerrar.");
      return;
    }
    try {
      await consultarArqueo();
    } catch (error) {
      console.error("Error al obtener arqueo previo al cierre:", error);
    }
    setShowModalCierre(true);
  };

  const ejecutarCierreCaja = async (montoRealEfectivo: number, observaciones?: string) => {
    setGuardandoCierre(true);
    try {
      const ok = await cerrarCaja(montoRealEfectivo, observaciones);
      return ok;
    } catch (error: any) {
      setAvisoModal("Error al cerrar caja: " + error.message);
      return false;
    } finally {
      setGuardandoCierre(false);
    }
  };

  const handleVerTicket = async (m: any) => {
    const idPedidoRaw = m.pedido?.idPedido || m.pedido?.id_pedido || (m.descripcion?.includes('Pedido #') ? m.descripcion.split('#')[1]?.trim() : null);

    if (idPedidoRaw && !isNaN(Number(idPedidoRaw))) {
      const idPedido = Number(idPedidoRaw);
      try {
        const response = await fetch(`http://localhost:8080/api/pedidos/${idPedido}`);
        if (response.ok) {
          const pedidoCompleto = await response.json();
          setTicketSeleccionado({ pedido: pedidoCompleto, movimiento: m });
          return;
        }
      } catch (error) {
        console.error("Error consultando datos completos del pedido:", error);
      }
    }

    const pedidoAdaptado = {
      id_pedido: idPedidoRaw || '-',
      cliente: {
        persona: null,
        razon_social: m.categoria === 'INSUMOS' ? 'Compra Insumos / Proveedor' : 'Consumidor Final',
        nombre: m.categoria === 'INSUMOS' ? 'Compra Insumos / Proveedor' : 'Consumidor Final'
      },
      monto_total: m.monto,
      observaciones: m.descripcion || 'Movimiento registrado en caja'
    };

    setTicketSeleccionado({ pedido: pedidoAdaptado, movimiento: m });
  };

  const CustomCajaAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const esEgreso = data.esEgreso;
      return (
        <div
          className="p-2 rounded-3 shadow-lg im-surface"
          style={{ border: `1px solid ${esEgreso ? '#e22e2e' : '#8e45e0'}`, fontSize: '0.85rem' }}
        >
          <div className="d-flex align-items-center justify-content-between gap-3 mb-2 pb-1 border-bottom border-secondary border-opacity-25">
            <span className="fw-bold text-body-secondary">{label}</span>
            <span className={`fw-bold badge ${esEgreso ? 'bg-danger' : 'bg-success'}`}>
              {esEgreso
                ? `- $${Math.abs(data.montoMovimiento).toLocaleString('es-AR')}`
                : `+ $${Math.abs(data.montoMovimiento).toLocaleString('es-AR')}`}
            </span>
          </div>
          <div className="d-flex align-items-center justify-content-between gap-2">
            <span className="text-body-secondary">Estado Caja:</span>
            <span className="fw-bold" style={{ color: '#20c997' }}>
              ${data.monto.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <SidebarLayout activeItem="Caja">
      <div className={`container-fluid p-3 font-monospace ${textColor}`}>
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fw-bold mx-auto font-monospace" style={{ fontSize: '2.8rem' }}>Caja</h1>
          <i className="bi bi-question-circle text-info fs-3" style={{ cursor: 'pointer' }}></i>
        </div>

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
                      <AreaChart
                        data={[...movimientos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                        .map(m => {
                          const esEgreso = m.tipoMovimiento === 'EGRESO';
                          return {
                            hora: new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
                            monto: esEgreso ? -Math.abs(m.monto) : m.monto,
                            esEgreso,
                            montoMovimiento: m.monto
                          };
                        })}
                        margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="colorSaldoCaja" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8e45e0" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8e45e0" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                        <XAxis dataKey="hora" tick={{ fill: chartTick, fontSize: 11 }} axisLine={{ stroke: chartGrid }} tickLine={false} />
                        <YAxis domain={['auto', 'auto']} tick={{ fill: chartTick, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip content={<CustomCajaAreaTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="monto"
                          stroke="#8e45e0"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorSaldoCaja)"
                          dot={{ fill: dotColor, stroke: dotColor, strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
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

        <div className="row g-4 align-items-stretch mb-4">
          <div className="col-lg-9 d-flex flex-column">
            <h5 className="mb-3 fw-semibold">Registro de Movimientos de Caja</h5>
            
            <div className="p-3 rounded-3 d-flex flex-column" style={{ backgroundColor: tableWrapBg, border: `1px solid ${cardBorder}`, boxShadow: shadowStyle, height: '315px' }}>
              <div className="table-responsive flex-grow-1" style={{ backgroundColor: tableWrapBg, height: '100%', overflowY: 'auto' }}>
               <table className="table table-hover m-0 align-middle text-center" style={{ '--bs-table-bg': tableWrapBg,
  '--bs-table-hover-bg': isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.075)', color: isDark ? '#fff' : 'inherit' } as React.CSSProperties}>
   <thead style={{ position: 'sticky', top: 0, backgroundColor: theadBg, zIndex: 1 }}>
     <tr className="text-muted border-secondary" style={{ fontSize: '0.9rem' }}>
       <th style={{ width: '60px' }}>ID</th>
       <th style={{ width: '140px' }}>Fecha/Hora</th>
       <th style={{ width: '90px' }}>Monto</th>
       <th style={{ width: '110px' }}>Método</th>
       <th style={{ width: '120px' }}>Categoría</th>
       <th className="text-start">Descripción</th>
       <th style={{ width: '60px' }}>Usu.</th>
       <th style={{ width: '60px' }}>Ped.</th>
       <th style={{ width: '120px' }}>Acciones</th>
     </tr>
   </thead>
   <tbody>
     {movimientos.length === 0 ? (
       <tr><td colSpan={9} className="py-5 opacity-50">No hay movimientos registrados hoy</td></tr>
     ) : (
       [...movimientos].reverse().map((m, idx) => {
         const imagenAdjunta = 
           m.comprobanteImagen || 
           m.comprobante || 
           m.imagenComprobante || 
           m.comprobante_imagen || 
           m.imagen_comprobante ||
           m.urlComprobante ||
           m.url_comprobante;

         return (
           <tr key={m.id_movimiento || m.idMovimiento || idx} className="border-secondary" style={{ fontSize: '0.95rem' }}>
             <td className="fw-bold opacity-75">
               #{m.id_movimiento || m.idMovimiento || '-'}
             </td>
             <td>{new Date(m.fecha).toLocaleString('es-AR')}</td>
             <td className={`fw-bold ${m.tipoMovimiento === 'EGRESO' ? 'text-danger' : 'text-success'}`}>
               {m.tipoMovimiento === 'EGRESO' ? '-' : '+'}${Number(m.monto).toFixed(2)}
             </td>
             <td>
               <span className="badge bg-secondary font-monospace">
                 {m.metodoPago || 'EFECTIVO'}
               </span>
             </td>
             <td>{renderBadgeCategoria(m, isDark)}</td>
             
             <td>
               <div 
                 className="text-start" 
                 style={{ wordBreak: 'break-word', minWidth: '180px' }}
                 title={m.descripcion || 'Sin descripción'}
               >
                 {m.descripcion || '-'}
               </div>
             </td>
             
             <td>
               {(() => {
                 const u = m.usuario;

                 if (u && typeof u === 'object') {
                   const nombreCompleto = `${u.nombre || u.first_name || ''} ${u.apellido || u.last_name || ''}`.trim();
                   if (nombreCompleto) return nombreCompleto;

                   if (u.nombreUsuario) return u.nombreUsuario;
                   if (u.username) return u.username;
                   if (u.nombre_usuario) return u.nombre_usuario;
                 }

                 if (typeof u === 'string' && isNaN(Number(u))) {
                   return u;
                 }

                 try {
                   const localData = 
                     localStorage.getItem('usuario_logueado') || 
                     localStorage.getItem('usuario') || 
                     localStorage.getItem('user');

                   if (localData) {
                     const parsed = JSON.parse(localData);
                     
                     const nombreLocal = `${parsed.nombre || parsed.first_name || ''} ${parsed.apellido || parsed.last_name || ''}`.trim();
                     if (nombreLocal) return nombreLocal;
                     
                     if (parsed.nombreUsuario) return parsed.nombreUsuario;
                     if (parsed.username) return parsed.username;
                     if (parsed.nombre_usuario) return parsed.nombre_usuario;
                   }
                 } catch (e) {
                   // Error de lectura/parseo
                 }

                 return 'No se Encuentra al Usaurio';
               })()}
             </td>
             <td>
               {m.pedido?.idPedido || m.pedido?.id_pedido 
                 ? `#${m.pedido?.idPedido || m.pedido?.id_pedido}` 
                 : (m.descripcion?.includes('Pedido #') ? `#${m.descripcion.split('#')[1]?.trim()}` : '-')}
             </td>
             <td>
               <div className="d-flex justify-content-center gap-1">
                 {imagenAdjunta && (
                   <button
                     className="btn btn-sm btn-outline-info border-0 p-1"
                     title="Ver Comprobante de Transferencia"
                     onClick={() => setImagenComprobanteModal(imagenAdjunta)}
                   >
                     <i className="bi bi-eye fs-5"></i>
                   </button>
                 )}
                 <button
                   className="btn btn-sm btn-outline-info border-0 p-1"
                   title="Ver Ticket de Comprobante"
                   onClick={() => handleVerTicket(m)}
                 >
                   <i className="bi bi-receipt fs-5"></i>
                 </button>
                 <button
                   className="btn btn-sm btn-outline-warning border-0 p-1"
                   title="Corregir / Ajustar Cobro"
                   disabled={!cajaAbierta || m.categoria === 'AJUSTE'}
                   onClick={() => {
                     setMovimientoAjuste(m);
                     setMontoAjuste(String(m.monto));
                     setTipoAjuste(m.tipoMovimiento === 'INGRESO' ? 'EGRESO' : 'INGRESO');
                     setMetodoPagoAjuste(m.metodoPago || 'EFECTIVO');
                     setImagenAjuste(null);
                     setMotivoAjuste('');
                   }}
                 >
                   <i className="bi bi-arrow-counterclockwise fs-5"></i>
                 </button>
               </div>
             </td>
           </tr>
         );
       })
     )}
   </tbody>
</table>
              </div>
            </div>
          </div>

          <div className="col-lg-3 d-flex flex-column justify-content-start align-items-stretch gap-4 pt-0">
            <h5 className="mb-3 fw-semibold align-self-start" style={{ visibility: 'hidden' }}>Acciones</h5>

            <button
              className="btn btn-success py-2 d-flex justify-content-between align-items-center fw-semibold px-3 w-100"
              style={{ fontSize: '0.95rem', borderRadius: '8px' }}
              disabled={!cajaAbierta}
              onClick={() => setIsModalOpen(true)}
            >
              <span>Crear Nuevo Movimiento</span>
              <i className="bi bi-plus-lg fs-5 ms-2"></i>
            </button>

            <button
              className="btn py-2 d-flex justify-content-between align-items-center fw-semibold px-3 w-100"
              style={{ backgroundColor: '#6f42c1', color: '#ffffff', fontSize: '0.95rem', borderRadius: '8px' }}
              disabled={!cajaAbierta}
              onClick={() => setShowModalCompraInsumos(true)}
            >
              <span>Compra de Insumos</span>
              <i className="bi bi-truck fs-5 ms-2"></i>
            </button>

            <button
              className="btn py-2 d-flex justify-content-between align-items-center fw-semibold px-3 w-100"
              style={{ backgroundColor: '#0c500c', color: '#ffffff', fontSize: '0.95rem', borderRadius: '8px' }}
              disabled={!cajaAbierta || movimientos.length === 0}
              onClick={() =>
                exportarCajaExcel(movimientos, {
                  montoInicial: turnoActual?.montoInicial || 0,
                  saldoCaja,
                  ingresosTurno,
                  egresosTurno,
                })
              }
            >
              <span>Descargar Excel de Caja</span>
              <i className="bi bi-file-earmark-excel-fill fs-5 ms-2"></i>
            </button>

            <button
              className="btn py-2 d-flex justify-content-between align-items-center fw-semibold px-3 w-100"
              style={{ backgroundColor: '#c0392b', color: '#ffffff', fontSize: '0.95rem', borderRadius: '8px' }}
              disabled={!cajaAbierta || movimientos.length === 0}
              onClick={() =>
                exportarCajaPDF(movimientos, {
                  montoInicial: turnoActual?.montoInicial || 0,
                  saldoCaja,
                  ingresosTurno,
                  egresosTurno,
                })
              }
            >
              <span>Descargar PDF Caja</span>
              <i className="bi bi-file-earmark-pdf-fill fs-5 ms-2"></i>
            </button>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-3 justify-content-center w-100 mt-5 pt-2 px-2 m-0 pb-3">
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary px-4 py-2">Volver</button>

          <button className="btn btn-success d-flex align-items-center justify-content-center fw-semibold text-center text-white" style={{ height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }} disabled={cajaAbierta} onClick={handleAbrirAperturaModal}>
            <span>Iniciar Caja del Día</span>
          </button>
          
          <button className="btn d-flex align-items-center justify-content-center fw-semibold text-center" style={{ backgroundColor: '#10cbd8', color: '#ffffff', height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }} disabled={!cajaAbierta} onClick={handleConsultarArqueo}>
            <span>Consultar Arqueo</span>
          </button>
          
          <button className="btn btn-danger d-flex align-items-center justify-content-center fw-semibold text-center text-white" style={{ backgroundColor: '#daa32d', height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }} disabled={!cajaAbierta} onClick={handleAbrirCierreModal}>
            <span>Cerrar Turno y Arqueo</span>
          </button>
        </div>
      </div>

      {/* Modal Apertura */}
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
                      value={montoInicialInput} 
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setMontoInicialInput(e.target.value)}
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

      {/* Modal Ajuste / Corrección de Cobro */}
      {movimientoAjuste && (
        <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070 }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${textColor} font-monospace`} style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', border: `1px solid ${cardBorder}`, borderRadius: '12px' }}>
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title fw-bold text-warning d-flex align-items-center gap-2">
                  <i className="bi bi-arrow-counterclockwise"></i> Corrección / Ajuste de Movimiento
                </h5>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setMovimientoAjuste(null)}></button>
              </div>
              <form onSubmit={handleConfirmarAjuste}>
                <div className="modal-body py-3">
                  <div className="p-3 mb-3 rounded" style={{ backgroundColor: isDark ? '#27272a' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                    <div className="small text-muted mb-1">Movimiento Original:</div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">
                        #{movimientoAjuste.id_movimiento || movimientoAjuste.idMovimiento || '-'} - {movimientoAjuste.descripcion || 'Sin descripción'}
                      </span>
                      <span className={`fw-bold ${movimientoAjuste.tipoMovimiento === 'EGRESO' ? 'text-danger' : 'text-success'}`}>
                        {movimientoAjuste.tipoMovimiento === 'EGRESO' ? '-' : '+'}${Number(movimientoAjuste.monto).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small text-uppercase fw-semibold">Tipo de Ajuste:</label>
                      <select
                        className={`form-select font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'} border-secondary`}
                        value={tipoAjuste}
                        onChange={(e) => setTipoAjuste(e.target.value as 'INGRESO' | 'EGRESO')}
                      >
                        <option value="EGRESO">EGRESO (-)</option>
                        <option value="INGRESO">INGRESO (+)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-uppercase fw-semibold">Monto del Ajuste ($):</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0.01"
                        className={`form-control font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'} border-secondary`}
                        value={montoAjuste}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setMontoAjuste(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-uppercase fw-semibold">Método de Pago:</label>
                    <select
                      className={`form-select font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'} border-secondary`}
                      value={metodoPagoAjuste}
                      onChange={(e) => setMetodoPagoAjuste(e.target.value)}
                    >
                      <option value="EFECTIVO">EFECTIVO</option>
                      <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                      <option value="DEBITO">DÉBITO</option>
                      <option value="CREDITO">CRÉDITO</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-uppercase fw-semibold d-flex align-items-center justify-content-between">
                      <span>Comprobante / Imagen (Opcional):</span>
                      {imagenAjuste && <span className="text-success small"><i className="bi bi-check-circle-fill me-1"></i>Cargado</span>}
                    </label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className={`form-control font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'} border-secondary`}
                      onChange={handleImagenAjusteChange}
                    />
                    {imagenAjuste && (
                      <div className="mt-2 text-center">
                        <img 
                          src={imagenAjuste} 
                          alt="Previsualización" 
                          className="img-thumbnail" 
                          style={{ maxHeight: '100px', objectFit: 'contain' }} 
                        />
                      </div>
                    )}
                  </div>

                  <div className="alert alert-warning py-2 mb-3 small d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                    <span>
                      Se registrará un nuevo movimiento de <strong>{tipoAjuste}</strong> por <strong>${Number(montoAjuste || 0).toFixed(2)}</strong> vía <strong>{metodoPagoAjuste}</strong>.
                    </span>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small text-uppercase fw-semibold">Motivo del Ajuste:</label>
                    <input 
                      type="text" 
                      className={`form-control font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'} border-secondary`}
                      placeholder="Ej: Cobro mal efectuado / cambio de medio de pago / error tipográfico"
                      value={motivoAjuste}
                      onChange={(e) => setMotivoAjuste(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button 
                    type="button" 
                    className="btn btn-secondary px-4" 
                    onClick={() => {
                      setMovimientoAjuste(null);
                      setMetodoPagoAjuste('EFECTIVO');
                      setImagenAjuste(null);
                    }} 
                    disabled={guardandoAjuste}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-warning px-4 text-dark fw-bold" disabled={guardandoAjuste}>
                    {guardandoAjuste ? 'Procesando...' : 'Confirmar Ajuste'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VALIDACIÓN/AVISO GENERAL PARA CAJA */}
      {avisoModal && (
        <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1100 }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${textColor} font-monospace`} style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', border: `1px solid ${cardBorder}`, borderRadius: '12px' }}>
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title fw-bold text-warning d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill"></i> Validación
                </h5>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setAvisoModal(null)}></button>
              </div>
              <div className="modal-body py-4">
                <p className="m-0 fs-6">{avisoModal}</p>
              </div>
              <div className="modal-footer border-top border-secondary">
                <button type="button" className="btn btn-primary px-4 fw-bold" onClick={() => setAvisoModal(null)}>
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      <ModalCompraInsumos
        isOpen={showModalCompraInsumos}
        onClose={() => setShowModalCompraInsumos(false)}
        onConfirmar={handleConfirmarCompraInsumo}
      />

      {ticketSeleccionado && (
        <VistaTicketPagoModal
          pedido={ticketSeleccionado.pedido}
          movimiento={ticketSeleccionado.movimiento}
          onClose={() => setTicketSeleccionado(null)}
          esVentaRapida={!ticketSeleccionado.pedido.id_pedido || ticketSeleccionado.pedido.id_pedido === '-'}
        />
      )}

      {imagenComprobanteModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1080 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className={`modal-content p-3 ${textColor}`} style={{ backgroundColor: isDark ? '#18181b' : '#ffffff' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold m-0"><i className="bi bi-image me-2"></i>Comprobante de Transferencia</h6>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setImagenComprobanteModal(null)}></button>
              </div>
              <div className="text-center p-2">
                <img 
                  src={obtenerUrlComprobante(imagenComprobanteModal)} 
                  alt="Comprobante Transferencia" 
                  className="img-fluid rounded shadow" 
                  style={{ maxHeight: '70vh', objectFit: 'contain' }} 
                />
              </div>
              <div className="text-end mt-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setImagenComprobanteModal(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )} 
    </SidebarLayout>
  );
};