import { apiFetch } from '../../../config/api';
const API_URL = 'http://localhost:8080/api';

export interface MensajeChat {
  rol: 'usuario' | 'asistente';
  texto: string;
}

export const asistenteService = {
  async preguntar(mensaje: string, modulo: string | null, historial: MensajeChat[]): Promise<string> {
    const token = localStorage.getItem('token_sesion');

    const res = await apiFetch(`${API_URL}/asistente/preguntar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        mensaje,
        modulo,
        historial: historial.slice(-8),
      }),
    });

    if (!res.ok) {
      let mensajeError = 'No se pudo contactar al asistente.';
      try {
        const data = await res.json();
        if (data?.error) mensajeError = data.error;
      } catch {
      }
      throw new Error(mensajeError);
    }

    const data = await res.json();
    return data.respuesta as string;
  },
};
