import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SidebarLayout } from '../../../../components/layouts/SidebarLayout';

import { useTheme } from '../../../../Context/ThemeContext';
import { useIsMobile } from '../../../../hook/useIsMobile';

import { useHistorialPedidos } from '../hooks/useHistorialPedidos';
import { historialPedidoService } from '../service/historialPedidoService';

import { FiltrosHistorial } from '../components/FiltrosHistorial';
import { FilaHistorial } from '../components/FilaHistorial';

import { ModalAuditoriaPedido } from '../modals/ModalAuditoriaPedido';
import { VistaTicketModal } from '../../general/modals/VistaTicketModal';
import { ModalHistorialMermas } from '../modals/ModalHistorialMermas';
import { ModalDevolucionPedido } from '../modals/ModalDevolucionPedido';

import { VistaTicketPagoModal } from '../../../../components/modals/VistaTicketPagoModal';
import { CuentaCorrienteModal } from '../../../clientes/components/CuentaCorrienteModal';
import { mostrarError } from '../../../../config/dialogStore';
import { SkeletonFilasTabla } from '../../../../components/common/SkeletonCarga';

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

  const navigate = useNavigate();

  const [pedidoAuditoria, setPedidoAuditoria] = useState<any>(null);
  const [clienteCuentaCorriente, setClienteCuentaCorriente] = useState<any>(null);
  const [verTicketPedido, setVerTicketPedido] = useState<any>(null);
  const [ticketPagoSeleccionado, setTicketPagoSeleccionado] = useState<{ pedido: any; movimiento: any } | null>(null);
  const [pedidoMermas, setPedidoMermas] = useState<any>(null);

  const [pedidoDevolucion, setPedidoDevolucion] = useState<any>(null);
  const [avisoDevolucion, setAvisoDevolucion] = useState<{ show: boolean; titulo: string; mensaje: string; irACrear: boolean }>({
    show: false,
    titulo: '',
    mensaje: '',
    irACrear: false
  });

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstadoHistorial, setFiltroEstadoHistorial] = useState('TODOS');
  const { pedidos, cargando, cargandoMas, hayMas, total, cargarMas, recargarHistorial } =
    useHistorialPedidos(filtroTexto, filtroEstadoHistorial);

  const [suceso, setSuceso] = useState<{ show: boolean; titulo: string; mensaje: string; tipo: string }>({
    show: false,
    titulo: '',
    mensaje: '',
    tipo: 'exito'
  });

  const handleAbrirMermas = async (pedido: any) => {
    setPedidoMermas(pedido);
  };

  const handleAbrirAuditoria = async (idPedido: number) => {
    try {
      const pedidoCompleto = await historialPedidoService.obtenerPorId(idPedido);
      if (pedidoCompleto) {
        setPedidoAuditoria(pedidoCompleto);
      } else {
        mostrarError('No se pudo obtener el historial detallado de este pedido.');
      }
    } catch (error) {
      console.error('Error al conectar con la API de auditoría:', error);
      mostrarError('Error de red al intentar buscar el historial.');
    }
  };

  const handleAbrirDevolucion = (pedido: any) => {
    const estado = (pedido?.estado || '').toUpperCase();
    if (estado === 'CANCELADO') {
      setAvisoDevolucion({
        show: true,
        titulo: 'Pedido Cancelado',
        mensaje: `El pedido #${pedido.id_pedido} fue cancelado y no puede ser devuelto. Por favor, registre uno nuevo en Crear Pedido.`,
        irACrear: true
      });
      return;
    }
    if (estado === 'DEVUELTO') {
      setAvisoDevolucion({
        show: true,
        titulo: 'Pedido ya Devuelto',
        mensaje: `El pedido #${pedido.id_pedido} ya fue marcado como devuelto y no puede procesarse nuevamente.`,
        irACrear: false
      });
      return;
    }
    setPedidoDevolucion(pedido);
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

  // Ya vienen filtrados y ordenados (más recientes primero) desde el backend.
  const pedidosOrdenados = pedidos;

  return (
    <SidebarLayout activeItem="Historial de Pedidos">
      <div className="container-fluid px-0 h-100 d-flex flex-column font-monospace" style={{ color: textColor }}>

        <div className="d-flex justify-content-center align-items-center mb-4 position-relative d-print-none">
          <h2 className="fw-bold fs-2 m-0 text-center font-monospace" style={{ color: titleColor }}>
            Historial de Pedidos
          </h2>
        </div>

        <FiltrosHistorial
          filtroTexto={filtroTexto}
          setFiltroTexto={setFiltroTexto}
          filtroEstadoHistorial={filtroEstadoHistorial}
          setFiltroEstadoHistorial={setFiltroEstadoHistorial}
        />

        <div
          className="rounded-3 border mb-3 font-monospace"
          style={{
            backgroundColor: mainCardBg,
            borderColor: cardBorder,
            height: 'clamp(260px, calc(100vh - 290px), 65.3vh)', // en monitores grandes sigue siendo 65.3vh; en notebooks deja lugar a los botones de abajo
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
                <SkeletonFilasTabla columnas={11} filas={8} />
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
                    onAbrirDevolucion={handleAbrirDevolucion}
                    onAbrirMermas={handleAbrirMermas}
                  />
                ))
              )}
            </tbody>
          </table>
          {!cargando && pedidosOrdenados.length > 0 && (
            <div className="d-flex flex-column align-items-center gap-2 py-3 font-monospace" style={{ color: grayText, fontSize: '0.8rem' }}>
              <span>Mostrando {pedidosOrdenados.length} de {total} pedidos</span>
              {hayMas && (
                <button className="btn btn-sm fw-bold px-4" style={{ backgroundColor: '#8e45e0', color: '#ffffff' }} onClick={cargarMas} disabled={cargandoMas}>
                  {cargandoMas ? 'Cargando...' : 'Cargar más'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className={`d-flex align-items-center mt-3 mb-4 font-monospace ${isMobile ? 'justify-content-stretch' : 'justify-content-between'}`}>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary fw-bold shadow-sm font-monospace d-inline-flex align-items-center justify-content-center"
            style={{
              color: '#ffffff',
              padding: '0.7rem clamp(0.75rem, 1.1vw, 1.4rem)',
              fontSize: '1rem',
              minWidth: '5.5rem'
            }}
          >
            Volver
          </button>
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

      {avisoDevolucion.show && (
        <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
            <div
              className="modal-content p-4 text-center shadow-lg"
              style={{
                border: `2px solid ${isDark ? '#8e45e0' : '#a855f7'}`,
                backgroundColor: isDark ? '#1a1a1c' : '#ffffff',
                color: isDark ? '#ffffff' : '#0f172a',
                borderRadius: '12px'
              }}
            >
              <i className="bi bi-x-octagon fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">{avisoDevolucion.titulo}</h5>
              <p className="small m-0" style={{ color: grayText }}>{avisoDevolucion.mensaje}</p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button
                  className="btn btn-secondary btn-sm px-4 fw-bold text-white"
                  style={{ borderRadius: '6px' }}
                  onClick={() => setAvisoDevolucion({ show: false, titulo: '', mensaje: '', irACrear: false })}
                >
                  Cerrar
                </button>
                {avisoDevolucion.irACrear && (
                  <button
                    className="btn btn-success btn-sm px-4 fw-bold text-white"
                    style={{ borderRadius: '6px' }}
                    onClick={() => navigate('/crear-pedido')}
                  >
                    Ir a Crear Pedido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
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