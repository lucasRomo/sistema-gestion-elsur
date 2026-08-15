import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../../../components/layouts/SidebarLayout';
import { usePedidosPendientes } from '../hooks/usePedidosPendientes';
import { PedidoPendienteService } from '../service/pedidoPendienteService';
import { empleadoService } from '../../../services/empleadoService';
import { SuccesModal } from '../../../components/layouts/SuccesModal';

// Importación de Componentes y Modales Centralizados
import { FiltrosPedidos } from '../../pedidos/components/FiltrosPedidos';
import { TarjetaPedido } from '../../pedidos/components/TarjetaPedido'; 
import { ModalCambioEstado } from '../../pedidos/modals/ModalCambioEstado';
import { ModalRegistrarPago } from '../../pedidos/modals/ModalRegistrarPago';
import { ModalGestionarComprobantes } from '../../pedidos/modals/ModalGestionarComprobantes';
import { ModalAdvertenciaDeuda } from '../../pedidos/modals/ModalAdvertenciaDeuda';
import { VistaTicketModal } from '../../pedidos/modals/VistaTicketModal';
import { VistaTicketPagoModal } from '../../../components/modals/VistaTicketPagoModal';
import { CuentaCorrienteModal } from '../../clientes/components/CuentaCorrienteModal';
import { ModalGestionMermas } from '../../pedidos/modals/ModalGestionMermas';
import { useTheme } from '../../../Context/ThemeContext';

// Modales Auxiliares
import { ModalErrorStock } from '../modals/ModalErrorStock';
import { ModalConfirmarDesvincular } from '../modals/ModalConfirmarDesvincular';
import { ModalAvisoCuentaCorriente } from '../modals/ModalAvisoCuentaCorriente';

export const PedidosPendientesView: React.FC = () => {
  const { pedidos, cargando, actualizarEstado, refrescar } = usePedidosPendientes();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Estados
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pedidoMermaSel, setPedidoMermaSel] = useState<any | null>(null);
  const [filtroEmpleado, setFiltroEmpleado] = useState('');

  // Estados de Modales y Pedidos
  const [pedidoEstadoSel, setPedidoEstadoSel] = useState<any>(null);
  const [nuevoEstadoPendiente, setNuevoEstadoPendiente] = useState<string>('');
  const [pedidoPagoSel, setPedidoPagoSel] = useState<any>(null);
  const [verTicketPedido, setVerTicketPedido] = useState<any>(null);
  const [pedidoGestionComprobanteSel, setPedidoGestionComprobanteSel] = useState<any | null>(null);
  const [clienteCuentaCorriente, setClienteCuentaCorriente] = useState<any>(null);

  // Estados de Notificación y Confirmación
  const [suceso, setSuceso] = useState({ show: false, titulo: "", mensaje: "", tipo: "exito" });
  const [ticketPagoSel, setTicketPagoSel] = useState<{ pedido: any; movimiento?: any } | null>(null);
  const [sucesoError, setSucesoError] = useState<{ show: boolean; mensaje: string }>({ show: false, mensaje: '' });
  const [modalNotif, setModalNotif] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });
  const [confirmarDesvincular, setConfirmarDesvincular] = useState<{ show: boolean; idComprobante: number | null }>({
    show: false,
    idComprobante: null
  });
  const [modalAvisoCuentaCorriente, setModalAvisoCuentaCorriente] = useState<{ show: boolean; pedido: any | null }>({
    show: false,
    pedido: null,
  });

  const [modalAdvertenciaDeuda, setModalAdvertenciaDeuda] = useState<{
    show: boolean;
    pedido: any;
    nuevoEstado: string;
    observaciones: string;
    saldoPendiente: number;
    deudaPrevia: number;
    deudaTotal: number;
    limiteCredito: number;
  }>({
    show: false,
    pedido: null,
    nuevoEstado: '',
    observaciones: '',
    saldoPendiente: 0,
    deudaPrevia: 0,
    deudaTotal: 0,
    limiteCredito: 0
  });

  useEffect(() => {
    const cargarEmpleados = async () => {
      try {
        const data = await empleadoService.obtenerTodos();
        setEmpleados(data);
      } catch (error) {
        console.error("Error al cargar empleados:", error);
      }
    };
    cargarEmpleados();
  }, []);

  const handleCambioEstadoCombo = (pedido: any, estadoDestino: string) => {
    setPedidoEstadoSel(pedido);
    setNuevoEstadoPendiente(estadoDestino);
  };

  const handleCambioEmpleado = async (idPedido: number, idEmpleado: string) => {
    try {
      const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
      const idUsuarioActivo = userLogueado.idUsuario ?? userLogueado.id_usuario ?? userLogueado.id ?? 1;
      
      await PedidoPendienteService.asignarEmpleado(idPedido, idEmpleado, idUsuarioActivo);
      await refrescar();
      setModalNotif({ show: true, msg: "El empleado ha sido asignado correctamente." });
    } catch (error) {
      console.error("Error al asignar:", error);
      alert("Error al asignar el empleado.");
    }
  };

  const ejecutarCambioEstado = async (idPedido: number, nuevoEst: string, estadoAnt: string, observaciones: string) => {
    const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
    const idUsuarioActivo = userLogueado.idUsuario ?? userLogueado.id_usuario ?? userLogueado.id ?? 1;

    try {
      await actualizarEstado(idPedido, nuevoEst, estadoAnt, observaciones, idUsuarioActivo);
    } catch (error: any) {
      console.error("Error al cambiar estado:", error);
      const mensajeOriginal = error.message || "";
      const mensajeAmigable = mensajeOriginal.toLowerCase().includes("stock") || mensajeOriginal.toLowerCase().includes("insuficiente")
        ? "No hay Suficiente Stock para Completar o Entregar el Pedido, Por Favor Modifique el stock en la Ventana Productos para Continuar"
        : mensajeOriginal;

      setSucesoError({ show: true, mensaje: mensajeAmigable });
    } finally {
      setPedidoEstadoSel(null);
      setNuevoEstadoPendiente('');
      setModalAdvertenciaDeuda(prev => ({ ...prev, show: false }));
    }
  };

  const confirmarCambioEstado = async (observaciones: string) => {
    if (!pedidoEstadoSel) return;

    const cliente = pedidoEstadoSel.cliente || {};
    const totalPedido = Number(pedidoEstadoSel.monto_total ?? pedidoEstadoSel.montoTotal ?? pedidoEstadoSel.total ?? 0);
    const pagadoPedido = Number(pedidoEstadoSel.monto_pago_adelantado ?? pedidoEstadoSel.montoPagoAdelantado ?? pedidoEstadoSel.monto_abonado ?? pedidoEstadoSel.montoAbonado ?? pedidoEstadoSel.pagoAdelantado ?? 0);

    const saldoPendientePedido = Math.max(0, totalPedido - pagadoPedido);
    const deudaPreviaCliente = Number(cliente.saldoDeudor ?? cliente.saldo_deudor ?? 0);
    const limiteCredito = Number(cliente.limiteCredito ?? cliente.limite_credito ?? 0);
    const deudaTotalProyectada = deudaPreviaCliente + saldoPendientePedido;

    const estadoNormalizado = (nuevoEstadoPendiente || '').toUpperCase().trim();
    const esEntregaOFinalizacion = ['ENTREGADO', 'FINALIZADO', 'COMPLETADO', 'TERMINADO', 'LISTO PARA ENTREGAR'].includes(estadoNormalizado);
    const superaLimite = limiteCredito > 0 ? deudaTotalProyectada > limiteCredito : saldoPendientePedido > 0;

    if (esEntregaOFinalizacion && superaLimite) {
      setModalAdvertenciaDeuda({
        show: true,
        pedido: pedidoEstadoSel,
        nuevoEstado: nuevoEstadoPendiente,
        observaciones,
        saldoPendiente: saldoPendientePedido,
        deudaPrevia: deudaPreviaCliente,
        deudaTotal: deudaTotalProyectada,
        limiteCredito
      });
      setPedidoEstadoSel(null);
      return;
    }

    await ejecutarCambioEstado(pedidoEstadoSel.id_pedido, nuevoEstadoPendiente, pedidoEstadoSel.estado, observaciones);
  };

  const handleActualizarLimiteYEntregar = async (nuevoLimiteNum: number) => {
    const cliente = modalAdvertenciaDeuda.pedido?.cliente || {};
    const idCliente = cliente.idCliente ?? cliente.id_cliente;

    if (!idCliente) {
      alert("No se pudo identificar el ID del cliente para actualizar su límite.");
      return;
    }

    try {
      await PedidoPendienteService.actualizarLimiteCredito(idCliente, nuevoLimiteNum);
      await ejecutarCambioEstado(
        modalAdvertenciaDeuda.pedido.id_pedido,
        modalAdvertenciaDeuda.nuevoEstado,
        modalAdvertenciaDeuda.pedido.estado,
        modalAdvertenciaDeuda.observaciones
      );
    } catch (error: any) {
      console.error("Error actualizando límite de crédito:", error);
      alert(`Error: ${error.message || "No se pudo actualizar el límite de crédito."}`);
    }
  };

  const confirmarPago = async (tipoPago: string, monto: number, archivo: File | null) => {
    try {
      const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
      const idUsuarioActivo = userLogueado.idUsuario ?? userLogueado.id_usuario ?? userLogueado.id ?? 1;

      const pedidoActualizado = await PedidoPendienteService.registrarPago(
        pedidoPagoSel.id_pedido,
        monto,
        tipoPago,
        idUsuarioActivo,
        archivo
      );

      setSuceso({ show: true, titulo: "Éxito", mensaje: "Pago registrado correctamente", tipo: "exito" });
      setPedidoPagoSel(null);
      setTicketPagoSel({
        pedido: pedidoActualizado || pedidoPagoSel,
        movimiento: { metodoPago: tipoPago, fecha: new Date(), monto }
      });
      await refrescar();
    } catch (error: any) {
      console.error(error);
      setSuceso({ show: true, titulo: "Error", mensaje: error.message || "Error al registrar el pago", tipo: "error" });
    }
  };

  const handleVincularComprobante = async (idComprobante: number, archivo: File) => {
    try {
      const pedidoActualizado = await PedidoPendienteService.vincularComprobanteDigital(idComprobante, archivo);
      setPedidoGestionComprobanteSel(pedidoActualizado);
      setSuceso({ show: true, titulo: "Éxito", mensaje: "Comprobante vinculado", tipo: "exito" });
    } catch (error: any) {
      setSuceso({ show: true, titulo: "Error", mensaje: error.message, tipo: "error" });
    }
  };

  const ejecutarEliminarComprobante = async () => {
    const idComprobante = confirmarDesvincular.idComprobante;
    if (!idComprobante) return;

    setConfirmarDesvincular({ show: false, idComprobante: null });

    try {
      const pedidoActualizado = await PedidoPendienteService.eliminarComprobanteDigital(idComprobante);
      setPedidoGestionComprobanteSel(pedidoActualizado);
      setSuceso({ show: true, titulo: "Éxito", mensaje: "Comprobante desvinculado correctamente", tipo: "exito" });
    } catch (error: any) {
      setSuceso({ show: true, titulo: "Error", mensaje: error.message, tipo: "error" });
    }
  };

  const handleCambioUbicacion = async (idPedido: number, nuevaUbicacion: string) => {
    try {
      await PedidoPendienteService.actualizarUbicacion(idPedido, nuevaUbicacion);
      await refrescar();
      setSuceso({ show: true, titulo: "Éxito", mensaje: `Ubicación actualizada a "${nuevaUbicacion}"`, tipo: "exito" });
    } catch (error) {
      console.error("Error al actualizar la ubicación:", error);
      setSucesoError({ show: true, mensaje: "No se pudo actualizar la ubicación del pedido en el servidor." });
    }
  };

  const handleSubirArchivoFisico = async (idPedido: number, file: File) => {
    try {
      const ok = await PedidoPendienteService.subirComprobanteFisico(idPedido, file);
      if (ok) {
        alert('¡Comprobante guardado en el servidor con éxito!');
        await refrescar();
      } else {
        alert('Error al intentar subir el archivo al servidor.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor.');
    }
  };

  const handleEliminarComprobanteFisico = async (idPedido: number) => {
    if (!window.confirm('¿Estás seguro de que querés eliminar el comprobante físico de este pedido?')) return;
    try {
      const ok = await PedidoPendienteService.eliminarComprobanteFisico(idPedido);
      if (ok) {
        alert('Comprobante eliminado con éxito.');
        await refrescar();
      } else {
        alert('No se pudo eliminar el archivo.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de comunicación con el backend.');
    }
  };

  const handleAbrirPago = (pedido: any) => {
    if (pedido.es_cuenta_corriente) {
      setModalAvisoCuentaCorriente({ show: true, pedido });
    } else {
      setPedidoPagoSel(pedido);
    }
  };

  // Filtrado de pedidos
  const pedidosFiltrados = pedidos.filter(p => {
    const esVentaRapida = (p.observaciones?.toLowerCase().includes('venta rápida') || 
                         p.observacion?.toLowerCase().includes('venta rápida') || 
                         p.estante === 'Venta Rápida') && p.estado !== 'PENDIENTE';
    if (esVentaRapida) return false;

    const nombreCliente = p.cliente?.persona 
      ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido}`
      : (p.cliente?.razonSocial || p.cliente?.razon_social || p.cliente?.nombre || 'Consumidor Final');

    if (!nombreCliente.toLowerCase().includes(filtroCliente.toLowerCase())) return false;

    if (filtroEstado === 'DEVUELTO') {
      const listaHistoriales = p.historiales || p.historialEstadoPedidos || [];
      const esDevolucion = p.estado === 'DEVUELTO' ||
        p.observaciones?.toLowerCase().includes('devolución') ||
        p.observacion?.toLowerCase().includes('devolución') ||
        Boolean(p.observacion_devolucion || p.motivo_devolucion) ||
        listaHistoriales.some((h: any) => 
          (h.observaciones && h.observaciones.toLowerCase().includes('devolución')) ||
          (h.observacion && h.observacion.toLowerCase().includes('devolución')) ||
          h.estado_anterior === 'DEVUELTO' || 
          h.estadoAnterior === 'DEVUELTO'
        );
      if (!esDevolucion) return false;
    } else if (filtroEstado === 'PRESUPUESTO') {
      if (p.estado !== 'PRESUPUESTO') return false;
    } else {
      if (p.estado === 'PRESUPUESTO') return false;
      if (filtroEstado !== '' && p.estado !== filtroEstado) return false;
    }

    if (filtroEmpleado !== '') {
      const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0 ? p.asignaciones[p.asignaciones.length - 1] : null;
      const idEmpleadoAsignado = ultimaAsignacion?.empleado?.idEmpleado || ultimaAsignacion?.empleado?.id_empleado;
      if (filtroEmpleado === 'SIN_ASIGNAR') {
        if (idEmpleadoAsignado) return false;
      } else {
        if (String(idEmpleadoAsignado) !== String(filtroEmpleado)) return false;
      }
    }
    return true;
  });

  return (
    <SidebarLayout activeItem="Pedidos Pendientes">
      <div className="container-fluid px-2 d-flex flex-column pt-3" style={{ height: 'calc(100vh - 45px)', overflow: 'hidden' }}>
        <div className="d-flex justify-content-center align-items-center mb-2 position-relative d-print-none">
          <h1 className="fw-bold tracking-tight text-white m-0 text-center" style={{ fontSize: '1.85rem' }}>
            {filtroEstado === 'PRESUPUESTO' ? 'Presupuestos / Cotizaciones' : 'Cola de Producción Taller'}
          </h1>
          <span className="badge bg-dark border border-info text-info font-monospace position-absolute end-0">Datos en Tiempo Real</span>
        </div>

        <div className="mt-3 mb-3">
          <FiltrosPedidos 
            filtroCliente={filtroCliente}
            setFiltroCliente={setFiltroCliente}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            filtroEmpleado={filtroEmpleado}
            setFiltroEmpleado={setFiltroEmpleado}
            empleados={empleados}
            isDarkMode={isDarkMode}
          />
        </div>

        <div className="flex-grow-1 overflow-y-auto mb-2 pe-1" style={{ height: 'calc(100vh - 210px)' }}>
          {cargando ? (
            <div className="text-center py-5 font-monospace text-muted">Cargando Pedidos Pendientes...</div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="text-center py-5 font-monospace text-muted">No se encontraron registros bajo este filtro.</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {pedidosFiltrados.map((pedido) => (
                <div key={`pedido-card-${pedido.id_pedido}`} className="w-100">
                  <TarjetaPedido 
                    pedido={pedido}
                    onCambioEstado={handleCambioEstadoCombo}
                    onCambioUbicacion={handleCambioUbicacion}
                    onSelectPago={handleAbrirPago}
                    onSelectTicket={setVerTicketPedido}
                    onSubirArchivo={handleSubirArchivoFisico}
                    onEliminarComprobante={handleEliminarComprobanteFisico}
                    empleados={empleados}
                    onCambioEmpleado={handleCambioEmpleado}
                    onSelectComprobantes={(p) => setPedidoGestionComprobanteSel(p)}
                    onGestionarMermas={(p) => setPedidoMermaSel(p)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center pt-2 border-secondary pb-1 mt-auto">
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary px-4 py-2">Volver</button>
        </div>
      </div>

      {/* SECCIÓN DE MODALES */}
      {pedidoEstadoSel && (
        <ModalCambioEstado 
          pedido={pedidoEstadoSel}
          nuevoEstado={nuevoEstadoPendiente}
          onClose={() => { setPedidoEstadoSel(null); setNuevoEstadoPendiente(''); }}
          onConfirm={confirmarCambioEstado}
        />
      )}

      <ModalAdvertenciaDeuda 
        data={modalAdvertenciaDeuda}
        onClose={() => setModalAdvertenciaDeuda(prev => ({ ...prev, show: false }))}
        onActualizarYEntregar={handleActualizarLimiteYEntregar}
        onAutorizarUnaVez={() => ejecutarCambioEstado(modalAdvertenciaDeuda.pedido.id_pedido, modalAdvertenciaDeuda.nuevoEstado, modalAdvertenciaDeuda.pedido.estado, modalAdvertenciaDeuda.observaciones)}
        onRegistrarCobro={(pedido) => {
          setModalAdvertenciaDeuda(prev => ({ ...prev, show: false }));
          setPedidoPagoSel(pedido);
        }}
      />

      {pedidoPagoSel && (
        <ModalRegistrarPago 
          show={true}
          pedido={pedidoPagoSel}
          onClose={() => setPedidoPagoSel(null)}
          onConfirm={confirmarPago}
        />
      )}

      {verTicketPedido && (
        <VistaTicketModal 
          pedido={verTicketPedido}
          onClose={() => setVerTicketPedido(null)}
        />
      )}

      {/* VISTA TICKET PAGO (CAJA) */}
      {ticketPagoSel && (
        <VistaTicketPagoModal 
          pedido={ticketPagoSel.pedido}
          movimiento={ticketPagoSel.movimiento}
          onClose={() => setTicketPagoSel(null)}
        />
      )}

      {/* GESTIÓN DE COMPROBANTES */}
      {pedidoGestionComprobanteSel && (
        <ModalGestionarComprobantes
          pedido={pedidoGestionComprobanteSel}
          onClose={() => setPedidoGestionComprobanteSel(null)}
          onVincularComprobante={handleVincularComprobante}
          onEliminarComprobante={async (idComp) => setConfirmarDesvincular({ show: true, idComprobante: idComp })} 
          onVerTicket={(pedido, cobro) => {
            setTicketPagoSel({ pedido, movimiento: cobro });
          }}
        />
      )}

      {/* GESTIÓN DE MERMAS */}
      {pedidoMermaSel && (
        <ModalGestionMermas
          pedido={pedidoMermaSel}
          onClose={() => setPedidoMermaSel(null)}
          onConfirm={() => {
            setPedidoMermaSel(null);
            refrescar();
          }}
        />
      )}

      {/* MODAL ERROR STOCK */}
      <ModalErrorStock 
        show={sucesoError.show}
        mensaje={sucesoError.mensaje}
        onClose={() => {
          setSucesoError({ show: false, mensaje: '' });
          refrescar();
        }}
      />

      {/* MODAL CONFIRMAR DESVINCULAR COMPROBANTE */}
      <ModalConfirmarDesvincular 
        show={confirmarDesvincular.show}
        onClose={() => setConfirmarDesvincular({ show: false, idComprobante: null })}
        onConfirm={ejecutarEliminarComprobante}
      />

      {/* MODAL AVISO CUENTA CORRIENTE */}
      <ModalAvisoCuentaCorriente 
        show={modalAvisoCuentaCorriente.show}
        isDarkMode={isDarkMode}
        onRevisarCuenta={() => {
          const clienteAsociado = modalAvisoCuentaCorriente.pedido?.cliente;
          setModalAvisoCuentaCorriente({ show: false, pedido: null });
          setClienteCuentaCorriente(clienteAsociado); 
        }}
        onAbonarPedido={() => {
          const pedidoAbonar = modalAvisoCuentaCorriente.pedido;
          setModalAvisoCuentaCorriente({ show: false, pedido: null });
          setPedidoPagoSel(pedidoAbonar);
        }}
        onClose={() => setModalAvisoCuentaCorriente({ show: false, pedido: null })}
      />

      {clienteCuentaCorriente && (
        <CuentaCorrienteModal 
          cliente={clienteCuentaCorriente}
          onCerrar={() => setClienteCuentaCorriente(null)}
          onActualizar={() => {}}
        />
      )}

      {modalNotif.show && (
        <SuccesModal 
          show={modalNotif.show} 
          message={modalNotif.msg} 
          onClose={() => {
            setModalNotif({ show: false, msg: '' });
            refrescar();
          }} 
        />
      )}

      {suceso.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-white text-center" 
              style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px' }}
            >
              <i className={`bi ${suceso.tipo === 'exito' ? 'bi-check-circle' : 'bi-x-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">{suceso.titulo}</h5>
              <p className="small" style={{ color: '#a1a1aa' }}>{suceso.mensaje}</p>
              <button 
                className={`btn ${suceso.tipo === 'exito' ? 'btn-success' : 'btn-danger'} btn-sm px-4 mt-3 fw-bold`}
                onClick={() => {
                  setSuceso({ ...suceso, show: false });
                  if (suceso.tipo === 'exito') {
                    refrescar();
                  }
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};