import React, { useState } from 'react';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { usePedidosPendientes } from '../hooks/usePedidosPendientes';
import { pedidoService } from '../services/pedidoService';

// Importación de Componentes Extraídos e Internos
import { FiltrosPedidos } from '../features/pedidos/components/FiltrosPedidos';
import { FilaPedido } from '../features/pedidos/components/FilaPedido';
import { ModalCambioEstado } from '../features/pedidos/ModalCambioEstado';
import { ModalRegistrarPago } from '../features/pedidos/ModalRegistrarPago';
import { VistaTicketModal } from '../features/pedidos/VistaTicketModal';

export const PedidosPendientesPage: React.FC = () => {
  const { pedidos, cargando, actualizarEstado, registrarPago } = usePedidosPendientes();
  
  // Controles de Modales
  const [pedidoEstadoSel, setPedidoEstadoSel] = useState<any>(null);
  const [nuevoEstadoPendiente, setNuevoEstadoPendiente] = useState<string>('');
  const [pedidoPagoSel, setPedidoPagoSel] = useState<any>(null);
  const [verTicketPedido, setVerTicketPedido] = useState<any>(null);

  // Filtros de búsqueda estatales
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Handlers de Controladores
  const handleCambioEstadoCombo = (pedido: any, estadoDestino: string) => {
    setPedidoEstadoSel(pedido);
    setNuevoEstadoPendiente(estadoDestino);
  };

  const confirmarCambioEstado = async (observaciones: string) => {
    if (!pedidoEstadoSel) return;
    const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
    
    await actualizarEstado(
      pedidoEstadoSel.id_pedido,
      nuevoEstadoPendiente,
      pedidoEstadoSel.estado,
      observaciones,
      userLogueado.id_usuario || 1
    );
    
    setPedidoEstadoSel(null);
    setNuevoEstadoPendiente('');
  };

  const confirmarPago = async (tipoPago: string, monto: number, urlComprobante: string) => {
    if (!pedidoPagoSel) return;
    // Acordate que en la sección anterior sincronizamos que envíe 'montoPago' a la API
    await registrarPago(pedidoPagoSel.id_pedido, tipoPago, monto, urlComprobante);
    setPedidoPagoSel(null);
  };

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

  // Filtrado lógico en memoria reactivo
  const pedidosFiltrados = pedidos.filter(p => {
    const nombreCliente = p.cliente?.persona 
      ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido}`
      : (p.cliente?.razon_social || p.cliente?.nombre || 'Consumidor Final');

    const cumpleCliente = nombreCliente.toLowerCase().includes(filtroCliente.toLowerCase());
    
    if (filtroEstado === 'PRESUPUESTO') {
      if (p.estado !== 'PRESUPUESTO') return false;
    } else {
      if (p.estado === 'PRESUPUESTO') return false;
      if (filtroEstado !== '' && p.estado !== filtroEstado) return false;
    }
    return cumpleCliente;
  });

  return (
    <>
      <div className="container-fluid px-2">
        <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
          <h1 className="fw-bold tracking-tight">
            {filtroEstado === 'PRESUPUESTO' ? 'Presupuestos / Cotizaciones' : 'Cola de Producción Taller'}
          </h1>
          <span className="badge bg-dark border border-info text-info font-monospace">Datos en Tiempo Real</span>
        </div>

        {/* Panel de Filtros Componentizado */}
        <FiltrosPedidos 
          filtroCliente={filtroCliente}
          setFiltroCliente={setFiltroCliente}
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
        />

        {/* Tabla Principal */}
        <div className="table-responsive rounded border border-secondary d-print-none" style={{ backgroundColor: '#161618' }}>
          <table className="table table-dark table-hover align-middle mb-0 small">
            <thead className="table-light text-uppercase font-monospace" style={{ fontSize: '0.8rem' }}>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Estante</th>
                <th>Contacto</th>
                <th>Empleado Asignado</th> 
                <th>Fecha Asignación</th>  
                <th>Estado</th>
                <th>Monto Total</th>
                <th>Monto Abonado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={10} className="text-center py-4 text-muted font-monospace">
                    Consultando la base de datos PostgreSQL...
                  </td>
                </tr>
              ) : pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-4 text-muted">
                    No se encontraron registros bajo este filtro.
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((pedido) => (
                  <FilaPedido 
                    key={`pedido-row-${pedido.id_pedido}`}
                    pedido={pedido}
                    onCambioEstado={handleCambioEstadoCombo}
                    onSelectPago={setPedidoPagoSel}
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

      {/* Renderizado Condicional de Modales */}
      {pedidoEstadoSel && (
        <ModalCambioEstado 
          pedido={pedidoEstadoSel}
          nuevoEstado={nuevoEstadoPendiente}
          onClose={() => { setPedidoEstadoSel(null); setNuevoEstadoPendiente(''); }}
          onConfirm={confirmarCambioEstado}
        />
      )}

      {pedidoPagoSel && (
        <ModalRegistrarPago 
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
    </>
  );
};