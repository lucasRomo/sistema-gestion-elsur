import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { cajaService } from '../services/cajaService';
import { VistaTicketPagoModal } from '../../../components/modals/VistaTicketPagoModal';
import type { MovimientoCaja } from '../types/caja';
import { formatearMonto } from '../../../utils/formato';

// Detalle de movimientos del turno con "Ver comprobante" y "Ver ticket". Lo usan el arqueo
// automático y el cierre de turno: antes el cierre tenía su propia tabla sin esas acciones.

interface Props {
  movimientos: MovimientoCaja[];
  /** Color del borde del visor de comprobantes (el del modal que lo contiene). */
  colorAcento: string;
  alturaMaxima?: string;
}

export const TablaMovimientosArqueo: React.FC<Props> = ({ movimientos, colorAcento, alturaMaxima = '320px' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const modalBg = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const cardBorder = isDark ? '#3f3f46' : '#e2e8f0';
  const textMuted = isDark ? '#a1a1aa' : '#475569';

  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<string | null>(null);
  const [comprobanteBlobUrl, setComprobanteBlobUrl] = useState<string | null>(null);
  const [cargandoComprobante, setCargandoComprobante] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState<{ pedido: any; movimiento: any } | null>(null);

  useEffect(() => {
    let urlCreada: string | null = null;

    if (comprobanteSeleccionado) {
      setCargandoComprobante(true);
      cajaService.obtenerBlobComprobante(comprobanteSeleccionado)
        .then((blobUrl) => {
          urlCreada = blobUrl;
          setComprobanteBlobUrl(blobUrl);
        })
        .catch((err) => {
          console.error('Error al cargar comprobante:', err);
          setComprobanteBlobUrl(null);
        })
        .finally(() => setCargandoComprobante(false));
    } else {
      setComprobanteBlobUrl(null);
    }

    return () => {
      if (urlCreada) URL.revokeObjectURL(urlCreada);
    };
  }, [comprobanteSeleccionado]);

  const handleVerTicket = async (m: any) => {
    const idPedidoRaw = m.pedido?.idPedido || m.pedido?.id_pedido || (m.descripcion?.includes('Pedido #') ? m.descripcion.split('#')[1]?.trim() : null);

    if (idPedidoRaw && !isNaN(Number(idPedidoRaw))) {
      const idPedido = Number(idPedidoRaw);

      try {
        const pedidoCompleto = await cajaService.obtenerPedidoPorId(idPedido);
        if (pedidoCompleto) {
          setTicketSeleccionado({ pedido: pedidoCompleto, movimiento: m });
          return;
        }
      } catch (errService) {
        console.error("Error al obtener pedido mediante cajaService:", errService);
      }
    }

    const pedidoAdaptado = {
      id_pedido: idPedidoRaw || '-',
      cliente: {
        persona: null,
        razon_social: m.categoria === 'INSUMOS' ? 'Compra Insumos / Proveedor' : 'Consumidor Final',
        nombre: m.categoria === 'INSUMOS' ? 'Compra Insumos / Proveedor' : 'Consumidor Final'
      },
      monto_total: m.monto,
      observaciones: m.descripcion || 'Movimiento registrado en caja'
    };

    setTicketSeleccionado({ pedido: pedidoAdaptado, movimiento: m });
  };

  return (
    <>
      <div className="table-responsive rounded-3" style={{ maxHeight: alturaMaxima, minHeight: '180px', overflowY: 'auto', border: `1px solid ${cardBorder}` }}>
        <table
          className="table table-sm table-hover m-0 text-center align-middle"
          style={{
            backgroundColor: 'transparent',
            '--bs-table-bg': 'transparent',
            '--bs-table-hover-bg': isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            color: textColor,
            borderColor: cardBorder
          } as React.CSSProperties}
        >
          <thead style={{ position: 'sticky', top: 0, backgroundColor: modalBg, zIndex: 1 }}>
            <tr className="text-muted small" style={{ backgroundColor: modalBg }}>
              <th style={{ backgroundColor: modalBg, color: textMuted }}>Hora</th>
              <th style={{ backgroundColor: modalBg, color: textMuted }}>Monto</th>
              <th style={{ backgroundColor: modalBg, color: textMuted }}>Método</th>
              <th style={{ backgroundColor: modalBg, color: textMuted }}>Tipo</th>
              <th className="text-start" style={{ backgroundColor: modalBg, color: textMuted }}>Descripción</th>
              <th style={{ backgroundColor: modalBg, color: textMuted }}>Acciones</th>
            </tr>
          </thead>
          <tbody className="small">
            {movimientos.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-3 text-muted" style={{ backgroundColor: 'transparent' }}>
                  No hay movimientos registrados en este turno
                </td>
              </tr>
            ) : (
              movimientos.map((m: any) => {
                const rawUrl = m.comprobanteImagen || m.comprobante || m.imagenComprobante || m.comprobante_imagen || m.imagen_comprobante || m.urlComprobante || m.url_comprobante;

                return (
                  <tr key={m.id_movimiento || m.idMovimiento} style={{ borderColor: cardBorder }}>
                    <td style={{ backgroundColor: 'transparent', color: textColor }}>
                      {new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="fw-bold" style={{ backgroundColor: 'transparent', color: textColor }}>
                      ${formatearMonto(Number(m.monto))}
                    </td>
                    <td style={{ backgroundColor: 'transparent' }}>
                      <span className="badge bg-secondary">
                        {m.metodoPago || 'Efectivo'}
                      </span>
                    </td>
                    <td style={{ backgroundColor: 'transparent' }}>
                      <span
                        className="d-inline-block px-2 py-1 rounded fw-semibold"
                        style={{
                          backgroundColor: m.tipoMovimiento === 'INGRESO' ? '#1c9b4a' : '#ef4444',
                          color: '#ffffff',
                          border: `1px solid ${m.tipoMovimiento === 'INGRESO' ? '#1c9b4a' : '#ef4444'}`,
                          fontSize: '0.60rem'
                        }}
                      >
                        {m.tipoMovimiento === 'INGRESO' ? 'Ganancia' : 'Egreso'}
                      </span>
                    </td>
                    <td className="text-start text-truncate" style={{ maxWidth: '180px', backgroundColor: 'transparent', color: textColor }}>
                      {m.descripcion || '-'}
                    </td>
                    <td style={{ backgroundColor: 'transparent' }}>
                      <div className="d-flex justify-content-center align-items-center gap-1">
                        {rawUrl ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info p-0 px-2 text-info-custom"
                            title="Ver Comprobante Adjunto"
                            onClick={() => setComprobanteSeleccionado(rawUrl)}
                          >
                            <i className="bi bi-file-image"></i>
                          </button>
                        ) : (
                          <span className="text-muted opacity-50">-</span>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info p-0 px-2 text-info-custom"
                          title="Ver Ticket de Comprobante"
                          onClick={() => handleVerTicket(m)}
                        >
                          <i className="bi bi-receipt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {comprobanteSeleccionado && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1080 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content p-3" style={{ backgroundColor: modalBg, color: textColor, border: `2px solid ${colorAcento}` }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold m-0"><i className="bi bi-image me-2"></i>Comprobante de Transferencia</h6>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setComprobanteSeleccionado(null)}></button>
              </div>
              <div className="text-center p-2">
                {cargandoComprobante ? (
                  <p className="opacity-50 py-4 m-0">Cargando comprobante...</p>
                ) : comprobanteBlobUrl ? (
                  <img src={comprobanteBlobUrl} alt="Comprobante Transferencia" className="img-fluid rounded shadow" style={{ maxHeight: '70vh', objectFit: 'contain' }} />
                ) : (
                  <p className="text-danger py-4 m-0">No se pudo cargar el comprobante.</p>
                )}
              </div>
              <div className="text-end mt-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setComprobanteSeleccionado(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {ticketSeleccionado && (
        <VistaTicketPagoModal
          pedido={ticketSeleccionado.pedido}
          movimiento={ticketSeleccionado.movimiento}
          onClose={() => setTicketSeleccionado(null)}
          esVentaRapida={!ticketSeleccionado.pedido.id_pedido || ticketSeleccionado.pedido.id_pedido === '-'}
        />
      )}
    </>
  );
};
