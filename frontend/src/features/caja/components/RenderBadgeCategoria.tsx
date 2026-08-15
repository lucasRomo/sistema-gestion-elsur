import React from 'react';
import type { MovimientoCaja } from '../services/cajaService';

export const renderBadgeCategoria = (m: MovimientoCaja, isDark: boolean) => {
  const baseClasses = "d-inline-flex align-items-center gap-1 px-2 py-1 rounded fw-semibold";
  const baseStyle = { fontSize: '0.75rem', lineHeight: 1 };

  if (m.categoria === 'AJUSTE') {
    return (
      <span
        className={baseClasses}
        style={{
          ...baseStyle,
          backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : '#ffedd5',
          color: isDark ? '#fb923c' : '#c2410c',
          border: `1px solid ${isDark ? '#ea580c' : '#f97316'}`
        }}
      >
        <i className="bi bi-arrow-repeat"></i>AJUSTE
      </span>
    );
  }

  if (m.categoria === 'EGRESO_MANTENIMIENTO' || m.categoria === 'MANTENIMIENTO') {
    return (
      <span
        className={baseClasses}
        style={{
          ...baseStyle,
          backgroundColor: isDark ? 'rgba(234, 179, 8, 0.2)' : '#fef3c7',
          color: isDark ? '#facc15' : '#b45309',
          border: `1px solid ${isDark ? '#eab308' : '#f59e0b'}`
        }}
      >
        <i className="bi bi-tools"></i>MANTENIMIENTO
      </span>
    );
  }

  if (m.categoria === 'INSUMOS' || m.categoria === 'EGRESO_INSUMOS') {
    return (
      <span
        className={baseClasses}
        style={{
          ...baseStyle,
          backgroundColor: isDark ? 'rgba(14, 165, 233, 0.2)' : '#e0f2fe',
          color: isDark ? '#38bdf8' : '#0369a1',
          border: `1px solid ${isDark ? '#0ea5e9' : '#0284c7'}`
        }}
      >
        <i className="bi bi-truck"></i>INSUMOS
      </span>
    );
  }

  if (
    m.categoria === 'CTA_CTE' ||
    m.categoria === 'CUENTA_CORRIENTE' ||
    m.categoria === 'COBRO_CTA_CTE' ||
    m.descripcion?.toLowerCase().includes('cta. cte')
  ) {
    return (
      <span
        className={baseClasses}
        style={{
          ...baseStyle,
          backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : '#f3e8ff',
          color: isDark ? '#c084fc' : '#7e22ce',
          border: `1px solid ${isDark ? '#a855f7' : '#9333ea'}`
        }}
      >
        <i className="bi"></i>CTA_CTE
      </span>
    );
  }

  const esGanancia = m.tipoMovimiento === 'INGRESO';

  return (
    <span
      className={baseClasses}
      style={{
        backgroundColor: esGanancia
          ? (isDark ? 'rgba(28, 155, 74, 0.2)' : '#d1fae5')
          : (isDark ? 'rgba(226, 46, 46, 0.2)' : '#fee2e2'),
        color: esGanancia
          ? (isDark ? '#4ade80' : '#065f46')
          : (isDark ? '#f87171' : '#991b1b'),
        border: `1px solid ${esGanancia ? '#1c9b4a' : '#e22e2e'}`,
        fontSize: '0.75rem'
      }}
    >
      {esGanancia ? 'Ingreso' : 'Egreso'}
    </span>
  );
};