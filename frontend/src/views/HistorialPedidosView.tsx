import React, { useState } from 'react';
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
  
  // Estados para control de modales
  const [pedidoAuditoriaSel, setPedidoAuditoriaSel] = useState<any>(null);
  const [verTicketPedido, setVerTicketPedido] = useState<any>(null);

  // Filtros locales
  const [filtroCliente, setFiltroCliente] = useState('');
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

  // Filtrado de registros en memoria
  const pedidosFiltrados = pedidos.filter(p => {
    const nombreCliente = p.cliente?.persona 
      ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido}`
      : (p.cliente?.razon_social || p.cliente?.nombre || 'Consumidor Final');

    const cumpleCliente = nombreCliente.toLowerCase().includes(filtroCliente.toLowerCase());
    
    let cumpleEstado = true;
    if (filtroEstadoHistorial === 'ENTREGADO') {
      cumpleEstado = p.estado === 'ENTREGADO';
    } else if (filtroEstadoHistorial === 'CANCELADO') {
      cumpleEstado = p.estado === 'CANCELADO';
    } else {
      cumpleEstado = ['ENTREGADO', 'CANCELADO', 'FINALIZADO'].includes(p.estado);
    }

    return cumpleCliente && cumpleEstado;
  });

  return (
    <>
      <div className="container-fluid px-2">
        <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
          <h1 className="fw-bold tracking-tight">Historial de Pedidos</h1>
          <span className="badge bg-dark border border-secondary text-secondary font-monospace">Registros Históricos</span>
        </div>

        {/* Panel de Filtros Componentizado */}
        <FiltrosHistorial 
          filtroCliente={filtroCliente}
          setFiltroCliente={setFiltroCliente}
          filtroEstadoHistorial={filtroEstadoHistorial}
          setFiltroEstadoHistorial={setFiltroEstadoHistorial}
        />

        {/* Tabla del Historial */}
        <div className="table-responsive rounded border border-secondary" style={{ backgroundColor: '#161618' }}>
          <table className="table table-dark table-hover align-middle mb-0 small">
            <thead className="table-light text-uppercase font-monospace" style={{ fontSize: '0.8rem' }}>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
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