import React, { useState, useEffect, useRef } from 'react';
import type { Pedido, CartItem } from '../../general/types/Pedido';
import { VistaTicketPagoModal } from '../../../../components/modals/VistaTicketPagoModal';

interface Props {
  clientes: any[];
  empleados: any[]; 
  total: number;
  porcentajeDescuento?: number;
  categoriaNombre?: string;
  carrito: CartItem[];
  onVolver: () => void;
  onGuardar: (payload: { pedido: Pedido; idEmpleado: number; tipoPago: string; fileComprobante?: File | null }) => void;
}

export const DetallesPedidoForm: React.FC<Props> = ({ 
  clientes, 
  empleados, 
  total, 
  porcentajeDescuento = 0,
  categoriaNombre = '',
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
  const [mostrarPreviewTicket, setMostrarPreviewTicket] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
                  if (empId) conteo[empId] = (conteo[empId] || 0) + 1;
                });
              } else if (ped.empleado) {
                const empId = ped.empleado.idEmpleado ?? ped.empleado.id_empleado ?? ped.empleado.id;
                if (empId) conteo[empId] = (conteo[empId] || 0) + 1;
              }
            }
          });

          setPedidosPorEmpleado(conteo);
        }
      } catch (error) {
        console.error("Error al consultar carga laboral:", error);
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
    if (estado === 'PRESUPUESTO' || tipoPago === 'Cuenta Corriente') {
      setMontoEntregado('0');
      setComprobanteFile(null);
    }
  }, [estado, tipoPago]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteId || clienteId === '0') {
      alert("Por favor, seleccione un cliente válido.");
      return;
    }

    if (!empleadoId || empleadoId === '0') {
      alert("Por favor, seleccione un empleado válido.");
      return;
    }

    const detallesFormateados = carrito.map(item => ({
      producto: { idProducto: item.producto.idProducto! },
      cantidad: item.cantidad,
      precioUnitario: item.producto.precioBase,
      subtotal: item.subtotal
    }));

    let fechaFinalEntrega: string;
    if (fechaEntrega) {
      fechaFinalEntrega = fechaEntrega.length === 16 ? `${fechaEntrega}:00` : fechaEntrega;
    } else {
      fechaFinalEntrega = new Date().toISOString().substring(0, 19);
    }

    const textoDescuento = porcentajeDescuento > 0 
      ? ` [Descuento aplicado: ${porcentajeDescuento}% - Cat: ${categoriaNombre}]` 
      : (categoriaNombre ? ` [Cat: ${categoriaNombre}]` : '');

    const nuevoPedido: Pedido = {
      cliente: { id_cliente: Number(clienteId) },
      detalles: detallesFormateados,
      fecha_creacion: new Date().toISOString().substring(0, 19),
      fecha_entrega_estimada: fechaFinalEntrega,
      estado: estado,
      monto_total: total,
      monto_pago_adelantado: Number(montoEntregado),
      observaciones: `${observaciones}${textoDescuento}`.trim(),
      es_cuenta_corriente: tipoPago === 'Cuenta Corriente',
      es_presupuesto: estado === 'PRESUPUESTO',
    };

    onGuardar({
      pedido: nuevoPedido,
      idEmpleado: Number(empleadoId),
      tipoPago: tipoPago, 
      fileComprobante: comprobanteFile 
    });
  };

  return (
    <>
      <div className="card p-4 w-100 rounded" style={{ maxWidth: '1570px', backgroundColor: '#1b1b1b', color: '#fff' }}>
        <h2 className="text-center mb-4 fw-bold">Configurar Parámetros del Comprobante</h2>
        
        <form onSubmit={handleSubmit} className="row g-3">
          <div className="col-12">
            <label className="form-label small text-secondary fw-bold">Cliente:</label>
            <select className="form-select bg-dark text-white border-secondary" value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
              <option value="" disabled>-- Seleccione un Cliente --</option>  
              {clientes.map((c, index) => {
                const id = c.id_cliente ?? c.idCliente ?? c.id;
                const nombreCliente = c.persona ? `${c.persona.nombre} ${c.persona.apellido}` : (c.razon_social || `Cliente #${id || index}`);
                return <option key={`cli-${id ?? index}`} value={id}>{nombreCliente}</option>;
              })}
            </select>
          </div>

          <div className="col-12">
            <label className="form-label small text-secondary fw-bold">Empleado que Confecciona:</label>
            <select className="form-select bg-dark text-white border-secondary" value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)} required>
              <option value="" disabled>-- Seleccione un Empleado --</option>
              {empleadosActivos.map((emp, index) => {
                const id = emp.id_empleado ?? emp.idEmpleado ?? emp.id;
                const nombreCompleto = emp.persona ? `${emp.persona.nombre} ${emp.persona.apellido}` : `${emp.nombre || 'Empleado'} ${emp.apellido || id || index}`;
                const cantPendientes = pedidosPorEmpleado[Number(id)] || 0;
                return (
                  <option key={`emp-${id ?? index}`} value={id}>
                    {nombreCompleto} {emp.cargo ? `(${emp.cargo})` : ''} — [{cantPendientes} pendientes]
                  </option>
                );
              })} 
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label small text-secondary fw-bold">Estado / Destino:</label>
            <select className="form-select bg-dark text-white border-secondary" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="PENDIENTE">PENDIENTE (A Producción)</option>
              <option value="EN PROCESO">EN PROCESO (Taller)</option>
              <option value="ENTREGADO">ENTREGADO (Terminado)</option>
              <option value="PRESUPUESTO">PRESUPUESTO (Solo Guardar)</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label small text-secondary fw-bold">Método Comercial:</label>
            <select className="form-select bg-dark text-white border-secondary" value={tipoPago} onChange={(e) => setTipoPago(e.target.value)} disabled={estado === 'PRESUPUESTO'}>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta / Transferencia">Tarjeta / Transferencia</option>
              <option value="Cuenta Corriente">Cuenta Corriente</option>
            </select>
          </div>

          <div className="col-12">
            <label className="form-label small fw-bold">Fecha y Hora Estimada de Entrega:</label>
            <input type="datetime-local" className="form-control bg-dark text-white border-secondary" required={estado !== 'PRESUPUESTO'} value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
          </div>

          <div className="col-md-6">
            <label className="form-label small text-secondary fw-bold">Monto Total Cotizado:</label>
            <input type="text" className="form-control text-info fw-bold font-monospace fs-5 bg-dark border-secondary" readOnly value={`$${total.toFixed(2)}`} />
          </div>

          <div className="col-md-6">
            <label className="form-label small text-secondary fw-bold">Seña / Adelanto Recibido:</label>
            <input type="number" className="form-control font-monospace bg-dark text-white border-secondary" value={montoEntregado} onChange={(e) => setMontoEntregado(e.target.value)} disabled={estado === 'PRESUPUESTO' || tipoPago === 'Cuenta Corriente'} />
          </div>

          <div className="col-12">
            <label className="form-label small text-secondary fw-bold">Instrucciones / Notas Internas:</label>
            <textarea className="form-control bg-dark text-white border-secondary" rows={3} placeholder="Detalles de diseño, impresión o entrega..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 w-100 pt-3 border-top border-secondary">
            <button type="button" className="btn btn-secondary px-4 fw-semibold" onClick={onVolver}>
              Volver al Carrito
            </button>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {tipoPago === 'Tarjeta / Transferencia' && estado !== 'PRESUPUESTO' && (
                <>
                  <input type="file" ref={fileInputRef} className="d-none" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && setComprobanteFile(e.target.files[0])} />
                  <button type="button" className="btn btn-outline-info font-monospace" onClick={() => fileInputRef.current?.click()}>
                    <i className="bi bi-paperclip me-1"></i> {comprobanteFile ? comprobanteFile.name : 'Adjuntar Comprobante'}
                  </button>
                </>
              )}

              <button 
                type="button"
                className="btn btn-outline-warning font-monospace"
                disabled={Number(montoEntregado) <= 0 || isNaN(Number(montoEntregado))}
                onClick={() => setMostrarPreviewTicket(true)}
              >
                <i className="bi bi-receipt me-1"></i> Ver Ticket
              </button>
            </div>

            <button type="submit" className="btn btn-success px-4 fw-bold">
              {estado === 'PRESUPUESTO' ? 'Guardar Presupuesto' : 'Confirmar Pedido'}
            </button>
          </div>
        </form>
      </div>

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