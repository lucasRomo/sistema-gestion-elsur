import { apiFetch, API_BASE_URL } from '../config/api'; 

export const obtenerBlobUrl = async (rutaRelativaBackend: string): Promise<string> => {
  const response = await apiFetch(rutaRelativaBackend);
  if (!response.ok) throw new Error('No se pudo obtener el archivo');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const verComprobantePedido = async (nombreArchivo: string): Promise<void> => {
  const url = await obtenerBlobUrl(`${API_BASE_URL}/pedidos/comprobantes/archivo/${encodeURIComponent(nombreArchivo)}`);
  window.open(url, '_blank');
};