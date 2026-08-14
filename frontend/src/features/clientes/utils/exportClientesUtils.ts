import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportarClientesExcel = async (clientes: any[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Gestión de Clientes');

  // 1. Definición de columnas
  worksheet.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Nombre', key: 'nombre' },
    { header: 'Apellido', key: 'apellido' },
    { header: 'Documento', key: 'documento' },
    { header: 'Razón Social', key: 'razonSocial' },
    { header: 'Límite Crédito ($)', key: 'limiteCredito' },
    { header: 'Saldo Deudor ($)', key: 'saldoDeudor' },
    { header: 'Estado', key: 'estado' },
  ];

  // 2. Cargar filas
  clientes.forEach((c) => {
    worksheet.addRow({
      id: c.id_cliente ?? '-',
      nombre: c.persona?.nombre || '-',
      apellido: c.persona?.apellido || '-',
      documento: c.persona?.numeroDocumento || '-',
      razonSocial: c.razonSocial || '-',
      limiteCredito: c.limiteCredito != null ? Number(c.limiteCredito) : 0,
      saldoDeudor: c.saldoDeudor != null ? Number(c.saldoDeudor) : 0,
      estado: c.estado || '-',
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
  anchor.download = `Gestion_Clientes_${fecha}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export const exportarClientesPDF = (clientes: any[]) => {
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('Reporte de Gestión de Clientes', 14, 15);
  doc.setFontSize(10);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 14, 22);
  doc.text(`Total de registros: ${clientes.length}`, 14, 27);

  const tableColumn = [
    'ID',
    'Nombre',
    'Apellido',
    'Documento',
    'Razón Social',
    'Límite Cta. Cte. ($)',
    'Saldo Deudor ($)',
    'Estado',
  ];

  const tableRows = clientes.map((c) => [
    `#${c.id_cliente ?? '-'}`,
    c.persona?.nombre || '-',
    c.persona?.apellido || '-',
    c.persona?.numeroDocumento || '-',
    c.razonSocial || '-',
    `$${c.limiteCredito != null ? Number(c.limiteCredito).toFixed(2) : '0.00'}`,
    `$${c.saldoDeudor != null ? Number(c.saldoDeudor).toFixed(2) : '0.00'}`,
    c.estado || '-',
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 32,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [13, 202, 240], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`Gestion_Clientes_${fecha}.pdf`);
};