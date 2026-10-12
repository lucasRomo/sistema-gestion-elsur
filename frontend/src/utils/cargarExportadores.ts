import { hideLoading, showLoading } from '../config/loadingStore';
import { mostrarToast } from '../config/toastStore';

// Las librerías para exportar (Excel ~900 KB, PDF ~400 KB) se descargan recién cuando alguien
// exporta, no al abrir la pantalla. La primera vez se muestra "Preparando archivo..." mientras
// llegan; después quedan en la caché del navegador.

const conCarga = async <T,>(cargar: () => Promise<T>): Promise<T> => {
  showLoading('Preparando archivo...');
  try {
    return await cargar();
  } catch (error) {
    mostrarToast('No se pudo preparar el archivo. Revisá la conexión e intentá de nuevo.', { tipo: 'error' });
    throw error;
  } finally {
    hideLoading();
  }
};

export const cargarExcel = () => conCarga(() => import('exceljs').then((m) => m.default));

export const cargarPdf = () =>
  conCarga(() =>
    Promise.all([import('jspdf'), import('jspdf-autotable')]).then(([pdf, tabla]) => ({
      jsPDF: pdf.default,
      autoTable: tabla.default,
    }))
  );
