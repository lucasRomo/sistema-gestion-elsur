import type { Proveedor } from '../../proveedores/types/Proveedor';

export interface UnidadMedida {
  idUnidad?: number;
  nombre?: string;
  abreviatura?: string;
}

export interface Insumo {
  idInsumo?: number;
  nombreInsumo: string;
  precio: number;
  stockActual: number;
  stockMinimo: number;
  unidadMedida?: UnidadMedida;
  unidadCompra?: UnidadMedida;
  factorConversion?: number;
  stockEmpaquetado?: number;
  proveedor?: Proveedor;
  estado: string;
}