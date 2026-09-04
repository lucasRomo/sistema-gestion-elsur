import { API_BASE_URL } from '../../../../config/api';

export interface TipoDocumento {
  idTipoDocumento: number;
  nombreTipo?: string;
  nombre?: string;
}

export const personaService = {
  obtenerTiposDocumento: async (): Promise<TipoDocumento[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/tipos-documento`);
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("Error al obtener tipos de documento en personaService:", error);
      return [
        { idTipoDocumento: 1, nombreTipo: 'DNI', nombre: 'DNI' },
        { idTipoDocumento: 2, nombreTipo: 'CUIT', nombre: 'CUIT' },
        { idTipoDocumento: 3, nombreTipo: 'CUIL', nombre: 'CUIL' },
        { idTipoDocumento: 4, nombreTipo: 'PASAPORTE', nombre: 'PASAPORTE' }
      ];
    }
  }
};