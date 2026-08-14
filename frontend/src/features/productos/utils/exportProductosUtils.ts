import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Producto } from '../types/Producto';

export const exportarProductosExcel = async (productos: Producto[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Gestión de Productos');

  // 1. Definición de columnas
  worksheet.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Nombre Producto', key: 'nombre' },
    { header: 'Categoría', key: 'categoria' },
    { header: 'Precio Base ($)', key: 'precio' },
    { header: 'Stock', key: 'stock' },
    { header: 'Máquina Necesaria', key: 'maquina' },
    { header: 'Estado', key: 'estado' },
  ];

  // 2. Cargar filas
  productos.forEach((p) => {
    const maquinaNombre = p.maquinaNecesaria?.nombre || p.maquinaNecesaria?.nombreMaquina || 'No aplica';
    
    worksheet.addRow({
      id: p.idProducto ?? '-',
      nombre: p.nombreProducto,
      categoria: p.categoria?.nombre || '-',
      precio: p.precioBase != null ? Number(p.precioBase) : 0,
      stock: p.stock ?? 0,
      maquina: maquinaNombre,
      estado: p.estado,
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

  // 4. Auto-ajuste de ancho leyendo column.values (incluye los títulos)
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
  anchor.download = `Gestion_Productos_${fecha}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export const exportarProductosPDF = (productos: Producto[]) => {
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('Reporte de Gestión de Productos', 14, 15);
  doc.setFontSize(10);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 14, 22);
  doc.text(`Total de registros: ${productos.length}`, 14, 27);

  const tableColumn = [
    'ID',
    'Producto',
    'Categoría',
    'Precio ($)',
    'Stock',
    'Máquina Necesaria',
    'Estado',
  ];

  const tableRows = productos.map((p) => [
    `#${p.idProducto ?? '-'}`,
    p.nombreProducto,
    p.categoria?.nombre || '-',
    `$${p.precioBase != null ? Number(p.precioBase).toFixed(2) : '0.00'}`,
    p.stock ?? 0,
    p.maquinaNecesaria?.nombre || p.maquinaNecesaria?.nombreMaquina || 'No aplica',
    p.estado,
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 32,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [11, 201, 248], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`Gestion_Productos_${fecha}.pdf`);
};