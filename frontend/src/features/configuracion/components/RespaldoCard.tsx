// src/features/configuracion/components/RespaldoCard.tsx
import React from 'react';
import { useEffect } from 'react';
import { useConfiguracion } from '../hooks/useConfiguracion';

interface Props {
  config: ReturnType<typeof useConfiguracion>;
  esOscuro: boolean;
  cardBg: string;
  cardBorder: string;
  subBg: string;
  mutedTextColor: string;
  inputBgClass: string;
}

export const RespaldoCard: React.FC<Props> = ({
  config,
  esOscuro,
  cardBg,
  cardBorder,
  subBg,
  mutedTextColor,
  inputBgClass
}) => {
  const {
    usuario,
    historialRespaldos,
    cargarHistorialRespaldos,
    cargandoRespaldo,
    mensajeRespaldo,
    archivoSeleccionado, setArchivoSeleccionado,
    cargandoRestaurar,
    setMostrarModalConfirmacion,
    handleGenerarRespaldo,
    handleDescargarRespaldoHistorial,
    handleEliminarRespaldo
  } = config;

  // Detección del rol ADMIN
  const rolNombre = typeof usuario?.rol === 'string' 
    ? usuario.rol 
    : usuario?.rol?.nombreRol || usuario?.rol?.nombre || '';

  const esAdmin = rolNombre.toString().toUpperCase() === 'ADMIN';

  const handleRestaurarClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoSeleccionado) return;
    setMostrarModalConfirmacion(true);
  };
  
  useEffect(() => {
    cargarHistorialRespaldos();
  }, []);

  return (
    <div className="col-12 col-lg-7">
      <div className="p-4 rounded-4 shadow h-100 position-relative overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        
        {/* Capa de Bloqueo Exclusiva para la Tarjeta de Respaldos */}
        {!esAdmin && (
          <div 
            className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-4"
            style={{
              zIndex: 20,
              backgroundColor: esOscuro ? 'rgba(24, 24, 27, 0.94)' : 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(3px)'
            }}
          >
            <i className="bi bi-lock-fill text-warning display-4 mb-2"></i>
            <h5 className="fw-bold mb-2" style={{ color: esOscuro ? '#ffffff' : '#18181b' }}>
              Función Bloqueada
            </h5>
            <p className={`${mutedTextColor} small mb-0 px-3`} style={{ maxWidth: '380px' }}>
              Solo los usuarios con perfil <strong>ADMIN</strong> tienen acceso a la generación y restauración de respaldos.
            </p>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-1 text-info-custom">
              <i className="bi bi-hdd-network me-2"></i>Respaldo Local Contingente
            </h5>
            <p className={`${mutedTextColor} small mb-0`}>Generación y carga de datos para contingencias operativas</p>
          </div>
          <button 
            onClick={handleGenerarRespaldo}
            disabled={cargandoRespaldo}
            className="btn fw-bold px-3 shadow"
            style={{ backgroundColor: '#0da6c5', color: '#ffffff', borderRadius: '8px' }}
          >
            <i className="bi bi-download me-2"></i>
            {cargandoRespaldo ? 'Generando...' : 'Generar Respaldo Ahora'}
          </button>
        </div>

        {mensajeRespaldo && (
          <div className={`alert ${mensajeRespaldo.tipo === 'error' ? 'alert-danger bg-danger text-white' : 'alert-success bg-success text-white'} border-0 py-2 small fw-bold mb-3`}>
            <i className={`bi ${mensajeRespaldo.tipo === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'} me-2`}></i>
            {mensajeRespaldo.texto}
          </div>
        )}

        <div className="p-3 mb-4 rounded border border-secondary" style={{ backgroundColor: subBg }}>
          <h6 className="fw-bold text-warning mb-2 small">
            <i className="bi bi-upload me-2"></i>Cargar / Restaurar Copia de Seguridad
          </h6>
          <form onSubmit={handleRestaurarClick} className="d-flex gap-2">
            <input 
              type="file" 
              accept=".json"
              className={`form-control form-control-sm ${inputBgClass} font-monospace`}
              onChange={(e) => setArchivoSeleccionado(e.target.files ? e.target.files[0] : null)}
            />
            <button 
              type="submit" 
              disabled={cargandoRestaurar || !archivoSeleccionado}
              className="btn btn-warning btn-sm fw-bold text-nowrap px-3"
              style= {{ color: "#ffffff"}}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i>
              {cargandoRestaurar ? 'Cargando...' : 'Restaurar Datos'}
            </button>
          </form>
        </div>

        <div className="mt-3">
          <h6 className={`fw-bold ${mutedTextColor} mb-3 small`}>Historial de Respaldos Generados</h6>
          
          <div className="table-responsive rounded border border-secondary" style={{ maxHeight: '280px' }}>
            <table className={`table ${esOscuro ? 'table-dark' : 'table-light'} table-hover mb-0 align-middle small`}>
              <thead style={{ backgroundColor: esOscuro ? '#27272a' : '#e4e4e7' }}>
                <tr>
                  <th>Fecha / Hora</th>
                  <th>Archivo</th>
                  <th>Tamaño</th>
                  <th>Operador</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historialRespaldos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`text-center py-4 ${mutedTextColor}`}>
                      No hay respaldos registrados en el sistema.
                    </td>
                  </tr>
                ) : (
                  historialRespaldos.map((resp) => (
                    <tr key={resp.idRespaldo}>
                      <td>{new Date(resp.fechaHora).toLocaleString('es-AR')}</td>
                      <td className="text-info">{resp.nombreArchivo}</td>
                      <td><span className="badge bg-secondary">{resp.tamanio}</span></td>
                      <td><b>@{resp.usuarioOperador}</b></td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button 
                            onClick={() => handleDescargarRespaldoHistorial(resp.idRespaldo, resp.nombreArchivo)}
                            className="btn btn-outline-info btn-sm"
                            title="Descargar"
                          >
                            <i className="bi bi-download"></i>
                          </button>
                          <button 
                            onClick={() => handleEliminarRespaldo(resp.idRespaldo)}
                            className="btn btn-outline-danger btn-sm"
                            title="Eliminar"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};