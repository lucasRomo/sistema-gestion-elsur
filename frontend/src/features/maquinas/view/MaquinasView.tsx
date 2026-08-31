import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaquinaTabla } from '../components/MaquinaTabla';
import { MaquinaModal } from '../components/MaquinaModal';
import { MaquinaFallaModal } from '../components/MaquinaFallaModal';
import { HistorialIncidenciasModal } from '../components/HistorialIncidenciasModal';
import { SuccesModal } from '../../../components/layouts/SuccesModal';
import { useTheme } from '../../../Context/ThemeContext';
import { useMaquinas } from '../hook/useMaquinas';
import { useIsMobile } from '../../../hook/useIsMobile';

export const MaquinasView: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();

  // Variables de tema adaptativas unificadas
  const mainCardBg = isDark ? '#1d1d1d' : '#ffffff';
  const filterBg = isDark ? '#1b1b1b' : '#ffffff';
  const filterBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const cardBorder = isDark ? '#27272a' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const textSubtle = isDark ? '#a1a1aa' : '#64748b';
  const inputTextColor = isDark ? 'text-white' : 'text-dark';
  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? 'rgba(255,255,255,0.6)' : '#64748b';

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
    <div className="container-fluid px-0 h-100 d-flex flex-column font-monospace" style={{ color: textColor }}>
      
      {/* Encabezado Superior */}
      <div className="d-flex justify-content-center align-items-center mb-4">
        <h2 className="fw-bold fs-2 m-0 text-center font-monospace" style={{ color: titleColor }}>
          Gestión de Equipos y Máquinas
        </h2>
      </div>

      {/* Contenedor de Filtros */}
      <div 
        className="row g-3 align-items-center mb-4 p-3 rounded-3 shadow-sm font-monospace" 
        style={{ 
          backgroundColor: filterBg, 
          border: `1px solid ${filterBorder}`,
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <div className="col-12">
          <label className="form-label small fw-semibold" style={{ color: labelColor }}>
            Filtrar por Equipo o Estado:
          </label>
          <input
            type="text"
            className={`form-control ${inputTextColor} py-2 font-monospace shadow-none`}
            style={{ 
              backgroundColor: filterBg, 
              borderColor: filterBorder 
            }}
            placeholder="Buscar por equipo o estado..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      {/* Contenedor de Tabla */}
      <div 
        className="table-responsive rounded-3 border mb-3 font-monospace" 
        style={{ 
          backgroundColor: mainCardBg, 
          borderColor: cardBorder,
          height: '65.3vh',
          overflowY: 'auto',
          display: 'block'
        }}
      >
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

      {/* Barra Inferior: Mismo padding, font-size y estructura exacta que Usuarios */}
      <div className={`d-flex align-items-center mt-3 mb-4 font-monospace ${isMobile ? 'justify-content-stretch' : 'justify-content-between'}`}>
        
        {!isMobile && (
          <button
            className="btn btn-secondary fw-bold shadow-sm font-monospace d-inline-flex align-items-center justify-content-center"
            style={{ 
              color: '#ffffff',
              padding: '11px 24px',
              fontSize: '1rem',
              minWidth: '90px'
            }}
            onClick={() => navigate('/dashboard')}
          >
            Volver
          </button>
        )}

        <div className={`d-flex gap-2 ${isMobile ? 'w-100' : ''}`}>
          <button
            className={`btn btn-danger fw-bold shadow-sm d-inline-flex align-items-center justify-content-center ${isMobile ? 'flex-fill text-nowrap' : ''}`}
            style={{ 
              color: '#ffffff',
              padding: '11px 24px',
              fontSize: '1rem',
              minWidth: '90px'
            }}
            onClick={() => setShowModalFalla(true)}
          >
            Reportar Falla
          </button>
          <button
            className={`btn btn-warning fw-bold shadow-sm d-inline-flex align-items-center justify-content-center ${isMobile ? 'flex-fill text-nowrap' : ''}`}
            style={{ 
              backgroundColor: "#ffc107", 
              borderColor: "#ffc107", 
              color: '#ffffff',
              padding: '11px 24px',
              fontSize: '1rem',
              minWidth: '90px'
            }}
            onClick={() => {
              setMaquinaAEditar(null);
              setShowModalCrud(true);
            }}
          >
            Nuevo Equipo
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