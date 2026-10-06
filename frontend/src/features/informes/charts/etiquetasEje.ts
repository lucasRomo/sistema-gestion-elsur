// Nombres del eje X de los gráficos de barras (empleados, categorías...): se parten en hasta 2
// líneas y, si igual no entran, se cortan con "…" (el nombre completo sale en el tooltip).

const MAX_CARACTERES_POR_LINEA = 14;
const ANCHO_POR_CARACTER = 7.2; // px aprox. a 12px de fuente
const ANCHO_MAXIMO_POR_BARRA = 150;

export const partirEtiqueta = (texto: unknown, maxPorLinea = MAX_CARACTERES_POR_LINEA): string[] => {
  const palabras = String(texto ?? '').trim().split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of palabras) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (candidata.length <= maxPorLinea || !actual) {
      actual = candidata;
    } else {
      lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);

  const resultado = lineas.slice(0, 2).map((l) => (l.length > maxPorLinea ? `${l.slice(0, maxPorLinea - 1)}…` : l));
  if (lineas.length > 2) {
    const segunda = resultado[1];
    resultado[1] = segunda.length >= maxPorLinea ? `${segunda.slice(0, maxPorLinea - 1)}…` : `${segunda}…`;
  }
  return resultado;
};

/** Ancho de cada barra para que su nombre (partido en 2 líneas) no se pise con el de al lado. */
export const anchoPorEtiquetas = (etiquetas: unknown[], minimo: number): number => {
  const masLarga = etiquetas.reduce<number>(
    (max, e) => Math.max(max, ...partirEtiqueta(e).map((l) => l.length)), 0);
  return Math.max(minimo, Math.min(ANCHO_MAXIMO_POR_BARRA, Math.ceil(masLarga * ANCHO_POR_CARACTER) + 24));
};
