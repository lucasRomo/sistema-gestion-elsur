import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Proveedor } from '../types/Proveedor';

export const exportarProveedoresExcel = async (proveedores: Proveedor[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Gestión de Proveedores');

  worksheet.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Nombre Comercial', key: 'nombreComercial' },
    { header: 'Contacto', key: 'contacto' },
    { header: 'Email', key: 'email' },
    { header: 'Tipo de Proveedor', key: 'tipo' },
    { header: 'Estado', key: 'estado' },
  ];

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

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E2E8F0' },
  };

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

export const exportarProveedoresPDF = (
  proveedores: Proveedor[],
  fechaDesde?: string,
  fechaHasta?: string
) => {
  const doc = new jsPDF('landscape');

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('INFORME DE GESTIÓN DE PROVEEDORES', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(161, 161, 170);

  const rangoTexto = fechaDesde && fechaHasta 
    ? `Rango de datos: ${fechaDesde} al ${fechaHasta}` 
    : `Total de registros: ${proveedores.length}`;

  doc.text(rangoTexto, margin, 20);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, pageWidth - margin - 35, 20);

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
    startY: 34,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`Gestion_Proveedores_${fecha}.pdf`);
};