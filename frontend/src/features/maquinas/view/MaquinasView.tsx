import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Maquina } from '../types/Maquina';
import { MaquinaTabla } from '../components/MaquinaTabla';
import { MaquinaModal } from '../components//MaquinaModal';
import { MaquinaFallaModal } from '../components//MaquinaFallaModal';
import { HistorialIncidenciasModal } from '../components//HistorialIncidenciasModal';
import { useTheme } from '../../../Context/ThemeContext';

export const MaquinasView: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables de tema
  const cardBg = isDark ? '#1b1b1b' : '#ffffff';
  const cardBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const textSubtle = isDark ? '#a1a1aa' : '#64748b';
  const inputBg = isDark ? '#121214' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const titleColor = isDark ? '#ffffff' : '#0f172a';

  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');

  // Modales
  const [showModalCrud, setShowModalCrud] = useState(false);
  const [maquinaAEditar, setMaquinaAEditar] = useState<Maquina | null>(null);

  const [showModalFalla, setShowModalFalla] = useState(false);

  const [showModalHistorial, setShowModalHistorial] = useState(false);
  const [maquinaHistorial, setMaquinaHistorial] = useState<Maquina | null>(null);

  const getUsuarioActualId = () => {
    const usrStr = localStorage.getItem('usuario_logueado');
    if (usrStr) {
      try {
        const obj = JSON.parse(usrStr);
        return obj.idEmpleado || obj.idUsuario || obj.id_usuario || 1;
      } catch (e) {
        return 1;
      }
    }
    return 1;
  };

  const cargarMaquinas = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:8080/api/maquinas');
      if (res.ok) {
        const data = await res.json();
        setMaquinas(data);
      }
    } catch (err) {
      console.error("Error al cargar máquinas:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMaquinas();
  }, []);

  const handleGuardarMaquina = async (maquina: Maquina & { observacion?: string }) => {
    const url = maquina.idMaquina
      ? `http://localhost:8080/api/maquinas/${maquina.idMaquina}`
      : 'http://localhost:8080/api/maquinas';

    const method = maquina.idMaquina ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idMaquina: maquina.idMaquina,
        nombre: maquina.nombre,
        estado: maquina.estado
      })
    });

    if (res.ok) {
      if (maquina.idMaquina && maquina.observacion) {
        try {
          const incRes = await fetch(`http://localhost:8080/api/incidencias/maquina/${maquina.idMaquina}`);
          if (incRes.ok) {
            const incidencias: any[] = await incRes.json();
            const pendiente = incidencias.find((i: any) => i.estadoIncidencia === 'PENDIENTE');

            if (maquina.estado === 'OPERATIVA' && pendiente) {
              await fetch(`http://localhost:8080/api/incidencias/${pendiente.idIncidencia}/resolver`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  resolucion: maquina.observacion,
                  idEmpleadoResuelve: getUsuarioActualId()
                })
              });
            } else if (maquina.estado === 'MANTENIMIENTO' && !pendiente) {
              await fetch('http://localhost:8080/api/incidencias/reportar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  idMaquina: maquina.idMaquina,
                  descripcion: `[MANTENIMIENTO PROGRAMADO] ${maquina.observacion}`,
                  prioridad: 'MEDIA',
                  idEmpleadoReporta: getUsuarioActualId()
                })
              });
            } else if (['FUERA DE SERVICIO', 'FALLA'].includes(maquina.estado) && !pendiente) {
              await fetch('http://localhost:8080/api/incidencias/reportar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  idMaquina: maquina.idMaquina,
                  descripcion: `[${maquina.estado}] ${maquina.observacion}`,
                  prioridad: 'ALTA',
                  idEmpleadoReporta: getUsuarioActualId()
                })
              });
            }
          }
        } catch (err) {
          console.error("Error al sincronizar historial:", err);
        }
      }

      cargarMaquinas();
    } else {
      throw new Error("No se pudo procesar la solicitud.");
    }
  };

  const handleReportarFalla = async (idMaquina: number, descripcion: string, prioridad: string) => {
    const res = await fetch('http://localhost:8080/api/incidencias/reportar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        idMaquina, 
        descripcion, 
        prioridad,
        idEmpleadoReporta: getUsuarioActualId()
      })
    });

    if (res.ok) {
      cargarMaquinas();
    } else {
      throw new Error("Error al reportar la incidencia.");
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm("¿Seguro que desea eliminar esta máquina?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/maquinas/${id}`, { method: 'DELETE' });
      if (res.ok) cargarMaquinas();
    } catch (err) {
      console.error(err);
    }
  };

  const maquinasFiltradas = maquinas.filter(m =>
    m.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    m.estado.toLowerCase().includes(filtro.toLowerCase())
  );

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