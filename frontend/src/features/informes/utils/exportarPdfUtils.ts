import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { capturarElementoParaPdf } from './modoImpresionPdf';

interface ConfigTabla {
  titulo: string;
  columnas: string[];
  colorEncabezado: [number, number, number];
  obtenerFilas: (datos: any[]) => (string | number)[][];
}

interface ItemInforme {
  chartId: string;
  tituloGrafico: string;
  config?: ConfigTabla;
  datos?: any[];
}

const construirConfigSecciones = (
  seccionActiva: string,
  metricas: any,
  incongruenciasArqueo: any[]
): ItemInforme[] => {
  switch (seccionActiva) {
    case 'finanzas':
      return [
        {
          chartId: 'ingresos_chart',
          tituloGrafico: 'Evolución de Ingresos a Caja',
          config: {
            titulo: 'Detalle Cronológico de Caja',
            columnas: ['Periodo / Hora', 'Tipo', 'Movimiento', 'Estado Caja'],
            colorEncabezado: [142, 69, 224],
            obtenerFilas: (datos) =>
              datos.map((v) => [
                v.name || 'Sin fecha',
                v.esEgreso ? 'Egreso' : 'Ingreso',
                `$${Number(v.montoMovimiento || 0).toLocaleString('es-AR')}`,
                `$${Number(v.ventas || 0).toLocaleString('es-AR')}`
              ])
          },
          datos: metricas?.ventasPorPeriodo || []
        },
        {
          chartId: 'medios_pago_chart',
          tituloGrafico: 'Distribución por Medios de Pago',
          config: {
            titulo: 'Resumen Monetario y Medios de Pago',
            columnas: ['Medio de Pago', 'Monto Total'],
            colorEncabezado: [142, 69, 224],
            obtenerFilas: (datos) =>
              datos.map((m) => [
                m.name || 'Sin especificar',
                `$${Number(m.value || 0).toLocaleString('es-AR')}`
              ])
          },
          datos: metricas?.distribucionMediosPago || []
        },
        {
          chartId: 'egresos_chart',
          tituloGrafico: 'Egresos y Salidas de Caja',
          config: {
            titulo: 'Egresos y Salidas de Caja Detallados',
            columnas: ['Periodo / Hora', 'Monto', 'Descripción'],
            colorEncabezado: [226, 46, 46],
            obtenerFilas: (datos) =>
              datos.map((e) => [
                e.ejeX || 'Sin fecha',
                `$${Number(e.monto || 0).toLocaleString('es-AR')}`,
                e.descripcion || 'Sin descripción'
              ])
          },
          datos: metricas?.detalleEgresos || []
        },
        {
          chartId: 'categorias_ingresos_chart',
          tituloGrafico: 'Categorías de Ingresos',
          config: {
            titulo: 'Categorías de Ingresos',
            columnas: ['Categoría', 'Monto Total'],
            colorEncabezado: [32, 201, 151],
            obtenerFilas: (datos) =>
              datos.map((c) => [
                c.name || 'Sin categoría',
                `$${Number(c.value || 0).toLocaleString('es-AR')}`
              ])
          },
          datos: metricas?.categoriasIngresos || []
        },
        {
          chartId: 'categorias_egresos_chart',
          tituloGrafico: 'Categorías de Egresos',
          config: {
            titulo: 'Categorías de Egresos',
            columnas: ['Categoría', 'Monto Total'],
            colorEncabezado: [226, 46, 46],
            obtenerFilas: (datos) =>
              datos.map((c) => [
                c.name || 'Sin categoría',
                `$${Number(c.value || 0).toLocaleString('es-AR')}`
              ])
          },
          datos: metricas?.categoriasEgresos || []
        }
      ];

    case 'ventas':
      return [
        {
          chartId: 'estados_chart',
          tituloGrafico: 'Distribución por Estados de Pedidos'
        },
        {
          chartId: 'productos_chart',
          tituloGrafico: 'Ranking de Productos Más Vendidos',
          config: {
            titulo: 'Ranking de Productos Más Vendidos',
            columnas: ['Producto', 'Unidades Vendidas', 'Total Reagrupado'],
            colorEncabezado: [32, 201, 151],
            obtenerFilas: (datos) =>
              datos.map((p) => [
                p.nombre || p.name || 'Producto',
                p.cantidad || p.value || 0,
                `$${Number(p.total || 0).toLocaleString('es-AR')}`
              ])
          },
          datos: metricas?.productosMasVendidos || []
        },
        {
          chartId: 'categorias_chart',
          tituloGrafico: 'Categorías Más Vendidas',
          config: {
            titulo: 'Categorías Más Vendidas',
            columnas: ['Categoría', 'Unidades Vendidas'],
            colorEncabezado: [32, 201, 151],
            obtenerFilas: (datos) =>
              datos.map((c) => [c.name || 'Categoría', c.ventas || 0])
          },
          datos: metricas?.categoriasMasVendidas || []
        }
      ];

    case 'operaciones':
      return [
        {
          chartId: 'recaudacion_empleados_chart',
          tituloGrafico: 'Recaudación por Empleado',
          config: {
            titulo: 'Recaudación por Empleado',
            columnas: ['Empleado', 'Recaudación', 'Pedidos Completados'],
            colorEncabezado: [13, 202, 240],
            obtenerFilas: (datos) =>
              datos.map((e) => [
                e.name || 'Empleado',
                `$${Number(e.ventas || 0).toLocaleString('es-AR')}`,
                e.pedidosCompletados || 0
              ])
          },
          datos: metricas?.rendimientoEmpleados || []
        },
        {
          chartId: 'pedidos_empleados_chart',
          tituloGrafico: 'Pedidos Completados por Empleado'
        },
        {
          chartId: 'tiempo_promedio_chart',
          tituloGrafico: 'Tiempo Promedio de Finalización de Pedido',
          config: {
            titulo: 'Tiempo Promedio de Finalización de Pedido',
            columnas: ['Empleado', 'Tiempo Promedio (min)'],
            colorEncabezado: [182, 107, 9],
            obtenerFilas: (datos) => datos.map((e) => [e.name || 'Empleado', e.valor || 0])
          },
          datos: metricas?.tiempoPromedioPedidoPorEmpleado || []
        },
        {
          chartId: 'tiempo_maximo_chart',
          tituloGrafico: 'Tiempo Máximo de Tardanza por Empleado',
          config: {
            titulo: 'Tiempo Máximo de Tardanza por Empleado',
            columnas: ['Empleado', 'Tiempo Máximo (min)'],
            colorEncabezado: [255, 193, 7],
            obtenerFilas: (datos) => datos.map((e) => [e.name || 'Empleado', e.valor || 0])
          },
          datos: metricas?.tiempoMaximoEmpleado || []
        },
        {
          chartId: 'pedidos_devueltos_chart',
          tituloGrafico: 'Pedidos Devueltos por Empleado'
        }
      ];

    case 'clientes':
      return [
        {
          chartId: 'clientes_chart',
          tituloGrafico: 'Clientes Más Activos'
        },
        {
          chartId: 'deudores_chart',
          tituloGrafico: 'Cuentas Corrientes (Top Deudores)'
        },
        {
          chartId: 'categorias_cliente_chart',
          tituloGrafico: 'Ventas por Categoría de Cliente',
          config: {
            titulo: 'Ventas por Categoría de Cliente',
            columnas: ['Categoría', 'Pedidos', 'Monto Total'],
            colorEncabezado: [32, 201, 151],
            obtenerFilas: (datos) =>
              datos.map((c) => [
                c.name || 'Categoría',
                c.ventas || 0,
                `$${Number(c.montoTotal || 0).toLocaleString('es-AR')}`
              ])
          },
          datos: metricas?.ventasPorCategoriaCliente || []
        }
      ];

    case 'control':
      return [
        {
          chartId: 'mermas_chart',
          tituloGrafico: 'Registro de Mermas',
          config: {
            titulo: 'Registro de Mermas',
            columnas: ['Periodo / Hora', 'Cantidad'],
            colorEncabezado: [255, 193, 7],
            obtenerFilas: (datos) =>
              datos.map((m) => [m.horaLabel || m.ejeX || 'Sin fecha', m.cantidad || 0])
          },
          datos: metricas?.mermasPorPeriodo || []
        },
        {
          chartId: 'incongruencias_chart',
          tituloGrafico: 'Incongruencias de Arqueo',
          config: {
            titulo: 'Incongruencias de Arqueo',
            columnas: ['Empleado', 'Monto Diferencia', 'Cant. Incongruencias'],
            colorEncabezado: [244, 63, 94],
            obtenerFilas: (datos) =>
              datos.map((i) => [
                i.empleado || 'Sin especificar',
                `$${Number(i.montoDiferencia || 0).toLocaleString('es-AR')}`,
                i.cantidadIncongruencias || 0
              ])
          },
          datos: incongruenciasArqueo || []
        },
        {
          chartId: 'averias_chart',
          tituloGrafico: 'Registro de Averías',
          config: {
            titulo: 'Registro de Averías',
            columnas: ['Periodo / Hora', 'Cantidad'],
            colorEncabezado: [253, 126, 20],
            obtenerFilas: (datos) => datos.map((a) => [a.ejeX || 'Sin fecha', a.cantidad || 0])
          },
          datos: metricas?.averiasPorPeriodo || []
        }
      ];

    default:
      return [];
  }
};

export const exportarInformePDF = async (
  elementId: string,
  fechaDesde: string,
  fechaHasta: string,
  seccionActiva: string,
  metricas: any,
  incongruenciasArqueo: any[] = []
) => {
  if (seccionActiva === 'MENU') return;

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Cabecera superior
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`INFORME DE ${seccionActiva.toUpperCase()}`, margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(161, 161, 170);
  doc.text(`Rango de datos: ${fechaDesde} al ${fechaHasta}`, margin, 20);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, pageWidth - margin - 35, 20);

  let currentY = 36;
  const secciones = construirConfigSecciones(seccionActiva, metricas, incongruenciasArqueo);

  // Delimitamos la búsqueda usando elementId para corregir el aviso de TypeScript
  const rootContainer = document.getElementById(elementId) || document;

  for (const item of secciones) {
    // 1. Renderizar la tabla si la sección define datos
    if (item.config && item.datos && item.datos.length > 0) {
      if (currentY + 25 > pageHeight) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text(item.config.titulo, margin, currentY);
      currentY += 4;

      autoTable(doc, {
        startY: currentY,
        head: [item.config.columnas],
        body: item.config.obtenerFilas(item.datos),
        theme: 'striped',
        headStyles: { fillColor: item.config.colorEncabezado },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // 2. Buscar el elemento del gráfico dentro del contenedor activo
    const chartEl = rootContainer.querySelector(`[data-chart-id="${item.chartId}"]`) as HTMLElement | null;

    if (chartEl) {
      if (currentY + 90 > pageHeight) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gráfico: ${item.tituloGrafico}`, margin, currentY);
      currentY += 6;

      try {
        const canvas = await capturarElementoParaPdf(chartEl);
        const imgDataUrl = canvas.toDataURL('image/png', 1.0);

        const maxImgWidth = pageWidth - margin * 2;
        const maxImgHeight = 80;

        let finalImgWidth = maxImgWidth;
        let finalImgHeight = (canvas.height * finalImgWidth) / canvas.width;

        if (finalImgHeight > maxImgHeight) {
          finalImgHeight = maxImgHeight;
          finalImgWidth = (canvas.width * finalImgHeight) / canvas.height;
        }

        const xOffset = margin + (maxImgWidth - finalImgWidth) / 2;

        doc.addImage(imgDataUrl, 'PNG', xOffset, currentY, finalImgWidth, finalImgHeight);
        currentY += finalImgHeight + 12;
      } catch (err) {
        console.warn(`Error al capturar gráfico [${item.chartId}]:`, err);
      }
    }
  }

  doc.save(`Informe_${seccionActiva}_${fechaDesde}_a_${fechaHasta}.pdf`);
};