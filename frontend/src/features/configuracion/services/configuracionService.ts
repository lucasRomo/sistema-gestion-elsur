export interface RespaldoLog {
  idRespaldo: number;
  fechaHora: string;
  nombreArchivo: string;
  tamanio: string;
  usuarioOperador: string;
  tipo: string;
}

const API_URL = 'http://localhost:8080/api';

export const configuracionService = {
  // --- Perfil ---
  async cambiarPassword(idUsuario: number, token: string, passwords: { actual: string; nueva: string }) {
    return fetch(`${API_URL}/usuarios/${idUsuario}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ passwordActual: passwords.actual, passwordNueva: passwords.nueva })
    });
  },

  async cambiarUsuario(idUsuario: number, token: string, datos: { actual: string; nuevo: string }) {
    return fetch(`${API_URL}/usuarios/${idUsuario}/username`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ usuarioActual: datos.actual, usuarioNuevo: datos.nuevo })
    });
  },

  async cambiarEmail(idUsuario: number, token: string, datos: { actual: string; nuevo: string }) {
    return fetch(`${API_URL}/usuarios/${idUsuario}/email`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ emailActual: datos.actual, emailNuevo: datos.nuevo })
    });
  },

  // --- Respaldos ---
  async getHistorialRespaldos(token: string): Promise<RespaldoLog[]> {
    const res = await fetch(`${API_URL}/respaldos/historial`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Error al obtener historial");
    return res.json();
  },

  async generarRespaldo(usuarioNombre: string, token: string) {
    return fetch(`${API_URL}/respaldos/generar?usuario=${encodeURIComponent(usuarioNombre)}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async descargarRespaldo(idRespaldo: number, token: string): Promise<Blob> {
    const res = await fetch(`${API_URL}/respaldos/descargar/${idRespaldo}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Error al descargar");
    return res.blob();
  },

  async eliminarRespaldo(idRespaldo: number, token: string) {
    return fetch(`${API_URL}/respaldos/${idRespaldo}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async restaurarRespaldo(formData: FormData, token: string) {
    return fetch(`${API_URL}/respaldos/restaurar`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
  }
};