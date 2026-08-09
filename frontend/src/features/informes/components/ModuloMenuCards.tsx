import React from 'react';

export type SeccionInforme = 'MENU' | 'finanzas' | 'ventas' | 'operaciones' | 'clientes' | 'control';

export interface SeccionMenuConfig {
  id: SeccionInforme;
  label: string;
  desc: string;
  icon: string;
  color: string;
}

interface ModuloMenuCardsProps {
  seccionesMenu: SeccionMenuConfig[];
  setSeccionActiva: (seccion: SeccionInforme) => void;
  esAdmin: boolean;
  setShowModalRegistrosArqueo: (show: boolean) => void;
}

export const ModuloMenuCards: React.FC<ModuloMenuCardsProps> = ({
  seccionesMenu,
  setSeccionActiva,
  esAdmin,
  setShowModalRegistrosArqueo,
}) => {
  return (
    <div>
      <h5 className="fw-bold mb-3 text-body-secondary font-monospace" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>
        SELECCIONÁ UN MÓDULO PARA VER SUS INFORMES DETALLADOS:
      </h5>

      <div className="row g-4 align-items-stretch">
        {seccionesMenu.map((sec) => (
          <div className="col-12 col-md-6 col-xl-4 d-flex" key={sec.id}>
            <div 
              onClick={() => setSeccionActiva(sec.id)}
              className="card-menu-item p-4 w-100 d-flex flex-column justify-content-between"
              style={{ borderLeft: `5px solid ${sec.color}` }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <i className={`bi ${sec.icon}`} style={{ fontSize: '2rem', color: sec.color }}></i>
                  <span className="badge bg-dark text-white-50 border border-secondary px-2 py-1">Ver Reportes →</span>
                </div>
                <h4 className="fw-bold text-white mb-2">{sec.label}</h4>
                <p className="text-body-secondary small mb-0">{sec.desc}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Tarjeta de Exportación */}
        <div className="col-12 col-md-6 col-xl-4 d-flex">
          <div 
            onClick={() => alert("Función de descarga en PDF en desarrollo.")}
            className="card-menu-item p-4 w-100 d-flex flex-column justify-content-between"
            style={{ borderLeft: '5px solid #e22e2e' }}
          >
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: '2rem', color: '#e22e2e' }}></i>
                <span className="badge bg-danger text-white px-2 py-1">Próximamente</span>
              </div>
              <h4 className="fw-bold text-white mb-2">EXPORTAR INFORMES</h4>
              <p className="text-body-secondary small mb-0">Generar y descargar un documento consolidado con las métricas del período</p>
            </div>

            <button 
              type="button"
              className="btn btn-sm text-white fw-bold w-100 mt-4 d-flex align-items-center justify-content-center gap-2 py-2"
              style={{ backgroundColor: '#e22e2e', borderRadius: '8px' }}
            >
              <i className="bi bi-file-earmark-arrow-down-fill fs-6"></i>
              Descargar Informes en un PDF
            </button>
          </div>
        </div>

        {/* Tarjeta de Registros de Arqueo (Solo Admin) */}
        {esAdmin && (
          <div className="col-12 d-flex">
            <div
              onClick={() => setShowModalRegistrosArqueo(true)}
              className="card-menu-item p-4 w-100 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
              style={{ borderLeft: '5px solid #daa32d' }}
            >
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-journal-check" style={{ fontSize: '2.2rem', color: '#daa32d' }}></i>
                <div>
                  <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                    <h4 className="fw-bold text-white mb-0">REGISTROS DE ARQUEO</h4>
                    <span className="badge bg-dark text-white-50 border border-secondary px-2 py-1">Solo Admin</span>
                  </div>
                  <p className="text-white-50 small mb-0">
                    Revisá todos los cierres de caja registrados por turno, sus movimientos y diferencias de arqueo
                  </p>
                </div>
              </div>

              <span
                className="badge bg-dark text-white-50 border border-secondary px-3 py-2 flex-shrink-0"
                style={{ whiteSpace: 'nowrap' }}
              >
                Ver Registros →
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};