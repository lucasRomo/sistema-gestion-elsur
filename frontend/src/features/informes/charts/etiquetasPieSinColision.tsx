import React from 'react';

const RADIAN = Math.PI / 180;
const RADIO_QUIEBRE = 8;    
const RADIO_LABEL = 12; 
const ESPACIO_MIN_VERTICAL = 34;

interface EtiquetaCalculada {
  name: string;
  value: number;
  xBorde: number;
  yBorde: number;
  xQuiebre: number;
  yQuiebre: number;
  x: number;
  y: number;
  textAnchor: 'start' | 'end';
}

export function normalizarDatosTorta<T extends Record<string, any>>(
  dataset: T[],
  minFraccion: number = 0.06
): (T & { valorGrafico: number })[] {
  const obtenerValor = (d: T) =>
    Number(d.value ?? d.totalGastado ?? d.saldoDeudor ?? 0);

  const total = dataset.reduce((acc, d) => acc + obtenerValor(d), 0);

  if (total <= 0 || dataset.length === 0) {
    return dataset.map((d) => ({ ...d, valorGrafico: obtenerValor(d) }));
  }

  const minimoAbsoluto = total * minFraccion;

  const chicas = dataset.filter((d) => {
    const v = obtenerValor(d);
    return v > 0 && v < minimoAbsoluto;
  });
  const grandes = dataset.filter((d) => obtenerValor(d) >= minimoAbsoluto);

  const sumaGrandes = grandes.reduce((acc, d) => acc + obtenerValor(d), 0);
  const deficit = chicas.reduce(
    (acc, d) => acc + (minimoAbsoluto - obtenerValor(d)),
    0
  );


  if (deficit <= 0 || sumaGrandes <= 0) {
    return dataset.map((d) => ({ ...d, valorGrafico: obtenerValor(d) }));
  }

  return dataset.map((d) => {
    const valor = obtenerValor(d);
    if (valor <= 0) return { ...d, valorGrafico: 0 };
    if (valor < minimoAbsoluto) return { ...d, valorGrafico: minimoAbsoluto };

    const proporcion = valor / sumaGrandes;
    return { ...d, valorGrafico: Math.max(0, valor - deficit * proporcion) };
  });
}

const calcularPosicionesSinColision = (
  dataset: any[],
  cx: number,
  cy: number,
  outerRadius: number
): Record<number, EtiquetaCalculada> => {
  const total =
    dataset.reduce(
      (acc, d) =>
        acc + Number(d.valorGrafico ?? d.value ?? d.totalGastado ?? d.saldoDeudor ?? 0),
      0
    ) || 1;

  let acumulado = 0;

  const crudas = dataset.map((d, i) => {
    const valorReal = Number(d.value ?? d.totalGastado ?? d.saldoDeudor ?? 0);
    const valorAngulo = Number(d.valorGrafico ?? valorReal);
    const fraccion = valorAngulo / total;
    const midAngle = 360 * (acumulado + fraccion / 2);
    acumulado += fraccion;

    const anguloRad = -midAngle * RADIAN;
    const xBorde = cx + outerRadius * Math.cos(anguloRad);
    const yBorde = cy + outerRadius * Math.sin(anguloRad);
    const xQuiebre = cx + (outerRadius + RADIO_QUIEBRE) * Math.cos(anguloRad);
    const yObjetivo = cy + (outerRadius + RADIO_LABEL) * Math.sin(anguloRad);
    const lado: 'izquierda' | 'derecha' = Math.cos(anguloRad) >= 0 ? 'derecha' : 'izquierda';

    return { index: i, name: d.name, value: valorReal, lado, xBorde, yBorde, xQuiebre, yObjetivo };
  });

  const resultado: Record<number, EtiquetaCalculada> = {};

  (['izquierda', 'derecha'] as const).forEach((lado) => {
    const grupo = crudas
      .filter((c) => c.lado === lado)
      .sort((a, b) => a.yObjetivo - b.yObjetivo);

    let yPrevia = -Infinity;
    grupo.forEach((etiqueta) => {
      const yFinal = Math.max(etiqueta.yObjetivo, yPrevia + ESPACIO_MIN_VERTICAL);
      yPrevia = yFinal;

      const xLabel = cx + (lado === 'derecha' ? 1 : -1) * (outerRadius + RADIO_LABEL + 8);

      resultado[etiqueta.index] = {
        name: etiqueta.name,
        value: etiqueta.value,
        xBorde: etiqueta.xBorde,
        yBorde: etiqueta.yBorde,
        xQuiebre: etiqueta.xQuiebre,
        yQuiebre: yFinal,
        x: xLabel,
        y: yFinal,
        textAnchor: lado === 'derecha' ? 'start' : 'end'
      };
    });
  });

  return resultado;
};

export const crearRendererEtiquetasSinColision = (
  dataset: any[],
  formatearTexto: (name: string, value: number) => { linea1: string, linea2: string } | string,
  isDark: boolean = true
) => {
  let cache: Record<number, EtiquetaCalculada> | null = null;
  let ultimoCx = 0;
  let ultimoCy = 0;
  let ultimoRadio = 0;

  // Ajuste de colores dinámicos
  const colorTexto = isDark ? '#e4e4e7' : '#0f172a';
  const colorLinea = isDark ? '#a1a1aa' : '#64748b';

  const RendererEtiqueta = (props: any) => {
    const { cx, cy, outerRadius, index } = props;

    if (!cache || cx !== ultimoCx || cy !== ultimoCy || outerRadius !== ultimoRadio) {
      ultimoCx = cx;
      ultimoCy = cy;
      ultimoRadio = outerRadius;
      cache = calcularPosicionesSinColision(dataset, cx, cy, outerRadius);
    }

    const pos = cache[index];
    if (!pos) return null;

    const textoFormat = formatearTexto(pos.name, pos.value);
    const esMultilinea = typeof textoFormat === 'object';

    return (
      <g>
        <polyline
          points={`${pos.xBorde},${pos.yBorde} ${pos.xQuiebre},${pos.yQuiebre} ${pos.x},${pos.y}`}
          className="im-pie-label-line"
          stroke={colorLinea}
          fill="none"
          strokeWidth={1}
        />
        <text
          x={pos.x}
          y={pos.y}
          textAnchor={pos.textAnchor}
          dominantBaseline="central"
          className="im-pie-label-text"
          fill={colorTexto} 
          fontSize={11} 
          fontWeight="bold"
        >
          {esMultilinea ? (
            <>
              <tspan x={pos.x} dy="-0.6em">
                {textoFormat.linea1}
              </tspan>
              <tspan x={pos.x} dy="1.2em">
                {textoFormat.linea2}
              </tspan>
            </>
          ) : (
            <tspan x={pos.x} dy="0">{textoFormat}</tspan>
          )}
        </text>
      </g>
    );
  };

  return RendererEtiqueta;
};

// Devolvemos objetos para aprovechar el renderizado multilínea
export const formatearDinero = (name: string, value: number) => ({
  linea1: name,
  linea2: `$${Number(value || 0).toLocaleString('es-AR')}`
});

export const formatearCantidad = (name: string, value: number) => ({
  linea1: name,
  linea2: `${value}`
});