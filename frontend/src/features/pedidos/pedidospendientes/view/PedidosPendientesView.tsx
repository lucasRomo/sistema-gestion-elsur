import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { SidebarLayout } from '../../../../components/layouts/SidebarLayout';
import { useTheme } from '../../../../Context/ThemeContext';
import { showLoading, hideLoading } from '../../../../config/loadingStore';

import { empleadoService } from '../../../../services/empleadoService';

import { usePedidosPendientes } from '../hooks/usePedidosPendientes';
import { PedidoPendienteService } from '../service/pedidoPendienteService';

import { FiltrosPedidos } from '../components/FiltrosPedidos';
import { ListaPedidosPendientes } from '../components/ListaPedidosPendientes';
import { PedidosModales } from '../components/PedidosModales';
import { confirmarAccion } from '../../../../config/dialogStore';
import { mostrarToast } from '../../../../config/toastStore';
import { TableroPedidos } from '../components/TableroPedidos';

export const PedidosPendientesView: React.FC = () => {
  const { pedidos, cargando, pedidosActualizando, actualizarEstado, refrescar, refrescarPedido } = usePedidosPendientes();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [empleados, setEmpleados] = useState<any[]>([]);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pedidoMermaSel, setPedidoMermaSel] = useState<any | null>(null);
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  // Pestañas con contador: antes los presupuestos solo se veían eligiendo una opción escondida
  // del filtro de estado, y parecía que habían desaparecido.
  const [pestana, setPestana] = useState<'TALLER' | 'PRESUPUESTOS' | 'ATRASADOS'>('TALLER');
  const [modoVista, setModoVista] = useState<'LISTA' | 'TABLERO'>(() => {
    try { return localStorage.getItem('pedidos_modo_vista') === 'TABLERO' ? 'TABLERO' : 'LISTA'; } catch { return 'LISTA'; }
  });
  const cambiarModoVista = (modo: 'LISTA' | 'TABLERO') => {
    setModoVista(modo);
    try { localStorage.setItem('pedidos_modo_vista', modo); } catch { /* sin almacenamiento: solo esta sesión */ }
  };

  const [pedidoEstadoSel, setPedidoEstadoSel] = useState<any>(null);
  const [nuevoEstadoPendiente, setNuevoEstadoPendiente] = useState<string>('');
  const [pedidoPagoSel, setPedidoPagoSel] = useState<any>(null);
  const [verTicketPedido, setVerTicketPedido] = useState<any>(null);
  const [pedidoGestionComprobanteSel, setPedidoGestionComprobanteSel] = useState<any | null>(null);
  const [clienteCuentaCorriente, setClienteCuentaCorriente] = useState<any>(null);

  const [suceso, setSuceso] = useState({ show: false, titulo: "", mensaje: "", tipo: "exito" });
  const [ticketPagoSel, setTicketPagoSel] = useState<{ pedido: any; movimiento?: any } | null>(null);
  const [sucesoError, setSucesoError] = useState<{ show: boolean; mensaje: string; titulo?: string }>({ show: false, mensaje: '' });
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
    const empleadoElegido = empleados.find(e => String(e.idEmpleado ?? e.id_empleado) === String(idEmpleado));
    const nombreElegido = empleadoElegido?.persona
      ? `${empleadoElegido.persona.nombre} ${empleadoElegido.persona.apellido}`
      : 'el empleado seleccionado';
    if (!(await confirmarAccion(`¿Asignar el pedido #${idPedido} a ${nombreElegido}?`, { titulo: 'Reasignar empleado', textoConfirmar: 'Asignar' }))) return;

    const pedidoActual = pedidos.find(p => p.id_pedido === idPedido);
    const asignaciones = pedidoActual?.asignaciones || [];
    const ultimaAsignacion = asignaciones.length > 0 ? asignaciones[asignaciones.length - 1] : null;
    const idEmpleadoAnterior = ultimaAsignacion?.empleado?.idEmpleado ?? ultimaAsignacion?.empleado?.id_empleado;

    showLoading('Asignando empleado...');
    try {
      const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
      const idUsuarioActivo = userLogueado.idUsuario ?? userLogueado.id_usuario ?? userLogueado.id ?? 1;

      await PedidoPendienteService.asignarEmpleado(idPedido, idEmpleado, idUsuarioActivo);
      hideLoading();
      // Acción chica y reversible: aviso breve con "Deshacer" en vez de un modal que hay que cerrar.
      mostrarToast(`Pedido #${idPedido} asignado a ${nombreElegido}`, {
        accion: idEmpleadoAnterior ? {
          texto: 'Deshacer',
          onClick: async () => {
            try {
              await PedidoPendienteService.asignarEmpleado(idPedido, String(idEmpleadoAnterior), idUsuarioActivo);
              mostrarToast(`Se restauró el empleado anterior del pedido #${idPedido}`, { tipo: 'info' });
              refrescarPedido(idPedido);
            } catch (err: any) {
              mostrarToast(err?.message || 'No se pudo deshacer la asignación.', { tipo: 'error' });
            }
          }
        } : undefined
      });
      refrescarPedido(idPedido);
    } catch (error: any) {
      console.error("Error al asignar:", error);
      hideLoading();
      setSucesoError({ show: true, titulo: 'Error al asignar', mensaje: error?.message || "No se pudo asignar el empleado al pedido." });
    }
  };

  const ejecutarCambioEstado = async (idPedido: number, nuevoEst: string, estadoAnt: string, observaciones: string) => {
    const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
    const idUsuarioActivo = userLogueado.idUsuario ?? userLogueado.id_usuario ?? userLogueado.id ?? 1;

    showLoading('Actualizando estado del pedido...');
    try {
      await actualizarEstado(idPedido, nuevoEst, estadoAnt, observaciones, idUsuarioActivo);
      hideLoading();
      refrescarPedido(idPedido);
      setModalNotif({
        show: true,
        msg: `El estado del pedido #${idPedido} cambió a "${nuevoEst}" correctamente.`
      });
    } catch (error: any) {
      console.error("Error al cambiar estado:", error);
      const mensajeOriginal = error.message || "";
      const mensajeAmigable = mensajeOriginal.toLowerCase().includes("stock") || mensajeOriginal.toLowerCase().includes("insuficiente")
        ? "No hay Suficiente Stock para Completar o Entregar el Pedido, Por Favor Modifique el stock en la Ventana Productos para Continuar"
        : mensajeOriginal;

      hideLoading();
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
    const idClientePedido = Number(cliente.idCliente ?? cliente.id_cliente ?? 0);
    const totalPedido = Number(pedidoEstadoSel.monto_total ?? pedidoEstadoSel.montoTotal ?? pedidoEstadoSel.total ?? 0);
    const pagadoPedido = Number(pedidoEstadoSel.monto_pago_adelantado ?? pedidoEstadoSel.montoPagoAdelantado ?? pedidoEstadoSel.monto_abonado ?? pedidoEstadoSel.montoAbonado ?? pedidoEstadoSel.pagoAdelantado ?? 0);

    const saldoPendientePedido = Math.max(0, totalPedido - pagadoPedido);
    const deudaPreviaCliente = Number(cliente.saldoDeudor ?? cliente.saldo_deudor ?? 0);
    const limiteCredito = Number(cliente.limiteCredito ?? cliente.limite_credito ?? 0);
    const deudaTotalProyectada = deudaPreviaCliente + saldoPendientePedido;

    const estadoNormalizado = (nuevoEstadoPendiente || '').toUpperCase().trim();
    const esEntregaOFinalizacion = ['ENTREGADO', 'FINALIZADO', 'COMPLETADO', 'TERMINADO', 'LISTO PARA ENTREGAR'].includes(estadoNormalizado);
    const superaLimite = limiteCredito > 0 ? deudaTotalProyectada > limiteCredito : saldoPendientePedido > 0;

    // NUEVO (consulta: "¿qué pasa si el Consumidor Final tiene saldo
    // pendiente?"): Consumidor Final (id 1) no opera con Cuenta Corriente, así
    // que no tiene sentido mostrarle el modal de "Autorizar Solo Esta Vez" /
    // "Actualizar Límite y Entregar" -- ese modal sugiere que la deuda queda
    // registrada, y para este cliente el backend la rechaza directamente (ver
    // PedidoServiceImpl.cambiarEstadoPedido). Se corta acá con un aviso claro,
    // en vez de abrir un modal cuyas dos opciones van a terminar en el mismo
    // error del backend.
    if (esEntregaOFinalizacion && superaLimite && idClientePedido === 1) {
      setSucesoError({
        show: true,
        titulo: 'No se puede entregar',
        mensaje: `El Consumidor Final tiene un saldo pendiente de $${saldoPendientePedido.toFixed(2)}. Cobre el total antes de continuar -- el Consumidor Final no opera con Cuenta Corriente.`
      });
      setPedidoEstadoSel(null);
      return;
    }

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
      setSucesoError({ show: true, titulo: 'Error', mensaje: "No se pudo identificar el cliente para actualizar su límite de crédito." });
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
      setSucesoError({ show: true, titulo: 'Error', mensaje: error.message || "No se pudo actualizar el límite de crédito." });
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
      refrescarPedido(pedidoPagoSel.id_pedido);
    } catch (error: any) {
      console.error(error);
      setSuceso({ show: true, titulo: "Error", mensaje: error.message || "Error al registrar el pago", tipo: "error" });
    }
  };

  const handleVincularComprobante = async (idComprobante: number, archivo: File) => {
    try {
      const pedidoActualizado = await PedidoPendienteService.vincularComprobanteDigital(idComprobante, archivo);
      setPedidoGestionComprobanteSel(pedidoActualizado);
      if (pedidoActualizado?.id_pedido) refrescarPedido(pedidoActualizado.id_pedido);
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
      if (pedidoActualizado?.id_pedido) refrescarPedido(pedidoActualizado.id_pedido);
      setSuceso({ show: true, titulo: "Éxito", mensaje: "Comprobante desvinculado correctamente", tipo: "exito" });
    } catch (error: any) {
      setSuceso({ show: true, titulo: "Error", mensaje: error.message, tipo: "error" });
    }
  };

  const handleCambioUbicacion = async (idPedido: number, nuevaUbicacion: string) => {
    const ubicacionAnterior = pedidos.find(p => p.id_pedido === idPedido)?.ubicacion_estante || 'Taller';
    showLoading('Actualizando ubicación...');
    try {
      await PedidoPendienteService.actualizarUbicacion(idPedido, nuevaUbicacion);
      hideLoading();
      mostrarToast(`Pedido #${idPedido}: ubicación "${nuevaUbicacion}"`, {
        accion: {
          texto: 'Deshacer',
          onClick: async () => {
            try {
              await PedidoPendienteService.actualizarUbicacion(idPedido, ubicacionAnterior);
              mostrarToast(`Pedido #${idPedido}: ubicación restaurada a "${ubicacionAnterior}"`, { tipo: 'info' });
              refrescarPedido(idPedido);
            } catch (err: any) {
              mostrarToast(err?.message || 'No se pudo deshacer el cambio de ubicación.', { tipo: 'error' });
            }
          }
        }
      });
      refrescarPedido(idPedido);
    } catch (error: any) {
      console.error("Error al actualizar la ubicación:", error);
      hideLoading();
      setSucesoError({ show: true, titulo: 'Error', mensaje: error?.message || "No se pudo actualizar la ubicación del pedido en el servidor." });
    }
  };

  const handleAbrirPago = (pedido: any) => {
    if (pedido.es_cuenta_corriente) {
      setModalAvisoCuentaCorriente({ show: true, pedido });
    } else {
      setPedidoPagoSel(pedido);
    }
  };

  const esVentaRapidaCerrada = (p: any) =>
    (p.observaciones?.toLowerCase().includes('venta rápida') ||
     p.observacion?.toLowerCase().includes('venta rápida') ||
     p.estante === 'Venta Rápida') && p.estado !== 'PENDIENTE';

  const estaAtrasado = (p: any) => {
    if (!p.fecha_entrega_estimada || p.estado === 'FINALIZADO' || p.estado === 'PRESUPUESTO') return false;
    const entrega = new Date(p.fecha_entrega_estimada).getTime();
    return !isNaN(entrega) && entrega < Date.now();
  };

  const pedidosVisibles = pedidos.filter(p => !esVentaRapidaCerrada(p));
  const contadores = {
    TALLER: pedidosVisibles.filter(p => p.estado !== 'PRESUPUESTO').length,
    PRESUPUESTOS: pedidosVisibles.filter(p => p.estado === 'PRESUPUESTO').length,
    ATRASADOS: pedidosVisibles.filter(estaAtrasado).length,
  };

  const pedidosFiltrados = pedidosVisibles.filter(p => {
    if (pestana === 'PRESUPUESTOS') {
      if (p.estado !== 'PRESUPUESTO') return false;
    } else {
      if (p.estado === 'PRESUPUESTO') return false;
      if (pestana === 'ATRASADOS' && !estaAtrasado(p)) return false;
    }

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
    } else if (filtroEstado !== '' && pestana !== 'PRESUPUESTOS' && p.estado !== filtroEstado) {
      return false;
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

  const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => (a.id_pedido ?? 0) - (b.id_pedido ?? 0));

  return (
    <SidebarLayout activeItem="Pedidos Pendientes">
      <div className="container-fluid px-2 d-flex flex-column pt-3" style={{ height: 'calc(100vh - 45px)', overflow: 'hidden' }}>
        <div className="d-flex justify-content-center align-items-center mb-2 position-relative d-print-none">
          <h1 className="fw-bold tracking-tight text-white m-0 text-center" style={{ fontSize: '1.85rem' }}>
            {pestana === 'PRESUPUESTOS' ? 'Presupuestos / Cotizaciones' : 'Cola de Producción Taller'}
          </h1>
        </div>

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2 d-print-none font-monospace">
          <div className="d-flex gap-1 flex-wrap" role="tablist">
            {([
              { clave: 'TALLER', texto: 'Taller', icono: 'bi-tools', color: '#8e45e0' },
              { clave: 'PRESUPUESTOS', texto: 'Presupuestos', icono: 'bi-file-earmark-text', color: '#a855f7' },
              { clave: 'ATRASADOS', texto: 'Atrasados', icono: 'bi-alarm', color: '#dc3545' },
            ] as const).map(t => {
              const activa = pestana === t.clave;
              return (
                <button
                  key={t.clave}
                  role="tab"
                  aria-selected={activa}
                  className="btn btn-sm fw-bold d-flex align-items-center gap-2"
                  style={{
                    backgroundColor: activa ? t.color : 'transparent',
                    color: activa ? '#ffffff' : (isDarkMode ? '#d4d4d8' : '#334155'),
                    border: `1px solid ${activa ? t.color : (isDarkMode ? '#3f3f46' : '#cbd5e1')}`,
                    borderRadius: '8px'
                  }}
                  onClick={() => setPestana(t.clave)}
                >
                  <i className={`bi ${t.icono}`} aria-hidden="true"></i>
                  {t.texto}
                  <span className="badge rounded-pill" style={{ backgroundColor: activa ? 'rgba(255,255,255,0.25)' : t.color, color: '#ffffff' }}>
                    {contadores[t.clave]}
                  </span>
                </button>
              );
            })}
          </div>

          {pestana !== 'PRESUPUESTOS' && (
            <div className="btn-group btn-group-sm" role="group" aria-label="Modo de vista">
              {(['LISTA', 'TABLERO'] as const).map(m => (
                <button
                  key={m}
                  className="btn fw-bold"
                  style={{
                    backgroundColor: modoVista === m ? '#8e45e0' : 'transparent',
                    color: modoVista === m ? '#ffffff' : (isDarkMode ? '#d4d4d8' : '#334155'),
                    border: `1px solid ${modoVista === m ? '#8e45e0' : (isDarkMode ? '#3f3f46' : '#cbd5e1')}`
                  }}
                  onClick={() => cambiarModoVista(m)}
                >
                  <i className={`bi ${m === 'LISTA' ? 'bi-list-ul' : 'bi-kanban'} me-1`} aria-hidden="true"></i>
                  {m === 'LISTA' ? 'Lista' : 'Tablero'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 mb-2">
          <FiltrosPedidos
            filtroCliente={filtroCliente}
            setFiltroCliente={setFiltroCliente}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            filtroEmpleado={filtroEmpleado}
            setFiltroEmpleado={setFiltroEmpleado}
            empleados={empleados}
          />
        </div>

        <div className="flex-grow-1 overflow-y-auto mb-2 pe-1" style={{ height: 'calc(100vh - 210px)' }}>
          {modoVista === 'TABLERO' && pestana !== 'PRESUPUESTOS' && !cargando ? (
            <TableroPedidos pedidos={pedidosOrdenados} onMover={handleCambioEstadoCombo} />
          ) : (
          <ListaPedidosPendientes
            cargando={cargando}
            pedidos={pedidosOrdenados}
            pedidosActualizando={pedidosActualizando}
            empleados={empleados}
            onCambioEstado={handleCambioEstadoCombo}
            onCambioUbicacion={handleCambioUbicacion}
            onSelectPago={handleAbrirPago}
            onSelectTicket={setVerTicketPedido}
            onCambioEmpleado={handleCambioEmpleado}
            onSelectComprobantes={(p) => setPedidoGestionComprobanteSel(p)}
            onGestionarMermas={(p) => setPedidoMermaSel(p)}
          />
          )}
        </div>

        <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center pt-2 border-secondary pb-1 mt-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary fw-bold shadow-sm font-monospace d-inline-flex align-items-center justify-content-center"
            style={{
              color: '#ffffff',
              padding: '11px 24px',
              fontSize: '1rem',
              minWidth: '90px'
            }}
          >
            Volver
          </button>
        </div>
      </div>

      <PedidosModales
        pedidoEstadoSel={pedidoEstadoSel}
        nuevoEstadoPendiente={nuevoEstadoPendiente}
        onCerrarCambioEstado={() => { setPedidoEstadoSel(null); setNuevoEstadoPendiente(''); }}
        onConfirmarCambioEstado={confirmarCambioEstado}
        modalAdvertenciaDeuda={modalAdvertenciaDeuda}
        onCerrarAdvertenciaDeuda={() => setModalAdvertenciaDeuda(prev => ({ ...prev, show: false }))}
        onActualizarYEntregar={handleActualizarLimiteYEntregar}
        onAutorizarUnaVez={() => ejecutarCambioEstado(modalAdvertenciaDeuda.pedido.id_pedido, modalAdvertenciaDeuda.nuevoEstado, modalAdvertenciaDeuda.pedido.estado, modalAdvertenciaDeuda.observaciones)}
        onRegistrarCobro={(pedido) => {
          setModalAdvertenciaDeuda(prev => ({ ...prev, show: false }));
          setPedidoPagoSel(pedido);
        }}
        pedidoPagoSel={pedidoPagoSel}
        onCerrarPago={() => setPedidoPagoSel(null)}
        onConfirmarPago={confirmarPago}
        verTicketPedido={verTicketPedido}
        onCerrarTicket={() => setVerTicketPedido(null)}
        ticketPagoSel={ticketPagoSel}
        onCerrarTicketPago={() => setTicketPagoSel(null)}
        pedidoGestionComprobanteSel={pedidoGestionComprobanteSel}
        onCerrarGestionComprobantes={() => setPedidoGestionComprobanteSel(null)}
        onVincularComprobante={handleVincularComprobante}
        onEliminarComprobanteDigital={async (idComp) => setConfirmarDesvincular({ show: true, idComprobante: idComp })}
        onVerTicketDesdeComprobante={(pedido, cobro) => {
          setTicketPagoSel({ pedido, movimiento: cobro });
        }}
        pedidoMermaSel={pedidoMermaSel}
        onCerrarMerma={() => setPedidoMermaSel(null)}
        onConfirmarMerma={() => {
          const idPedidoMerma = pedidoMermaSel?.id_pedido;
          setSuceso({ show: true, titulo: "Éxito", mensaje: "Merma registrada correctamente.", tipo: "exito" });
          if (idPedidoMerma) refrescarPedido(idPedidoMerma);
        }}
        sucesoError={sucesoError}
        onCerrarError={() => {
          setSucesoError({ show: false, mensaje: '' });
          refrescar();
        }}
        confirmarDesvincular={confirmarDesvincular}
        onCerrarConfirmarDesvincular={() => setConfirmarDesvincular({ show: false, idComprobante: null })}
        onConfirmarEliminarComprobante={ejecutarEliminarComprobante}
        modalAvisoCuentaCorriente={modalAvisoCuentaCorriente}
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
        onCerrarAvisoCuentaCorriente={() => setModalAvisoCuentaCorriente({ show: false, pedido: null })}
        clienteCuentaCorriente={clienteCuentaCorriente}
        onCerrarCuentaCorriente={() => setClienteCuentaCorriente(null)}
        modalNotif={modalNotif}
        onCerrarModalNotif={() => setModalNotif({ show: false, msg: '' })}
        suceso={suceso}
        onCerrarSuceso={() => setSuceso({ ...suceso, show: false })}
      />
    </SidebarLayout>
  );
};