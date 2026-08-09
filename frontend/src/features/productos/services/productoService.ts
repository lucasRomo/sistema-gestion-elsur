import type { Producto } from '../types/Producto';

const API_URL = 'http://localhost:8080/api/productos';

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