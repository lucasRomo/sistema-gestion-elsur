import { useState } from 'react';

// Lógica compartida de selección de mermas (modal de Pedidos Pendientes y modal de Productos).
//
// Regla de stock:
// - Producto con stock vinculado a insumos: su stock se calcula desde los insumos, así que lo
//   que se pierde son los insumos. Al marcar el producto se pre-marcan los insumos de su receta
//   (cantidad x consumo) y el usuario puede desmarcar los que se puedan reutilizar.
// - Producto con stock manual: se descuenta del stock del producto. Sus insumos no se
//   pre-marcan (se descontaría dos veces), pero se pueden marcar a mano.

export interface InsumoDeReceta {
  key: string;
  idInsumo: number;
  consumoUnitario: number;
}

export interface ItemMerma {
  selected: boolean;
  cantidad: number | string;
  descripcion: string;
  idProducto?: number;
  idInsumo?: number;
  /** Key del producto al que pertenece este insumo (solo insumos de receta). */
  productoKey?: string;
  consumoUnitario?: number;
  /** true mientras la cantidad del insumo siga calculada desde la del producto. */
  auto?: boolean;
}

export type SeleccionMermas = Record<string, ItemMerma>;

const redondear = (n: number) => Math.round(n * 1000) / 1000;

const cantidadDesdeProducto = (cantidadProducto: number | string, consumo: number): number | string => {
  const cant = Number(cantidadProducto);
  if (cantidadProducto === '' || !Number.isFinite(cant) || cant <= 0) return '';
  return redondear(cant * consumo);
};

export const useSeleccionMermas = () => {
  const [selections, setSelections] = useState<SeleccionMermas>({});

  const toggleProducto = (
    keyProd: string,
    idProducto: number,
    insumosReceta: InsumoDeReceta[],
    stockVinculado: boolean
  ) => {
    setSelections(prev => {
      const siguiente = { ...prev };

      if (prev[keyProd]?.selected) {
        delete siguiente[keyProd];
        Object.keys(siguiente).forEach(k => {
          if (siguiente[k].productoKey === keyProd && siguiente[k].auto) delete siguiente[k];
        });
        return siguiente;
      }

      siguiente[keyProd] = { selected: true, cantidad: 1, descripcion: '', idProducto };

      if (stockVinculado) {
        insumosReceta.forEach(ins => {
          if (siguiente[ins.key]?.selected) return;
          siguiente[ins.key] = {
            selected: true,
            cantidad: cantidadDesdeProducto(1, ins.consumoUnitario),
            descripcion: '',
            idInsumo: ins.idInsumo,
            idProducto,
            productoKey: keyProd,
            consumoUnitario: ins.consumoUnitario,
            auto: true
          };
        });
      }
      return siguiente;
    });
  };

  const toggleInsumo = (keyIns: string, idInsumo: number, idProducto: number | undefined, keyProd: string, consumoUnitario: number) => {
    setSelections(prev => {
      const siguiente = { ...prev };
      if (prev[keyIns]?.selected) {
        delete siguiente[keyIns];
        return siguiente;
      }
      const cantidadProducto = prev[keyProd]?.selected ? prev[keyProd].cantidad : '';
      const desdeProducto = cantidadDesdeProducto(cantidadProducto, consumoUnitario);
      siguiente[keyIns] = {
        selected: true,
        cantidad: desdeProducto === '' ? 1 : desdeProducto,
        descripcion: '',
        idInsumo,
        idProducto,
        productoKey: keyProd,
        consumoUnitario,
        auto: desdeProducto !== ''
      };
      return siguiente;
    });
  };

  const actualizarCampo = (key: string, campo: 'cantidad' | 'descripcion', valor: string | number) => {
    setSelections(prev => {
      if (!prev[key]) return prev;
      const siguiente = { ...prev };
      const esInsumoDeReceta = Boolean(prev[key].productoKey);

      siguiente[key] = {
        ...prev[key],
        [campo]: valor,
        // Si el usuario corrige a mano la cantidad de un insumo, deja de seguir al producto.
        ...(campo === 'cantidad' && esInsumoDeReceta ? { auto: false } : {})
      };

      if (campo === 'cantidad' && !esInsumoDeReceta) {
        Object.keys(siguiente).forEach(k => {
          const item = siguiente[k];
          if (item.productoKey === key && item.auto && item.consumoUnitario) {
            siguiente[k] = { ...item, cantidad: cantidadDesdeProducto(valor, item.consumoUnitario) };
          }
        });
      }
      return siguiente;
    });
  };

  const limpiar = () => setSelections({});

  return { selections, toggleProducto, toggleInsumo, actualizarCampo, limpiar };
};

/** Devuelve el mensaje de error a mostrar, o null si la selección es válida. */
export const validarSeleccionMermas = (selections: SeleccionMermas): string | null => {
  const items = Object.values(selections);
  if (items.length === 0) {
    return 'Por favor, selecciona al menos un producto o insumo afectado.';
  }
  const cantidadInvalida = items.some(item => {
    const cant = Number(item.cantidad);
    return item.cantidad === '' || !Number.isFinite(cant) || cant <= 0;
  });
  if (cantidadInvalida) {
    return 'La cantidad de cada ítem de merma debe ser un número mayor a 0.';
  }
  const productoNoEntero = items.some(item => !item.idInsumo && !Number.isInteger(Number(item.cantidad)));
  if (productoNoEntero) {
    return 'La cantidad de productos perdidos debe ser un número entero (las unidades de producto no se fraccionan).';
  }
  return null;
};

/** Normaliza la receta que devuelve /producto-insumo/producto/{id}. */
export const insumosDeReceta = (receta: any[], prefijoKey: string): (InsumoDeReceta & { nombre: string; unidad: string })[] =>
  (receta || [])
    .map((item: any, idx: number) => {
      const ins = item.insumo || {};
      const idInsumo = ins.idInsumo ?? ins.id_insumo;
      return {
        key: `${prefijoKey}-ins-${idInsumo}-${idx}`,
        idInsumo,
        consumoUnitario: Number(item.cantidadConsumo ?? item.cantidad_consumo ?? 0),
        nombre: ins.nombreInsumo || ins.nombre || 'Insumo',
        unidad: ins.unidadMedida?.nombre || ''
      };
    })
    .filter(i => i.idInsumo != null);
