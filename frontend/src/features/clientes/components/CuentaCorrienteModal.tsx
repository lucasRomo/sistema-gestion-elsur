import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { clienteService } from '../services/clienteService';
import { VistaTicketPagoModal } from '../../../components/modals/VistaTicketPagoModal';

interface Props {
  cliente: any;
  onCerrar: () => void;
  onActualizar: () => void;
}

export const CuentaCorrienteModal: React.FC<Props> = ({ cliente, onCerrar, onActualizar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const modalBg = isDark ? '#1b1b1b' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? 'text-white' : 'text-dark';
  const textColorHex = isDark ? '#ffffff' : '#000000';
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

  const idCliente = cliente.id_cliente || cliente.idCliente;

  // Estado local para saldo deudor para actualización inmediata en UI
  const [saldoDeudorLocal, setSaldoDeudorLocal] = useState<number>(Number(cliente.saldoDeudor || 0));
  const [limite, setLimite] = useState<number | string>(cliente.limiteCredito ?? 0);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [montoPago, setMontoPago] = useState<number>(0);
  const [descripcionPago, setDescripcionPago] = useState<string>('Pago parcial / total');
  const [metodoPago, setMetodoPago] = useState<string>('EFECTIVO');
  const [comprobanteImagen, setComprobanteImagen] = useState<string | null>(null);

  const [suceso, setSuceso] = useState({ show: false, titulo: "", mensaje: "", tipo: "exito" });
  const [ticketData, setTicketData] = useState<{ pedido: any; movimiento: any } | null>(null);
  const [imagenModalUrl, setImagenModalUrl] = useState<string | null>(null);

  // Estados para el dropdown personalizado
  const [showDropdownMetodoPago, setShowDropdownMetodoPago] = useState<boolean>(false);
  
  const opcionesPago = [
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TRANSFERENCIA', label: 'Transferencia' },
    { value: 'DEBITO', label: 'Débito' },
    { value: 'CREDITO', label: 'Crédito' }
  ];

  useEffect(() => {
    setSaldoDeudorLocal(Number(cliente.saldoDeudor || 0));
    setLimite(cliente.limiteCredito ?? 0);
  }, [cliente]);  

  const cargarMovimientos = async () => {
    try {
      const data = await clienteService.getMovimientos(idCliente);
      setMovimientos(data);
    } catch (e) {
      console.error("Error al cargar movimientos:", e);
    }
  };

  useEffect(() => {
    if (idCliente) {
      cargarMovimientos();
    }
  }, [idCliente]);

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobanteImagen(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleActualizarLimite = async (e: React.FormEvent) => {
    e.preventDefault(); 
    try {
      const limiteNumerico = limite === '' ? 0 : Number(limite);
      await clienteService.actualizarLimiteCredito(idCliente, limiteNumerico);
      setSuceso({ 
        show: true, 
        titulo: "¡Éxito!", 
        mensaje: "Límite de crédito actualizado correctamente.", 
        tipo: "exito" 
      }); 
      onActualizar(); 
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

    if (metodoPago === 'TRANSFERENCIA' && !comprobanteImagen) {
      setSuceso({
        show: true,
        titulo: "Comprobante Requerido",
        mensaje: "Por favor adjunte la imagen del comprobante de transferencia.",
        tipo: "error"
      });
      return;
    }

    try {
      const resPago = await clienteService.registrarPago(
        idCliente,
        montoPago,
        descripcionPago,
        metodoPago,
        comprobanteImagen || undefined
      );

      const idMovGenerado = resPago?.idMovimiento || resPago?.id_movimiento || Date.now();
      const fechaMov = resPago?.fecha || new Date().toISOString();

      setSaldoDeudorLocal(prev => prev - montoPago);

      setMontoPago(0);
      setDescripcionPago('Pago parcial / total');
      setMetodoPago('EFECTIVO');
      setComprobanteImagen(null);

      setSuceso({
        show: true,
        titulo: "¡Éxito!",
        mensaje: "Pago e ingreso a caja registrados correctamente.",
        tipo: "exito"
      });

      cargarMovimientos();
      onActualizar();

      setTicketData({
        pedido: {
          id_pedido: '-',
          cliente: cliente,
          monto_total: montoPago,
          observaciones: descripcionPago
        },
        movimiento: {
          id_movimiento: idMovGenerado,
          fecha: fechaMov,
          monto: montoPago,
          metodoPago: metodoPago,
          tipoMovimiento: 'INGRESO',
          categoria: 'COBRO_CTA_CTE',
          descripcion: `Cobro Cta. Cte. - ${cliente.persona?.nombre || ''} ${cliente.persona?.apellido || ''}`
        }
      });

    } catch (e) {
      setSuceso({
        show: true,
        titulo: "Error",
        mensaje: "Error al registrar el pago.",
        tipo: "error"
      });
    }
  };

  const abrirTicketHistorial = (m: any) => {
    setTicketData({
      pedido: {
        id_pedido: '-',
        cliente: cliente,
        monto_total: m.monto,
        observaciones: m.descripcion
      },
      movimiento: {
        id_movimiento: m.idMovimiento || m.id_movimiento,
        fecha: m.fecha,
        monto: m.monto,
        metodoPago: m.metodoPago || 'EFECTIVO',
        tipoMovimiento: m.tipo === 'PAGO' ? 'INGRESO' : 'EGRESO',
        categoria: 'COBRO_CTA_CTE',
        descripcion: m.descripcion
      }
    });
  };

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div 
  className={`modal-content ${textColor} shadow-lg font-monospace`} 
  style={{ 
    backgroundColor: modalBg, 
    border: '2px solid #5ba704' 
  }}
>
            <div className={`modal-header border-bottom ${borderDivider}`}>
              <h5 className="modal-title font-monospace fw-bold">
               Cuenta Corriente: <span style={{ color: isDark ? '#0bc9f8' : '#0284c7' }}>{cliente.persona?.nombre} {cliente.persona?.apellido}</span>
              </h5>
              <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onCerrar}></button>
            </div>
            <div className="modal-body p-4">
              
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="p-3 rounded border" style={{ backgroundColor: cardBg, borderColor: inputBorder }}>
                    <small className="font-monospace fw-semibold" style={{ color: mutedText }}>Saldo Deudor Actual</small>
                    {(() => {
                      const saldo = Math.abs(saldoDeudorLocal);
                      const limiteVal = Number(limite || 0);
                      let colorClase = 'text-success';
                      if (saldoDeudorLocal > 0) {
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
                          ${saldoDeudorLocal.toFixed(2)}
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
                        onChange={e => {
                          const val = e.target.value;
                          setLimite(val === '' ? '' : Number(val));
                        }} 
                      />
                    </div>
                    <button type="submit" className="btn fw-bold" style={{ backgroundColor: '#ca9e1b', color: '#ffffff' }}>
                      Actualizar Límite
                    </button>
                  </form>
                </div>
              </div>

              <form onSubmit={handleRegistrarPago} className="p-3 mb-4 rounded border" style={{ backgroundColor: cardBg, borderColor: inputBorder }}>
                <h6 className="font-monospace text-warning mb-3 fw-bold">Registrar Cobro / Liquidación de Saldo</h6>
                <div className="row g-2">
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold" style={{ color: mutedText }}>Monto ($)</label>
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

                  {/* Selector de Medio de Pago Personalizado */}
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold" style={{ color: mutedText }}>Medio de Pago</label>
                    <div className="position-relative" tabIndex={0} onBlur={() => setTimeout(() => setShowDropdownMetodoPago(false), 200)}>
                      <div
                        className={`form-control d-flex justify-content-between align-items-center ${textColor}`}
                        style={{ 
                          backgroundColor: inputBg, 
                          borderColor: showDropdownMetodoPago ? '#0284c7' : inputBorder, 
                          cursor: 'pointer',
                          boxShadow: showDropdownMetodoPago ? '0 0 0 1px #0284c7' : 'none',
                          userSelect: 'none'
                        }}
                        onClick={() => setShowDropdownMetodoPago(!showDropdownMetodoPago)}
                      >
                        <span>{opcionesPago.find(o => o.value === metodoPago)?.label || 'Efectivo'}</span>
                        <i className="bi bi-chevron-down" style={{ fontSize: '0.75rem', color: mutedText }}></i>
                      </div>

                      {showDropdownMetodoPago && (
                        <div 
                          className="position-absolute w-100 rounded mt-1 shadow-lg overflow-hidden"
                          style={{ 
                            zIndex: 1060, 
                            backgroundColor: isDark ? '#1a1a1c' : '#ffffff',
                            border: `1px solid ${inputBorder}`,
                            top: '100%', 
                            left: 0 
                          }}
                        >
                          {opcionesPago.map(opcion => {
                            const isSelected = metodoPago === opcion.value;
                            return (
                              <div
                                key={opcion.value}
                                className="px-3 py-2"
                                style={{ 
                                  cursor: 'pointer',
                                  backgroundColor: isSelected ? '#93c5fd' : 'transparent',
                                  color: isSelected ? '#000000' : textColorHex,
                                  transition: 'background-color 0.1s'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = isDark ? '#27272a' : '#f1f5f9';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                                onMouseDown={() => {
                                  setMetodoPago(opcion.value);
                                  setShowDropdownMetodoPago(false);
                                }}
                              >
                                {opcion.label}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold" style={{ color: mutedText }}>Observaciones / Comprobante</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Pago parcial / Transferencia CBU..." 
                      className={`form-control ${textColor}`} 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                      value={descripcionPago} 
                      onChange={e => setDescripcionPago(e.target.value)} 
                    />
                  </div>

                  {metodoPago === 'TRANSFERENCIA' && (
                    <div className="col-12 mt-2">
                      <label className="form-label small fw-semibold text-info-custom">
                        <i className="bi bi-paperclip me-1"></i> Adjuntar Comprobante de Transferencia (Imagen)
                      </label>
                      <input 
                        type="file" 
                        accept="image/*"
                        className={`form-control ${textColor}`}
                        style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                        onChange={handleImagenChange}
                        required
                      />
                      {comprobanteImagen && (
                        <div className="mt-2 d-flex align-items-center gap-2">
                          <small className="text-success fw-bold"><i className="bi bi-check-circle me-1"></i>Imagen cargada</small>
                          <button
  type="button"
  className="btn btn-sm fw-semibold"
  style={{
    color: '#149bdf',
    borderColor: '#149bdf',
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease-in-out'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = '#149bdf';
    e.currentTarget.style.color = '#fff';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = '#149bdf';
  }}
  onClick={() => setImagenModalUrl(comprobanteImagen)}
>
  Ver vista previa
</button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="col-12 mt-3 d-flex justify-content-end">
                    <button type="submit" className="btn btn-success px-4 fw-bold">Imputar Pago</button>
                  </div>
                </div>
              </form>

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
                      <th style={{ padding: '10px' }}>Medio Pago</th>
                      <th style={{ padding: '10px' }}>Descripción</th>
                      <th style={{ padding: '10px' }} className="text-end">Monto</th>
                      <th style={{ padding: '10px' }} className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m: any) => {
                      const idMov = m.idMovimiento || m.id_movimiento;
                      const tieneImagen = !!(m.comprobanteImagen || m.comprobante);

                      return (
                        <tr key={idMov || Math.random()} style={{ borderBottom: `1px solid ${tableRowBorder}` }}>
                          <td style={{ padding: '10px' }}>{new Date(m.fecha).toLocaleString()}</td>
                          <td style={{ padding: '10px' }}>
                            <span className={`badge ${m.tipo === 'PAGO' ? 'bg-success' : 'bg-danger'}`}>
                              {m.tipo}
                            </span>
                          </td>
                          <td style={{ padding: '10px' }}>
                            <span className="badge bg-secondary font-monospace">
                              {m.metodoPago || 'EFECTIVO'}
                            </span>
                          </td>
                          <td style={{ padding: '10px' }}>{m.descripcion}</td>
                          <td style={{ padding: '10px' }} className={`text-end fw-bold ${m.tipo === 'PAGO' ? 'text-success' : 'text-danger'}`}>
                            {m.tipo === 'PAGO' ? '-' : '+'}${Number(m.monto).toFixed(2)}
                          </td>
                          <td style={{ padding: '10px' }} className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                              {tieneImagen && (
                                <button 
                                  type="button"
                                  className="btn btn-sm btn-outline-info"
                                  title="Ver Comprobante de Transferencia"
                                  onClick={() => setImagenModalUrl(m.comprobanteImagen || m.comprobante)}
                                >
                                  <i className="bi bi-file-image"></i>
                                </button>
                              )}
                              {m.tipo === 'PAGO' && (
                                <button 
                                  type="button"
                                  className="btn btn-sm btn-outline-success"
                                  title="Ver / Imprimir Ticket"
                                  onClick={() => abrirTicketHistorial(m)}
                                >
                                  <i className="bi bi-receipt"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {movimientos.length === 0 && (
                      <tr>
                        <td colSpan={6} className={`text-center py-4 ${textColor}`}>No existen movimientos registrados en la cuenta corriente.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
            <div className={`modal-footer border-top ${borderDivider}`}>
              <button className="btn btn-secondary px-4 fw-semibold" style={{ color: '#ffffff' }} onClick={onCerrar}>
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>

      {ticketData && (
        <VistaTicketPagoModal
          pedido={ticketData.pedido}
          movimiento={ticketData.movimiento}
          onClose={() => setTicketData(null)}
        />
      )}

      {imagenModalUrl && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1080 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className={`modal-content p-3 ${textColor}`} style={{ backgroundColor: modalBg }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold m-0"><i className="bi bi-image me-2"></i>Comprobante de Transferencia</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setImagenModalUrl(null)}></button>
              </div>
              <div className="text-center p-2">
                <img src={imagenModalUrl} alt="Comprobante" className="img-fluid rounded shadow" style={{ maxHeight: '70vh', objectFit: 'contain' }} />
              </div>
              <div className="text-end mt-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setImagenModalUrl(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {suceso.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className={`modal-content p-4 ${textColor} text-center shadow-lg`} style={{ border: '2px solid #8e45e0', backgroundColor: modalBg, borderRadius: '12px' }}>
              <i className={`bi ${suceso.tipo === 'exito' ? 'bi-check-circle' : 'bi-x-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">{suceso.titulo}</h5>
              <p className="small" style={{ color: mutedText }}>{suceso.mensaje}</p>
              
              <div className="d-flex flex-column gap-2 mt-3">
                <button 
                  style={{ backgroundColor: '#af3a32', border: 'none', color: "#ffffff" }} 
                  className="btn btn-secondary btn-sm px-4 fw-bold" 
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