import { API_BASE_URL, apiFetch } from '../../../config/api';

export interface RespaldoLog {
  idRespaldo: number;
  fechaHora: string;
  nombreArchivo: string;
  tamanio: string;
  usuarioOperador: string;
  tipo: string;
}

// BUG corregido: este service tenía su propia 'API_URL' hardcodeada a
// 'http://localhost:8080/api' y usaba fetch() directo con un header
// Authorization armado a mano, en vez de la API_BASE_URL compartida
// (config/api.ts, que respeta VITE_API_URL) y el helper apiFetch que ya usa
// el resto del proyecto. Esto afectaba a TODO el módulo Configuración -- las
// tres pestañas de Ajustes de Perfil (usuario/contraseña/email) y las cinco
// operaciones de Respaldo (historial, generar, descargar, eliminar,
// restaurar) -- que hubieran quedado rotas en cualquier entorno que no fuera
// el de desarrollo local del autor, mientras el resto de los módulos (que sí
// usan API_BASE_URL) funcionarían normalmente en el mismo despliegue. Se
// mantiene la firma de cada función (sigue recibiendo 'token' desde
// useConfiguracion, que lo lee de localStorage) para no tener que tocar
// todos los call sites, pasándolo ahora como header explícito a apiFetch en
// vez de a fetch() directo.
export const configuracionService = {
  // --- Perfil ---
  async cambiarPassword(idUsuario: number, token: string, passwords: { actual: string; nueva: string }) {
    return apiFetch(`${API_BASE_URL}/usuarios/${idUsuario}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ passwordActual: passwords.actual, passwordNueva: passwords.nueva })
    });
  },

  async cambiarUsuario(idUsuario: number, token: string, datos: { actual: string; nuevo: string }) {
    return apiFetch(`${API_BASE_URL}/usuarios/${idUsuario}/username`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ usuarioActual: datos.actual, usuarioNuevo: datos.nuevo })
    });
  },

  async cambiarEmail(idUsuario: number, token: string, datos: { actual: string; nuevo: string }) {
    return apiFetch(`${API_BASE_URL}/usuarios/${idUsuario}/email`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ emailActual: datos.actual, emailNuevo: datos.nuevo })
    });
  },

  // --- Respaldos ---
  async getHistorialRespaldos(token: string): Promise<RespaldoLog[]> {
    const res = await apiFetch(`${API_BASE_URL}/respaldos/historial`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Error al obtener historial");
    return res.json();
  },

  async generarRespaldo(usuarioNombre: string, token: string) {
    return apiFetch(`${API_BASE_URL}/respaldos/generar?usuario=${encodeURIComponent(usuarioNombre)}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async descargarRespaldo(idRespaldo: number, token: string): Promise<Blob> {
    const res = await apiFetch(`${API_BASE_URL}/respaldos/descargar/${idRespaldo}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Error al descargar");
    return res.blob();
  },

  async eliminarRespaldo(idRespaldo: number, token: string) {
    return apiFetch(`${API_BASE_URL}/respaldos/${idRespaldo}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async restaurarRespaldo(formData: FormData, token: string) {
    return apiFetch(`${API_BASE_URL}/respaldos/restaurar`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
  }
};