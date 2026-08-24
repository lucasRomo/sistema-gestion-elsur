import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../../../components/layouts/SidebarLayout';
import { useHistorialPedidos } from '../hooks/useHistorialPedidos';
import { historialPedidoService } from '../service/historialPedidoService';
import { useTheme } from '../../../Context/ThemeContext';

// Componentes Modularizados
import { FiltrosHistorial } from '../components/FiltrosHistorial';
import { FilaHistorial } from '../components/FilaHistorial';

// Modales
import { ModalAuditoriaPedido } from '../modals/ModalAuditoriaPedido';
import { VistaTicketModal } from '../modals/VistaTicketModal';
import { VistaTicketPagoModal } from '../../../components/modals/VistaTicketPagoModal';
import { ModalHistorialMermas } from '../modals/ModalHistorialMermas';
import { CuentaCorrienteModal } from '../../clientes/components/CuentaCorrienteModal';
import { ModalDevolucionPedido } from '../modals/ModalDevolucionPedido';

export const HistorialPedidosPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tableWrapperBg = isDark ? '#1d1d1d' : '#f8fafc';
  const tableBg = isDark ? '#1d1d1d' : '#ffffff';
  const tableText = isDark ? '#e4e4e7' : '#18181b';
  const theadBg = isDark ? '#1d1d1d' : '#f6f9fc';
  const theadBorder = isDark ? '#27272a' : '#e2e8f0';
  const theadText = isDark ? '#fefeff' : '#334155';
  const grayText = isDark ? '#a1a1aa' : '#64748b';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';
  
  const { pedidos, cargando, recargarHistorial } = useHistorialPedidos();
  const navigate = useNavigate();
  
  // Estados para control de modales
  const [pedidoAuditoria, setPedidoAuditoria] = useState<any>(null);
  const [clienteCuentaCorriente, setClienteCuentaCorriente] = useState<any>(null);
  const [verTicketPedido, setVerTicketPedido] = useState<any>(null);
  const [ticketPagoSeleccionado, setTicketPagoSeleccionado] = useState<{ pedido: any; movimiento: any } | null>(null);
  const [pedidoMermas, setPedidoMermas] = useState<any>(null);

  // Estado para el modal de devolución
  const [pedidoDevolucion, setPedidoDevolucion] = useState<any>(null);

  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstadoHistorial, setFiltroEstadoHistorial] = useState('TODOS');

  // Estado de Suceso / Notificación
  const [suceso, setSuceso] = useState<{ show: boolean; titulo: string; mensaje: string; tipo: string }>({ 
    show: false, 
    titulo: '', 
    mensaje: '', 
    tipo: 'exito' 
  });

  const handleAbrirMermas = async (pedido: any) => {
    setPedidoMermas(pedido);
  };

  // Operaciones de Servicio
  const handleAbrirAuditoria = async (idPedido: number) => {
    try {
      const pedidoCompleto = await historialPedidoService.obtenerPorId(idPedido);
      if (pedidoCompleto) {
        setPedidoAuditoria(pedidoCompleto);
      } else {
        alert('No se pudo obtener el historial detallado de este pedido.');
      }
    } catch (error) {
      console.error('Error al conectar con la API de auditoría:', error);
      alert('Error de red al intentar buscar el historial.');
    }
  };

  const handleSubirArchivoFisico = async (idPedido: number, file: File) => {
    try {
      const ok = await historialPedidoService.subirComprobanteFisico(idPedido, file);
      if (ok) {
        alert('¡Archivo adjuntado con éxito en el histórico!');
        recargarHistorial();
      } else {
        alert('Error al subir el comprobante.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEliminarComprobanteFisico = async (idPedido: number) => {
    if (!window.confirm('¿Deseas eliminar permanentemente el comprobante de este pedido histórico?')) return;
    try {
      const ok = await historialPedidoService.eliminarComprobanteFisico(idPedido);
      if (ok) {
        alert('Comprobante eliminado con éxito.');
        recargarHistorial();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleProcesarDevolucion = async (accion: 'REINICIAR' | 'DEVUELTO', descripcionEntrante?: string) => {
    const textoDescripcion = descripcionEntrante || '';

    if (!textoDescripcion.trim()) {
      setSuceso({
        show: true,
        titulo: 'Atención',
        mensaje: 'Por favor, ingresa una descripción para la devolución.',
        tipo: 'error'
      });
      return;
    }

    try {
      const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
      const idUsuarioActivo = userLogueado.idUsuario ?? userLogueado.id_usuario ?? userLogueado.id ?? 1;

      const nuevoEstado = accion === 'REINICIAR' ? 'PENDIENTE' : 'DEVUELTO';
      const obsPrefix = accion === 'REINICIAR' ? 'Devolución (Volver a Hacer): ' : 'Devolución Final: ';

      await historialPedidoService.procesarDevolucion(
        pedidoDevolucion.id_pedido,
        nuevoEstado,
        `${obsPrefix}${textoDescripcion}`,
        idUsuarioActivo
      );

      setSuceso({
        show: true,
        titulo: 'Éxito',
        mensaje: accion === 'REINICIAR' 
          ? 'El pedido ha vuelto a ingresar a la cola de pedidos pendientes.' 
          : 'Pedido finalizado y marcado como Devuelto correctamente.',
        tipo: 'exito'
      });

      setPedidoDevolucion(null);
      recargarHistorial();
    } catch (error: any) {
      console.error('Error al procesar la devolución:', error);
      setSuceso({
        show: true,
        titulo: 'Error',
        mensaje: error.message || 'Error al procesar la devolución.',
        tipo: 'error'
      });
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const busquedaTermino = filtroTexto.toLowerCase().trim();

    const nombreCliente = p.cliente?.persona 
      ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido}`
      : (p.cliente?.razon_social || p.cliente?.nombre || 'Consumidor Final');

    const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0 
      ? p.asignaciones[p.asignaciones.length - 1] 
      : null;

    const nombreEmpleado = ultimaAsignacion?.empleado?.persona
      ? `${ultimaAsignacion.empleado.persona.nombre} ${ultimaAsignacion.empleado.persona.apellido}`
      : 'Sistema';

    const formatearFechaString = (fechaIso: string | null | undefined) => {
      if (!fechaIso) return '';
      const [fecha, horaCompleta] = fechaIso.split('T');
      if (!fecha) return fechaIso;
      const [anio, mes, dia] = fecha.split('-');
      if (!horaCompleta) return `${dia}/${mes}/${anio}`;
      const partesHora = horaCompleta.split('.')[0].split(':');
      let horas = parseInt(partesHora[0], 10);
      const minutos = partesHora[1];
      const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
      horas = horas % 12 || 12;
      const horasStr = horas < 10 ? `0${horas}` : `${horas}`;
      return `${dia}/${mes}/${anio} ${horasStr}:${minutos} ${ampm}`;
    };

    const fechaCierre = p.fecha_finalizacion || p.fecha_modificacion || ultimaAsignacion?.fecha_asignacion;
    const fechaFormateadaParaBuscar = formatearFechaString(fechaCierre);

    const cumpleBusquedaGeneral = 
      nombreCliente.toLowerCase().includes(busquedaTermino) ||
      nombreEmpleado.toLowerCase().includes(busquedaTermino) ||
      fechaFormateadaParaBuscar.toLowerCase().includes(busquedaTermino);
    
    let cumpleEstado = true;
    if (filtroEstadoHistorial === 'ENTREGADO') {
      cumpleEstado = p.estado === 'ENTREGADO';
    } else if (filtroEstadoHistorial === 'CANCELADO') {
      cumpleEstado = p.estado === 'CANCELADO';
    } else {
      cumpleEstado = ['ENTREGADO', 'CANCELADO', 'FINALIZADO', 'DEVUELTO'].includes(p.estado);
    }

    return cumpleBusquedaGeneral && cumpleEstado;
  });

  const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => (a.id_pedido ?? 0) - (b.id_pedido ?? 0)); 

  return (
    <SidebarLayout activeItem="Historial de Pedidos">
      <div 
        className="container-fluid px-2 d-flex flex-column pt-3" 
        style={{ height: 'calc(100vh - 45px)', overflow: 'hidden' }}
      >
        <div className="d-flex justify-content-center align-items-center mb-2 position-relative d-print-none">
          <h1 className="fw-bold tracking-tight text-white m-0 text-center" style={{ fontSize: '1.85rem' }}>Historial de Pedidos</h1>
          <span className="badge bg-dark border border-secondary text-secondary font-monospace position-absolute end-0">Registros Históricos</span>
        </div>

        <div className="mt-3 mb-3">
          <FiltrosHistorial 
            filtroTexto={filtroTexto}
            setFiltroTexto={setFiltroTexto}
            filtroEstadoHistorial={filtroEstadoHistorial}
            setFiltroEstadoHistorial={setFiltroEstadoHistorial}
          />
        </div>

        <div 
          className="d-flex flex-column flex-grow-1 overflow-hidden mb-2 shadow-sm rounded-3 border" 
          style={{ 
            backgroundColor: tableWrapperBg, 
            borderColor: isDark ? '#27272a' : '#e2e8f0',
            height: 'calc(100vh - 165px)' 
          }}
        >
          <div className="table-responsive flex-grow-1" style={{ backgroundColor: tableWrapperBg, height: '100%', overflowY: 'auto' }}>
            <table 
              className={`table-hover m-0 align-middle ${isDark ? 'table-dark' : ''}`}
              style={{ width: '100%', borderCollapse: 'collapse', color: tableText, backgroundColor: tableBg }}
            >
              <thead style={{ position: 'sticky', top: 0, backgroundColor: theadBg, zIndex: 1 }}>
                <tr style={{ backgroundColor: theadBg, borderBottom: `2px solid ${theadBorder}`, color: theadText, fontFamily: 'monospace', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 12px 12px 24px' }}>ID</th>
                  <th style={{ padding: '12px 12px 12px 19px' }}>Cliente</th>
                  <th style={{ padding: '12px 12px' }}>Contacto</th>
                  <th style={{ padding: '12px 12px' }}>Operador de Cierre</th> 
                  <th style={{ padding: '12px 24px 12px 12px' }}>Fecha Creación</th>
                  <th style={{ padding: '12px 24px 12px 12px' }}>Fecha de Entrega Estimada</th>
                  <th style={{ padding: '12px 24px 12px 12px' }}>Fecha de Entrega Final</th>  
                  <th className="text-center" style={{ padding: '12px 12px' }}>Estado Final</th>
                  <th style={{ padding: '12px 12px' }}>Monto Total</th>
                  <th style={{ padding: '12px 12px' }}>Monto Cobrado</th>
                  <th className="text-center" style={{ padding: '12px 8px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4 font-monospace">
                      Cargando historial de pedidos...
                    </td>
                  </tr>
                ) : pedidosOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4">
                      No se encontraron órdenes en el historial bajo estos filtros.
                    </td>
                  </tr>
                ) : (
                  pedidosOrdenados.map((pedido) => (
                    <FilaHistorial 
                      key={`historial-row-${pedido.id_pedido}`}
                      pedido={pedido}
                      onAbrirAuditoria={handleAbrirAuditoria}
                      onSelectTicket={setVerTicketPedido}
                      onSubirArchivo={handleSubirArchivoFisico}
                      onEliminarComprobante={handleEliminarComprobanteFisico}
                      onAbrirDevolucion={(p) => setPedidoDevolucion(p)}
                      onAbrirMermas={handleAbrirMermas}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center pt-1 pb-1 mt-auto">
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary px-4 py-2">Volver</button>
        </div>
      </div>

      {pedidoMermas && (
        <ModalHistorialMermas
          pedido={pedidoMermas}
          onClose={() => setPedidoMermas(null)}
        />
      )}

      {pedidoAuditoria && (
        <ModalAuditoriaPedido 
          pedido={pedidoAuditoria} 
          onClose={() => setPedidoAuditoria(null)}
          onAbrirCuentaCorriente={(cliente) => setClienteCuentaCorriente(cliente)}
          onVerTicket={(pedido, cobro) => setTicketPagoSeleccionado({ pedido, movimiento: cobro })}
        />
      )}

      {ticketPagoSeleccionado && (
        <VistaTicketPagoModal 
          pedido={ticketPagoSeleccionado.pedido}
          movimiento={ticketPagoSeleccionado.movimiento}
          onClose={() => setTicketPagoSeleccionado(null)}
        />
      )}

      {clienteCuentaCorriente && (
        <CuentaCorrienteModal 
          cliente={clienteCuentaCorriente}
          onCerrar={() => setClienteCuentaCorriente(null)}
          onActualizar={() => {}}
        />
      )}

      {verTicketPedido && (
        <VistaTicketModal 
          pedido={verTicketPedido}
          onClose={() => setVerTicketPedido(null)}
        />
      )}

      {pedidoDevolucion && (
        <ModalDevolucionPedido 
          pedido={pedidoDevolucion}
          isDark={isDark}
          mutedText={mutedText}
          onClose={() => setPedidoDevolucion(null)}
          onProcesar={handleProcesarDevolucion}
        />
      )}

      {suceso.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-white text-center" 
              style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px', fontFamily: 'monospace' }}
            >
              <i className={`bi ${suceso.tipo === 'exito' ? 'bi-check-circle' : 'bi-exclamation-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">{suceso.titulo}</h5>
              <p className="small" style={{ color: grayText }}>{suceso.mensaje}</p>
              <button 
                className={`btn ${suceso.tipo === 'exito' ? 'btn-success' : 'btn-danger'} btn-sm px-4 mt-3 fw-bold`}
                style={{ borderRadius: '6px' }}
                onClick={() => {
                  setSuceso({ ...suceso, show: false });
                  if (suceso.tipo === 'exito') {
                    recargarHistorial();
                  }
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};