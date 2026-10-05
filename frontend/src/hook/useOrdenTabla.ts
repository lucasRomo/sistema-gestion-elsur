import { useMemo, useState } from 'react';

export type DireccionOrden = 'asc' | 'desc';
export type ValorOrden = string | number | null | undefined;

// Orden de tablas tocando el encabezado: primer clic ascendente, segundo descendente.
// Los vacíos van siempre al final; los textos se comparan sin distinguir mayúsculas ni acentos.
export function useOrdenTabla<T>(
  items: T[],
  accesores: Record<string, (item: T) => ValorOrden>,
  inicial: { clave: string; direccion: DireccionOrden }
) {
  const [orden, setOrden] = useState(inicial);

  const alternar = (clave: string) =>
    setOrden((prev) =>
      prev.clave === clave
        ? { clave, direccion: prev.direccion === 'asc' ? 'desc' : 'asc' }
        : { clave, direccion: 'asc' });

  const accesor = accesores[orden.clave];
  const ordenados = useMemo(() => {
    if (!accesor) return items;
    const signo = orden.direccion === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      const va = accesor(a);
      const vb = accesor(b);
      const vaciaA = va === null || va === undefined || va === '';
      const vaciaB = vb === null || vb === undefined || vb === '';
      if (vaciaA || vaciaB) return vaciaA === vaciaB ? 0 : vaciaA ? 1 : -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * signo;
      return String(va).localeCompare(String(vb), 'es', { sensitivity: 'base', numeric: true }) * signo;
    });
  }, [items, accesor, orden.direccion]);

  return { ordenados, orden, alternar };
}
