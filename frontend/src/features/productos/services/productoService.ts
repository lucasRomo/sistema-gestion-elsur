import type { Producto, Categoria } from '../types/Producto';
import type { Maquina } from '../../maquinas/types/Maquina';
import { API_BASE_URL } from '../../../config/api';

const API_URL = `${API_BASE_URL}/productos`;
const API_CATEGORIAS_URL = `${API_BASE_URL}/categorias`;
const API_INSUMOS_URL = `${API_BASE_URL}/insumos`;
const API_PRODUCTO_INSUMO_URL = `${API_BASE_URL}/producto-insumo`;
const API_MAQUINAS_URL = `${API_BASE_URL}/maquinas`;
const API_MERMAS_URL = `${API_BASE_URL}/mermas`;

const obtenerIdUsuarioLogueado = (): number | null => {
  const usuarioGuardado = localStorage.getItem('usuario_logueado');
  if (!usuarioGuardado) return null;
  try {
    const usuarioObj = JSON.parse(usuarioGuardado);
    return usuarioObj?.idUsuario || usuarioObj?.id_usuario || null;
  } catch {
    return null;
  }
};

// --- Productos ---
export const getProductos = async (): Promise<Producto[]> => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener productos");
  return res.json();
};

export const guardarProducto = async (producto: Partial<Producto>) => {
  const idUsuarioActual = obtenerIdUsuarioLogueado();
  const isEditing = Boolean(producto.idProducto);
  
  const baseUrl = isEditing ? `${API_URL}/${producto.idProducto}` : API_URL;
  const method = isEditing ? 'PUT' : 'POST';

  const url = idUsuarioActual 
    ? `${baseUrl}?idUsuario=${idUsuarioActual}` 
    : baseUrl;

  const res = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
};

export interface ActualizarPreciosPayload {
  criterio?: 'TODOS' | 'CATEGORIA' | 'SELECCION';
  porcentaje: number;
  idCategoria?: number | null;
  idProveedor?: number | null;
  idsProductos?: number[];
}

export const actualizarPreciosMasivo = async (payload: ActualizarPreciosPayload) => {
  const idUsuarioActual = obtenerIdUsuarioLogueado();
  let url = `${API_URL}/actualizar-precios`;
  
  if (idUsuarioActual) {
    url += `?idUsuario=${idUsuarioActual}`;
  }

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.text();
};

export const toggleStockVinculado = async (idProducto: number) => {
  const res = await fetch(`${API_URL}/${idProducto}/toggle-stock-vinculado`, {
    method: 'PATCH'
  });
  if (!res.ok) throw new Error("Error al cambiar vinculación de stock");
  return res.json();
};

// --- Insumos y Recetas ---
export const getInsumos = async (): Promise<any[]> => {
  const res = await fetch(API_INSUMOS_URL);
  if (!res.ok) throw new Error("Error al obtener insumos");
  return res.json();
};

export const getRecetaPorProducto = async (idProducto: number): Promise<any[]> => {
  const res = await fetch(`${API_PRODUCTO_INSUMO_URL}/producto/${idProducto}`);
  if (!res.ok) throw new Error("Error al obtener la receta del producto");
  return res.json();
};

export const guardarRecetaProducto = async (idProducto: number, payload: any[]): Promise<void> => {
  const res = await fetch(`${API_PRODUCTO_INSUMO_URL}/producto/${idProducto}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Error al guardar la receta del producto");
};

export const getTodasLasRecetas = async (): Promise<any[]> => {
  const res = await fetch(API_PRODUCTO_INSUMO_URL);
  if (!res.ok) throw new Error("Error al obtener recetas");
  return res.json();
};

// --- Categorías ---
export const getCategorias = async (): Promise<Categoria[]> => {
  const res = await fetch(API_CATEGORIAS_URL);
  if (!res.ok) throw new Error("Error al obtener categorías");
  return res.json();
};

export const crearCategoria = async (nombre: string): Promise<Categoria> => {
  const res = await fetch(API_CATEGORIAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre })
  });
  if (!res.ok) throw new Error("No se pudo crear la categoría");
  return res.json();
};

export const eliminarCategoria = async (idCategoria: number): Promise<void> => {
  const res = await fetch(`${API_CATEGORIAS_URL}/${idCategoria}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error("No se pudo eliminar la categoría");
};

// --- Máquinas ---
export const getMaquinas = async (): Promise<Maquina[]> => {
  const res = await fetch(API_MAQUINAS_URL);
  if (!res.ok) throw new Error("Error al obtener máquinas");
  return res.json();
};

// --- Mermas ---
export const getHistorialMermas = async (): Promise<any[]> => {
  const res = await fetch(API_MERMAS_URL);
  if (!res.ok) throw new Error("Error al obtener mermas");
  return res.json();
};