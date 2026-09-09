export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Wrapper de fetch que agrega automáticamente el header Authorization
 * con el token guardado en localStorage.
 */
export const apiFetch = (input: string, init: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('token_sesion');

  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Si la ruta es relativa (ej: '/pedidos'), le antepone la base URL
  const url = input.startsWith('http') ? input : `${API_BASE_URL}${input}`;

  return fetch(url, { ...init, headers });
};