import React from 'react';
import { AvisoValidacionModal } from '../modals/AvisoValidacionModal';
import { VistaTicketPagoModal } from '../../../components/modals/VistaTicketPagoModal';
import { ModalCargaIA } from '../modals/ModalCargaIA';
import type { ItemCompraInsumo } from '../types/compraInsumos';

interface CompraInsumosModalesProps {
  modalIaAbierto: boolean;
  onCerrarModalIa: () => void;
  onConfirmarItemsIa: (nuevosItems: ItemCompraInsumo[]) => void;
  insumos: any[];
  productos: any[];
  unidadesMedida: any[];

  avisoModal: string | null;
  onCerrarAviso: () => void;

  ticketSeleccionado: { pedido: any; movimiento: any } | null;
  onCerrarTicket: () => void;

  isDark: boolean;
  cardBg: string;
  cardBorder: string;
  textColor: string;
}

export const CompraInsumosModales: React.FC<CompraInsumosModalesProps> = ({
  modalIaAbierto,
  onCerrarModalIa,
  onConfirmarItemsIa,
  insumos,
  productos,
  unidadesMedida,
  avisoModal,
  onCerrarAviso,
  ticketSeleccionado,
  onCerrarTicket,
  isDark,
  cardBg,
  cardBorder,
  textColor
}) => {
  return (
    <>
      <ModalCargaIA
        isOpen={modalIaAbierto}
        onClose={onCerrarModalIa}
        onConfirmarItems={onConfirmarItemsIa}
        insumos={insumos}
        productos={productos}
        unidadesMedida={unidadesMedida}
        isDark={isDark}
        cardBg={cardBg}
        cardBorder={cardBorder}
        textColor={textColor}
      />

      {avisoModal && (
        <AvisoValidacionModal
          mensaje={avisoModal}
          onClose={onCerrarAviso}
          isDark={isDark}
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
        />
      )}

      {ticketSeleccionado && (
        <VistaTicketPagoModal
          pedido={ticketSeleccionado.pedido}
          movimiento={ticketSeleccionado.movimiento}
          onClose={onCerrarTicket}
          esVentaRapida={true}
        />
      )}
    </>
  );
};
