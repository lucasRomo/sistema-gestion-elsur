import React, { useState } from 'react';

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
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content bg-dark text-white border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title font-monospace">
              <i className="bi bi-wallet2 text-success me-2"></i>
              Resumen General de Cuentas Corrientes Activas
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onCerrar}></button>
          </div>

          <div className="modal-body">
            {/* Tarjetas de Métricas Rápidas */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded">
                  <span className="text-white-50 font-monospace small">Cuentas Corrientes Activas</span>
                  <h4 className="fw-bold text-info mb-0">{cuentasActivas.length}</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded">
                  <span className="text-white-50 font-monospace small">Total Crédito Otorgado</span>
                  <h4 className="fw-bold text-warning mb-0">${totalLimite.toFixed(2)}</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded">
                  <span className="text-white-50 font-monospace small">Total Deuda Acumulada</span>
                  <h4 className={`fw-bold mb-0 ${totalDeuda > 0 ? 'text-danger' : 'text-success'}`}>
                    ${totalDeuda.toFixed(2)}
                  </h4>
                </div>
              </div>
            </div>

            {/* Controles de Búsqueda y Filtros */}
            <div className="row g-3 mb-3 align-items-center">
              <div className="col-md-7">
                <input
                  type="text"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="Buscar por Nombre, DNI / Documento o Razón Social..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
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
                  <label className="form-check-label text-white-50 small ms-2" htmlFor="switchDeuda">
                    Ver solo clientes con deuda pendiente
                  </label>
                </div>
              </div>
            </div>

            {/* Tabla de Cuentas Corrientes */}
            <div className="table-responsive" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
              <table className="table table-dark table-hover border-secondary">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>DNI / Documento</th>
                    <th>Razón Social</th>
                    <th className="text-end">Límite Crédito</th>
                    <th className="text-end">Saldo Deudor</th>
                    <th className="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cuentasActivas.map((c: any) => (
                    <tr key={c.id_cliente}>
                      <td>{c.id_cliente}</td>
                      <td>{c.persona?.nombre} {c.persona?.apellido}</td>
                      <td>{c.persona?.numeroDocumento || '-'}</td>
                      <td>{c.razonSocial || '-'}</td>
                      <td className="text-end font-monospace text-warning">
                        ${Number(c.limiteCredito || 0).toFixed(2)}
                      </td>
                      <td className={`text-end font-monospace fw-bold ${Number(c.saldoDeudor || 0) > 0 ? 'text-danger' : 'text-success'}`}>
                        ${Number(c.saldoDeudor || 0).toFixed(2)}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-outline-success btn-sm font-monospace"
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
                      <td colSpan={7} className="text-center text-muted py-4">
                        No se encontraron cuentas corrientes activas con los filtros especificados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="modal-footer border-secondary">
            <button className="btn btn-secondary" onClick={onCerrar}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};