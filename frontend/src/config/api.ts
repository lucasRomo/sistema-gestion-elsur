import { showLoading, hideLoading } from './loadingStore';
import { mostrarAviso } from './dialogStore';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface ApiFetchOptions extends RequestInit {
  skipLoading?: boolean;
  forceLoading?: boolean;
  loadingMessage?: string;
}

let avisoSesionMostrado = false;

// Token vencido (dura 10 hs) o inválido: el backend responde 401 a todo. Antes las pantallas
// quedaban vacías sin explicación; ahora se cierra la sesión y se vuelve al login.
const manejarSesionExpirada = () => {
  if (avisoSesionMostrado) return;
  avisoSesionMostrado = true;
  localStorage.removeItem('token_sesion');
  localStorage.removeItem('usuario_logueado');
  localStorage.removeItem('usuario');
  mostrarAviso('Tu sesión expiró. Por favor, iniciá sesión nuevamente.', { titulo: 'Sesión expirada' })
    .then(() => { window.location.href = '/login'; });
};

export const apiFetch = async (
  input: string,
  init: ApiFetchOptions = {}
): Promise<Response> => {
  const { skipLoading, forceLoading, loadingMessage, ...restInit } = init;
  const token = localStorage.getItem('token_sesion');

  const headers = new Headers(restInit.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = input.startsWith('http') ? input : `${API_BASE_URL}${input}`;

  const metodo = (restInit.method || 'GET').toUpperCase();
  const esMutacion = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo);
  const debeCargar = (esMutacion || forceLoading) && !skipLoading;

  if (debeCargar) showLoading(loadingMessage);
  try {
    const response = await fetch(url, { ...restInit, headers });
    // Solo con una sesión de usuario real: el login devuelve 401 por credenciales inválidas
    // y el token del portón (registro) tiene su propio flujo.
    if (response.status === 401 && token && localStorage.getItem('usuario_logueado')) {
      manejarSesionExpirada();
    }
    return response;
  } finally {
    if (debeCargar) hideLoading();
  }
};

export const extraerMensajeError = async (
  response: Response,
  mensajePorDefecto = 'Ocurrió un error inesperado. Intentalo de nuevo.'
): Promise<string> => {
  let texto = '';
  try {
    texto = await response.text();
  } catch {
    return mensajePorDefecto;
  }

  if (!texto) return mensajePorDefecto;

  try {
    const cuerpo = JSON.parse(texto);
    if (typeof cuerpo?.mensaje === 'string' && cuerpo.mensaje.trim()) return cuerpo.mensaje;
    if (typeof cuerpo?.message === 'string' && cuerpo.message.trim()) return cuerpo.message;
    if (typeof cuerpo?.error === 'string' && cuerpo.error.trim()) return cuerpo.error;
    return mensajePorDefecto;
  } catch {
    return texto;
  }
};