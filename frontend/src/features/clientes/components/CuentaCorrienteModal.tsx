import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../Context/ThemeContext';

interface Props {
  cliente: any;
  onCerrar: () => void;
  onActualizar: () => void;
}

export const CuentaCorrienteModal: React.FC<Props> = ({ cliente, onCerrar, onActualizar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables adaptativas según el tema
  const modalBg = isDark ? '#1b1b1b' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? 'text-white' : 'text-dark';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';
  const borderDivider = isDark ? 'border-secondary' : 'border-light-subtle';
  const cardBg = isDark ? '#1b1b1b' : '#f8fafc';
  const inputBg = isDark ? '#1b1b1b' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const tableContainerBg = isDark ? '#1a1a1c' : '#ffffff';
  const tableText = isDark ? '#ffffff' : '#0f172a';
  const tableContainerBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const tableHeaderBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const tableRowBorder = isDark ? '#2d2d30' : '#e2e8f0';

  

  const [limite, setLimite] = useState<number>(cliente.limiteCredito || 0);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [montoPago, setMontoPago] = useState<number>(0);
  const [descripcionPago, setDescripcionPago] = useState<string>('Pago parcial / total');
  
  // Estado para controlar el modal personalizado de éxito/error
  const [suceso, setSuceso] = useState({ show: false, titulo: "", mensaje: "", tipo: "exito" });

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
        setSuceso({
          show: true,
          titulo: "¡Éxito!",
          mensaje: "Límite de crédito actualizado correctamente.",
          tipo: "exito"
        });
        onActualizar();
      } else {
        throw new Error("No se pudo actualizar el límite");
      }
    } catch (e) {
      setSuceso({
        show: true,
        titulo: "Error",
        mensaje: "Error al actualizar el límite.",
        tipo: "error"
      });
    }
  };

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoPago <= 0) {
      setSuceso({
        show: true,
        titulo: "Atención",
        mensaje: "El monto ingresado debe ser mayor a 0",
        tipo: "error"
      });
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
        setSuceso({
          show: true,
          titulo: "¡Éxito!",
          mensaje: "Pago registrado correctamente.",
          tipo: "exito"
        });
        cargarMovimientos();
        onActualizar();
      } else {
        throw new Error("Error al registrar pago");
      }
    } catch (e) {
      setSuceso({
        show: true,
        titulo: "Error",
        mensaje: "Error al registrar pago",
        tipo: "error"
      });
    }
  };

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className={`modal-content ${textColor} shadow-lg font-monospace`} style={{ backgroundColor: modalBg, border: `1px solid ${modalBorder}` }}>
            <div className={`modal-header border-bottom ${borderDivider}`}>
              <h5 className="modal-title font-monospace fw-bold">
               Cuenta Corriente: <span style={{ color: isDark ? '#0bc9f8' : '#0284c7' }}>{cliente.persona?.nombre} {cliente.persona?.apellido}</span>
              </h5>
              <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onCerrar}></button>
            </div>
            <div className="modal-body p-4">
              
              {/* Fila de Resumen y Asignación de Límite */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="p-3 rounded border" style={{ backgroundColor: cardBg, borderColor: inputBorder }}>
                    <small className="font-monospace fw-semibold" style={{ color: mutedText }}>Saldo Deudor Actual</small>
                    {(() => {
                      const saldo = Math.abs(Number(cliente.saldoDeudor || 0));
                      const limiteVal = Number(cliente.limiteCredito || 0);
                      let colorClase = 'text-success';
                      if (saldo > 0) {
                        if (limiteVal > 0) {
                          const porcentaje = (saldo / limiteVal) * 100;
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
                  <form onSubmit={handleActualizarLimite} className="p-3 rounded border d-flex gap-3 align-items-end" style={{ backgroundColor: cardBg, borderColor: inputBorder }}>
                    <div className="flex-grow-1">
                      <label className="form-label small fw-semibold" style={{ color: mutedText }}>Límite de Crédito Permitido ($)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className={`form-control ${textColor}`} 
                        style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                        value={limite} 
                        onChange={e => setLimite(Number(e.target.value))} 
                      />
                    </div>
                    <button type="submit" className="btn fw-bold" style={{ backgroundColor: '#ca9e1b', color: '#ffffff' }}>
  Actualizar Límite
</button>
                  </form>
                </div>
              </div>

              {/* Fila de Registro de Liquidación / Pago */}
              <form onSubmit={handleRegistrarPago} className="p-3 mb-4 rounded border" style={{ backgroundColor: cardBg, borderColor: inputBorder }}>
                <h6 className="font-monospace text-warning mb-2 fw-bold">Registrar Cobro / Liquidación de Saldo</h6>
                <div className="row g-2">
                  <div className="col-md-4">
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="Monto a abonar" 
                      className={`form-control ${textColor}`} 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                      value={montoPago || ''} 
                      onChange={e => setMontoPago(Number(e.target.value))} 
                      required 
                    />
                  </div>
                  <div className="col-md-5">
                    <input 
                      type="text" 
                      placeholder="Observaciones / Nro de Comprobante" 
                      className={`form-control ${textColor}`} 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                      value={descripcionPago} 
                      onChange={e => setDescripcionPago(e.target.value)} 
                    />
                  </div>
                  <div className="col-md-3">
                    <button type="submit" className="btn btn-success w-100 fw-bold">Imputar Pago</button>
                  </div>
                </div>
              </form>

              {/* Tabla de Histórico de Movimientos */}
              <h6 className="font-monospace mb-2 fw-bold">Histórico de Compras y Pagos</h6>
              <div 
              className="table-responsive rounded shadow-sm" 
              style={{ 
                maxHeight: '45vh', 
                overflowY: 'auto',
                backgroundColor: tableContainerBg,
                border: `1px solid ${tableContainerBorder}`,
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <table 
                className="align-middle m-0" 
                style={{ 
                  width: '100%',
                  borderCollapse: 'separate', 
                  borderSpacing: 0,
                  color: tableText 
                }}
              >
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${tableHeaderBorder}` }}>
                      <th style={{ padding: '10px' }}>Fecha</th>
                      <th style={{ padding: '10px' }}>Tipo</th>
                      <th style={{ padding: '10px' }}>Descripción</th>
                      <th style={{ padding: '10px' }} className="text-end">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m: any) => (
                      <tr key={m.idMovimiento} style={{ borderBottom: `1px solid ${tableRowBorder}` }}>
                        <td style={{ padding: '10px' }}>{new Date(m.fecha).toLocaleString()}</td>
                        <td style={{ padding: '10px' }}>
                          <span className={`badge ${m.tipo === 'PAGO' ? 'bg-success' : 'bg-danger'}`}>
                            {m.tipo}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>{m.descripcion}</td>
                        <td style={{ padding: '10px' }} className={`text-end fw-bold ${m.tipo === 'PAGO' ? 'text-success' : 'text-danger'}`}>
                          {m.tipo === 'PAGO' ? '-' : '+'}${Number(m.monto).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {movimientos.length === 0 && (
                      <tr>
                        <td colSpan={4} className={`text-center py-4 ${textColor}`}>No existen movimientos registrados en la cuenta corriente.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
            <div className={`modal-footer border-top ${borderDivider}`}>
              <button className="btn btn-danger px-4 fw-semibold" style={{ color: '#ffffff' }} onClick={onCerrar}>
  Volver
</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Suceso con zIndex superior para superponerse correctamente */}
      {suceso.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className={`modal-content p-4 ${textColor} text-center shadow-lg`} style={{ border: '2px solid #8e45e0', backgroundColor: modalBg, borderRadius: '12px' }}>
              <i className={`bi ${suceso.tipo === 'exito' ? 'bi-check-circle' : 'bi-x-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">{suceso.titulo}</h5>
              <p className="small" style={{ color: mutedText }}>{suceso.mensaje}</p>
              
              <div className="d-flex flex-column gap-2 mt-3">
                <button 
                  style={{ backgroundColor: '#af3a32', border: 'none' }} 
                  className="btn btn-secondary btn-sm px-4 fw-bold text-white" 
                  onClick={() => setSuceso({ ...suceso, show: false })}
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