import type { Proveedor } from '../types/Proveedor';

const API_URL = 'http://localhost:8080/api/proveedores';
const API_TIPOS_URL = 'http://localhost:8080/api/tipos-proveedor';

export const getProveedores = async (): Promise<Proveedor[]> => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener proveedores");
  return res.json();
};

export const guardarProveedor = async (proveedor: Proveedor) => {
  const usuarioGuardado = localStorage.getItem('usuario_logueado');
  const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const idUsuarioActual = usuarioObj?.idUsuario || usuarioObj?.id_usuario;

  const isEditing = Boolean(proveedor.idProveedor);
  const baseUrl = isEditing ? `${API_URL}/${proveedor.idProveedor}` : API_URL;
  const method = isEditing ? 'PUT' : 'POST';

  const url = idUsuarioActual 
    ? `${baseUrl}?idUsuario=${idUsuarioActual}` 
    : baseUrl;

  const res = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proveedor)
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

/* --- MÉTODOS PARA TIPOS / CATEGORÍAS DE PROVEEDOR --- */

export const getTiposProveedor = async (): Promise<any[]> => {
  const res = await fetch(API_TIPOS_URL);
  if (!res.ok) throw new Error("Error al obtener tipos de proveedor");
  return res.json();
};

export const crearTipoProveedor = async (descripcion: string): Promise<any> => {
  const res = await fetch(API_TIPOS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descripcion })
  });
  if (!res.ok) throw new Error("Error al crear tipo de proveedor");
  return res.json();
};

export const eliminarTipoProveedor = async (id: number): Promise<void> => {
  const res = await fetch(`${API_TIPOS_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error("Error al eliminar tipo de proveedor");
};