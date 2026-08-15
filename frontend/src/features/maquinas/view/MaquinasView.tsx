import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaquinaTabla } from '../components/MaquinaTabla';
import { MaquinaModal } from '../components/MaquinaModal';
import { MaquinaFallaModal } from '../components/MaquinaFallaModal';
import { HistorialIncidenciasModal } from '../components/HistorialIncidenciasModal';
import { SuccesModal } from '../../../components/layouts/SuccesModal';
import { useTheme } from '../../../Context/ThemeContext';
import { useMaquinas } from '../hook/useMaquinas';

export const MaquinasView: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables de tema
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const textSubtle = isDark ? '#a1a1aa' : '#64748b';
  const inputBg = isDark ? '#1b1b1b' : '#ffffff';
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
    handleReportarFalla
  } = useMaquinas();

  // Estado para el SuccesModal
  const [successState, setSuccessState] = useState<{
    show: boolean;
    title: string;
    message: string;
    icon?: string;
  }>({
    show: false,
    title: '¡Éxito!',
    message: '',
    icon: 'bi-check-circle-fill'
  });

  const cerrarModalExito = () => {
    setSuccessState(prev => ({ ...prev, show: false }));
  };

  // Interceptor para guardar (Nuevo / Modificar)
  const onGuardarConFeedback = async (maquinaData: any) => {
    const esEdicion = Boolean(maquinaData.idMaquina);
    await handleGuardarMaquina(maquinaData);

    setSuccessState({
      show: true,
      title: esEdicion ? '¡Equipo Modificado!' : '¡Equipo Registrado!',
      message: esEdicion 
        ? `Se actualizaron correctamente los datos de "${maquinaData.nombre}".` 
        : `El equipo "${maquinaData.nombre}" se dio de alta correctamente.`,
      icon: 'bi-check-circle-fill'
    });
  };

  // Interceptor para reportar falla
  const onReportarFallaConFeedback = async (idMaquina: number, descripcion: string, prioridad: string) => {
    await handleReportarFalla(idMaquina, descripcion, prioridad);

    setSuccessState({
      show: true,
      title: '¡Falla Reportada!',
      message: 'La incidencia se registró correctamente y el equipo cambió a "Fuera de Servicio".',
      icon: 'bi-exclamation-triangle-fill'
    });
  };

  return (
    <div className="container-fluid font-monospace" style={{ color: textColor }}>
      
      {/* Encabezado */}
<div className="d-flex justify-content-center align-items-center mb-4 pb-2 text-center">
  <div className="w-100">
    <h3 className="fw-bold mb-1" style={{ color: titleColor }}>
      <i className="bi me-2 text-warning"></i>Gestión de Equipos y Máquinas
    </h3>
  </div>
</div>

      {/* Buscador */}
<div className="row mb-3">
  <div className="col-12">
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
            />
          )}
        </div>
      </div>

      {/* Botones de acción inferior */}
      <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
        <button
          className="btn btn-secondary fw-bold px-3 shadow"
          onClick={() => navigate('/dashboard')}
        >
          <i className="bi"></i>Volver
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

      {/* Modales de Operación */}
      <MaquinaModal
        show={showModalCrud}
        maquinaEditar={maquinaAEditar}
        onClose={() => setShowModalCrud(false)}
        onGuardar={onGuardarConFeedback}
      />

      <MaquinaFallaModal
        show={showModalFalla}
        maquinas={maquinas}
        onClose={() => setShowModalFalla(false)}
        onReportarFalla={onReportarFallaConFeedback}
      />

      <HistorialIncidenciasModal
  show={showModalHistorial}
  maquina={maquinaHistorial}
  onClose={() => setShowModalHistorial(false)}
  onIncidenciaResuelta={cargarMaquinas}
  onPagoExitoso={(msj) => {
    setSuccessState({
      show: true,
      title: '¡Pago Registrado!',
      message: msj,
      icon: 'bi-cash-coin'
    });
  }}
/>

      {/* Modal Reusable de Notificación de Éxito */}
      <SuccesModal
        show={successState.show}
        title={successState.title}
        message={successState.message}
        icon={successState.icon}
        onClose={cerrarModalExito}
      />
    </div>
  );
};