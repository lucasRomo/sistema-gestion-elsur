import React from 'react';
import type { Turno } from '../types/caja';

interface ResumenTurnoCardProps {
  cajaAbierta: boolean;
  saldoCaja: number;
  turnoActual: Turno | null;
  ingresosTurno: number;
  egresosTurno: number;
  cardBg: string;
  cardBorder: string;
}

export const ResumenTurnoCard: React.FC<ResumenTurnoCardProps> = ({
  cajaAbierta,
  saldoCaja,
  turnoActual,
  ingresosTurno,
  egresosTurno,
  cardBg,
  cardBorder
}) => {
  return (
    <div className="col-md-6">
      <div className="p-4 rounded-3 h-100" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="opacity-75 fw-medium">
            Flujo de Caja Actual: {' '}
            <span className={cajaAbierta ? 'text-success fw-bold' : 'text-danger fw-bold'}>
              {cajaAbierta ? 'Abierta' : 'Cerrado'}
            </span>
          </span>
        </div>

        <div className="small font-monospace opacity-50 mb-1">Saldo de Caja Actual</div>

        <h1 className="fw-bold mb-3" style={{ fontSize: '2.6rem' }}>
          ${cajaAbierta ? saldoCaja.toLocaleString('es-AR') : '0'}
        </h1>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span>Inicio de Caja:</span>
          <span className="fw-bold text-info fs-6 text-info-custom">
            ${cajaAbierta ? (turnoActual?.montoInicial || 0).toLocaleString('es-AR') : '0'}
          </span>
        </div>
        <div className="border-top border-secondary pt-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span>Total de Ingresos de Turno:</span>
            <span className="text-success fw-semibold font-monospace">
              ${cajaAbierta ? ingresosTurno.toLocaleString('es-AR') : '0'}
            </span>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span>Total de Egresos de Turno:</span>
            <span className="text-danger fw-semibold font-monospace">
              ${cajaAbierta ? egresosTurno.toLocaleString('es-AR') : '0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
