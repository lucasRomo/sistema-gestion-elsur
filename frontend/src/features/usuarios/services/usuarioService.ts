// src/services/usuarioService.ts
import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../config/api';

const API_URL = `${API_BASE_URL}/usuarios`;

export const getUsuarios = async () => {
  const res = await apiFetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener usuarios");
  return res.json();
};

 // Valida en el backend si un nombre de usuario ya se encuentra registrado.
export const validarExisteUsuario = async (nombreUsuario: string): Promise<boolean> => {
  if (!nombreUsuario.trim()) return false;

  try {
    const response = await apiFetch(`${API_URL}/exists?nombreUsuario=${encodeURIComponent(nombreUsuario.trim())}`);
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

  const res = await apiFetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario)
  });

  if (!res.ok) throw new Error(await extraerMensajeError(res, 'Error al guardar el usuario.'));
  return res.json();
};

// "Ver contraseña" en Gestión de Usuarios. Le pedimos al admin logueado que
// reingrese SU PROPIA contraseña (no la del usuario que quiere ver) para
// confirmar la operación; el backend valida eso y recién ahí desencripta.
export const obtenerPasswordReal = async (idUsuario: number, passwordAdmin: string): Promise<string> => {
  const res = await apiFetch(`${API_URL}/${idUsuario}/password-real`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passwordAdmin })
  });

  if (!res.ok) throw new Error(await extraerMensajeError(res, 'No se pudo obtener la contraseña.'));
  const data = await res.json();
  return data.passwordReal;
};

// NUEVO: "Restablecer contraseña" en Gestión de Usuarios. Antes esto no existía
// de verdad -- el campo "Contraseña" del modal de edición de usuario no tenía
// ningún efecto real (guardarUsuario/PUT siempre conserva el hash existente en
// una edición general, ver UsuarioServiceImpl.guardar en el backend), así que
// no había forma de fijarle una contraseña nueva a otro usuario sin que éste
// supiera la actual. Mismo criterio de reautenticación que obtenerPasswordReal:
// quien pide esto reingresa SU PROPIA contraseña de administrador, nunca la del
// usuario objetivo.
export const restablecerPassword = async (
  idUsuario: number,
  passwordAdmin: string,
  passwordNueva: string
): Promise<void> => {
  const res = await apiFetch(`${API_URL}/${idUsuario}/password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passwordAdmin, passwordNueva })
  });

  if (!res.ok) throw new Error(await extraerMensajeError(res, 'No se pudo restablecer la contraseña.'));
};