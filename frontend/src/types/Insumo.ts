// src/types/Insumo.ts
import type { Proveedor } from './Proveedor';

export interface UnidadMedida {
  idUnidad?: number;
  descripcion: string;
}

export interface Insumo {
  idInsumo?: number;
  nombreInsumo: string;
  precio: number;
  stockActual: number;
  stockMinimo: number;
  unidadMedida?: UnidadMedida;
  proveedor?: Proveedor;
  estado: string;
}