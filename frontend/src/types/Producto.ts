export interface Categoria {
  idCategoria: number;
  nombre: string;
  descuentoAutomatico: number;
}

export interface Maquina {
  idMaquina: number;
  nombre: string;
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