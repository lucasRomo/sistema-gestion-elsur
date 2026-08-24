import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Tipo local y permisivo para lo que este módulo necesita.
// Lo definimos acá en vez de importar `MovimientoCaja` de otro archivo porque
// hoy conviven dos definiciones distintas de `MovimientoCaja` en el proyecto
// (services/cajaService.ts y types/caja.ts) con `usuario` tipado de forma
// diferente en cada una. Este tipo es compatible con ambas, así que
// exportarCajaPDF/exportarCajaExcel funcionan sin importar cuál te llegue.
export interface MovimientoCajaExport {
  id_movimiento?: number;
  idMovimiento?: number;
  monto: number;
  tipoMovimiento: 'INGRESO' | 'EGRESO';
  categoria?: string;
  descripcion: string;
  metodoPago?: string;
  fecha: string;
  usuario?: unknown;
  pedido?: {
    idPedido?: number;
    id_pedido?: number;
  } | null;
}

export interface ResumenTurnoCaja {
  montoInicial?: number;
  saldoCaja?: number;
  ingresosTurno?: number;
  egresosTurno?: number;
  fechaApertura?: string;
}

const obtenerNombreUsuario = (m: MovimientoCajaExport): string => {
  const u = m.usuario as any;

  if (u && typeof u === 'object') {
    const nombreCompleto = `${u.nombre || u.first_name || ''} ${u.apellido || u.last_name || ''}`.trim();
    if (nombreCompleto) return nombreCompleto;

    if (u.nombreUsuario) return u.nombreUsuario;
    if (u.username) return u.username;
    if (u.nombre_usuario) return u.nombre_usuario;
    if (u.idUsuario || u.id_usuario) return `Usuario #${u.idUsuario ?? u.id_usuario}`;
  }

  if (typeof u === 'string' && u.trim()) {
    return u.trim();
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

const obtenerPedidoTexto = (m: MovimientoCajaExport): string => {
  const idPedido = m.pedido?.idPedido ?? m.pedido?.id_pedido;
  if (idPedido) return `#${idPedido}`;
  if (m.descripcion?.includes('Pedido #')) return `#${m.descripcion.split('#')[1]?.trim()}`;
  return '-';
};

const obtenerIdMovimiento = (m: MovimientoCajaExport): string => {
  return `${m.id_movimiento ?? m.idMovimiento ?? '-'}`;
};


export const exportarCajaExcel = async (
  movimientos: MovimientoCajaExport[],
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


export const exportarCajaPDF = (
  movimientos: MovimientoCajaExport[],
  resumen?: ResumenTurnoCaja,
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
  doc.text('INFORME DE MOVIMIENTOS DE CAJA', margin, 12);

  // Subtítulos y metadatos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(161, 161, 170);

  const rangoTexto = fechaDesde && fechaHasta 
    ? `Rango de datos: ${fechaDesde} al ${fechaHasta}` 
    : `Total de registros: ${movimientos.length}`;

  doc.text(rangoTexto, margin, 20);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, pageWidth - margin - 35, 20);

  let startY = 36;

  // 2. Resumen monetario del turno
  if (resumen) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);

    const txtInicial = `Monto Inicial: $${Number(resumen.montoInicial ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    const txtIngresos = `Ingresos: $${Number(resumen.ingresosTurno ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    const txtEgresos = `Egresos: $${Number(resumen.egresosTurno ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    const txtSaldo = `Saldo Actual: $${Number(resumen.saldoCaja ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

    doc.text(`${txtInicial}   |   ${txtIngresos}   |   ${txtEgresos}   |   ${txtSaldo}`, margin, startY);
    startY += 8;
  }

  // 3. Construcción de la tabla
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