import React from 'react';

interface Props {
  esOscuro: boolean;
  toggleTheme: () => void;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  mutedTextColor: string;
}

export const AparienciaSection: React.FC<Props> = ({
  esOscuro, toggleTheme, cardBg, cardBorder, textColor, mutedTextColor
}) => (
  <div className="row mb-4">
    <div className="col-12">
      <div className="p-3 rounded-4 shadow d-flex justify-content-between align-items-center" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        <div className="d-flex align-items-center gap-3">
          <i className={`bi ${esOscuro ? 'bi-moon-stars-fill text-warning' : 'bi-sun-fill text-primary'} fs-3`}></i>
          <div>
            <h6 className="fw-bold mb-0" style={{ color: textColor }}>Apariencia del Sistema</h6>
            <span className={`${mutedTextColor} small`}>
              Modo actual: <b>{esOscuro ? 'Oscuro (Dark Mode)' : 'Claro (Light Mode)'}</b>
            </span>
          </div>
        </div>

        <div className="form-check form-switch fs-4 mb-0">
          <input 
            className="form-check-input style-switch" 
            type="checkbox" 
            role="switch"
            id="flexSwitchCheckDefault"
            checked={!esOscuro}
            onChange={toggleTheme}
            style={{ cursor: 'pointer' }}
          />
          <label className="form-check-label fs-6 align-middle ms-2" htmlFor="flexSwitchCheckDefault" style={{ color: textColor, cursor: 'pointer' }}>
            {esOscuro ? 'Cambiar a Claro' : 'Cambiar a Oscuro'}
          </label>
        </div>
      </div>
    </div>
  </div>
);