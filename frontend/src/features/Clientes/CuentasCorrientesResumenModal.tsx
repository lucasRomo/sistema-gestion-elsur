import React, { useState } from 'react';
import { useTheme } from '../../Context/ThemeContext';

interface Props {
  clientes: any[];
  onCerrar: () => void;
  onSeleccionarCliente: (cliente: any) => void;
}

export const CuentasCorrientesResumenModal: React.FC<Props> = ({
  clientes,
  onCerrar,
  onSeleccionarCliente,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables adaptativas del tema
  const modalBg = isDark ? '#1b1b1b' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : '#64748b';
  const borderDivider = isDark ? 'border-secondary' : 'border-light-subtle';
  const cardBg = isDark ? '#1b1b1b' : '#f8fafc';
  const inputBg = isDark ? '#1b1b1b' : '#ffffff';
  const inputTextColor = isDark ? 'text-white' : 'text-dark';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';

  // Estilos específicos de la tabla adaptativa
  const tableContainerBg = isDark ? '#1a1a1c' : '#ffffff';
  const tableText = isDark ? '#ffffff' : '#0f172a';
  const tableContainerBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const tableHeaderBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const tableRowBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const hoverRowBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc';
  const emptyTextColor = isDark ? 'text-white-50' : 'text-muted';

  const [busqueda, setBusqueda] = useState('');
  const [soloConDeuda, setSoloConDeuda] = useState(false);

  // Filtrar solo los clientes que tienen Cuenta Corriente Habilitada (Límite Crédito > 0)
  const cuentasActivas = clientes.filter((c) => {
    const tieneCuenta = Number(c.limiteCredito || 0) > 0;
    if (!tieneCuenta) return false;

    if (soloConDeuda && Number(c.saldoDeudor || 0) <= 0) return false;

    if (!busqueda) return true;
    const q = busqueda.toLowerCase().trim();
    return (
      c.persona?.nombre?.toLowerCase().includes(q) ||
      c.persona?.apellido?.toLowerCase().includes(q) ||
      c.persona?.numeroDocumento?.includes(q) ||
      c.razonSocial?.toLowerCase().includes(q)
    );
  });

  // Totales acumulados
  const totalDeuda = cuentasActivas.reduce((acc, c) => acc + Number(c.saldoDeudor || 0), 0);
  const totalLimite = cuentasActivas.reduce((acc, c) => acc + Number(c.limiteCredito || 0), 0);

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content shadow-lg font-monospace" style={{ backgroundColor: modalBg, border: `1px solid ${modalBorder}`, color: titleColor }}>
          <div className={`modal-header border-bottom ${borderDivider}`}>
            <h5 className="modal-title font-monospace fw-bold" style={{ color: titleColor }}>
              <i className="bi bi-wallet2 text-success me-2"></i>
              Resumen General de Cuentas Corrientes Activas
            </h5>
            <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onCerrar}></button>
          </div>

          <div className="modal-body p-4">
            {/* Tarjetas de Métricas Rápidas */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="p-3 rounded border" style={{ backgroundColor: cardBg, borderColor: inputBorder }}>
                  <span className="font-monospace small fw-semibold d-block mb-1" style={{ color: mutedText }}>Cuentas Corrientes Activas</span>
                  <h4 className="fw-bold text-info mb-0">{cuentasActivas.length}</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded border" style={{ backgroundColor: cardBg, borderColor: inputBorder }}>
                  <span className="font-monospace small fw-semibold d-block mb-1" style={{ color: mutedText }}>Total Crédito Otorgado</span>
                  <h4 className="fw-bold text-warning mb-0">${totalLimite.toFixed(2)}</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded border" style={{ backgroundColor: cardBg, borderColor: inputBorder }}>
                  <span className="font-monospace small fw-semibold d-block mb-1" style={{ color: mutedText }}>Total Deuda Acumulada</span>
                  <h4 className={`fw-bold mb-0 ${totalDeuda > 0 ? 'text-danger' : 'text-success'}`}>
                    ${totalDeuda.toFixed(2)}
                  </h4>
                </div>
              </div>
            </div>

            {/* Controles de Búsqueda y Filtros */}
            <div className="row g-3 mb-3 align-items-center">
              <div className="col-md-7">
                <div className="input-group">
                  <span className="input-group-text border-end-0" style={{ backgroundColor: inputBg, borderColor: inputBorder, color: mutedText }}>
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className={`form-control border-start-0 ${inputTextColor}`}
                    style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                    placeholder="Buscar por Nombre, DNI / Documento o Razón Social..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-5 d-flex align-items-center justify-content-end">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="switchDeuda"
                    checked={soloConDeuda}
                    onChange={(e) => setSoloConDeuda(e.target.checked)}
                  />
                  <label className="form-check-label small ms-2 fw-semibold" htmlFor="switchDeuda" style={{ color: mutedText }}>
                    Ver solo clientes con deuda pendiente
                  </label>
                </div>
              </div>
            </div>

            {/* Tabla de Cuentas Corrientes Adaptativa (sin la clase .table) */}
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
                  <tr style={{ borderBottom: `2px solid ${tableHeaderBorder}`, backgroundColor: tableContainerBg }}>
                    <th className="py-3 px-3 font-monospace small" style={{ color: tableText, width: '60px', whiteSpace: 'nowrap' }}>ID</th>
                    <th className="py-3 px-3 font-monospace small" style={{ color: tableText }}>Cliente</th>
                    <th className="py-3 px-3 font-monospace small" style={{ color: tableText }}>DNI / Documento</th>
                    <th className="py-3 px-3 font-monospace small" style={{ color: tableText }}>Razón Social</th>
                    <th className="py-3 px-3 font-monospace small text-end" style={{ color: tableText }}>Límite Crédito</th>
                    <th className="py-3 px-3 font-monospace small text-end" style={{ color: tableText }}>Saldo Deudor</th>
                    <th className="py-3 px-3 font-monospace small text-center" style={{ color: tableText }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cuentasActivas.map((c: any) => (
                    <tr 
                      key={c.id_cliente} 
                      style={{ borderBottom: `1px solid ${tableRowBorder}`, transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverRowBg}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className="px-3 py-3 font-monospace small" style={{ color: tableText, whiteSpace: 'nowrap' }}>{c.id_cliente}</td>
                      <td className="px-3 py-3 fw-bold" style={{ color: tableText }}>{c.persona?.nombre} {c.persona?.apellido}</td>
                      <td className="px-3 py-3" style={{ color: tableText }}>{c.persona?.numeroDocumento || '-'}</td>
                      <td className="px-3 py-3" style={{ color: tableText }}>{c.razonSocial || '-'}</td>
                      <td className="px-3 py-3 text-end font-monospace text-warning fw-semibold">
                        ${Number(c.limiteCredito || 0).toFixed(2)}
                      </td>
                      <td className={`px-3 py-3 text-end font-monospace fw-bold ${Number(c.saldoDeudor || 0) > 0 ? 'text-danger' : 'text-success'}`}>
                        ${Number(c.saldoDeudor || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          className="btn btn-outline-success btn-sm font-monospace rounded-2 px-3 py-1"
                          onClick={() => {
                            onCerrar();
                            onSeleccionarCliente(c);
                          }}
                        >
                          <i className="bi bi-wallet2 me-1"></i> Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cuentasActivas.length === 0 && (
                    <tr>
                      <td colSpan={7} className={`text-center py-5 ${emptyTextColor}`}>
                        <i className="bi bi-search display-5 d-block mb-2 opacity-50"></i>
                        <span className="font-monospace">No se encontraron cuentas corrientes activas con los filtros especificados.</span>
                      </td>
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
  );
};