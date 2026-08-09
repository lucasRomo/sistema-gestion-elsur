// src/services/usuarioService.ts
const API_URL = 'http://localhost:8080/api/usuarios';

export const getUsuarios = async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener usuarios");
  return res.json();
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