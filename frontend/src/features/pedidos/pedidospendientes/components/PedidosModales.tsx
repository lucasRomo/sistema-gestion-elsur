import React from 'react';

import { SuccesModal } from '../../../../components/layouts/SuccesModal';
import { CuentaCorrienteModal } from '../../../clientes/components/CuentaCorrienteModal';
import { VistaTicketPagoModal } from '../../../../components/modals/VistaTicketPagoModal';

import { ModalCambioEstado } from '../modals/ModalCambioEstado';
import { ModalRegistrarPago } from '../modals/ModalRegistrarPago';
import { ModalGestionarComprobantes } from '../modals/ModalGestionarComprobantes';
import { ModalAdvertenciaDeuda } from '../modals/ModalAdvertenciaDeuda';
import { VistaTicketModal } from '../../general/modals/VistaTicketModal';
import { ModalGestionMermas } from '../modals/ModalGestionMermas';
import { ModalErrorStock } from '../../general/modals/ModalErrorStock';
import { ModalConfirmarDesvincular } from '../modals/ModalConfirmarDesvincular';
import { ModalAvisoCuentaCorriente } from '../modals/ModalAvisoCuentaCorriente';
import { ModalSuceso } from './ModalSuceso';

interface ModalAdvertenciaDeudaData {
  show: boolean;
  pedido: any;
  nuevoEstado: string;
  observaciones: string;
  saldoPendiente: number;
  deudaPrevia: number;
  deudaTotal: number;
  limiteCredito: number;
}

interface SucesoState {
  show: boolean;
  titulo: string;
  mensaje: string;
  tipo: string;
}

interface SucesoErrorState {
  show: boolean;
  mensaje: string;
  titulo?: string;
}

interface ModalNotifState {
  show: boolean;
  msg: string;
}

interface ConfirmarDesvincularState {
  show: boolean;
  idComprobante: number | null;
}

interface ModalAvisoCuentaCorrienteState {
  show: boolean;
  pedido: any | null;
}

interface PedidosModalesProps {
  pedidoEstadoSel: any;
  nuevoEstadoPendiente: string;
  onCerrarCambioEstado: () => void;
  onConfirmarCambioEstado: (observaciones: string) => void;

  modalAdvertenciaDeuda: ModalAdvertenciaDeudaData;
  onCerrarAdvertenciaDeuda: () => void;
  onActualizarYEntregar: (nuevoLimite: number) => void;
  onAutorizarUnaVez: () => void;
  onRegistrarCobro: (pedido: any) => void;

  pedidoPagoSel: any;
  onCerrarPago: () => void;
  onConfirmarPago: (tipoPago: string, monto: number, archivo: File | null) => void;

  verTicketPedido: any;
  onCerrarTicket: () => void;

  ticketPagoSel: { pedido: any; movimiento?: any } | null;
  onCerrarTicketPago: () => void;

  pedidoGestionComprobanteSel: any;
  onCerrarGestionComprobantes: () => void;
  onVincularComprobante: (idComprobante: number, archivo: File) => void;
  onEliminarComprobanteDigital: (idComprobante: number) => Promise<void>;
  onVerTicketDesdeComprobante: (pedido: any, cobro: any) => void;

  pedidoMermaSel: any;
  onCerrarMerma: () => void;
  onConfirmarMerma: () => void;

  sucesoError: SucesoErrorState;
  onCerrarError: () => void;

  confirmarDesvincular: ConfirmarDesvincularState;
  onCerrarConfirmarDesvincular: () => void;
  onConfirmarEliminarComprobante: () => void;

  modalAvisoCuentaCorriente: ModalAvisoCuentaCorrienteState;
  isDarkMode: boolean;
  onRevisarCuenta: () => void;
  onAbonarPedido: () => void;
  onCerrarAvisoCuentaCorriente: () => void;

  clienteCuentaCorriente: any;
  onCerrarCuentaCorriente: () => void;

  modalNotif: ModalNotifState;
  onCerrarModalNotif: () => void;

  suceso: SucesoState;
  onCerrarSuceso: () => void;
}

export const PedidosModales: React.FC<PedidosModalesProps> = ({
  pedidoEstadoSel,
  nuevoEstadoPendiente,
  onCerrarCambioEstado,
  onConfirmarCambioEstado,
  modalAdvertenciaDeuda,
  onCerrarAdvertenciaDeuda,
  onActualizarYEntregar,
  onAutorizarUnaVez,
  onRegistrarCobro,
  pedidoPagoSel,
  onCerrarPago,
  onConfirmarPago,
  verTicketPedido,
  onCerrarTicket,
  ticketPagoSel,
  onCerrarTicketPago,
  pedidoGestionComprobanteSel,
  onCerrarGestionComprobantes,
  onVincularComprobante,
  onEliminarComprobanteDigital,
  onVerTicketDesdeComprobante,
  pedidoMermaSel,
  onCerrarMerma,
  onConfirmarMerma,
  sucesoError,
  onCerrarError,
  confirmarDesvincular,
  onCerrarConfirmarDesvincular,
  onConfirmarEliminarComprobante,
  modalAvisoCuentaCorriente,
  isDarkMode,
  onRevisarCuenta,
  onAbonarPedido,
  onCerrarAvisoCuentaCorriente,
  clienteCuentaCorriente,
  onCerrarCuentaCorriente,
  modalNotif,
  onCerrarModalNotif,
  suceso,
  onCerrarSuceso
}) => {
  return (
    <>
      {pedidoEstadoSel && (
        <ModalCambioEstado
          pedido={pedidoEstadoSel}
          nuevoEstado={nuevoEstadoPendiente}
          onClose={onCerrarCambioEstado}
          onConfirm={onConfirmarCambioEstado}
        />
      )}

      <ModalAdvertenciaDeuda
        data={modalAdvertenciaDeuda}
        onClose={onCerrarAdvertenciaDeuda}
        onActualizarYEntregar={onActualizarYEntregar}
        onAutorizarUnaVez={onAutorizarUnaVez}
        onRegistrarCobro={onRegistrarCobro}
      />

      {pedidoPagoSel && (
        <ModalRegistrarPago
          show={true}
          pedido={pedidoPagoSel}
          onClose={onCerrarPago}
          onConfirm={onConfirmarPago}
        />
      )}

      {verTicketPedido && (
        <VistaTicketModal
          pedido={verTicketPedido}
          onClose={onCerrarTicket}
        />
      )}

      {ticketPagoSel && (
        <VistaTicketPagoModal
          pedido={ticketPagoSel.pedido}
          movimiento={ticketPagoSel.movimiento}
          onClose={onCerrarTicketPago}
        />
      )}

      {pedidoGestionComprobanteSel && (
        <ModalGestionarComprobantes
          pedido={pedidoGestionComprobanteSel}
          onClose={onCerrarGestionComprobantes}
          onVincularComprobante={onVincularComprobante}
          onEliminarComprobante={onEliminarComprobanteDigital}
          onVerTicket={onVerTicketDesdeComprobante}
        />
      )}

      {pedidoMermaSel && (
        <ModalGestionMermas
          pedido={pedidoMermaSel}
          onClose={onCerrarMerma}
          onConfirm={onConfirmarMerma}
        />
      )}

      <ModalErrorStock
        show={sucesoError.show}
        mensaje={sucesoError.mensaje}
        titulo={sucesoError.titulo}
        onClose={onCerrarError}
      />

      <ModalConfirmarDesvincular
        show={confirmarDesvincular.show}
        onClose={onCerrarConfirmarDesvincular}
        onConfirm={onConfirmarEliminarComprobante}
      />

      <ModalAvisoCuentaCorriente
        show={modalAvisoCuentaCorriente.show}
        isDarkMode={isDarkMode}
        onRevisarCuenta={onRevisarCuenta}
        onAbonarPedido={onAbonarPedido}
        onClose={onCerrarAvisoCuentaCorriente}
      />

      {clienteCuentaCorriente && (
        <CuentaCorrienteModal
          cliente={clienteCuentaCorriente}
          onCerrar={onCerrarCuentaCorriente}
          onActualizar={() => {}}
        />
      )}

      {modalNotif.show && (
        <SuccesModal
          show={modalNotif.show}
          message={modalNotif.msg}
          onClose={onCerrarModalNotif}
        />
      )}

      <ModalSuceso
        show={suceso.show}
        titulo={suceso.titulo}
        mensaje={suceso.mensaje}
        tipo={suceso.tipo}
        onClose={onCerrarSuceso}
      />
    </>
  );
};
