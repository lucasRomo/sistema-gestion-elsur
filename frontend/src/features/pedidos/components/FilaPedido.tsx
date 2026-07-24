import React from 'react';

interface FilaPedidoProps {
  pedido: any;
  empleados: any[];
  onCambioEstado: (pedido: any, estadoDestino: string) => void;
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
  onCambioEmpleado,
  onSelectPago,
  onSelectTicket,
  onSubirArchivo,
  onEliminarComprobante,
  onSelectComprobantes
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
  const urlUltimoComprobante = (() => {
    // 1. Buscamos primero en el array de comprobantes directos del pedido
    if (p.comprobantes && p.comprobantes.length > 0) {
      const ultimo = p.comprobantes[p.comprobantes.length - 1];
      if (ultimo?.urlArchivoComprobante) return ultimo.urlArchivoComprobante;
    }
    
    // 2. Si no hay, buscamos en los pagos/adelantos asociados al pedido
    if (p.pagos && p.pagos.length > 0) {
      // Buscamos el último pago que tenga un campo 'urlComprobante' o similar no vacío
      const pagosConComprobante = p.pagos.filter((pago: any) => pago.urlComprobante || pago.urlArchivoComprobante);
      if (pagosConComprobante.length > 0) {
        const ultimoPago = pagosConComprobante[pagosConComprobante.length - 1];
        return ultimoPago.urlComprobante || ultimoPago.urlArchivoComprobante;
      }
    }
    
    return null;
  })();

  const tieneComprobante = urlUltimoComprobante !== null;

  return (
    <tr style={{ borderBottom: '1px solid #1d1d1d', backgroundColor: '#1d1d1d', transition: 'background-color 0.2s'}}
     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1d1d1d'}>
      <td style={{ padding: '10px 2px 12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start',  color: '#00d2ff', fontFamily: 'monospace', fontWeight: 'bold',height: '100%'}} className="fw-bold text-info">#{p.id_pedido}</td>
      <td>
        <div className="fw-semibold text-white">{nombreCliente}</div>
        {p.observaciones && (
          <small className="text-warning d-block font-monospace bg-black p-1 rounded mt-1 border-start border-warning border-2" style={{ fontSize: '0.80rem', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
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
      <select 
       className="form-select form-select-sm bg-black text-light border-secondary font-monospace"
       style={{ width: '160px', fontSize: '0.85rem', cursor: 'pointer' }}
       value={
       ultimaAsignacion?.empleado?.idEmpleado || 
       ultimaAsignacion?.empleado?.id_empleado || 
       ''}
       onChange={(e) => onCambioEmpleado(p.id_pedido, e.target.value)}>
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
      <td className="font-monospace" style={{ color: '#a9a9aa', fontSize: '0.82rem' }}>
        {fechaAsignacionFormateada}
      </td>
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
      <td className="fw-bold">${Number(p.monto_total).toFixed(2)}</td>
      <td className="text-info">${Number(p.monto_pago_adelantado).toFixed(2)}</td>
      <td>
        <div className="d-flex justify-content-center gap-3 align-items-center">  
          
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
          <button className="rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', cursor: 'pointer', backgroundColor: 'transparent', transition: 'all 0.2s ease',
           border: `0.8px solid ${p.monto_pago_adelantado >= p.monto_total || p.estado === 'PRESUPUESTO' ? '#22c55e' : '#a72828'}`, opacity: p.monto_pago_adelantado >= p.monto_total || p.estado === 'PRESUPUESTO' ? 0.5 : 1}}
           onMouseEnter={(e) => { const isLocked = (p.monto_pago_adelantado >= p.monto_total || p.estado === 'PRESUPUESTO'); e.currentTarget.style.backgroundColor = isLocked ? '#22c55e' : '#a72828';
           const icon = e.currentTarget.querySelector('i') as HTMLElement;
           if (icon) icon.style.color = '#000000';}}
           onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent';
           const isLocked = (p.monto_pago_adelantado >= p.monto_total || p.estado === 'PRESUPUESTO');
           const icon = e.currentTarget.querySelector('i') as HTMLElement;
           if (icon) icon.style.color = isLocked ? '#22c55e' : '#a72828'; }}
           onClick={() => onSelectPago(p)}
           title={p.monto_pago_adelantado >= p.monto_total || p.estado === 'PRESUPUESTO' ? "Ya no quedaron mas Señas/Montos por Asignar" : "Registrar Nuevo Monto/Seña"}
           disabled={p.monto_pago_adelantado >= p.monto_total || p.estado === 'PRESUPUESTO'}
          >
            <i className="bi bi-currency-dollar" style={{ fontSize: '16px', color: (p.monto_pago_adelantado >= p.monto_total || p.estado === 'PRESUPUESTO') ? '#22c55e' : '#a72828', transition: '0.2s' }}></i>
          </button>

          {/* Botón de Impresión de Tickets */}
          <button 
           className="rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', cursor: 'pointer', backgroundColor: 'transparent', transition: 'all 0.2s ease', border: '0.8px solid #ffc107'}}
           onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffc107';
           const icon = e.currentTarget.querySelector('i') as HTMLElement;
           if (icon) icon.style.color = '#000000'; }}
           onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent';
           const icon = e.currentTarget.querySelector('i') as HTMLElement; if (icon) icon.style.color = '#ffc107'; }}
           onClick={() => onSelectTicket(p)}
           title="Imprimir Ticket"
          >
            <i className="bi bi-printer" style={{ fontSize: '16px', color: '#ffc107', transition: '0.2s' }}></i>
          </button>
        </div>
      </td>
    </tr>
  );
};