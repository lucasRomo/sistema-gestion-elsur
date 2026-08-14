import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Proveedor } from '../types/Proveedor';

export const exportarProveedoresExcel = async (proveedores: Proveedor[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Gestión de Proveedores');

  // 1. Definición de columnas
  worksheet.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Nombre Comercial', key: 'nombreComercial' },
    { header: 'Contacto', key: 'contacto' },
    { header: 'Email', key: 'email' },
    { header: 'Tipo de Proveedor', key: 'tipo' },
    { header: 'Estado', key: 'estado' },
  ];

  // 2. Cargar filas
  proveedores.forEach((p) => {
    worksheet.addRow({
      id: p.idProveedor ?? '-',
      nombreComercial: p.nombreComercial,
      contacto: p.contactoNombre || '-',
      email: p.emailContacto || '-',
      tipo: p.tipoProveedor?.descripcion || 'General',
      estado: p.estado || '-',
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
  anchor.download = `Gestion_Proveedores_${fecha}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export const exportarProveedoresPDF = (proveedores: Proveedor[]) => {
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('Reporte de Gestión de Proveedores', 14, 15);
  doc.setFontSize(10);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 14, 22);
  doc.text(`Total de registros: ${proveedores.length}`, 14, 27);

  const tableColumn = [
    'ID',
    'Nombre Comercial',
    'Contacto',
    'Email',
    'Tipo de Proveedor',
    'Estado',
  ];

  const tableRows = proveedores.map((p) => [
    `#${p.idProveedor ?? '-'}`,
    p.nombreComercial,
    p.contactoNombre || '-',
    p.emailContacto || '-',
    p.tipoProveedor?.descripcion || 'General',
    p.estado || '-',
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 32,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`Gestion_Proveedores_${fecha}.pdf`);
};