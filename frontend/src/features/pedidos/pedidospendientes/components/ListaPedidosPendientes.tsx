import React from 'react';
import { TarjetaPedido } from './TarjetaPedido';

interface ListaPedidosPendientesProps {
  cargando: boolean;
  pedidos: any[];
  empleados: any[];
  onCambioEstado: (pedido: any, estadoDestino: string) => void;
  onCambioUbicacion: (idPedido: number, nuevaUbicacion: string) => void;
  onSelectPago: (pedido: any) => void;
  onSelectTicket: (pedido: any) => void;
  onSubirArchivo: (idPedido: number, file: File) => void;
  onEliminarComprobante: (idPedido: number) => void;
  onCambioEmpleado: (idPedido: number, idEmpleado: string) => void;
  onSelectComprobantes: (pedido: any) => void;
  onGestionarMermas: (pedido: any) => void;
}

export const ListaPedidosPendientes: React.FC<ListaPedidosPendientesProps> = ({
  cargando,
  pedidos,
  empleados,
  onCambioEstado,
  onCambioUbicacion,
  onSelectPago,
  onSelectTicket,
  onSubirArchivo,
  onEliminarComprobante,
  onCambioEmpleado,
  onSelectComprobantes,
  onGestionarMermas
}) => {
  if (cargando) {
    return <div className="text-center py-5 font-monospace text-muted">Cargando Pedidos Pendientes...</div>;
  }

  if (pedidos.length === 0) {
    return <div className="text-center py-5 font-monospace text-muted">No se encontraron registros bajo este filtro.</div>;
  }

  return (
    <div className="d-flex flex-column gap-2">
      {pedidos.map((pedido) => (
        <div key={`pedido-card-${pedido.id_pedido}`} className="w-100">
          <TarjetaPedido
            pedido={pedido}
            onCambioEstado={onCambioEstado}
            onCambioUbicacion={onCambioUbicacion}
            onSelectPago={onSelectPago}
            onSelectTicket={onSelectTicket}
            onSubirArchivo={onSubirArchivo}
            onEliminarComprobante={onEliminarComprobante}
            empleados={empleados}
            onCambioEmpleado={onCambioEmpleado}
            onSelectComprobantes={onSelectComprobantes}
            onGestionarMermas={onGestionarMermas}
          />
        </div>
      ))}
    </div>
  );
};
