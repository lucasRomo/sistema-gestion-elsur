import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MovimientoCaja } from '../types/caja';

export interface ResumenTurnoCaja {
  montoInicial?: number;
  saldoCaja?: number;
  ingresosTurno?: number;
  egresosTurno?: number;
  fechaApertura?: string;
}

const obtenerNombreUsuario = (m: MovimientoCaja): string => {
  const u = m.usuario as any;

  if (u && typeof u === 'object') {
    const nombreCompleto = `${u.nombre || u.first_name || ''} ${u.apellido || u.last_name || ''}`.trim();
    if (nombreCompleto) return nombreCompleto;

    if (u.nombreUsuario) return u.nombreUsuario;
    if (u.username) return u.username;
    if (u.nombre_usuario) return u.nombre_usuario;
    if (u.idUsuario || u.id_usuario) return `Usuario #${u.idUsuario ?? u.id_usuario}`;
  }

  try {
    const localData =
      localStorage.getItem('usuario_logueado') ||
      localStorage.getItem('usuario') ||
      localStorage.getItem('user');

    if (localData) {
      const parsed = JSON.parse(localData);
      const nombreLocal = `${parsed.nombre || parsed.first_name || ''} ${parsed.apellido || parsed.last_name || ''}`.trim();
      if (nombreLocal) return nombreLocal;
      if (parsed.nombreUsuario) return parsed.nombreUsuario;
      if (parsed.username) return parsed.username;
      if (parsed.nombre_usuario) return parsed.nombre_usuario;
    }
  } catch {
  }

  return '-';
};

const obtenerPedidoTexto = (m: MovimientoCaja): string => {
  const idPedido = m.pedido?.idPedido;
  if (idPedido) return `#${idPedido}`;
  if (m.descripcion?.includes('Pedido #')) return `#${m.descripcion.split('#')[1]?.trim()}`;
  return '-';
};

const obtenerIdMovimiento = (m: MovimientoCaja): string => {
  return `${m.id_movimiento ?? m.idMovimiento ?? '-'}`;
};


export const exportarCajaExcel = async (
  movimientos: MovimientoCaja[],
  resumen?: ResumenTurnoCaja
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Movimientos de Caja');

  worksheet.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Fecha/Hora', key: 'fecha' },
    { header: 'Tipo', key: 'tipo' },
    { header: 'Monto', key: 'monto' },
    { header: 'Método de Pago', key: 'metodo' },
    { header: 'Categoría', key: 'categoria' },
    { header: 'Descripción', key: 'descripcion' },
    { header: 'Usuario', key: 'usuario' },
    { header: 'Pedido', key: 'pedido' },
  ];

  movimientos.forEach((m) => {
    worksheet.addRow({
      id: obtenerIdMovimiento(m),
      fecha: new Date(m.fecha).toLocaleString('es-AR'),
      tipo: m.tipoMovimiento === 'EGRESO' ? 'Egreso' : 'Ingreso',
      monto: Number(m.monto ?? 0),
      metodo: m.metodoPago || 'EFECTIVO',
      categoria: m.categoria || '-',
      descripcion: m.descripcion || '-',
      usuario: obtenerNombreUsuario(m),
      pedido: obtenerPedidoTexto(m),
    });
  });

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: '000000' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E2E8F0' },
  };

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const tipoCell = row.getCell('tipo');
    const montoCell = row.getCell('monto');
    montoCell.numFmt = '"$"#,##0.00';
    montoCell.font = {
      bold: true,
      color: { argb: tipoCell.value === 'Egreso' ? 'C0392B' : '1E8449' },
    };
  });

  if (resumen) {
    worksheet.addRow({});
    const filaInicial = worksheet.addRow({ descripcion: 'Monto Inicial de Caja', monto: Number(resumen.montoInicial ?? 0) });
    filaInicial.font = { bold: true };
    const filaIngresos = worksheet.addRow({ descripcion: 'Total Ingresos del Turno', monto: Number(resumen.ingresosTurno ?? 0) });
    filaIngresos.font = { bold: true, color: { argb: '1E8449' } };
    const filaEgresos = worksheet.addRow({ descripcion: 'Total Egresos del Turno', monto: Number(resumen.egresosTurno ?? 0) });
    filaEgresos.font = { bold: true, color: { argb: 'C0392B' } };
    const filaSaldo = worksheet.addRow({ descripcion: 'Saldo Actual de Caja', monto: Number(resumen.saldoCaja ?? 0) });
    filaSaldo.font = { bold: true };
    [filaInicial, filaIngresos, filaEgresos, filaSaldo].forEach((row) => {
      row.getCell('monto').numFmt = '"$"#,##0.00';
    });
  }

  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell!({ includeEmpty: true }, (cell) => {
      const columnValue = cell.value ? cell.value.toString() : '';
      if (columnValue.length > maxLength) {
        maxLength = columnValue.length;
      }
    });
    column.width = Math.max(maxLength + 4, 12);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const fecha = new Date().toISOString().slice(0, 10);
  anchor.download = `Movimientos_Caja_${fecha}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};


export const exportarCajaPDF = (movimientos: MovimientoCaja[], resumen?: ResumenTurnoCaja) => {
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('Reporte de Movimientos de Caja', 14, 15);
  doc.setFontSize(10);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 14, 22);
  doc.text(`Total de registros: ${movimientos.length}`, 14, 27);

  let startY = 32;

  if (resumen) {
    doc.text(
      `Monto Inicial: $${Number(resumen.montoInicial ?? 0).toFixed(2)}   |   ` +
      `Ingresos: $${Number(resumen.ingresosTurno ?? 0).toFixed(2)}   |   ` +
      `Egresos: $${Number(resumen.egresosTurno ?? 0).toFixed(2)}   |   ` +
      `Saldo Actual: $${Number(resumen.saldoCaja ?? 0).toFixed(2)}`,
      14,
      32
    );
    startY = 38;
  }

  const tableColumn = [
    'ID',
    'Fecha/Hora',
    'Tipo',
    'Monto',
    'Método',
    'Categoría',
    'Descripción',
    'Usuario',
    'Pedido',
  ];

  const tableRows = movimientos.map((m) => [
    `#${obtenerIdMovimiento(m)}`,
    new Date(m.fecha).toLocaleString('es-AR'),
    m.tipoMovimiento === 'EGRESO' ? 'Egreso' : 'Ingreso',
    `${m.tipoMovimiento === 'EGRESO' ? '-' : '+'}$${Number(m.monto ?? 0).toFixed(2)}`,
    m.metodoPago || 'EFECTIVO',
    m.categoria || '-',
    m.descripcion || '-',
    obtenerNombreUsuario(m),
    obtenerPedidoTexto(m),
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [142, 69, 224], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const fila = data.row.raw as any[];
        const esEgreso = fila[2] === 'Egreso';
        data.cell.styles.textColor = esEgreso ? [192, 57, 43] : [30, 132, 73];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`Movimientos_Caja_${fecha}.pdf`);
};
