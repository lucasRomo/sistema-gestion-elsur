import { apiFetch, API_BASE_URL } from '../config/api';
import { mostrarToast } from '../config/toastStore';

export const obtenerBlobUrl = async (rutaRelativaBackend: string, mensajeCarga?: string): Promise<string> => {
  const response = await apiFetch(rutaRelativaBackend, mensajeCarga ? { forceLoading: true, loadingMessage: mensajeCarga } : {});
  if (!response.ok) throw new Error('No se pudo obtener el archivo');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const verComprobantePedido = async (nombreArchivo: string): Promise<void> => {
  // La pestaña se abre en el mismo clic (antes de esperar la descarga): si se abre después,
  // navegadores como Safari la bloquean como ventana emergente.
  const pestana = window.open('', '_blank');
  if (pestana) {
    pestana.document.title = 'Comprobante';
    pestana.document.body.innerHTML = '<p style="font-family:monospace;padding:2rem;color:#555">Cargando comprobante...</p>';
  }
  try {
    const url = await obtenerBlobUrl(
      `${API_BASE_URL}/pedidos/comprobantes/archivo/${encodeURIComponent(nombreArchivo)}`,
      'Cargando comprobante...'
    );
    if (pestana) pestana.location.href = url;
    else window.open(url, '_blank');
    // El navegador ya tiene el archivo; se libera la memoria del blob al rato.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    pestana?.close();
    mostrarToast('No se pudo abrir el comprobante. Puede que el archivo ya no exista.', { tipo: 'error' });
  }
};
