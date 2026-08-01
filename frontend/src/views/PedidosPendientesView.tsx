import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { usePedidosPendientes } from '../hooks/usePedidosPendientes';
import { pedidoService } from '../services/pedidoService';
import { empleadoService } from '../services/empleadoService';
import { SuccesModal } from '../components/layouts/SuccesModal';
import { useTurno } from '../Context/TurnoContext';
import { ModalGestionarComprobantes } from '../features/pedidos/ModalGestionarComprobantes';

// Importación de Componentes Extraídos e Internos
import { FiltrosPedidos } from '../features/pedidos/components/FiltrosPedidos';
import { FilaPedido } from '../features/pedidos/components/FilaPedido'; 
import { ModalCambioEstado } from '../features/pedidos/ModalCambioEstado';
import { ModalRegistrarPago } from '../features/pedidos/ModalRegistrarPago';
import { VistaTicketModal } from '../features/pedidos/VistaTicketModal';

export const PedidosPendientesPage: React.FC = () => {
  const { pedidos, cargando, actualizarEstado, registrarPago } = usePedidosPendientes();
  const navigate = useNavigate();
  const { cajaAbierta } = useTurno();
  const [suceso, setSuceso] = useState({ show: false, titulo: "", mensaje: "", tipo: "exito" });
  const [pedidoGestionComprobanteSel, setPedidoGestionComprobanteSel] = useState<any | null>(null);
  const [filtroEmpleado, setFiltroEmpleado] = useState('');

  // Controles de Modales
  const [pedidoEstadoSel, setPedidoEstadoSel] = useState<any>(null);
  const [nuevoEstadoPendiente, setNuevoEstadoPendiente] = useState<string>('');
  const [pedidoPagoSel, setPedidoPagoSel] = useState<any>(null);
  const [verTicketPedido, setVerTicketPedido] = useState<any>(null);
  const [sucesoError, setSucesoError] = useState<{ show: boolean; mensaje: string }>({ show: false, mensaje: '' });
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [modalNotif, setModalNotif] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });
  const [confirmarDesvincular, setConfirmarDesvincular] = useState<{ show: boolean; idComprobante: number | null }>({
    show: false,
    idComprobante: null
  });

  // Modal de Advertencia por Deuda / Saldo Pendiente al Entregar o Finalizar
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

  // Estado para el nuevo límite de crédito a ingresar en el modal
  const [nuevoLimiteInput, setNuevoLimiteInput] = useState<string>('');
  const [guardandoLimite, setGuardandoLimite] = useState<boolean>(false);

  // Filtros de búsqueda estatales
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Handlers de Controladores
  const handleCambioEstadoCombo = (pedido: any, estadoDestino: string) => {
    setPedidoEstadoSel(pedido);
    setNuevoEstadoPendiente(estadoDestino);
  };

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

  // Handler para asignar empleado
  const handleCambioEmpleado = async (idPedido: number, idEmpleado: string) => {
    try {
      const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
      const idUsuarioActivo = userLogueado.idUsuario ?? userLogueado.id_usuario ?? userLogueado.id ?? 1;
      
      await (pedidoService as any).asignarEmpleado(idPedido, idEmpleado, idUsuarioActivo);
      
      setModalNotif({ show: true, msg: "El empleado ha sido asignado correctamente." });
    } catch (error) {
      console.error("Error al asignar:", error);
      alert("Error al asignar el empleado.");
    }
  };

  // Función interna para ejecutar el cambio de estado en el backend
  const ejecutarCambioEstado = async (idPedido: number, nuevoEst: string, estadoAnt: string, observaciones: string) => {
    const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
    const idUsuarioActivo = userLogueado.idUsuario ?? userLogueado.id_usuario ?? userLogueado.id;

    try {
      await actualizarEstado(
        idPedido,
        nuevoEst,
        estadoAnt,
        observaciones,
        idUsuarioActivo
      );
    } catch (error: any) {
      console.error("Error al cambiar estado:", error);
      const mensajeOriginal = error.message || "";
      let mensajeAmigable = "Hubo un error al procesar el cambio de estado.";
      if (mensajeOriginal.toLowerCase().includes("stock") || mensajeOriginal.toLowerCase().includes("insuficiente")) {
        mensajeAmigable = "No hay Suficiente Stock para Completar o Entregar el Pedido, Por Favor Modifique el stock en la Ventana Productos para Continuar";
      } else {
        mensajeAmigable = mensajeOriginal;
      }

      setSucesoError({
        show: true,
        mensaje: mensajeAmigable
      });
    } finally {
      setPedidoEstadoSel(null);
      setNuevoEstadoPendiente('');
      setModalAdvertenciaDeuda({
        show: false,
        pedido: null,
        nuevoEstado: '',
        observaciones: '',
        saldoPendiente: 0,
        deudaPrevia: 0,
        deudaTotal: 0,
        limiteCredito: 0
      });
    }
  };

  // Confirmación desde ModalCambioEstado con chequeo exacto contra Cliente.java
  const confirmarCambioEstado = async (observaciones: string) => {
    if (!pedidoEstadoSel) return;

    const cliente = pedidoEstadoSel.cliente || {};

    // 1. Monto total del pedido
    const totalPedido = Number(
      pedidoEstadoSel.monto_total ?? 
      pedidoEstadoSel.montoTotal ?? 
      pedidoEstadoSel.total ?? 
      0
    );

    // 2. Monto abonado/seña del pedido
    const pagadoPedido = Number(
      pedidoEstadoSel.monto_pago_adelantado ?? 
      pedidoEstadoSel.montoPagoAdelantado ?? 
      pedidoEstadoSel.monto_abonado ?? 
      pedidoEstadoSel.montoAbonado ?? 
      pedidoEstadoSel.pagoAdelantado ?? 
      0
    );

    // Saldo pendiente de este pedido
    const saldoPendientePedido = Math.max(0, totalPedido - pagadoPedido);

    // 3. Deuda previa del cliente (mapeado directo de Cliente.java: saldoDeudor)
    const deudaPreviaCliente = Number(
      cliente.saldoDeudor ?? 
      cliente.saldo_deudor ?? 
      0
    );

    // 4. Límite de crédito del cliente (mapeado directo de Cliente.java: limiteCredito)
    const limiteCredito = Number(
      cliente.limiteCredito ?? 
      cliente.limite_credito ?? 
      0
    );

    // Deuda total proyectada
    const deudaTotalProyectada = deudaPreviaCliente + saldoPendientePedido;

    const estadoNormalizado = (nuevoEstadoPendiente || '').toUpperCase().trim();
    const esEntregaOFinalizacion = [
      'ENTREGADO', 
      'FINALIZADO', 
      'COMPLETADO', 
      'TERMINADO', 
      'LISTO PARA ENTREGAR'
    ].includes(estadoNormalizado);

    // Se activa si hay saldo pendiente y (no tiene límite o la deuda supera el límite actual)
    const superaLimite = limiteCredito > 0 
      ? deudaTotalProyectada > limiteCredito 
      : saldoPendientePedido > 0;

    if (esEntregaOFinalizacion && superaLimite) {
      // Sugerimos como nuevo límite por defecto la deuda proyectada para facilitar la carga rápida
      setNuevoLimiteInput(deudaTotalProyectada.toString());

      setModalAdvertenciaDeuda({
        show: true,
        pedido: pedidoEstadoSel,
        nuevoEstado: nuevoEstadoPendiente,
        observaciones: observaciones,
        saldoPendiente: saldoPendientePedido,
        deudaPrevia: deudaPreviaCliente,
        deudaTotal: deudaTotalProyectada,
        limiteCredito: limiteCredito
      });
      setPedidoEstadoSel(null);
      return;
    }

    // Procesar cambio si no supera los límites
    await ejecutarCambioEstado(
      pedidoEstadoSel.id_pedido,
      nuevoEstadoPendiente,
      pedidoEstadoSel.estado,
      observaciones
    );
  };

  // Función para actualizar límite de crédito en la BD y entregar inmediatamente
  const handleActualizarLimiteYEntregar = async () => {
    const nuevoLimiteNum = Number(nuevoLimiteInput);
    if (isNaN(nuevoLimiteNum) || nuevoLimiteNum < 0) {
      alert("Por favor, ingresá un monto de límite de crédito válido.");
      return;
    }

    const cliente = modalAdvertenciaDeuda.pedido?.cliente || {};
    const idCliente = cliente.idCliente ?? cliente.id_cliente;

    if (!idCliente) {
      alert("No se pudo identificar el ID del cliente para actualizar su límite.");
      return;
    }

    setGuardandoLimite(true);
    try {
      // Llamada al endpoint de Spring Boot de CuentaCorrienteController
      const response = await fetch(`http://localhost:8080/api/cuentas-corrientes/cliente/${idCliente}/limite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limiteCredito: nuevoLimiteNum })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al actualizar el límite de crédito en el servidor.");
      }

      // Límite actualizado en backend con éxito, procedemos a cambiar el estado del pedido
      await ejecutarCambioEstado(
        modalAdvertenciaDeuda.pedido.id_pedido,
        modalAdvertenciaDeuda.nuevoEstado,
        modalAdvertenciaDeuda.pedido.estado,
        modalAdvertenciaDeuda.observaciones
      );
    } catch (error: any) {
      console.error("Error actualizando límite de crédito:", error);
      alert(`Error: ${error.message || "No se pudo actualizar el límite de crédito."}`);
    } finally {
      setGuardandoLimite(false);
    }
  };

  const confirmarPago = async (tipoPago: string, monto: number, archivo: File | null) => {
    try {
      const formData = new FormData();
      
      const payload = {
        monto: monto,
        tipoPago: tipoPago,
        idUsuario: 1 
      };

      formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));

      if (archivo) {
        formData.append("comprobante", archivo);
      }

      const response = await fetch(`http://localhost:8080/api/pedidos/${pedidoPagoSel.id_pedido}/pagos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al procesar el pago");
      }

      setSuceso({ 
        show: true, 
        titulo: "Éxito", 
        mensaje: "Pago registrado correctamente", 
        tipo: "exito" 
      });
      
      setPedidoPagoSel(null);

    } catch (error: any) {
      console.error(error);
      setSuceso({
        show: true,
        titulo: "Error",
        mensaje: error.message || "Error al registrar el pago",
        tipo: "error"
      });
    }
  };

  const handleVincularComprobante = async (idComprobante: number, archivo: File) => {
    try {
      const formData = new FormData();
      formData.append("comprobante", archivo);

      const response = await fetch(`http://localhost:8080/api/pedidos/comprobantes/${idComprobante}/archivo`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error("No se pudo subir el archivo.");

      const pedidoActualizado = await response.json();
      setPedidoGestionComprobanteSel(pedidoActualizado);
      setSuceso({ show: true, titulo: "Éxito", mensaje: "Comprobante vinculado", tipo: "exito" });
    } catch (error: any) {
      setSuceso({ show: true, titulo: "Error", mensaje: error.message, tipo: "error" });
    }
  };

  const handleEliminarComprobante = async (idComprobante: number) => {
    setConfirmarDesvincular({
      show: true,
      idComprobante
    });
  };

  const ejecutarEliminarComprobante = async () => {
    const idComprobante = confirmarDesvincular.idComprobante;
    if (!idComprobante) return;

    setConfirmarDesvincular({ show: false, idComprobante: null });

    try {
      const response = await fetch(`http://localhost:8080/api/pedidos/comprobantes/${idComprobante}/archivo`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error("No se pudo eliminar el archivo.");

      const pedidoActualizado = await response.json();
      setPedidoGestionComprobanteSel(pedidoActualizado);

      setSuceso({ 
        show: true, 
        titulo: "Éxito", 
        mensaje: "Comprobante desvinculado correctamente", 
        tipo: "exito" 
      });
    } catch (error: any) {
      setSuceso({ 
        show: true, 
        titulo: "Error", 
        mensaje: error.message, 
        tipo: "error" 
      });
    }
  };

  const handleCambioUbicacion = async (idPedido: number, nuevaUbicacion: string) => {
    try {
      await pedidoService.actualizarUbicacion(idPedido, nuevaUbicacion);
      setSuceso({ 
        show: true, 
        titulo: "Éxito", 
        mensaje: `Ubicación actualizada a "${nuevaUbicacion}"`, 
        tipo: "exito" 
      });
    } catch (error) {
      console.error("Error al actualizar la ubicación:", error);
      setSucesoError({
        show: true,
        mensaje: "No se pudo actualizar la ubicación del pedido en el servidor."
      });
    }};

  const handleSubirArchivoFisico = async (idPedido: number, file: File) => {
    try {
      const ok = await pedidoService.subirComprobanteFisico(idPedido, file);
      if (ok) {
        alert('¡Comprobante guardado en el servidor con éxito!');
        window.location.reload();
      } else {
        alert('Error al intentar subir el archivo al servidor.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión con la API de Spring Boot.');
    }
  };

  const handleEliminarComprobanteFisico = async (idPedido: number) => {
    if (!window.confirm('¿Estás seguro de que querés eliminar el comprobante físico de este pedido?')) return;
    try {
      const ok = await pedidoService.eliminarComprobanteFisico(idPedido);
      if (ok) {
        alert('Comprobante eliminado con éxito.');
        window.location.reload();
      } else {
        alert('No se pudo eliminar el archivo.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de comunicación con el backend.');
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const esVentaRapida = 
      p.observaciones?.toLowerCase().includes('venta rápida') || 
      p.observacion?.toLowerCase().includes('venta rápida') ||
      p.estante === 'Venta Rápida';

    if (esVentaRapida) return false;

    const nombreCliente = p.cliente?.persona 
      ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido}`
      : (p.cliente?.razonSocial || p.cliente?.razon_social || p.cliente?.nombre || 'Consumidor Final');
    const cumpleCliente = nombreCliente.toLowerCase().includes(filtroCliente.toLowerCase());
    if (!cumpleCliente) return false;

    if (filtroEstado === 'PRESUPUESTO') {
      if (p.estado !== 'PRESUPUESTO') return false;
    } else {
      if (p.estado === 'PRESUPUESTO') return false;
      if (filtroEstado !== '' && p.estado !== filtroEstado) return false;
    }

    if (filtroEmpleado !== '') {
      const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0
        ? p.asignaciones[p.asignaciones.length - 1]
        : null;

      const idEmpleadoAsignado = ultimaAsignacion?.empleado?.idEmpleado || 
                                 ultimaAsignacion?.empleado?.id_empleado;

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
      <div 
        className="container-fluid px-2 d-flex flex-column pt-3" 
        style={{ height: 'calc(100vh - 45px)', overflow: 'hidden' }}
      >
        <div className="d-flex justify-content-center align-items-center mb-2 position-relative d-print-none">
        <h1 className="fw-bold tracking-tight text-white m-0 text-center" style={{ fontSize: '1.85rem' }}>
         {filtroEstado === 'PRESUPUESTO' ? 'Presupuestos / Cotizaciones' : 'Cola de Producción Taller'}</h1>
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
          />
        </div>

        <div 
          className="d-flex flex-column flex-grow-1 overflow-hidden mb-2" 
          style={{ backgroundColor: '#1d1d1d', height: 'calc(100vh - 210px)' }}
        >
          <div 
            className="table-responsive flex-grow-1" 
            style={{ backgroundColor: '#1d1d1d', height: '100%', overflowY: 'auto' }}
          >
            <table 
              className="table-dark table-hover m-0 align-middle"
              style={{ width: '100%', borderCollapse: 'collapse', color: '#e4e4e7', backgroundColor: '#121214' }}
            >
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#1d1d1d', zIndex: 1 }}>
                <tr style={{ backgroundColor: '#1d1d1d', borderBottom: '2px solid #27272a', color: '#a1a1aa', fontFamily: 'monospace', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 12px 12px 24px' }}>ID</th>
                  <th>Cliente</th>
                  <th style={{ padding: '3px' }}>Estante</th>
                  <th style={{ textAlign: 'left' }}>Contacto</th>
                  <th>Empleado Asignado</th> 
                  <th>Fecha Creación</th>  
                  <th className="text-warning">Entrega Estimada</th>
                  <th>Estado</th>
                  <th>Monto Total</th>
                  <th>Monto Abonado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={10} className="text-center py-5 font-monospace">
                      No se han encontrado Pedidos Pendientes en la Base de Datos
                    </td>
                  </tr>
                ) : pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-5">
                      No se encontraron registros bajo este filtro.
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map((pedido) => (
                    <FilaPedido 
                      key={`pedido-row-${pedido.id_pedido}`}
                      pedido={pedido}
                      onCambioEstado={handleCambioEstadoCombo}
                      onCambioUbicacion={handleCambioUbicacion}
                      onSelectPago={setPedidoPagoSel}
                      onSelectTicket={setVerTicketPedido}
                      onSubirArchivo={handleSubirArchivoFisico}
                      onEliminarComprobante={handleEliminarComprobanteFisico}
                      empleados={empleados}
                      onCambioEmpleado={handleCambioEmpleado}
                      onSelectComprobantes={(p) => setPedidoGestionComprobanteSel(p)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center pt-2 border-top border-secondary pb-1 mt-auto">
          <button onClick={() => navigate('/dashboard')} className="btn btn-danger px-4 py-2">Volver</button>
        </div>
      </div>

      {/* MODAL CAMBIO DE ESTADO */}
      {pedidoEstadoSel && (
        <ModalCambioEstado 
          pedido={pedidoEstadoSel}
          nuevoEstado={nuevoEstadoPendiente}
          onClose={() => { 
            setPedidoEstadoSel(null);
            setNuevoEstadoPendiente(''); 
          }}
          onConfirm={confirmarCambioEstado}
        />
      )}

      {/* MODAL ADVERTENCIA DE DEUDA / LÍMITE DE CRÉDITO SUPERADO O INEXISTENTE */}
      {modalAdvertenciaDeuda.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div 
              className="modal-content text-white" 
              style={{ 
                backgroundColor: '#1a1a1c', 
                border: '2px solid #f59e0b', 
                borderRadius: '12px', 
                padding: '24px'
              }}
            >
              <div className="text-center mb-3">
                <div 
                  className="d-inline-flex align-items-center justify-content-center mb-2"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    border: '2px solid #f59e0b'
                  }}
                >
                  <i className="bi bi-exclamation-triangle-fill fs-2" style={{ color: '#f59e0b' }}></i>
                </div>
                <h5 className="fw-bold m-0" style={{ color: '#ffffff' }}>
                  {modalAdvertenciaDeuda.limiteCredito === 0 
                    ? 'Cliente sin Límite de Crédito' 
                    : 'Límite de Crédito Superado'}
                </h5>
              </div>

              <div className="p-3 mb-3 rounded" style={{ backgroundColor: '#121214', border: '1px solid #27272a', fontSize: '0.9rem' }}>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Pedido #:</span>
                  <span className="fw-bold text-white">{modalAdvertenciaDeuda.pedido?.id_pedido}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Deuda Previa (Saldo Deudor):</span>
                  <span className="fw-bold text-light">${(modalAdvertenciaDeuda.deudaPrevia || 0).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Saldo Pendiente del Pedido:</span>
                  <span className="fw-bold text-light">${(modalAdvertenciaDeuda.saldoPendiente || 0).toFixed(2)}</span>
                </div>
                <hr className="my-2 border-secondary" />
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-white fw-bold">Deuda Total Proyectada:</span>
                  <span className="fw-bold text-warning">${(modalAdvertenciaDeuda.deudaTotal || 0).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Límite Actual Asignado:</span>
                  <span className={`fw-bold ${modalAdvertenciaDeuda.limiteCredito === 0 ? 'text-danger' : 'text-info'}`}>
                    ${modalAdvertenciaDeuda.limiteCredito.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* OPCIÓN PARA ACTUALIZAR EL LÍMITE DE CRÉDITO DIRECTO */}
              <div className="p-3 mb-3 rounded" style={{ backgroundColor: '#232326', border: '1px solid #3f3f46' }}>
                <label className="form-label text-warning small fw-bold mb-1">
                  <i className="bi bi-pencil-square me-1"></i>
                  {modalAdvertenciaDeuda.limiteCredito === 0 
                    ? 'Asignar Nuevo Límite de Crédito al Cliente ($):' 
                    : 'Actualizar Límite de Crédito ($):'}
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  className="form-control bg-dark text-white border-secondary font-monospace"
                  placeholder="Ingrese el nuevo límite..."
                  value={nuevoLimiteInput}
                  onChange={(e) => setNuevoLimiteInput(e.target.value)}
                />
              </div>

              <div className="d-flex flex-column gap-2">
                {/* BOTÓN 1: Actualizar Límite en BD y Entregar */}
                <button 
                  type="button" 
                  className="btn btn-primary fw-bold py-2"
                  disabled={guardandoLimite}
                  onClick={handleActualizarLimiteYEntregar}
                >
                  <i className="bi bi-save me-1"></i> 
                  {guardandoLimite ? 'Guardando...' : 'Actualizar Límite y Entregar'}
                </button>

                {/* BOTÓN 2: Autorizar Excepcionalmente por esta vez */}
                <button 
                  type="button" 
                  className="btn btn-warning fw-bold py-2"
                  style={{ backgroundColor: '#d97706', border: 'none', color: '#fff' }}
                  onClick={() => {
                    ejecutarCambioEstado(
                      modalAdvertenciaDeuda.pedido.id_pedido,
                      modalAdvertenciaDeuda.nuevoEstado,
                      modalAdvertenciaDeuda.pedido.estado,
                      modalAdvertenciaDeuda.observaciones
                    );
                  }}
                >
                  <i className="bi bi-check-circle me-1"></i> Autorizar Solo Esta Vez
                </button>

                {/* BOTÓN 3: Ir a Cobrar */}
                <button 
                  type="button" 
                  className="btn btn-success fw-bold py-2"
                  style={{ backgroundColor: '#15803d', border: 'none' }}
                  onClick={() => {
                    const pedidoParaCobro = modalAdvertenciaDeuda.pedido;
                    setModalAdvertenciaDeuda({
                      show: false,
                      pedido: null,
                      nuevoEstado: '',
                      observaciones: '',
                      saldoPendiente: 0,
                      deudaPrevia: 0,
                      deudaTotal: 0,
                      limiteCredito: 0
                    });
                    setPedidoPagoSel(pedidoParaCobro);
                  }}
                >
                  <i className="bi bi-currency-dollar me-1"></i> Registrar Cobro Ahora
                </button>

                {/* BOTÓN 4: Cancelar */}
                <button 
                  type="button" 
                  className="btn btn-outline-secondary py-2 mt-1"
                  onClick={() => setModalAdvertenciaDeuda({
                    show: false,
                    pedido: null,
                    nuevoEstado: '',
                    observaciones: '',
                    saldoPendiente: 0,
                    deudaPrevia: 0,
                    deudaTotal: 0,
                    limiteCredito: 0
                  })}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRO DE PAGOS */}
      {pedidoPagoSel && (
        <ModalRegistrarPago 
          show={true}
          pedido={pedidoPagoSel}
          onClose={() => setPedidoPagoSel(null)}
          onConfirm={confirmarPago}
        />
      )}

      {/* VISTA PREVIA TICKET */}
      {verTicketPedido && (
        <VistaTicketModal 
          pedido={verTicketPedido}
          onClose={() => setVerTicketPedido(null)}
        />
      )}

      {/* GESTION DE COMPROBANTES */}
      {pedidoGestionComprobanteSel && (
        <ModalGestionarComprobantes
          pedido={pedidoGestionComprobanteSel}
          onClose={() => setPedidoGestionComprobanteSel(null)}
          onVincularComprobante={handleVincularComprobante}
          onEliminarComprobante={handleEliminarComprobante} 
        />
      )}

      {/* MODAL ERROR STOCK */}
      {sucesoError.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-white text-center" 
              style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px', fontFamily: 'monospace' }}
            >
              <i className="bi bi-x-circle fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">Error por Falta de Stock</h5>
              <p className="small" style={{ color: '#a1a1aa' }}>{sucesoError.mensaje}</p>
              <button 
                className="btn btn-danger btn-sm px-4 mt-3 fw-bold"
                style={{ borderRadius: '6px' }}
                onClick={() => {
                  setSucesoError({ show: false, mensaje: '' });
                  window.location.reload();
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR DESVINCULAR COMPROBANTE */}
      {confirmarDesvincular.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1100 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-white text-center" 
              style={{ 
                border: '2px solid #dc3545', 
                backgroundColor: '#1a1a1c', 
                borderRadius: '12px',
                fontFamily: 'monospace'
              }}
            >
              <i className="bi bi-x-circle fs-1 mb-2" style={{ color: '#dc3545' }}></i>
              <h5 className="fw-bold">¿Desvincular Comprobante?</h5>
              <p className="small" style={{ fontSize: '0.85rem' }}>
                ¿Estás seguro que querés desvincular este comprobante de este pedido?
              </p>

              <div className="d-flex gap-2 justify-content-center mt-3">
                <button 
                  className="btn btn-sm btn-secondary fw-bold px-3"
                  style={{ borderRadius: '6px' }}
                  onClick={() => setConfirmarDesvincular({ show: false, idComprobante: null })}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-sm btn-danger fw-bold px-3"
                  style={{ borderRadius: '6px' }}
                  onClick={ejecutarEliminarComprobante}
                >
                  Desvincular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTIFICACION GENÉRICA */}
      {suceso.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-white text-center" 
              style={{ 
                border: '2px solid #8e45e0', 
                backgroundColor: '#1a1a1c', 
                borderRadius: '12px' 
              }}
            >
              <i className={`bi ${suceso.tipo === 'exito' ? 'bi-check-circle' : 'bi-x-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">{suceso.titulo}</h5>
              <p className="small" style={{ color: '#a1a1aa' }}>{suceso.mensaje}</p>
              <button 
                className={`btn ${suceso.tipo === 'exito' ? 'btn-success' : 'btn-danger'} btn-sm px-4 mt-3 fw-bold`}
                onClick={() => {
                  setSuceso({ ...suceso, show: false });
                  if (suceso.tipo === 'exito') {
                    window.location.reload();
                  }
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL DE ASIGNACION */}
      {modalNotif.show && (
        <SuccesModal 
          show={modalNotif.show} 
          message={modalNotif.msg} 
          onClose={() => {
            setModalNotif({ show: false, msg: '' });
            window.location.reload(); 
          }} 
        />
      )}
    </SidebarLayout>
  );
};