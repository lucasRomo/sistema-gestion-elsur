import React from 'react';
import type { AreaCurso, Institucion } from '../types/Repositorio';

interface Props {
  busqueda: string;
  setBusqueda: (v: string) => void;
  filtroMateria: string;
  setFiltroMateria: (v: string) => void;
  filtroInstitucion: string;
  setFiltroInstitucion: (v: string) => void;
  areas: AreaCurso[];
  instituciones: Institucion[];
  onAgregarDocumento: () => void;
  textColor: string;
  inputBg: string;
  cardBorder: string;
}

export const FiltrosRepositorio: React.FC<Props> = ({
  busqueda,
  setBusqueda,
  filtroMateria,
  setFiltroMateria,
  filtroInstitucion,
  setFiltroInstitucion,
  areas,
  instituciones,
  onAgregarDocumento,
  textColor,
  inputBg,
  cardBorder,
}) => {
  return (
    <>
      <h5 className="fw-bold mb-3">Buscador y Filtros</h5>
      <div className="input-group mb-3">
        <input
          type="text"
          className={`form-control ${textColor}`}
          style={{ backgroundColor: inputBg, borderColor: cardBorder }}
          placeholder="Buscar por título, autor o materia..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <span className="input-group-text border-secondary text-secondary" style={{ backgroundColor: inputBg, borderColor: cardBorder }}>
          <i className="bi bi-search"></i>
        </span>
      </div>

      <div className="row g-2 mb-3 align-items-center">
        <div className="col-md-5">
          <label className="small text-secondary fw-bold mb-1">Filtrar por Materia:</label>
          <select
            className={`form-select form-select-sm ${textColor}`}
            style={{ backgroundColor: inputBg, borderColor: cardBorder }}
            value={filtroMateria}
            onChange={(e) => setFiltroMateria(e.target.value)}
          >
            <option value="">Sin Filtro</option>
            {areas.map((a) => (
              <option key={a.idArea} value={a.idArea}>{a.nombreArea}</option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label className="small text-secondary fw-bold mb-1">Filtrar por Institución:</label>
          <select
            className={`form-select form-select-sm ${textColor}`}
            style={{ backgroundColor: inputBg, borderColor: cardBorder }}
            value={filtroInstitucion}
            onChange={(e) => setFiltroInstitucion(e.target.value)}
          >
            <option value="">Sin Filtro</option>
            {instituciones.map((i) => (
              <option key={i.idInstitucion} value={i.idInstitucion}>{i.nombreInstitucion}</option>
            ))}
          </select>
        </div>

        <div className="col-md-3 d-flex align-items-end">
          <button
            className="btn btn-sm w-100 fw-bold mt-3"
            style={{ backgroundColor: '#28a745', color: '#ffffff' }}
            onClick={onAgregarDocumento}
          >
            Agregar Documento
          </button>
        </div>
      </div>
    </>
  );
};