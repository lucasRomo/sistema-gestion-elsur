import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface RegistroActividad {
  idRegAct: number;
  fecha: string;
  usuario?: {
    idUsuario: number;
    nombreUsuario: string;
    persona?: {
      nombre: string;
      apellido: string;
    };
  };
  accion: string;
  tablaAfectada: string;
  columnaAfectada: string;
  idRegistroMod: number;
  datosAnteriores: string | null;
  datosNuevos: string | null;
}

export const HistorialActividadView: React.FC = () => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState<RegistroActividad[]>([]);
  const [filtroEmpleado, setFiltroEmpleado] = useState<string>('Sin Filtro');
  const [busquedaTabla, setBusquedaTabla] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarActividades = async () => {
    try {
      setCargando(true);
      const response = await fetch('http://localhost:8080/api/registro-actividad');
      if (response.ok) {
        const data = await response.json();
        setActividades(data);
      }
    } catch (error) {
      console.error('Error al conectar con la API de historial:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarActividades();
  }, []);

  const obtenerNombreUsuario = (reg: RegistroActividad) => {
    if (reg.usuario?.persona) {
      return `${reg.usuario.persona.nombre} ${reg.usuario.persona.apellido}`;
    }
    return reg.usuario?.nombreUsuario || 'Sistema';
  };

  const formatearDato = (dato: string | null) => {
    if (!dato) return '-';
    return dato.replace(/^"(.*)"$/, '$1');
  };

  const empleadosUnicos = Array.from(
    new Set(actividades.map((a) => obtenerNombreUsuario(a)))
  );

  const actividadesFiltradas = actividades.filter((act) => {
    const nombreUsuario = obtenerNombreUsuario(act);
    const coincideEmpleado =
      filtroEmpleado === 'Sin Filtro' || nombreUsuario === filtroEmpleado;
    const coincideTabla = (act.tablaAfectada || '')
      .toLowerCase()
      .includes(busquedaTabla.toLowerCase());

    return coincideEmpleado && coincideTabla;
  });

  return (
    <div className="container-fluid text-white p-3 font-sans" style={{ minHeight: '100vh' }}>
      
      {/* Título Superior */}
      <div className="d-flex align-items-center mb-4">
        <h2 className="fw-bold fs-2 text-white m-0">Historial de Actividad</h2>
      </div>

      {/* Tarjeta Contenedora Principal */}
      <div 
        className="card border-0 p-4 rounded-3 shadow-sm mb-4"
        style={{ backgroundColor: '#1d1d1d', border: '1px solid #1d1d1d' }}
      >
        {/* Filtros Superiores */}
        <div className="row g-3 mb-4">
          <div className="col-md-7">
            <label className="form-label text-secondary small fw-semibold mb-1">
              Filtro por Tabla Modificada:
            </label>
            <div className="position-relative">
              <input
                type="text"
                className="form-control text-white border-secondary bg-dark shadow-none"
                style={{ backgroundColor: '#1d1d1d', borderColor: '#1d1d1d' }}
                placeholder="Buscar tabla (ej. clientes, productos)..."
                value={busquedaTabla}
                onChange={(e) => setBusquedaTabla(e.target.value)}
              />
              <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-secondary"></i>
            </div>
          </div>

          <div className="col-md-5">
            <label className="form-label text-secondary small fw-semibold mb-1">
              Empleado / Usuario:
            </label>
            <select
              className="form-select text-white border-secondary bg-dark shadow-none"
              style={{ backgroundColor: '#1d1d1d', borderColor: '#1d1d1d' }}
              value={filtroEmpleado}
              onChange={(e) => setFiltroEmpleado(e.target.value)}
            >
              <option value="Sin Filtro">Todos los usuarios</option>
              {empleadosUnicos.map((emp) => (
                <option key={emp} value={emp}>
                  {emp}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla con Scroll Interno y Cabecera Fija */}
        <div 
          className="table-responsive" 
          style={{ maxHeight: '60vh', overflowY: 'auto' }}
        >
          <table className="table table-borderless text-white align-middle mb-0" style={{ '--bs-table-bg': '#1d1d1d', '--bs-table-color': '#ffffff' } as React.CSSProperties}>
            <thead className="sticky-top" style={{ backgroundColor: '#1d1d1d', zIndex: 1 }}>
              <tr className="border-bottom border-secondary text-secondary" style={{ fontSize: '0.8rem', letterSpacing: '0.3px' }}>
                <th className="py-3 fw-bold" style={{ width: '18%', backgroundColor: '#1d1d1d' }}>FECHA Y HORA</th>
                <th className="py-3 fw-bold" style={{ width: '18%', backgroundColor: '#1d1d1d' }}>USUARIO RESPONSIBLE</th>
                <th className="py-3 fw-bold" style={{ width: '15%', backgroundColor: '#1d1d1d' }}>TABLA AFECTADA</th>
                <th className="py-3 fw-bold" style={{ width: '15%', backgroundColor: '#1d1d1d' }}>COLUMNA AFECTADA</th>
                <th className="py-3 fw-bold text-center" style={{ width: '10%', backgroundColor: '#1d1d1d' }}>ID ITEM MODIF.</th>
                <th className="py-3 fw-bold text-start" style={{ width: '12%', backgroundColor: '#1d1d1d' }}>DATO PREVIO</th>
                <th className="py-3 fw-bold text-start" style={{ width: '12%', backgroundColor: '#1d1d1d' }}>DATO MODIF.</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '0.88rem' }}>
              {cargando ? (
                <tr>
                  <td colSpan={7} className="py-5 text-center text-muted">
                    <div className="spinner-border spinner-border-sm text-secondary me-2" role="status" />
                    Cargando movimientos...
                  </td>
                </tr>
              ) : actividadesFiltradas.length > 0 ? (
                actividadesFiltradas.map((act) => (
                  <tr key={act.idRegAct} className="border-bottom border-dark">
                    <td className="text-secondary font-monospace" style={{ fontSize: '0.85rem' }}>
                      {new Date(act.fecha).toLocaleString('es-AR', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="fw-semibold text-white">
                      <i className="bi bi-person me-2 text-secondary"></i>
                      {obtenerNombreUsuario(act)}
                    </td>
                    <td className="text-white-50">{act.tablaAfectada}</td>
                    <td className="text-white-50">{act.columnaAfectada || '-'}</td>
                    <td className="text-center font-monospace text-warning">
                      #{act.idRegistroMod || '-'}
                    </td>
                    <td className="text-secondary text-start">{formatearDato(act.datosAnteriores)}</td>
                    <td className="fw-semibold text-success text-start">{formatearDato(act.datosNuevos)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-5 text-center text-secondary">
                    No se registraron movimientos en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón Volver */}
      <div className="d-flex justify-content-start mb-3">
        <button 
          className="btn btn-danger px-4 fw-semibold rounded-2 shadow-sm"
          style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', fontSize: '0.95rem' }}
          onClick={() => navigate(-1)}
        >
          Volver
        </button>
      </div>

    </div>
  );
};