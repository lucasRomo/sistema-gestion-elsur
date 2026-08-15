import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RegistroActividad } from '../types/RegistroActividad';

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

export const exportarHistorialActividadExcel = async (actividades: RegistroActividad[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Historial de Actividad');

  // 1. Definición de columnas
  worksheet.columns = [
    { header: 'Fecha y Hora', key: 'fecha' },
    { header: 'Usuario Responsable', key: 'usuario' },
    { header: 'Tabla Afectada', key: 'tabla' },
    { header: 'Columna Afectada', key: 'columna' },
    { header: 'ID Item Modif.', key: 'idRegistro' },
    { header: 'Dato Previo', key: 'datoPrevio' },
    { header: 'Dato Modif.', key: 'datoNuevo' },
  ];

  // 2. Cargar filas
  actividades.forEach((act) => {
    worksheet.addRow({
      fecha: new Date(act.fecha).toLocaleString('es-AR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }),
      usuario: obtenerNombreUsuario(act),
      tabla: act.tablaAfectada || '-',
      columna: act.columnaAfectada || '-',
      idRegistro: act.idRegistroMod ?? '-',
      datoPrevio: formatearDato(act.datosAnteriores),
      datoNuevo: formatearDato(act.datosNuevos),
    });
  });

  // 3. Estilo para el encabezado
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E2E8F0' },
  };

  // 4. Auto-ajuste de ancho de columnas
  worksheet.columns.forEach((column) => {
    let maxLen = 0;

    if (column.values && Array.isArray(column.values)) {
      column.values.forEach((val) => {
        if (val !== null && val !== undefined) {
          const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
          if (strVal.length > maxLen) {
            maxLen = strVal.length;
          }
        }
      });
    }

    column.width = Math.max(maxLen + 6, 15);
  });

  // 5. Descarga del archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const fecha = new Date().toISOString().slice(0, 10);
  anchor.download = `Historial_Actividad_${fecha}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export const exportarHistorialActividadPDF = (actividades: RegistroActividad[]) => {
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('Reporte de Historial de Actividad', 14, 15);
  doc.setFontSize(10);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 14, 22);
  doc.text(`Total de registros: ${actividades.length}`, 14, 27);

  const tableColumn = [
    'Fecha y Hora',
    'Usuario Responsable',
    'Tabla Afectada',
    'Columna Afectada',
    'ID Item',
    'Dato Previo',
    'Dato Modif.',
  ];

  const tableRows = actividades.map((act) => [
    new Date(act.fecha).toLocaleString('es-AR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }),
    obtenerNombreUsuario(act),
    act.tablaAfectada || '-',
    act.columnaAfectada || '-',
    `#${act.idRegistroMod ?? '-'}`,
    formatearDato(act.datosAnteriores),
    formatearDato(act.datosNuevos),
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 32,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`Historial_Actividad_${fecha}.pdf`);
};