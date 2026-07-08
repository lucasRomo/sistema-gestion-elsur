import React, { useState, useEffect } from 'react';
import type { Pedido, CartItem } from '../../types/Pedido';

interface Props {
  clientes: any[];
  empleados: any[]; 
  total: number;
  carrito: CartItem[];
  onVolver: () => void;
  onGuardar: (payload: { pedido: Pedido; idEmpleado: number }) => void;
}

export const DetallesPedidoForm: React.FC<Props> = ({ clientes, empleados, total, carrito, onVolver, onGuardar }) => {
  const [clienteId, setClienteId] = useState<string>('');
  const [empleadoId, setEmpleadoId] = useState<string>(''); 
  const [estado, setEstado] = useState('PENDIENTE');
  const [tipoPago, setTipoPago] = useState('Efectivo');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [montoEntregado, setMontoEntregado] = useState('0');
  const [observaciones, setObservaciones] = useState('');

  // Seteo inicial seguro de cliente
  useEffect(() => {
    if (clientes && clientes.length > 0) {
      const primerCliente = clientes[0];
      const idEncontrado = primerCliente.id_cliente ?? primerCliente.idCliente ?? primerCliente.id ?? '';
      setClienteId(String(idEncontrado));
    }
  }, [clientes]);

  // Seteo inicial seguro de empleado
  useEffect(() => {
    if (empleados && empleados.length > 0) {
      const primerEmpleado = empleados[0];
      const idEncontrado = primerEmpleado.id_empleado ?? primerEmpleado.idEmpleado ?? primerEmpleado.id ?? '';
      setEmpleadoId(String(idEncontrado));
    }
  }, [empleados]);

  // Si eligen el estado PRESUPUESTO, limpiamos la seña por defecto
  useEffect(() => {
    if (estado === 'PRESUPUESTO') {
      setMontoEntregado('0');
    }
  }, [estado]);

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
    // Si es presupuesto y no ponen fecha, le asignamos el día de hoy por defecto
    const fechaFinalEntrega = fechaEntrega 
      ? `${fechaEntrega}T00:00:00` 
      : `${new Date().toISOString().split('T')[0]}T00:00:00`;

    // Armamos la estructura pura de Pedido mapeando las banderas correctas
    const nuevoPedido: Pedido = {
      cliente: { id_cliente: Number(clienteId) },
      detalles: detallesFormateados,
      fecha_entrega_estimada: fechaFinalEntrega,
      estado: estado,
      monto_total: total,
      monto_pago_adelantado: Number(montoEntregado),
      observaciones: observaciones,
      es_cuenta_corriente: tipoPago === 'Cuenta Corriente',
      es_presupuesto: esPresupuesto
    };

    const payloadFinal = {
      pedido: nuevoPedido,
      idEmpleado: Number(empleadoId)
    };

    onGuardar(payloadFinal);
  };

  return (
    <div className="card text-white p-4 mx-auto rounded" style={{ backgroundColor: '#1a1a1c', border: '1px solid #3f3f46', maxWidth: '650px' }}>
      <h3 className="text-center mb-4 fw-normal font-monospace">Configurar Parámetros del Comprobante</h3>
      
      <form onSubmit={handleSubmit} className="row g-3">
        {/* Selector de Cliente */}
        <div className="col-12">
          <label className="form-label small text-secondary fw-bold">Cliente:</label>
          <select 
            className="form-select bg-dark text-white border-secondary" 
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
                <option key={`cliente-opt-${id ?? index}`} value={id}>
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
            className="form-select bg-dark text-white border-secondary" 
            value={empleadoId} 
            onChange={(e) => setEmpleadoId(e.target.value)}
            required
          >
            <option value="" disabled>-- Seleccione un Empleado --</option>
            {empleados.map((emp, index) => {
              const id = emp.id_empleado ?? emp.idEmpleado ?? emp.id;
              const nombreCompleto = emp.persona 
                ? `${emp.persona.nombre} ${emp.persona.apellido}`
                : `${emp.nombre || 'Empleado'} ${emp.apellido || id || index}`;
                
              return (
                <option key={`empleado-opt-${id ?? index}`} value={id}>
                  {nombreCompleto} {emp.cargo ? `(${emp.cargo})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Combobox de Estado con Presupuesto Agregado */}
        <div className="col-md-6">
          <label className="form-label small text-secondary fw-bold">Tipo / Estado de Registro:</label>
          <select className="form-select bg-dark text-white border-secondary" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="PENDIENTE">PENDIENTE (A Producción)</option>
            <option value="EN PROCESO">EN PROCESO (Taller)</option>
            <option value="PRESUPUESTO">PRESUPUESTO (Solo Guardar)</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label small text-secondary fw-bold">Método Comercial:</label>
          <select 
            className="form-select bg-dark text-white border-secondary" 
            value={tipoPago} 
            onChange={(e) => setTipoPago(e.target.value)}
            disabled={estado === 'PRESUPUESTO'}
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta / Transferencia">Tarjeta / Transferencia</option>
            <option value="Cuenta Corriente">Cuenta Corriente</option>
          </select>
        </div>

        <div className="col-12">
          <label className="form-label small text-secondary fw-bold">
            Fecha de Entrega Estimada: {estado === 'PRESUPUESTO' && <span className="text-muted">(Opcional para presupuestos)</span>}
          </label>
          <input 
            type="date" 
            className="form-control bg-dark text-white border-secondary" 
            required={estado !== 'PRESUPUESTO'} 
            value={fechaEntrega} 
            onChange={(e) => setFechaEntrega(e.target.value)} 
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small text-secondary fw-bold">Monto Total Cotizado:</label>
          <input type="text" className="form-control bg-light text-dark fw-bold" readOnly value={`$${total}`} />
        </div>

        <div className="col-md-6">
          <label className="form-label small text-secondary fw-bold">Seña / Adelanto Recibido:</label>
          <input 
            type="number" 
            className="form-control bg-dark text-white border-secondary" 
            value={montoEntregado} 
            onChange={(e) => setMontoEntregado(e.target.value)} 
            disabled={estado === 'PRESUPUESTO'}
          />
        </div>

        <div className="col-12">
          <label className="form-label small text-secondary fw-bold">Instrucciones / Notas Internas:</label>
          <textarea 
            className="form-control bg-dark text-white border-secondary" 
            rows={3} 
            placeholder="Detalles sobre materiales, medidas o aclaración de validez del presupuesto..." 
            value={observaciones} 
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <div className="d-flex justify-content-between mt-4">
          <button type="button" className="btn btn-danger px-4" style={{ backgroundColor: '#a63333', border: 'none' }} onClick={onVolver}>
            Volver al Carrito
          </button>
          <button type="submit" className="btn btn-success px-4" style={{ backgroundColor: '#3d824b', border: 'none' }}>
            {estado === 'PRESUPUESTO' ? 'Guardar Presupuesto' : 'Confirmar Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
};