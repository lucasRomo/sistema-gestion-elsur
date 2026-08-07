import React, { useEffect, useState } from 'react';
import type { Maquina } from '../types/Maquina';
import { MaquinaTabla } from '../features/maquinas/MaquinaTabla';
import { MaquinaModal } from '../features/maquinas/MaquinaModal';
import { MaquinaFallaModal } from '../features/maquinas/MaquinaFallaModal';
import { HistorialIncidenciasModal } from '../features/maquinas/HistorialIncidenciasModal';

export const MaquinasView: React.FC = () => {
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

    // 1. Guardar cambios básicos de la máquina
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
      // 2. Sincronización automática con el historial según el estado seleccionado
      if (maquina.idMaquina && maquina.observacion) {
        try {
          const incRes = await fetch(`http://localhost:8080/api/incidencias/maquina/${maquina.idMaquina}`);
          if (incRes.ok) {
            const incidencias: any[] = await incRes.json();
            const pendiente = incidencias.find((i: any) => i.estadoIncidencia === 'PENDIENTE');

            if (maquina.estado === 'OPERATIVA' && pendiente) {
              // Si pasa a OPERATIVA, resuelve la incidencia pendiente
              await fetch(`http://localhost:8080/api/incidencias/${pendiente.idIncidencia}/resolver`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  resolucion: maquina.observacion,
                  idEmpleadoResuelve: getUsuarioActualId()
                })
              });
            } else if (maquina.estado === 'MANTENIMIENTO' && !pendiente) {
              // Si pasa a MANTENIMIENTO y no había ticket abierto
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
              // Si pasa a FUERA DE SERVICIO o FALLA
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
    <div className="container-fluid font-monospace" style={{ color: '#ffffff' }}>
      
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
        <div>
          <h3 className="fw-bold text-white mb-1">
            <i className="bi bi-cpu me-2 text-warning"></i>Gestión de Equipos y Máquinas
          </h3>
          <small className="text-white-50">Control operativo e historial de incidencias técnicas</small>
        </div>
      </div>

      {/* Buscador */}
      <div className="row mb-3">
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text bg-dark border-secondary text-white-50">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control bg-dark text-white border-secondary"
              placeholder="Buscar por equipo o estado..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Equipos */}
      <div className="card bg-dark border-secondary rounded-3 shadow">
        <div className="card-body p-0">
          {cargando ? (
            <div className="text-center py-5 text-white-50">
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

      {/* Botones inferiores */}
      <div className="d-flex justify-content-end gap-2 mt-3 mb-4">
        <button
          className="btn btn-danger fw-bold px-3 shadow"
          onClick={() => setShowModalFalla(true)}
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>Reportar Falla
        </button>
        <button
          className="btn btn-warning fw-bold text-dark px-3 shadow"
          onClick={() => {
            setMaquinaAEditar(null);
            setShowModalCrud(true);
          }}
        >
          <i className="bi bi-plus-circle me-2"></i>Nuevo Equipo
        </button>
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