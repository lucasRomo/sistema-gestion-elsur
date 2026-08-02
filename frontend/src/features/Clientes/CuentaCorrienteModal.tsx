import React, { useState, useEffect } from 'react';

interface Props {
  cliente: any;
  onCerrar: () => void;
  onActualizar: () => void;
}

export const CuentaCorrienteModal: React.FC<Props> = ({ cliente, onCerrar, onActualizar }) => {
  const [limite, setLimite] = useState<number>(cliente.limiteCredito || 0);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [montoPago, setMontoPago] = useState<number>(0);
  const [descripcionPago, setDescripcionPago] = useState<string>('Pago parcial / total');

  const cargarMovimientos = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/cuentas-corrientes/cliente/${cliente.id_cliente}/movimientos`);
      if (res.ok) {
        const data = await res.json();
        setMovimientos(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    cargarMovimientos();
  }, [cliente.id_cliente]);

  const handleActualizarLimite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8080/api/cuentas-corrientes/cliente/${cliente.id_cliente}/limite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limiteCredito: Number(limite) })
      });
      if (res.ok) {
        alert("Límite de crédito actualizado correctamente.");
        onActualizar();
      }
    } catch (e) {
      alert("Error al actualizar el límite.");
    }
  };

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoPago <= 0) {
      alert("El monto ingresado debe ser mayor a 0");
      return;
    }
    try {
      const res = await fetch(`http://localhost:8080/api/cuentas-corrientes/cliente/${cliente.id_cliente}/registrar-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: montoPago, descripcion: descripcionPago })
      });
      if (res.ok) {
        setMontoPago(0);
        cargarMovimientos();
        onActualizar();
      }
    } catch (e) {
      alert("Error al registrar pago");
    }
  };

  

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content bg-dark text-white border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title font-monospace">
              Cuenta Corriente: <span className="text-info">{cliente.persona?.nombre} {cliente.persona?.apellido} ({cliente.razonSocial})</span>
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onCerrar}></button>
          </div>
          <div className="modal-body">
            
            {/* Fila de Resumen y Asignación de Límite */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded">
                  <small className="text-white-50 font-monospace">Saldo Deudor Actual</small>
                  {(() => {
                    const saldo = Math.abs(Number(cliente.saldoDeudor || 0));
                    const limite = Number(cliente.limiteCredito || 0);
                    let colorClase = 'text-success';
                    if (saldo > 0) {
                      if (limite > 0) {
                        const porcentaje = (saldo / limite) * 100;
                        if (porcentaje >= 100) {
                          colorClase = 'text-danger'; 
                        } else if (porcentaje >= 75) {
                          colorClase = 'text-warning'; 
                        } else {
                          colorClase = 'text-success';
                        }
                      } else {
                        colorClase = 'text-danger';
                      }
                    }
                    return (
                      <h3 className={`fw-bold mb-0 ${colorClase}`}>
                        ${Number(cliente.saldoDeudor || 0).toFixed(2)}
                      </h3>
                    );
                  })()}
                </div>
              </div>

              <div className="col-md-8">
                <form onSubmit={handleActualizarLimite} className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded d-flex gap-3 align-items-end">
                  <div className="flex-grow-1">
                    <label className="form-label small">Límite de Crédito Permitido ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control bg-dark text-white border-secondary" 
                      value={limite} 
                      onChange={e => setLimite(Number(e.target.value))} 
                    />
                  </div>
                  <button type="submit" className="btn btn-warning fw-bold">Actualizar Límite</button>
                </form>
              </div>
            </div>

            {/* Fila de Registro de Liquidación / Pago */}
            <form onSubmit={handleRegistrarPago} className="p-3 mb-4 bg-secondary bg-opacity-10 border border-secondary rounded">
              <h6 className="font-monospace text-warning mb-2">Registrar Cobro / Liquidación de Saldo</h6>
              <div className="row g-2">
                <div className="col-md-4">
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Monto a abonar" 
                    className="form-control bg-dark text-white border-secondary" 
                    value={montoPago || ''} 
                    onChange={e => setMontoPago(Number(e.target.value))} 
                    required 
                  />
                </div>
                <div className="col-md-5">
                  <input 
                    type="text" 
                    placeholder="Observaciones / Nro de Comprobante" 
                    className="form-control bg-dark text-white border-secondary" 
                    value={descripcionPago} 
                    onChange={e => setDescripcionPago(e.target.value)} 
                  />
                </div>
                <div className="col-md-3">
                  <button type="submit" className="btn btn-success w-100">Imputar Pago</button>
                </div>
              </div>
            </form>

            {/* Tabla de Histórico de Movimientos */}
            <h6 className="font-monospace mb-2">Histórico de Compras y Pagos</h6>
            <div className="table-responsive" style={{ maxHeight: '30vh', overflowY: 'auto' }}>
              <table className="table table-dark table-striped border-secondary">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th className="text-end">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m: any) => (
                    <tr key={m.idMovimiento}>
                      <td>{new Date(m.fecha).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${m.tipo === 'PAGO' ? 'bg-success' : 'bg-danger'}`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td>{m.descripcion}</td>
                      <td className={`text-end fw-bold ${m.tipo === 'PAGO' ? 'text-success' : 'text-danger'}`}>
                        {m.tipo === 'PAGO' ? '-' : '+'}${Number(m.monto).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {movimientos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center">No existen movimientos registrados en la cuenta corriente.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
          <div className="modal-footer border-secondary">
            <button className="btn btn-secondary" onClick={onCerrar}>Volver</button>
          </div>
        </div>
      </div>
    </div>
  );
};