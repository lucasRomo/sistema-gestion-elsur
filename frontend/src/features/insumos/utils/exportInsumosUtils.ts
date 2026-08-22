import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Insumo } from '../types/Insumo';

export const exportarInsumosExcel = async (insumos: Insumo[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Stock de Insumos');

  // 1. Definición de columnas
  worksheet.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Nombre Insumo', key: 'nombre' },
    { header: 'Precio ($)', key: 'precio' },
    { header: 'Stock Empaquetado', key: 'empaquetado' },
    { header: 'Stock Suelto / Consumo', key: 'suelto' },
    { header: 'Stock Mínimo', key: 'minimo' },
    { header: 'Proveedor', key: 'proveedor' },
    { header: 'Estado', key: 'estado' },
  ];

  // 2. Cargar las filas
  insumos.forEach((i) => {
    worksheet.addRow({
      id: i.idInsumo ?? '-',
      nombre: i.nombreInsumo,
      precio: i.precio != null ? Number(i.precio) : 0,
      empaquetado: `${i.stockEmpaquetado ?? 0} ${i.unidadCompra?.nombre || 'bultos'}`,
      suelto: `${i.stockActual} ${i.unidadMedida?.nombre || 'unid.'}`,
      minimo: `${i.stockMinimo} ${i.unidadMedida?.nombre || 'unid.'}`,
      proveedor: i.proveedor?.nombreComercial || i.proveedor?.tipoProveedor?.descripcion || '-',
      estado: i.estado,
    });
  });

  // 3. Estilo para el encabezado (Negrita y fondo gris claro)
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: '000000' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E2E8F0' }
  };

  // 4. Auto-ajuste dinámico del ancho de las columnas + padding
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell!({ includeEmpty: true }, (cell) => {
      const columnValue = cell.value ? cell.value.toString() : '';
      if (columnValue.length > maxLength) {
        maxLength = columnValue.length;
      }
    });
    // Se le agrega un margen extra (+4) para evitar que quede ajustado
    column.width = Math.max(maxLength + 4, 12);
  });

  // 5. Descargar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const fecha = new Date().toISOString().slice(0, 10);
  anchor.download = `Stock_Insumos_${fecha}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export const exportarInsumosPDF = (
  insumos: Insumo[],
  fechaDesde?: string,
  fechaHasta?: string
) => {
  const doc = new jsPDF('landscape');

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // 1. Cabecera superior (Banner Oscuro)
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Título principal
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('INFORME DE STOCK DE INSUMOS', margin, 12);

  // Subtítulos y metadatos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(161, 161, 170);

  const rangoTexto = fechaDesde && fechaHasta 
    ? `Rango de datos: ${fechaDesde} al ${fechaHasta}` 
    : `Total de registros: ${insumos.length}`;

  doc.text(rangoTexto, margin, 20);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, pageWidth - margin - 35, 20);

  // 2. Construcción de la tabla
  const tableColumn = [
    'ID',
    'Insumo',
    'Precio ($)',
    'Stock Empaquetado',
    'Stock Suelto',
    'Stock Mínimo',
    'Proveedor',
    'Estado',
  ];

  const tableRows = insumos.map((i) => [
    `#${i.idInsumo ?? '-'}`,
    i.nombreInsumo,
    `$${i.precio != null ? Number(i.precio).toFixed(2) : '0.00'}`,
    `${i.stockEmpaquetado ?? 0} ${i.unidadCompra?.nombre || ''}`,
    `${i.stockActual} ${i.unidadMedida?.nombre || ''}`,
    `${i.stockMinimo} ${i.unidadMedida?.nombre || ''}`,
    i.proveedor?.nombreComercial || i.proveedor?.tipoProveedor?.descripcion || '-',
    i.estado,
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 34,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [11, 201, 248], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`Stock_Insumos_${fecha}.pdf`);
};