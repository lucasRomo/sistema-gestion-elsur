import React, { useState, useEffect, useRef } from 'react';
import type { Pedido, CartItem } from '../types/Pedido';
import { VistaTicketPagoModal } from '../../../components/modals/VistaTicketPagoModal';

interface Props {
  clientes: any[];
  empleados: any[]; 
  total: number;
  porcentajeDescuento?: number;
  carrito: CartItem[];
  onVolver: () => void;
  onGuardar: (payload: { pedido: Pedido; idEmpleado: number; tipoPago: string; fileComprobante?: File | null }) => void;
}

export const DetallesPedidoForm: React.FC<Props> = ({ 
  clientes, 
  empleados, 
  total, 
  porcentajeDescuento = 0,
  carrito, 
  onVolver, 
  onGuardar 
}) => {
  const [clienteId, setClienteId] = useState<string>('');
  const [empleadoId, setEmpleadoId] = useState<string>(''); 
  const [estado, setEstado] = useState('PENDIENTE');
  const [tipoPago, setTipoPago] = useState('Efectivo');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [montoEntregado, setMontoEntregado] = useState('0');
  const [observaciones, setObservaciones] = useState('');

  const [pedidosPorEmpleado, setPedidosPorEmpleado] = useState<Record<number, number>>({});

  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para mostrar el modal de vista previa del ticket
  const [mostrarPreviewTicket, setMostrarPreviewTicket] = useState(false);

  const empleadosActivos = empleados.filter((emp) => {
    const estadoEmp = String(emp.estado || '').toUpperCase();
    return estadoEmp === 'ACTIVO' || emp.estado === undefined;
  });

  useEffect(() => {
    const fetchPedidosPendientes = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/pedidos');
        if (response.ok) {
          const data = await response.json();
          const conteo: Record<number, number> = {};

          data.forEach((ped: any) => {
            const estadoUpper = String(ped.estado || '').toUpperCase();
            const estaPendiente = !['FINALIZADO', 'CANCELADO', 'ENTREGADO', 'PRESUPUESTO'].includes(estadoUpper);

            if (estaPendiente) {
              if (Array.isArray(ped.asignaciones) && ped.asignaciones.length > 0) {
                ped.asignaciones.forEach((asig: any) => {
                  const empId = asig.empleado?.idEmpleado ?? asig.empleado?.id_empleado ?? asig.idEmpleado;
                  if (empId) {
                    conteo[empId] = (conteo[empId] || 0) + 1;
                  }
                });
              } else if (ped.empleado) {
                const empId = ped.empleado.idEmpleado ?? ped.empleado.id_empleado ?? ped.empleado.id;
                if (empId) {
                  conteo[empId] = (conteo[empId] || 0) + 1;
                }
              }
            }
          });

          setPedidosPorEmpleado(conteo);
        }
      } catch (error) {
        console.error("Error al consultar carga de trabajo de empleados:", error);
      }
    };

    fetchPedidosPendientes();
  }, []);

  useEffect(() => {
    if (clientes && clientes.length > 0) {
      const primerCliente = clientes[0];
      const idEncontrado = primerCliente.id_cliente ?? primerCliente.idCliente ?? primerCliente.id ?? '';
      setClienteId(String(idEncontrado));
    }
  }, [clientes]);

  useEffect(() => {
    if (empleadosActivos && empleadosActivos.length > 0) {
      const primerEmpleado = empleadosActivos[0];
      const idEncontrado = primerEmpleado.id_empleado ?? primerEmpleado.idEmpleado ?? primerEmpleado.id ?? '';
      setEmpleadoId(String(idEncontrado));
    }
  }, [empleados]);

  useEffect(() => {
    if (estado === 'PRESUPUESTO') {
      setMontoEntregado('0');
      setComprobanteFile(null);
    }
  }, [estado]);

  useEffect(() => {
    if (tipoPago === 'Cuenta Corriente') {
      setMontoEntregado('0');
      setComprobanteFile(null);
    } else if (tipoPago !== 'Tarjeta / Transferencia') {
      setComprobanteFile(null);
    }
  }, [tipoPago]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setComprobanteFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setComprobanteFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteId || clienteId === '0') {
      alert("Por favor, seleccione un cliente válido de la lista.");
      return;
    }

    if (!empleadoId || empleadoId === '0') {
      alert("Por favor, seleccione un empleado válido para asignar el pedido.");
      return;
    }

    const detallesFormateados = carrito.map(item => ({
      producto: { idProducto: item.producto.idProducto! },
      cantidad: item.cantidad,
      precioUnitario: item.producto.precioBase,
      subtotal: item.subtotal
    }));

    const esPresupuesto = estado === 'PRESUPUESTO';
    const esCuentaCorriente = tipoPago === 'Cuenta Corriente';

    let fechaFinalEntrega: string;

    if (fechaEntrega) {
      fechaFinalEntrega = fechaEntrega.length === 16 ? `${fechaEntrega}:00` : fechaEntrega;
    } else {
      const ahorita = new Date();
      const anio = ahorita.getFullYear();
      const mes = String(ahorita.getMonth() + 1).padStart(2, '0');
      const dia = String(ahorita.getDate()).padStart(2, '0');
      const hora = String(ahorita.getHours()).padStart(2, '0');
      const min = String(ahorita.getMinutes()).padStart(2, '0');
      fechaFinalEntrega = `${anio}-${mes}-${dia}T${hora}:${min}:00`;
    }

    const textoDescuento = porcentajeDescuento > 0 ? ` [Descuento aplicado: ${porcentajeDescuento}%]` : '';

    const nuevoPedido: Pedido = {
      cliente: { id_cliente: Number(clienteId) },
      detalles: detallesFormateados,
      fecha_entrega_estimada: fechaFinalEntrega,
      estado: estado,
      monto_total: total,
      monto_pago_adelantado: Number(montoEntregado),
      observaciones: `${observaciones}${textoDescuento}`.trim(),
      es_cuenta_corriente: esCuentaCorriente,
      es_presupuesto: esPresupuesto,
    };

    const payloadFinal = {
      pedido: nuevoPedido,
      idEmpleado: Number(empleadoId),
      tipoPago: tipoPago, 
      fileComprobante: comprobanteFile 
    };

    onGuardar(payloadFinal);
  };

  return (
    <>
      <div className="card p-4 w-100 rounded" style={{ maxWidth: '1570px', backgroundColor: '#1b1b1b' }}>
        <h2 className="text-center mb-4 fw-bold">Configurar Parámetros del Comprobante</h2>
        
        <form onSubmit={handleSubmit} className="row g-3">
          {/* Selector de Cliente */}
          <div className="col-12">
            <label className="form-label small text-secondary fw-bold">Cliente:</label>
            <select 
              className="form-select" 
              value={clienteId} 
              onChange={(e) => setClienteId(e.target.value)}
              required
            >
              <option value="" disabled>-- Seleccione un Cliente --</option>  
              {clientes.map((c, index) => {
                const id = c.id_cliente ?? c.idCliente ?? c.id;
                const nombreCliente = c.persona 
                  ? `${c.persona.nombre} ${c.persona.apellido}`
                  : (c.razon_social || `Cliente #${id || index}`);

                return (
                  <option key={`cliente-opt-${id ?? index}`} value={id} style={{ backgroundColor: '#1b1b1b', color: '#fff' }}>
                    {nombreCliente}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Selector de Empleado */}
          <div className="col-12">
            <label className="form-label small text-secondary fw-bold">Empleado que Confecciona:</label>
            <select 
              className="form-select" 
              value={empleadoId} 
              onChange={(e) => setEmpleadoId(e.target.value)}
              required
            >
              <option value="" disabled style={{ backgroundColor: '#1b1b1b', color: '#fff' }}>-- Seleccione un Empleado --</option>
              {empleadosActivos.map((emp, index) => {
                const id = emp.id_empleado ?? emp.idEmpleado ?? emp.id;
                const nombreCompleto = emp.persona 
                  ? `${emp.persona.nombre} ${emp.persona.apellido}`
                  : `${emp.nombre || 'Empleado'} ${emp.apellido || id || index}`;
                  
                const cantPendientes = pedidosPorEmpleado[Number(id)] || 0;
                const textoPendientes = cantPendientes === 0 
                  ? 'Sin pedidos pendientes' 
                  : cantPendientes === 1 
                    ? '1 pedido pendiente' 
                    : `${cantPendientes} pedidos pendientes`;

                return (
                  <option key={`empleado-opt-${id ?? index}`} value={id} style={{ backgroundColor: '#1e1e1f', color: '#fff' }}>
                    {nombreCompleto} {emp.cargo ? `(${emp.cargo})` : ''} — [{textoPendientes}]
                  </option>
                );
              })} 
            </select>
          </div>

          {/* Estado y Método Comercial */}
          <div className="col-md-6">
            <label className="form-label small text-secondary fw-bold">Tipo / Estado de Registro:</label>
            <select className="form-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="PENDIENTE" style={{ backgroundColor: '#1e1e1f', color: '#fff' }}>PENDIENTE (A Producción)</option>
              <option value="EN PROCESO" style={{ backgroundColor: '#1e1e1f', color: '#fff' }}>EN PROCESO (Taller)</option>
              <option value="PRESUPUESTO" style={{ backgroundColor: '#1e1e1f', color: '#fff' }}>PRESUPUESTO (Solo Guardar)</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label small text-secondary fw-bold">Método Comercial:</label>
            <select 
              className="form-select" 
              value={tipoPago} 
              onChange={(e) => setTipoPago(e.target.value)}
              disabled={estado === 'PRESUPUESTO'}
            >
              <option value="Efectivo" style={{ backgroundColor: '#1e1e1f', color: '#fff' }}>Efectivo</option>
              <option value="Tarjeta / Transferencia" style={{ backgroundColor: '#1e1e1f', color: '#fff' }}>Tarjeta / Transferencia</option>
              <option value="Cuenta Corriente" style={{ backgroundColor: '#1e1e1f', color: '#fff' }}>Cuenta Corriente</option>
            </select>
          </div>

          {/* Fecha y Hora de Entrega Estimada */}
          <div className="col-12">
            <label className="form-label small fw-bold">
              Fecha y Hora de Entrega Estimada: {estado === 'PRESUPUESTO' && <span className="text-muted fw-normal">(Opcional para presupuestos)</span>}
            </label>
            <input 
              type="datetime-local" 
              className="form-control" 
              required={estado !== 'PRESUPUESTO'} 
              value={fechaEntrega} 
              onChange={(e) => setFechaEntrega(e.target.value)} 
            />
          </div>

          {/* Montos */}
          <div className="col-md-6">
            <label className="form-label small text-body-secondary fw-bold d-flex justify-content-between">
              <span>Monto Total Cotizado:</span>
              {porcentajeDescuento > 0 && (
                <span className="text-success font-monospace">({porcentajeDescuento}% OFF aplicado)</span>
              )}
            </label>
            <input 
              type="text" 
              className="form-control text-info fw-bold font-monospace fs-5" 
              readOnly 
              value={`$${total.toFixed(2)}`} 
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small text-secondary fw-bold">
              Seña / Adelanto Recibido: {tipoPago === 'Cuenta Corriente' && <span className="text-info">(Opcional para Cuenta Corriente)</span>}
            </label>
            <input 
              type="number" 
              className="form-control font-monospace" 
              value={montoEntregado} 
              onChange={(e) => setMontoEntregado(e.target.value)} 
              disabled={estado === 'PRESUPUESTO'}
            />
          </div>

          {/* Notas Internas */}
          <div className="col-12">
            <label className="form-label small text-secondary fw-bold">Instrucciones / Notas Internas:</label>
            <textarea 
              className="form-control" 
              rows={3} 
              placeholder="Detalles sobre materiales, medidas o aclaración de validez del presupuesto..." 
              value={observaciones} 
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

        {/* Botones Inferiores */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 w-100 pt-3">
          <button 
            type="button" 
            className="btn btn-secondary px-4 fw-semibold"
            onClick={onVolver}
          >
            <i className="bi me-1"></i> Volver al Carrito
          </button>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {tipoPago === 'Tarjeta / Transferencia' && estado !== 'PRESUPUESTO' && (
                <>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="d-none" 
                    accept="image/*,application/pdf" 
                    onChange={handleFileChange} 
                  />
                  
                  {!comprobanteFile ? (
                    <button
                      type="button"
                      className="btn btn-outline-info font-monospace d-flex align-items-center gap-2 px-3"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="bi bi-paperclip"></i> Adjuntar Comprobante
                    </button>
                  ) : (
                    <div className="d-flex align-items-center bg-dark border border-success rounded px-3 py-1 gap-2">
                      <span className="text-success small font-monospace text-truncate" style={{ maxWidth: '180px' }} title={comprobanteFile.name}>
                        <i className="bi bi-file-earmark-check me-1"></i> {comprobanteFile.name}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0 m-0 border-0"
                        onClick={handleRemoveFile}
                        title="Quitar comprobante"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Botón para Ver Ticket (solo habilitado si la seña es mayor a 0) */}
              <button 
                type="button"
                className="btn btn-outline-warning font-monospace d-flex align-items-center gap-2 px-3"
                disabled={Number(montoEntregado) <= 0 || isNaN(Number(montoEntregado))}
                onClick={() => setMostrarPreviewTicket(true)}
              >
                <i className="bi bi-receipt"></i> Ver Ticket de Seña
              </button>
            </div>

            <button 
              type="submit" 
              className="btn btn-success px-4 fw-bold" 
              style={{ backgroundColor: '#288f47', border: 'none' }}
            >
              {estado === 'PRESUPUESTO' ? 'Guardar Presupuesto' : 'Confirmar Pedido'} <i className="bi bi-check-lg ms-1"></i>
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Vista Previa del Ticket */}
      {mostrarPreviewTicket && (
        <VistaTicketPagoModal 
          pedido={{
            cliente: clientes.find(c => String(c.id_cliente ?? c.idCliente ?? c.id) === clienteId) || { id_cliente: Number(clienteId) },
            detalles: carrito.map(item => ({
              producto: { idProducto: item.producto.idProducto! },
              cantidad: item.cantidad,
              precioUnitario: item.producto.precioBase,
              subtotal: item.subtotal
            })),
            fecha_entrega_estimada: fechaEntrega || new Date().toISOString(),
            estado: estado,
            monto_total: total,
            monto_pago_adelantado: Number(montoEntregado),
            observaciones: observaciones,
            es_cuenta_corriente: tipoPago === 'Cuenta Corriente',
            es_presupuesto: estado === 'PRESUPUESTO',
          }}
          movimiento={{
            monto: Number(montoEntregado),
            tipoMovimiento: 'ENTRADA',
            descripcion: `Seña / Adelanto - Pedido (${tipoPago})`,
            metodoPago: tipoPago
          }}
          onClose={() => setMostrarPreviewTicket(false)}
        />
      )}
    </>
  );
};