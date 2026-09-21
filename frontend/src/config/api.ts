import { showLoading, hideLoading } from './loadingStore';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface ApiFetchOptions extends RequestInit {
  skipLoading?: boolean;
  forceLoading?: boolean;
  loadingMessage?: string;
}

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
    return await fetch(url, { ...restInit, headers });
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