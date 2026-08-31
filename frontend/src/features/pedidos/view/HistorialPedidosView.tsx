import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Layout global
import { SidebarLayout } from '../../../components/layouts/SidebarLayout';

// Hooks y Servicios
import { useHistorialPedidos } from '../hooks/useHistorialPedidos';
import { historialPedidoService } from '../service/historialPedidoService';
import { useTheme } from '../../../Context/ThemeContext';
import { useIsMobile } from '../../../hook/useIsMobile';

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
  const isMobile = useIsMobile();

  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const mainCardBg = isDark ? '#1d1d1d' : '#ffffff';
  const cardBorder = isDark ? '#27272a' : '#cbd5e1';
  const grayText = isDark ? '#a1a1aa' : '#64748b';
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : '#64748b';
  
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
      <div className="container-fluid px-0 h-100 d-flex flex-column font-monospace" style={{ color: textColor }}>
        
        {/* Encabezado Superior */}
        <div className="d-flex justify-content-center align-items-center mb-4 position-relative d-print-none">
          <h2 className="fw-bold fs-2 m-0 text-center font-monospace" style={{ color: titleColor }}>
            Historial de Pedidos
          </h2>
          {!isMobile && (
            <span className="badge bg-dark border border-secondary text-secondary font-monospace position-absolute end-0">
              Registros Históricos
            </span>
          )}
        </div>

        {/* Componente Filtros */}
        <FiltrosHistorial 
          filtroTexto={filtroTexto}
          setFiltroTexto={setFiltroTexto}
          filtroEstadoHistorial={filtroEstadoHistorial}
          setFiltroEstadoHistorial={setFiltroEstadoHistorial}
        />

        {/* Contenedor Único de Tabla con Scroll Interno (65.3vh) */}
        <div 
          className="rounded-3 border mb-3 font-monospace" 
          style={{ 
            backgroundColor: mainCardBg, 
            borderColor: cardBorder,
            height: '65.3vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'block'
          }}
        >
          <table 
            className="table-hover m-0 align-middle w-100"
            style={{ 
              borderCollapse: 'collapse', 
              color: textColor, 
              backgroundColor: mainCardBg 
            }}
          >
            <thead style={{ position: 'sticky', top: 0, backgroundColor: mainCardBg, zIndex: 1 }}>
              <tr style={{ backgroundColor: mainCardBg, borderBottom: `2px solid ${cardBorder}`, color: isDark ? '#f8f8f8' : '#334155', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <th className="py-3 px-3 text-center" style={{ width: '6%' }}>ID</th>
                <th className="py-3 px-3 text-start" style={{ width: '16%' }}>Cliente</th>
                <th className="py-3 px-3 text-center" style={{ width: '8%' }}>Contacto</th>
                <th className="py-3 px-3 text-start" style={{ width: '14%' }}>Operador Cierre</th> 
                <th className="py-3 px-3 text-center" style={{ width: '10%' }}>Fecha Creación</th>
                <th className="py-3 px-3 text-center" style={{ width: '10%' }}>Entrega Estimada</th>
                <th className="py-3 px-3 text-center" style={{ width: '10%' }}>Entrega Final</th>  
                <th className="py-3 px-3 text-center" style={{ width: '8%' }}>Estado Final</th>
                <th className="py-3 px-3 text-center" style={{ width: '8%' }}>Total</th>
                <th className="py-3 px-3 text-center" style={{ width: '8%' }}>Cobrado</th>
                <th className="py-3 px-3 text-center" style={{ width: '10%' }}>Acciones</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '0.9rem' }}>
              {cargando ? (
                <tr>
                  <td colSpan={11} className="text-center py-5 border-0" style={{ color: textColor }}>
                    <i className="bi bi-arrow-repeat spin display-6 d-block mb-2"></i>
                    Cargando historial de pedidos...
                  </td>
                </tr>
              ) : pedidosOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-5 border-0" style={{ color: textColor }}>
                    <i className="bi bi-inbox display-5 d-block mb-2 opacity-50"></i>
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

        {/* Botonera Inferior */}
        <div className={`d-flex align-items-center mt-3 mb-4 font-monospace ${isMobile ? 'justify-content-stretch' : 'justify-content-between'}`}>
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

      {/* Modales Complementarios */}
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
        <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-center shadow-lg" 
              style={{ 
                border: `2px solid ${isDark ? '#8e45e0' : '#a855f7'}`, 
                backgroundColor: isDark ? '#1a1a1c' : '#ffffff', 
                color: isDark ? '#ffffff' : '#0f172a',
                borderRadius: '12px' 
              }}
            >
              <i className={`bi ${suceso.tipo === 'exito' ? 'bi-check-circle' : 'bi-exclamation-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">{suceso.titulo}</h5>
              <p className="small m-0" style={{ color: grayText }}>{suceso.mensaje}</p>
              <button 
                className={`btn ${suceso.tipo === 'exito' ? 'btn-success' : 'btn-danger'} btn-sm px-4 mt-3 fw-bold text-white`}
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