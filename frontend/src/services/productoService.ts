// src/services/productoService.ts
const API_URL = 'http://localhost:8080/api/productos';

const obtenerIdUsuarioLogueado = (): number | null => {
  const usuarioGuardado = localStorage.getItem('usuario_logueado');
  if (!usuarioGuardado) return null;
  const usuarioObj = JSON.parse(usuarioGuardado);
  return usuarioObj?.idUsuario || usuarioObj?.id_usuario || null;
};

export const getProductos = async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener productos");
  return res.json();
};

export const guardarProducto = async (producto: any) => {
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

export const actualizarPreciosMasivo = async (porcentaje: number) => {
  const idUsuarioActual = obtenerIdUsuarioLogueado();
  let url = `${API_URL}/actualizar-precios?porcentaje=${porcentaje}`;
  
  if (idUsuarioActual) {
    url += `&idUsuario=${idUsuarioActual}`;
  }

  const res = await fetch(url, {
    method: 'PATCH'
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.text();
};