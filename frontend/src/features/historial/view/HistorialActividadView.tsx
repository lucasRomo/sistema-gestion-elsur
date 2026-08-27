import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../Context/ThemeContext';
import { useHistorialActividad } from '../hooks/useHistorialActividad';
import type { RegistroActividad } from '../types/RegistroActividad';
import type { Pedido } from '../../pedidos/types/Pedido';

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
  const thText = isDark ? '#ffffff' : '#334155';
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

  const formatearFecha = (fechaRaw?: string | null) => {
  if (!fechaRaw) return '-';
  const isoString = fechaRaw.endsWith('Z') || fechaRaw.includes('+') 
    ? fechaRaw 
    : `${fechaRaw}Z`;

  const fechaObj = new Date(isoString);
  if (isNaN(fechaObj.getTime())) return '-';

  return fechaObj.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  };

  return (
    <div className="container-fluid p-3 font-sans" style={{ minHeight: '100vh' }}>
      
      {/* Título Superior */}
      <div className="d-flex justify-content-center align-items-center mb-4">
        <h2 className="fw-bold fs-2 m-0 text-center" style={{ color: titleColor }}>
          Historial de Actividad
        </h2>
      </div>

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

      {/* Tabla con Scroll Interno y Tamaño Fijo */}
      <div 
        className="table-responsive rounded-3 border mb-3 font-monospace" 
        style={{ 
          backgroundColor: mainCardBg, 
          borderColor: cardBorder,
          height: '65vh',
          overflowY: 'auto',
          display: 'block'
        }}
      >
        <table 
          className="table-hover m-0 align-middle w-100" 
          style={{ borderCollapse: 'collapse', color: inputText, backgroundColor: mainCardBg }}
        >
          <thead style={{ position: 'sticky', top: 0, backgroundColor: thBg, zIndex: 1, color: thText }}>
            <tr style={{ backgroundColor: thBg, borderBottom: `2px solid ${rowBorder}`, color: thText, fontSize: '0.85rem', textTransform: 'uppercase' }}>
              <th className="py-3 px-3 fw-bold text-start" style={{ width: '18%' }}>FECHA Y HORA</th>
              <th className="py-3 px-3 fw-bold text-start" style={{ width: '18%' }}>USUARIO RESPONSABLE</th>
              <th className="py-3 px-3 fw-bold text-start" style={{ width: '15%' }}>TABLA AFECTADA</th>
              <th className="py-3 px-3 fw-bold text-start" style={{ width: '15%' }}>COLUMNA AFECTADA</th>
              <th className="py-3 px-3 fw-bold text-center" style={{ width: '10%' }}>ID ITEM MODIF.</th>
              <th className="py-3 px-3 fw-bold text-start" style={{ width: '12%' }}>DATO PREVIO</th>
              <th className="py-3 px-3 fw-bold text-start" style={{ width: '12%' }}>DATO MODIF.</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.88rem' }}>
            {cargando ? (
              <tr>
                <td colSpan={7} className="py-5 text-center border-0" style={{ color: mutedText }}>
                  <div className="spinner-border spinner-border-sm me-2" role="status" style={{ color: mutedText }} />
                  Cargando movimientos...
                </td>
              </tr>
            ) : actividadesFiltradas.length > 0 ? (
              actividadesFiltradas.map((act, index) => (
                <tr 
                  key={act.idRegAct} 
                  style={{ borderBottom: index === actividadesFiltradas.length - 1 ? 'none' : `1px solid ${rowBorder}` }}
                >
                  <td className="font-monospace py-3 px-3" style={{ fontSize: '0.85rem', color: mutedText }}>
  {formatearFecha(act.fecha)}
</td>
                  <td className="fw-semibold py-3 px-3" style={{ color: userTextColor }}>
                    <i className="bi bi-person me-2" style={{ color: mutedText }}></i>
                    {obtenerNombreUsuario(act)}
                  </td>
                  <td className="py-3 px-3" style={{ color: mutedText }}>{act.tablaAfectada}</td>
                  <td className="py-3 px-3" style={{ color: mutedText }}>{act.columnaAfectada || '-'}</td>
                  <td className="text-center font-monospace text-warning py-3 px-3">
                    #{act.idRegistroMod || '-'}
                  </td>
                  <td className="text-start py-3 px-3" style={{ color: mutedText }}>{formatearDato(act.datosAnteriores)}</td>
                  <td className="fw-semibold text-success text-start py-3 px-3">{formatearDato(act.datosNuevos)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-5 text-center border-0" style={{ color: inputText }}>
                  No se registraron movimientos en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Barra Inferior: Botón Volver y Exportaciones */}
      <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
        <button
          className="btn btn-secondary fw-bold px-4 py-2 shadow-sm font-monospace"
          style={{ color: '#ffffff' }}
          onClick={() => navigate('/dashboard')}
        >
          Volver
        </button>

        <div className="d-flex gap-2">
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
      </div>

    </div>
  );
};