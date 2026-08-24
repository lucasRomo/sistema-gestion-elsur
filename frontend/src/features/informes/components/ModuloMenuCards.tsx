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

        {/* Tarjeta de Registros de Arqueo (En lugar de Exportar PDF, visible solo para Admin) */}
        {esAdmin && (
          <div className="col-12 col-md-6 col-xl-4 d-flex">
            <div 
              onClick={() => setShowModalRegistrosArqueo(true)}
              className="card-menu-item p-4 w-100 d-flex flex-column justify-content-between"
              style={{ borderLeft: '5px solid #daa32d' }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <i className="bi bi-journal-check" style={{ fontSize: '2rem', color: '#daa32d' }}></i>
                  <span className="badge bg-dark text-white-50 border border-secondary px-2 py-1">Solo Admin</span>
                </div>
                <h4 className="fw-bold text-white mb-2">REGISTROS DE ARQUEO</h4>
                <p className="text-body-secondary small mb-0">
                  Revisá todos los cierres de caja registrados por turno, sus movimientos y diferencias de arqueo.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};