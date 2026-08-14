import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../Context/ThemeContext';
import { useHistorialActividad } from '../hooks/useHistorialActividad';
import type { RegistroActividad } from '../types/RegistroActividad';
import {
  exportarHistorialActividadExcel,
  exportarHistorialActividadPDF,
} from '../utils/exportHistorialActividadUtils';

export const HistorialActividadView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables de estilo adaptativas
  const mainCardBg = isDark ? '#1d1d1d' : '#ffffff';
  const cardBorder = isDark ? '#27272a' : '#cbd5e1';
  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const inputBg = isDark ? '#1d1d1d' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const inputText = isDark ? '#ffffff' : '#0f172a';
  
  const thBg = isDark ? '#1d1d1d' : '#f8fafc';
  const thText = isDark ? '#a1a1aa' : '#475569';
  const rowBorder = isDark ? '#27272a' : '#e2e8f0';
  
  const userTextColor = isDark ? '#ffffff' : '#0f172a';
  const mutedText = isDark ? '#a1a1aa' : '#64748b';

  const navigate = useNavigate();
  const { actividades, cargando } = useHistorialActividad();

  const [filtroEmpleado, setFiltroEmpleado] = useState<string>('Sin Filtro');
  const [busquedaTabla, setBusquedaTabla] = useState<string>('');

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
    <div className="container-fluid p-3 font-sans" style={{ minHeight: '100vh' }}>
      
      {/* Título Superior */}
      <div className="d-flex justify-content-center align-items-center mb-4">
        <h2 className="fw-bold fs-2 m-0 text-center" style={{ color: titleColor }}>
          Historial de Actividad
        </h2>
      </div>

      {/* Tarjeta Contenedora Principal */}
      <div 
        className="card border-0 p-4 rounded-3 shadow-sm mb-4"
        style={{ backgroundColor: mainCardBg, border: `1px solid ${cardBorder}` }}
      >
        {/* Filtros Superiores */}
        <div className="row g-3 mb-4">
          <div className="col-md-7">
            <label className="form-label small fw-semibold mb-1" style={{ color: labelColor }}>
              Filtro por Tabla Modificada:
            </label>
            <div className="position-relative">
              <input
                type="text"
                className="form-control shadow-none"
                style={{ 
                  backgroundColor: inputBg, 
                  borderColor: inputBorder, 
                  color: inputText 
                }}
                placeholder="Buscar tabla (ej. clientes, productos)..."
                value={busquedaTabla}
                onChange={(e) => setBusquedaTabla(e.target.value)}
              />
              <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3" style={{ color: mutedText }}></i>
            </div>
          </div>

          <div className="col-md-5">
            <label className="form-label small fw-semibold mb-1" style={{ color: labelColor }}>
              Empleado / Usuario:
            </label>
            <select
              className="form-select shadow-none"
              style={{ 
                backgroundColor: inputBg, 
                borderColor: inputBorder, 
                color: inputText 
              }}
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

        {/* BOTONES DE EXPORTACIÓN (EXCEL Y PDF) */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          <button 
            className="btn btn-outline-success fw-bold d-flex align-items-center gap-2"
            onClick={() => exportarHistorialActividadExcel(actividadesFiltradas)}
            disabled={actividadesFiltradas.length === 0 || cargando}
            title="Exportar historial actual a Excel"
          >
            <i className="bi bi-file-earmark-excel-fill fs-5"></i>
            Exportar Excel
          </button>

          <button 
            className="btn btn-outline-danger fw-bold d-flex align-items-center gap-2"
            onClick={() => exportarHistorialActividadPDF(actividadesFiltradas)}
            disabled={actividadesFiltradas.length === 0 || cargando}
            title="Exportar historial actual a PDF"
          >
            <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
            Exportar PDF
          </button>
        </div>

        {/* Tabla con Scroll Interno y Cabecera Fija */}
        <div 
          className="table-responsive" 
          style={{ maxHeight: '60vh', overflowY: 'auto' }}
        >
          <table className="w-100 align-middle mb-0" style={{ color: inputText, backgroundColor: 'transparent', borderCollapse: 'collapse' }}>
            <thead className="sticky-top" style={{ backgroundColor: thBg, zIndex: 1 }}>
              <tr className="border-bottom" style={{ fontSize: '0.8rem', letterSpacing: '0.3px', borderColor: rowBorder, color: thText }}>
                <th className="py-3 fw-bold" style={{ width: '18%', backgroundColor: thBg }}>FECHA Y HORA</th>
                <th className="py-3 fw-bold" style={{ width: '18%', backgroundColor: thBg }}>USUARIO RESPONSABLE</th>
                <th className="py-3 fw-bold" style={{ width: '15%', backgroundColor: thBg }}>TABLA AFECTADA</th>
                <th className="py-3 fw-bold" style={{ width: '15%', backgroundColor: thBg }}>COLUMNA AFECTADA</th>
                <th className="py-3 fw-bold text-center" style={{ width: '10%', backgroundColor: thBg }}>ID ITEM MODIF.</th>
                <th className="py-3 fw-bold text-start" style={{ width: '12%', backgroundColor: thBg }}>DATO PREVIO</th>
                <th className="py-3 fw-bold text-start" style={{ width: '12%', backgroundColor: thBg }}>DATO MODIF.</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '0.88rem' }}>
              {cargando ? (
                <tr>
                  <td colSpan={7} className="py-5 text-center" style={{ color: mutedText }}>
                    <div className="spinner-border spinner-border-sm me-2" role="status" style={{ color: mutedText }} />
                    Cargando movimientos...
                  </td>
                </tr>
              ) : actividadesFiltradas.length > 0 ? (
                actividadesFiltradas.map((act) => (
                  <tr key={act.idRegAct} className="border-bottom" style={{ borderColor: rowBorder }}>
                    <td className="font-monospace py-3" style={{ fontSize: '0.85rem', color: mutedText }}>
                      {new Date(act.fecha).toLocaleString('es-AR', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="fw-semibold py-3" style={{ color: userTextColor }}>
                      <i className="bi bi-person me-2" style={{ color: mutedText }}></i>
                      {obtenerNombreUsuario(act)}
                    </td>
                    <td className="py-3" style={{ color: mutedText }}>{act.tablaAfectada}</td>
                    <td className="py-3" style={{ color: mutedText }}>{act.columnaAfectada || '-'}</td>
                    <td className="text-center font-monospace text-warning py-3">
                      #{act.idRegistroMod || '-'}
                    </td>
                    <td className="text-start py-3" style={{ color: mutedText }}>{formatearDato(act.datosAnteriores)}</td>
                    <td className="fw-semibold text-success text-start py-3">{formatearDato(act.datosNuevos)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-5 text-center" style={{ color: inputText }}>
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
          className="btn px-4 fw-semibold rounded-2 shadow-sm"
          style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#ffffff', fontSize: '0.95rem' }}
          onClick={() => navigate(-1)}
        >
          Volver
        </button>
      </div>

    </div>
  );
};