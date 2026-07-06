import type { Proveedor } from './Proveedor';

export interface UnidadMedida {
  idUnidad?: number;
  descripcion: string;
}

export interface Insumo {
  idInsumo?: number;
  nombreInsumo: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida?: UnidadMedida;
  proveedor?: Proveedor;
  estado: string;
}