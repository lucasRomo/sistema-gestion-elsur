import { showLoading, hideLoading } from './loadingStore';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface ApiFetchOptions extends RequestInit {
  /** true = nunca mostrar el overlay en esta llamada, aunque sea POST/PUT/DELETE */
  skipLoading?: boolean;
  /** true = mostrar el overlay aunque sea un GET (casos puntuales, ej. reporte pesado) */
  forceLoading?: boolean;
  /** Mensaje a mostrar mientras dura esta llamada */
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

/**
 * Extrae un mensaje de error legible de una respuesta HTTP no exitosa.
 *
 * El backend (ver GlobalExceptionHandler) devuelve siempre un JSON tipo
 * ApiError con un campo "mensaje" ({"timestamp":...,"status":400,"error":"Bad
 * Request","mensaje":"La Caja No está Abierta...","path":"/api/pedidos"}).
 * Antes, varios lugares del frontend hacían `throw new Error(await res.text())`
 * y mostraban eso tal cual en un modal -- el usuario terminaba viendo el JSON
 * crudo en pantalla en vez del mensaje. Esta función parsea ese cuerpo y se
 * queda solo con el texto pensado para mostrarse.
 */
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
    // No era JSON: algunos endpoints viejos devuelven el mensaje en texto plano,
    // sin envolver en ApiError -- en ese caso el texto tal cual ya es legible.
    return texto;
  }
};