import React from 'react';

interface FilaPedidoProps {
  pedido: any;
  onCambioEstado: (pedido: any, estadoDestino: string) => void;
  onSelectPago: (pedido: any) => void;
  onSelectTicket: (pedido: any) => void;
  onSubirArchivo: (idPedido: number, file: File) => void;
  onEliminarComprobante: (idPedido: number) => void;
}

export const FilaPedido: React.FC<FilaPedidoProps> = ({
  pedido: p,
  onCambioEstado,
  onSelectPago,
  onSelectTicket,
  onSubirArchivo,
  onEliminarComprobante
}) => {
  
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

  const fechaAsignacionFormateada = ultimaAsignacion?.fecha_asignacion
    ? new Date(ultimaAsignacion.fecha_asignacion).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

  // Validación de documentos
  const tieneComprobante = p.comprobantes && p.comprobantes.length > 0;
  const urlUltimoComprobante = tieneComprobante 
    ? p.comprobantes[p.comprobantes.length - 1].urlArchivoComprobante 
    : null;

  // Lógica de color de saldo ($)
  const getColorSignoPesos = (total: number, adelantado: number) => {
    if (adelantado === 0) return 'text-secondary';
    if (adelantado < total) return 'text-danger';
    return 'text-success';
  };

  return (
    <tr className="border-bottom border-dark">
      <td className="fw-bold text-info">#{p.id_pedido}</td>
      <td>
        <div className="fw-semibold text-white">{nombreCliente}</div>
        {p.observaciones && (
          <small className="text-warning d-block font-monospace bg-black p-1 rounded mt-1 border-start border-warning border-2" style={{ fontSize: '0.78rem' }}>
            <strong>Obs:</strong> {p.observaciones}
          </small>
        )}
      </td>
      <td>
        <span className="badge bg-black text-warning border border-warning-subtle font-monospace">
          {p.estado === 'PRESUPUESTO' ? 'Cotización' : (p.ubicacion_estante || 'Taller')}
        </span>
      </td>
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
      <td>
        <span className="text-light">
          <i className="bi bi-person-badge text-secondary me-1"></i>
          {nombreEmpleado}
        </span>
      </td>
      <td className="font-monospace text-secondary" style={{ fontSize: '0.82rem' }}>
        {fechaAsignacionFormateada}
      </td>
      <td>
        <select 
          className="form-select form-select-sm bg-black text-white border-secondary font-monospace"
          style={{ width: '145px', border: p.estado === 'PRESUPUESTO' ? '1px solid #ffc107' : '' }}
          value={p.estado}
          onChange={(e) => onCambioEstado(p, e.target.value)}
        >
          <option value="PRESUPUESTO">PRESUPUESTO</option>
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="EN PROCESO">EN PROCESO</option>
          <option value="PAUSADO">PAUSADO</option>
          <option value="CANCELADO">CANCELADO</option>
          <option value="FINALIZADO">FINALIZADO</option>
          <option value="ENTREGADO">ENTREGADO ➔</option>
        </select>
      </td>
      <td className="fw-bold">${Number(p.monto_total).toFixed(2)}</td>
      <td className="text-info">${Number(p.monto_pago_adelantado).toFixed(2)}</td>
      <td>
        <div className="d-flex justify-content-center gap-3 align-items-center">
          
          {/* Lógica de visualización del archivo adjunto */}
          {tieneComprobante && urlUltimoComprobante ? (
            <div className="d-flex gap-2 align-items-center">
              <button 
                className="btn btn-sm p-0 text-info" 
                title="Ver archivo de comprobante físico"
                onClick={() => window.open(urlUltimoComprobante, '_blank')}
              >
                <i className="bi bi-eye-fill fs-5"></i>
              </button>
              <button 
                className="btn btn-sm p-0 text-danger" 
                title="Eliminar Comprobante Físico"
                onClick={() => onEliminarComprobante(p.id_pedido)}
              >
                <i className="bi bi-trash-fill fs-5"></i>
              </button>
            </div>
          ) : (
            <div className="position-relative">
              <label 
                htmlFor={`file-input-${p.id_pedido}`} 
                className="btn btn-sm p-0 text-light opacity-50 m-0 d-flex align-items-center" 
                style={{ cursor: 'pointer' }}
                title="Seleccionar archivo o arrastrar comprobante"
              >
                <i className="bi bi-cloud-upload-fill fs-5"></i>
              </label>
              <input 
                id={`file-input-${p.id_pedido}`}
                type="file" 
                className="d-none"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onSubirArchivo(p.id_pedido, e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          {/* Botón de Pagos */}
          <button 
            className={`btn btn-sm border-0 bg-transparent p-0 transition-all ${getColorSignoPesos(p.monto_total, p.monto_pago_adelantado)}`} 
            title="Registrar Entrega de Dinero / Saldo"
            onClick={() => onSelectPago(p)}
            disabled={p.monto_pago_adelantado >= p.monto_total || p.estado === 'PRESUPUESTO'}
          >
            <i className="bi bi-currency-dollar fs-4"></i>
          </button>

          {/* Botón de Impresión de Tickets */}
          <button 
            className="btn btn-sm p-0 text-warning" 
            title="Imprimir Comprobante de Entrega"
            onClick={() => onSelectTicket(p)}
          >
            <i className="bi bi-printer fs-5"></i>
          </button>
        </div>
      </td>
    </tr>
  );
};