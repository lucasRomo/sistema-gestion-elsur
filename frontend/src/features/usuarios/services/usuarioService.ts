// src/services/usuarioService.ts
import { API_BASE_URL } from '../../../config/api';

const API_URL = `${API_BASE_URL}/usuarios`;

export const getUsuarios = async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener usuarios");
  return res.json();
};

 // Valida en el backend si un nombre de usuario ya se encuentra registrado.
export const validarExisteUsuario = async (nombreUsuario: string): Promise<boolean> => {
  if (!nombreUsuario.trim()) return false;

  try {
    const response = await fetch(`${API_URL}/exists?nombreUsuario=${encodeURIComponent(nombreUsuario.trim())}`);
    if (response.ok) {
      return await response.json();
    }
    return false;
  } catch (error) {
    console.error("Error al validar nombre de usuario:", error);
    return false;
  }
};

export const guardarUsuario = async (usuario: any) => {
  // 1. Extraemos el usuario autenticado que realiza la acción
  const usuarioGuardado = localStorage.getItem('usuario_logueado');
  const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const idUsuarioActual = usuarioObj?.idUsuario || usuarioObj?.id_usuario;

  // 2. Definimos si es actualización (PUT) o creación (POST)
  const isEditing = Boolean(usuario.idUsuario);
  const baseUrl = isEditing ? `${API_URL}/${usuario.idUsuario}` : API_URL;
  const method = isEditing ? 'PUT' : 'POST';

  const url = idUsuarioActual 
    ? `${baseUrl}?idUsuario=${idUsuarioActual}` 
    : baseUrl;

  const res = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario)
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};