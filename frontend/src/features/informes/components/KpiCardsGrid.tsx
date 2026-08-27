import React from 'react';

export interface KpiCard {
  label: string;
  sub: string;
  val: string | number;
  color: string;
  icon: string;
  points: string;
  changePercent?: number;
}

interface KpiCardsGridProps {
  kpiCards: KpiCard[];
}

export const KpiCardsGrid: React.FC<KpiCardsGridProps> = ({ kpiCards }) => {
  return (
    <div className="row g-2 g-sm-3 mb-4">
      <style>{`
        .kpi-card-surface {
          min-height: 160px;
        }
        @media (max-width: 480px) {
          .kpi-card-surface {
            min-height: 120px;
            padding: 0.65rem !important;
          }
          .kpi-card-icon {
            width: 24px !important;
            height: 24px !important;
            font-size: 0.7rem !important;
          }
          .kpi-card-sub {
            font-size: 0.58rem !important;
          }
          .kpi-card-label {
            font-size: 0.68rem !important;
          }
          .kpi-card-value {
            font-size: 1.1rem !important;
          }
        }
      `}</style>
      {kpiCards.map((card, idx) => (
        <div className="col-6 col-xl-3" key={idx}>
          <div
            className="p-3 rounded-4 h-100 shadow-sm d-flex flex-column position-relative overflow-hidden im-surface kpi-card-surface"
          >
            {/* Cabecera: ícono + ticker + título */}
            <div className="d-flex align-items-center gap-2 mb-2 position-relative z-1">
              <div
                className="d-flex align-items-center justify-content-center rounded-2 kpi-card-icon"
                style={{
                  backgroundColor: `${card.color}20`,
                  color: card.color,
                  width: '30px',
                  height: '30px',
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}
              >
                <i className={`bi ${card.icon}`}></i>
              </div>
              <div>
                <div className="text-body-secondary font-monospace fw-semibold kpi-card-sub" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                  {card.sub}
                </div>
                <div className="fw-bold text-body kpi-card-label" style={{ fontSize: '0.8rem' }}>
                  {card.label}
                </div>
              </div>
            </div>

            {/* Gráfico Sparkline SVG */}
            <div className="position-absolute start-0 end-0 bottom-0 w-100" style={{ height: '58%' }}>
              <svg viewBox="0 0 200 50" preserveAspectRatio="none" className="w-100 h-100">
                <defs>
                  <linearGradient id={`grad-dark-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={card.color} stopOpacity="0" />
                    <stop offset="50%" stopColor={card.color} stopOpacity="0" />
                    <stop offset="100%" stopColor={card.color} stopOpacity="0.22" />
                  </linearGradient>
                  <linearGradient id={`line-fade-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={card.color} stopOpacity="0" />
                    <stop offset="50%" stopColor={card.color} stopOpacity="0" />
                    <stop offset="100%" stopColor={card.color} stopOpacity="1" />
                  </linearGradient>
                </defs>
                <polygon
                  fill={`url(#grad-dark-${idx})`}
                  points={`0,50 ${card.points} 200,50`}
                />
                <polyline
                  fill="none"
                  stroke={`url(#line-fade-${idx})`}
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={card.points}
                />
              </svg>
            </div>

            {/* Valor principal */}
            <div className="mt-auto position-relative z-1">
              <h3 className="fw-bold mb-0 text-white kpi-card-value" style={{ fontSize: '1.6rem', letterSpacing: '-0.5px' }}>
                {card.val}
              </h3>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};