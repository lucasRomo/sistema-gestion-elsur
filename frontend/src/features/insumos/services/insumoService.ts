import type { Insumo, UnidadMedida } from '../types/Insumo';
import type { Proveedor } from '../../proveedores/types/Proveedor';
import { API_BASE_URL, apiFetch } from '../../../config/api';

const API_URL = `${API_BASE_URL}/insumos`;

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

// --- INSUMOS ---

export const getInsumos = async (): Promise<Insumo[]> => {
  const res = await apiFetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener insumos");
  return res.json();
};

export const guardarInsumo = async (insumo: any): Promise<Insumo> => {
  const idUsuarioActual = obtenerIdUsuarioLogueado();
  const isEditing = Boolean(insumo.idInsumo);
  
  const baseUrl = isEditing ? `${API_URL}/${insumo.idInsumo}` : API_URL;
  const method = isEditing ? 'PUT' : 'POST';

  const url = idUsuarioActual 
    ? `${baseUrl}?idUsuario=${idUsuarioActual}` 
    : baseUrl;

  const res = await apiFetch(url, {
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

export const convertirInsumo = async (idInsumo: number, cantidadBultos: number): Promise<Insumo> => {
  const idUsuarioActual = obtenerIdUsuarioLogueado();
  let url = `${API_URL}/${idInsumo}/convertir`;
  if (idUsuarioActual) {
    url += `?idUsuario=${idUsuarioActual}`;
  }

  const res = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cantidadBultos })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
};

export const getInsumosBajoStock = async (): Promise<Insumo[]> => {
  try {
    const res = await apiFetch(`${API_URL}/bajo-stock`);
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

  const res = await apiFetch(url, {
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

// --- PROVEEDORES ---

export const getProveedores = async (): Promise<Proveedor[]> => {
  const res = await fetch(`${API_BASE_URL}/proveedores`);
  if (!res.ok) throw new Error("Error al obtener proveedores");
  return res.json();
};

// --- UNIDADES DE MEDIDA ---

export const getUnidadesMedida = async (): Promise<UnidadMedida[]> => {
  const res = await fetch(`${API_BASE_URL}/unidades-medida`);
  if (!res.ok) throw new Error("Error al obtener unidades de medida");
  return res.json();
};

export const crearUnidadMedida = async (nombre: string): Promise<UnidadMedida> => {
  const res = await fetch(`${API_BASE_URL}/unidades-medida`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre })
  });

  if (!res.ok) {
    const errorMsg = await res.text();
    throw new Error(errorMsg || 'Error al guardar la unidad de medida');
  }
  return res.json();
};

export const eliminarUnidadMedida = async (idUnidad: number): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/unidades-medida/${idUnidad}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    throw new Error('No se pudo eliminar la unidad. Es posible que esté asignada a un insumo.');
  }
};