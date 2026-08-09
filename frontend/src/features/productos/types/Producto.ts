export interface Categoria {
  idCategoria: number;
  nombre: string;
  descuentoAutomatico?: number;
}

export interface Maquina {
  idMaquina: number;
  nombre?: string;
  nombreMaquina?: string;
  estado?: string;
}

export interface Producto {
  idProducto?: number;
  nombreProducto: string;
  precioBase: number;
  stock: number;
  stockVinculado?: boolean;
  categoria: Categoria;
  maquinaNecesaria?: Maquina | null;
  estado: 'Activo' | 'Desactivado';
}

export interface Insumo {
  idInsumo: number;
  nombreInsumo: string;
  unidadMedida: string;
  stockActual: number;
}

export interface RecetaItem {
  idProductoInsumo?: number;
  insumo: Insumo;
  cantidadConsumo: number;
}