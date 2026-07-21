import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { useHistorialPedidos } from '../hooks/useHistorialPedidos';
import { pedidoService } from '../services/pedidoService';

// Componentes Modularizados
import { FiltrosHistorial } from '../features/historial/components/FiltrosHistorial';
import { FilaHistorial } from '../features/historial/components/FilaHistorial';
import { ModalAuditoriaPedido } from '../features/pedidos/ModalAuditoriaPedido';
import { VistaTicketModal } from '../features/pedidos/VistaTicketModal';

export const HistorialPedidosPage: React.FC = () => {
  const { pedidos, cargando, recargarHistorial } = useHistorialPedidos();
  const navigate = useNavigate();
  
  // Estados para control de modales
  const [pedidoAuditoriaSel, setPedidoAuditoriaSel] = useState<any>(null);
  const [verTicketPedido, setVerTicketPedido] = useState<any>(null);

  // Filtro unificado de búsqueda general y estado histórico
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstadoHistorial, setFiltroEstadoHistorial] = useState('TODOS');

  // Traer los datos completos del pedido con sus historiales y cobros
  const handleAbrirAuditoria = async (idPedido: number) => {
    try {
      const pedidoCompleto = await pedidoService.obtenerPorId(idPedido);
      if (pedidoCompleto) {
        setPedidoAuditoriaSel(pedidoCompleto);
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
      const ok = await pedidoService.subirComprobanteFisico(idPedido, file);
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
      const ok = await pedidoService.eliminarComprobanteFisico(idPedido);
      if (ok) {
        alert('Comprobante eliminado con éxito.');
        recargarHistorial();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Filtrado de registros en memoria (Buscador unificado de tres campos)
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

    const fechaCierre = p.fecha_modificacion || ultimaAsignacion?.fecha_asignacion;
    let fechaFormateadaParaBuscar = '';
    
    if (fechaCierre) {
      const objetoFecha = new Date(fechaCierre);
      const fechaLocal = objetoFecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const fechaISO = objetoFecha.toISOString().split('T')[0];
      fechaFormateadaParaBuscar = `${fechaLocal} ${fechaISO}`; 
    }

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
      cumpleEstado = ['ENTREGADO', 'CANCELADO', 'FINALIZADO'].includes(p.estado);
    }

    return cumpleBusquedaGeneral && cumpleEstado;
  });

  return (
    <SidebarLayout activeItem="Historial de Pedidos">
      {/* Contenedor adaptado para ocupar el 100% real sin desbordar el viewport */}
      <div 
        className="container-fluid px-2 d-flex flex-column pt-3" 
        style={{ height: 'calc(100vh - 45px)', overflow: 'hidden' }}
      >
        
        {/* Título Principal */}
        <div className="d-flex justify-content-between align-items-center mb-2 d-print-none">
          <h1 className="fw-bold tracking-tight text-white m-0" style={{ fontSize: '1.85rem' }}>
            Historial de Pedidos
          </h1>
          <span className="badge bg-dark border border-secondary text-secondary font-monospace">
            Registros Históricos
          </span>
        </div>

        {/* Panel de Filtros Componentizado */}
        <div className="mt-3 mb-3">
          <FiltrosHistorial 
            filtroTexto={filtroTexto}
            setFiltroTexto={setFiltroTexto}
            filtroEstadoHistorial={filtroEstadoHistorial}
            setFiltroEstadoHistorial={setFiltroEstadoHistorial}
          />
        </div>

        {/* Tabla del Historial con Scroll Interno y Alto Dinámico */}
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
              {/* thead con sticky top */}
              <thead 
                style={{ position: 'sticky', top: 0, backgroundColor: '#1d1d1d', zIndex: 1 }}
              >
                <tr style={{ backgroundColor: '#1d1d1d', borderBottom: '2px solid #27272a', color: '#a1a1aa', fontFamily: 'monospace', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 12px 12px 24px' }}>ID</th>
                  <th style={{ padding: '12px 12px 12px 19px' }}>Cliente</th>
                  <th>Contacto</th>
                  <th>Operador de Cierre</th> 
                  <th>Fecha de Cierre</th>  
                  <th className="text-center">Estado Final</th>
                  <th>Monto Total</th>
                  <th>Monto Cobrado</th>
                  <th className="text-center">Auditoría / Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted font-monospace">
                      Buscando registros históricos en PostgreSQL...
                    </td>
                  </tr>
                ) : pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      No se encontraron órdenes en el historial bajo estos filtros.
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map((pedido) => (
                    <FilaHistorial 
                      key={`historial-row-${pedido.id_pedido}`}
                      pedido={pedido}
                      onAbrirAuditoria={handleAbrirAuditoria}
                      onSelectTicket={setVerTicketPedido}
                      onSubirArchivo={handleSubirArchivoFisico}
                      onEliminarComprobante={handleEliminarComprobanteFisico}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botón Volver - Ajustado abajo al límite de la pantalla */}
        <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center pt-2 border-top border-secondary pb-1 mt-auto">
          <button onClick={() => navigate('/dashboard')} className="btn btn-danger px-4 py-2">Volver</button>
        </div>
      </div>

      {/* RENDERIZADO DE MODALES DE AUDITORÍA Y TICKET */}
      {pedidoAuditoriaSel && (
        <ModalAuditoriaPedido 
          pedido={pedidoAuditoriaSel}
          onClose={() => setPedidoAuditoriaSel(null)}
        />
      )}

      {verTicketPedido && (
        <VistaTicketModal 
          pedido={verTicketPedido}
          onClose={() => setVerTicketPedido(null)}
        />
      )}
    </>
  );
};