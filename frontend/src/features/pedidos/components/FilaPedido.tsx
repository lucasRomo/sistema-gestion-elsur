import React, { useState } from 'react';
import { ContadorTiempo } from './ContadorTiempo';

interface FilaPedidoProps {
  pedido: any;
  empleados: any[];
  onCambioEstado: (pedido: any, estadoDestino: string) => void;
  onCambioUbicacion?: (idPedido: number, nuevaUbicacion: string) => void;
  onSelectPago: (pedido: any) => void;
  onSelectTicket: (pedido: any) => void;
  onSubirArchivo: (idPedido: number, file: File) => void;
  onEliminarComprobante: (idPedido: number) => void;
  onCambioEmpleado: (idPedido: number, idEmpleado: string) => void;
  onSelectComprobantes: (pedido: any) => void;
}

export const FilaPedido: React.FC<FilaPedidoProps> = ({
  pedido: p,
  empleados: e,
  onCambioEstado,
  onCambioUbicacion,
  onCambioEmpleado,
  onSelectPago,
  onSelectTicket,
  onSelectComprobantes
}) => {
  const [mostrarObsModal, setMostrarObsModal] = useState(false);

  // Cálculo de Nombre del Cliente
  const nombreCliente = p.cliente?.persona 
    ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido}`
    : (p.cliente?.razon_social || p.cliente?.nombre || 'Consumidor Final');

  // Cálculos de Asignaciones
  const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0
  ? p.asignaciones[p.asignaciones.length - 1]
  : null;

  const nombreEmpleado = ultimaAsignacion?.empleado?.persona
    ? `${ultimaAsignacion.empleado.persona.nombre} ${ultimaAsignacion.empleado.persona.apellido}`
    : (ultimaAsignacion?.empleado?.nombre ?? 'Sin Asignar');

  const formatearFechaString = (fechaIso: string | null | undefined, incluirHora = true) => {
    if (!fechaIso) return '-';
    const [fecha, horaCompleta] = fechaIso.split('T');
    if (!fecha) return fechaIso;

    const [anio, mes, dia] = fecha.split('-');
    if (!horaCompleta || !incluirHora) return `${dia}/${mes}/${anio}`;

    const [hhStr, mm] = horaCompleta.split('.')[0].split(':');
    let hh = parseInt(hhStr, 10);
    const ampm = hh >= 12 ? 'p. m.' : 'a. m.';
    hh = hh % 12 || 12;
    const hhFormat = hh < 10 ? `0${hh}` : `${hh}`;

    return `${dia}/${mes}/${anio}, ${hhFormat}:${mm} ${ampm}`;
  };

  // Formateo de Fechas
  const fechaCreacionRaw = p.fecha_creacion || ultimaAsignacion?.fecha_asignacion;
  const fechaCreacionFormateada = formatearFechaString(fechaCreacionRaw, true);
  const fechaEntregaFormateada = formatearFechaString(p.fecha_entrega_estimada, true);

  return (
    <>
      <tr style={{ borderBottom: '1px solid #1d1d1d', backgroundColor: '#1d1d1d', transition: 'background-color 0.2s'}}
       onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
       onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1d1d1d'}>
        <td style={{ padding: '10px 2px 12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', color: '#00d2ff', fontFamily: 'monospace', fontWeight: 'bold', height: '100%'}} className="fw-bold text-info">
          #{p.id_pedido}
        </td>

        {/* CLIENTE */}
        <td>
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold text-white">{nombreCliente}</span>
            {p.observaciones && p.observaciones.trim() !== '' && (
              <button 
                className="btn btn-link p-0 text-warning border-0 d-flex align-items-center"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
                onClick={() => setMostrarObsModal(true)}
                title="Ver observaciones del pedido"
              >
                <i className="bi bi-chat-left-text-fill fs-6"></i>
              </button>
            )}
          </div>
        </td>

        {/* ESTANTE / UBICACIÓN */}
        <td>
          {p.estado === 'PRESUPUESTO' ? (
            <span className="badge bg-black text-warning border border-warning-subtle font-monospace">
              Cotización
            </span>
          ) : (
            <select
              className="form-select form-select-sm bg-black text-warning border-warning-subtle font-monospace"
              style={{ width: '115px', fontSize: '0.80rem', cursor: 'pointer' }}
              value={p.ubicacion_estante || 'Taller'}
              onChange={(e) => onCambioUbicacion && onCambioUbicacion(p.id_pedido, e.target.value)}
            >
              <option value="Taller">Taller</option>
              <option value="Mostrador">Mostrador</option>
            </select>
          )}
        </td>

        {/* CONTACTO */}
        <td>
          <div className="d-flex gap-1">
            {p.cliente?.persona?.telefono && (
              <a href={`https://wa.me/${p.cliente.persona.telefono}`} target="_blank" rel="noreferrer" className="btn btn-sm text-success p-1">
                <i className="bi bi-whatsapp fs-5"></i>
              </a>
            )}
            {p.cliente?.persona?.email && (
              <a href={`mailto:${p.cliente.persona.email}`} className="btn btn-sm text-danger p-1">
                <i className="bi bi-envelope fs-5"></i>
              </a>
            )}
          </div>
        </td>

        {/* EMPLEADO ASIGNADO */}
        <td>
          <select 
            className="form-select form-select-sm bg-black text-light border-secondary font-monospace"
            style={{ width: '160px', fontSize: '0.85rem', cursor: 'pointer' }}
            value={
              ultimaAsignacion?.empleado?.idEmpleado || 
              ultimaAsignacion?.empleado?.id_empleado || 
              ''
            }
            onChange={(e) => onCambioEmpleado(p.id_pedido, e.target.value)}
          >
            <option value="" disabled>
              {nombreEmpleado !== 'Sin Asignar' ? nombreEmpleado : 'Seleccionar Operario'}
            </option>
            {e && e.map((emp) => {
              const idEmp = emp.idEmpleado || emp.id_empleado;
              const nombreEmp = emp.persona 
                ? `${emp.persona.nombre} ${emp.persona.apellido}` 
                : (emp.nombre || `Empleado #${idEmp}`);

              return (
                <option key={`emp-opt-${idEmp}`} value={idEmp}>
                  {nombreEmp}
                </option>
              );
            })}
          </select>
        </td>

        {/* FECHA ASIGNACIÓN */}
        <td className="font-monospace" style={{ color: '#a9a9aa', fontSize: '0.82rem' }}>
          {fechaCreacionFormateada}
        </td>

        {/* ENTREGA ESTIMADA + CONTADOR (Unificados en la misma celda) */}
        <td className="font-monospace" style={{ fontSize: '0.82rem' }}>
          <div className="d-flex flex-column align-items-start gap-1">
            <span className="text-warning fw-semibold">
              {fechaEntregaFormateada}
            </span>
            <ContadorTiempo fechaEstimadaIso={p.fecha_entrega_estimada} />
          </div>
        </td>

        {/* ESTADO */}
        <td>
          <select 
            className="form-select form-select-sm bg-black text-white border-secondary font-monospace"
            style={{ width: '145px', border: p.estado === 'PRESUPUESTO' ? '1px solid #ffc107' : '' }}
            value={p.estado}
            onChange={(e) => onCambioEstado(p, e.target.value)}
          >
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="EN PROCESO">EN PROCESO</option>
            <option value="FINALIZADO">FINALIZADO</option>
            <option value="ENTREGADO">ENTREGADO ➔</option>
            <option value="PAUSADO">PAUSADO</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>
        </td>

        {/* MONTO TOTAL */}
        <td className="fw-bold">${Number(p.monto_total).toFixed(2)}</td>

        {/* MONTO ABONADO */}
        <td className="text-info">${Number(p.monto_pago_adelantado).toFixed(2)}</td>

        {/* ACCIONES */}
        <td>
          <div className="d-flex justify-content-center gap-3 align-items-center">  
            {/* Botón Comprobantes */}
            <button 
              className="rounded d-flex align-items-center justify-content-center" 
              style={{ 
                width: '32px', 
                height: '32px', 
                cursor: 'pointer', 
                backgroundColor: 'transparent', 
                transition: 'all 0.2s ease',
                border: '1px solid #00d2ff'
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.backgroundColor = '#00d2ff';
                const icon = e.currentTarget.querySelector('i') as HTMLElement;
                if (icon) icon.style.color = '#000000';
              }} 
              onMouseLeave={(e) => { 
                e.currentTarget.style.backgroundColor = 'transparent';
                const icon = e.currentTarget.querySelector('i') as HTMLElement;
                if (icon) icon.style.color = '#00d2ff'; 
              }}
              onClick={() => onSelectComprobantes(p)} 
              title="Gestionar Comprobantes de Pago"
            >
              <i className="bi bi-file-earmark-text" style={{ fontSize: '16px', color: '#00d2ff', transition: '0.2s' }}></i>
            </button>

            {/* Botón de Pagos */}
            <button 
              className="rounded d-flex align-items-center justify-content-center" 
              style={{ 
                width: '32px', 
                height: '32px', 
                cursor: 'pointer', 
                backgroundColor: 'transparent', 
                transition: 'all 0.2s ease',
                border: `0.8px solid ${p.es_cuenta_corriente ? '#6b7280' : (p.monto_pago_adelantado >= p.monto_total || p.estado === 'PRESUPUESTO' ? '#22c55e' : '#a72828')}`
              }}
              onMouseEnter={(e) => { 
                if (p.es_cuenta_corriente) {
                  e.currentTarget.style.backgroundColor = '#374151'; // Un gris sutil al pasar el mouse
                  return;
                }
                const isLocked = (p.monto_pago_adelantado >= p.monto_total || p.estado === 'PRESUPUESTO'); 
                e.currentTarget.style.backgroundColor = isLocked ? '#22c55e' : '#a72828';
                const icon = e.currentTarget.querySelector('i') as HTMLElement;
                if (icon) icon.style.color = '#000000';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.backgroundColor = 'transparent';
                if (p.es_cuenta_corriente) return;
                const isLocked = (p.monto_pago_adelantado >= p.monto_total || p.estado === 'PRESUPUESTO');
                const icon = e.currentTarget.querySelector('i') as HTMLElement;
                if (icon) icon.style.color = isLocked ? '#22c55e' : '#a72828'; 
              }}
              onClick={() => onSelectPago(p)}
              title={p.es_cuenta_corriente ? "Pago vinculado a Cuenta Corriente" : (p.monto_pago_adelantado >= p.monto_total || p.estado === 'PRESUPUESTO' ? "Ya no quedaron mas Señas/Montos por Asignar" : "Registrar Nuevo Monto/Seña")}
            >
              <i className="bi bi-currency-dollar" style={{ fontSize: '16px', color: p.es_cuenta_corriente ? '#6b7280' : ((p.monto_pago_adelantado >= p.monto_total || p.estado === 'PRESUPUESTO') ? '#22c55e' : '#a72828'), transition: '0.2s' }}></i>
            </button>

            {/* Botón Impresión Ticket */}
            <button 
              className="rounded d-flex align-items-center justify-content-center" 
              style={{ width: '32px', height: '32px', cursor: 'pointer', backgroundColor: 'transparent', transition: 'all 0.2s ease', border: '0.8px solid #ffc107'}}
              onMouseEnter={(e) => { 
                e.currentTarget.style.backgroundColor = '#ffc107';
                const icon = e.currentTarget.querySelector('i') as HTMLElement;
                if (icon) icon.style.color = '#000000'; 
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.backgroundColor = 'transparent';
                const icon = e.currentTarget.querySelector('i') as HTMLElement; 
                if (icon) icon.style.color = '#ffc107'; 
              }}
              onClick={() => onSelectTicket(p)}
              title="Imprimir Ticket"
            >
              <i className="bi bi-printer" style={{ fontSize: '16px', color: '#ffc107', transition: '0.2s' }}></i>
            </button>
          </div>
        </td>
      </tr>

      {/* Modal para Observaciones */}
      {mostrarObsModal && (
        <div 
          className="modal d-block" 
          tabIndex={-1} 
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1055 }}
          onClick={() => setMostrarObsModal(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content bg-dark text-white border border-warning shadow-lg">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title font-monospace text-warning d-flex align-items-center gap-2">
                  <i className="bi bi-chat-left-text-fill"></i> Observaciones - Pedido #{p.id_pedido}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setMostrarObsModal(false)}
                ></button>
              </div>
              <div className="modal-body font-monospace" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#e4e4e7' }}>
                {p.observaciones}
              </div>
              <div className="modal-footer border-top border-secondary">
                <button 
                  type="button" 
                  className="btn btn-outline-warning font-monospace" 
                  onClick={() => setMostrarObsModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};