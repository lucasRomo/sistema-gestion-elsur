export const API_BASE_URL = 'http://192.168.0.96:8080/api';

/**
 * Wrapper de fetch que agrega automáticamente el header Authorization
 * con el token guardado en localStorage (misma clave que usa el login: 'token_sesion').
 *
 * Usar SIEMPRE en vez de fetch() directo para llamadas al backend, así no
 * volvemos a tener endpoints que "olviden" mandar el token.
 */
export const apiFetch = (input: string, init: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('token_sesion');

  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
};
