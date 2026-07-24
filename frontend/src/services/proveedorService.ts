// src/services/proveedorService.ts
import type { Proveedor } from '../types/Proveedor';

const API_URL = 'http://localhost:8080/api/proveedores';

export const getProveedores = async (): Promise<Proveedor[]> => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener proveedores");
  return res.json();
};

export const guardarProveedor = async (proveedor: Proveedor) => {
  // 1. Extraemos el usuario logueado desde localStorage
  const usuarioGuardado = localStorage.getItem('usuario_logueado');
  const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const idUsuarioActual = usuarioObj?.idUsuario || usuarioObj?.id_usuario;

  // 2. Definimos verbo HTTP y URL
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