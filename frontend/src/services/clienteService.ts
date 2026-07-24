const API_URL = 'http://localhost:8080/api/clientes';

export const getClientes = async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener clientes");
  return res.json();
};

export const crearCliente = async (cliente: any) => {
  // 1. Obtenemos el usuario activo desde localStorage (misma lógica que en CajaView)
  const usuarioGuardado = localStorage.getItem('usuario_logueado');
  const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const idUsuarioActual = usuarioObj?.idUsuario || usuarioObj?.id_usuario;

  // 2. Armamos la URL agregando el idUsuario si existe
  const url = idUsuarioActual 
    ? `${API_URL}?idUsuario=${idUsuarioActual}` 
    : API_URL;

  // 3. Hacemos el POST a la URL con la query string
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cliente)
  });

  if (!res.ok) throw new Error(await res.text());
  return res;
};