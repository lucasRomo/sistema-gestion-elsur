// src/services/insumoService.ts
const API_URL = 'http://localhost:8080/api/insumos';

const obtenerIdUsuarioLogueado = (): number | null => {
  const usuarioGuardado = localStorage.getItem('usuario_logueado');
  if (!usuarioGuardado) return null;
  const usuarioObj = JSON.parse(usuarioGuardado);
  return usuarioObj?.idUsuario || usuarioObj?.id_usuario || null;
};

export const getInsumos = async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener insumos");
  return res.json();
};

export const guardarInsumo = async (insumo: any) => {
  const idUsuarioActual = obtenerIdUsuarioLogueado();
  const isEditing = Boolean(insumo.idInsumo);
  
  const baseUrl = isEditing ? `${API_URL}/${insumo.idInsumo}` : API_URL;
  const method = isEditing ? 'PUT' : 'POST';

  const url = idUsuarioActual 
    ? `${baseUrl}?idUsuario=${idUsuarioActual}` 
    : baseUrl;

  const res = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(insumo)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
};