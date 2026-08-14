import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MaquinaTabla } from '../components/MaquinaTabla';
import { MaquinaModal } from '../components/MaquinaModal';
import { MaquinaFallaModal } from '../components/MaquinaFallaModal';
import { HistorialIncidenciasModal } from '../components/HistorialIncidenciasModal';
import { useTheme } from '../../../Context/ThemeContext';
import { useMaquinas } from '../hook/useMaquinas';

export const MaquinasView: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables de tema
  const cardBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const textSubtle = isDark ? '#a1a1aa' : '#64748b';
  const inputBg = isDark ? '#121214' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const titleColor = isDark ? '#ffffff' : '#0f172a';

  const {
    maquinas,
    maquinasFiltradas,
    cargando,
    filtro,
    setFiltro,
    showModalCrud,
    setShowModalCrud,
    maquinaAEditar,
    setMaquinaAEditar,
    showModalFalla,
    setShowModalFalla,
    showModalHistorial,
    setShowModalHistorial,
    maquinaHistorial,
    setMaquinaHistorial,
    cargarMaquinas,
    handleGuardarMaquina,
    handleReportarFalla,
    handleEliminar
  } = useMaquinas();

  return (
    <div className="container-fluid font-monospace" style={{ color: textColor }}>
      
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
        <div>
          <h3 className="fw-bold mb-1" style={{ color: titleColor }}>
            <i className="bi bi-cpu me-2 text-warning"></i>Gestión de Equipos y Máquinas
          </h3>
          <small style={{ color: textSubtle }}>Control operativo e historial de incidencias técnicas</small>
        </div>
      </div>

      {/* Buscador */}
      <div className="row mb-3">
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text" style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textSubtle }}>
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
              placeholder="Buscar por equipo o estado..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Equipos */}
      <div>
        <div className="card-body p-0">
          {cargando ? (
            <div className="text-center py-5" style={{ color: textSubtle }}>
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              Cargando equipos...
            </div>
          ) : (
            <MaquinaTabla
              maquinas={maquinasFiltradas}
              onEditar={(m) => {
                setMaquinaAEditar(m);
                setShowModalCrud(true);
              }}
              onVerIncidencias={(m) => {
                setMaquinaHistorial(m);
                setShowModalHistorial(true);
              }}
              onEliminar={handleEliminar}
            />
          )}
        </div>
      </div>

      {/* Botones de acción inferior */}
      <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
        <button
          className="btn btn-danger fw-bold px-3 shadow"
          onClick={() => navigate('/dashboard')}
        >
          <i className="bi me-2"></i>Volver
        </button>

        <div className="d-flex gap-2">
          <button
            className="btn btn-danger fw-bold px-3 shadow"
            onClick={() => setShowModalFalla(true)}
          >
            Reportar Falla
          </button>
          <button
            className="btn btn-warning fw-bold px-3 shadow"
            style={{ backgroundColor: "#ce9b0e", borderColor: "#ce9b0e", color: '#ffffff' }}
            onClick={() => {
              setMaquinaAEditar(null);
              setShowModalCrud(true);
            }}
          >
            <i className="bi me-2"></i>Nuevo Equipo
          </button>
        </div>
      </div>

      {/* Modales */}
      <MaquinaModal
        show={showModalCrud}
        maquinaEditar={maquinaAEditar}
        onClose={() => setShowModalCrud(false)}
        onGuardar={handleGuardarMaquina}
      />

      <MaquinaFallaModal
        show={showModalFalla}
        maquinas={maquinas}
        onClose={() => setShowModalFalla(false)}
        onReportarFalla={handleReportarFalla}
      />

      <HistorialIncidenciasModal
        show={showModalHistorial}
        maquina={maquinaHistorial}
        onClose={() => setShowModalHistorial(false)}
        onIncidenciaResuelta={cargarMaquinas}
      />
    </div>
  );
};