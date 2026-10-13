import React from 'react';

// El PDF está en frontend/public/manual/: Vercel lo sirve como archivo estático (no pasa por
// el backend). Para actualizarlo, reemplazar ese archivo manteniendo el nombre.
export const URL_MANUAL = '/manual/Manual_de_Usuario_GestaPro.pdf';

interface Props {
  esOscuro: boolean;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  mutedTextColor: string;
}

export const ManualUsuarioSection: React.FC<Props> = ({ esOscuro, cardBg, cardBorder, textColor, mutedTextColor }) => (
  <div className="row mb-4">
    <div className="col-12">
      <div
        className="p-3 rounded-4 shadow d-flex flex-wrap justify-content-between align-items-center gap-3"
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
      >
        <div className="d-flex align-items-center gap-3">
          <i className="bi bi-book-half fs-3" style={{ color: '#8e45e0' }} aria-hidden="true"></i>
          <div>
            <h6 className="fw-bold mb-0" style={{ color: textColor }}>Manual de Usuario</h6>
            <span className={`${mutedTextColor} small`}>
              Guía paso a paso de todos los módulos (PDF, 16 MB).
            </span>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <a
            href={URL_MANUAL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn fw-semibold text-white"
            style={{ backgroundColor: '#8e45e0', borderColor: '#8e45e0' }}
          >
            <i className="bi bi-eye me-2" aria-hidden="true"></i>Ver manual
          </a>
          <a
            href={URL_MANUAL}
            download="Manual_de_Usuario_GestaPro.pdf"
            className={`btn fw-semibold ${esOscuro ? 'btn-outline-light' : 'btn-outline-secondary'}`}
          >
            <i className="bi bi-download me-2" aria-hidden="true"></i>Descargar
          </a>
        </div>
      </div>
    </div>
  </div>
);
