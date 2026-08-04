// src/services/insumoService.ts
import type { Insumo } from '../types/Insumo';

const API_URL = 'http://localhost:8080/api/insumos';

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

export const getInsumosBajoStock = async (): Promise<Insumo[]> => {
  try {
    const res = await fetch(`${API_URL}/bajo-stock`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Falló endpoint /bajo-stock, aplicando filtro local de respaldo", e);
  }
  const todos = await getInsumos();
  return todos.filter((i: Insumo) => i.stockActual <= i.stockMinimo);
};

export interface ActualizarInsumosPayload {
  porcentaje: number;
  idProveedor?: number | null;
  idsInsumos?: number[];
}

export const actualizarInsumosMasivo = async (payload: ActualizarInsumosPayload) => {
  const idUsuarioActual = obtenerIdUsuarioLogueado();
  let url = `${API_URL}/actualizar-masivo`;
  
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