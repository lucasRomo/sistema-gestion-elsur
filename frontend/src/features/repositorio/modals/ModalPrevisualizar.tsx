import React, { useEffect, useState } from 'react';
import type { DocumentoDigital } from '../types/Repositorio';
import { API_BASE_URL, apiFetch } from '../../../config/api';

interface Props {
  show: boolean;
  documento: DocumentoDigital | null;
  onClose: () => void;
  textColor: string;
  cardBg: string;
  isDarkMode: boolean;
}

export const ModalPrevisualizar: React.FC<Props> = ({
  show,
  documento,
  onClose,
  textColor,
  cardBg,
  isDarkMode,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let urlActual: string | null = null;

    const cargarArchivo = async () => {
      if (!documento?.urlArchivoLocal) return;
      setCargando(true);
      try {
        const response = await apiFetch(`${API_BASE_URL}/documentos-digital/archivo/${encodeURIComponent(documento.urlArchivoLocal)}`);
        if (!response.ok) throw new Error('No se pudo obtener el archivo');
        const blob = await response.blob();
        urlActual = URL.createObjectURL(blob);
        setBlobUrl(urlActual);
      } catch (error) {
        console.error('Error al cargar la previsualización:', error);
        setBlobUrl(null);
      } finally {
        setCargando(false);
      }
    };

    if (show && documento) {
      cargarArchivo();
    }

    // Liberamos el blob anterior al cerrar el modal o cambiar de documento
    return () => {
      if (urlActual) URL.revokeObjectURL(urlActual);
    };
  }, [show, documento]);

  if (!show || !documento) return null;

  const ext = documento.tipoArchivo?.toUpperCase();

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 1060 }}>
      <div className="modal-dialog modal-fullscreen p-3">
        <div className={`modal-content border-secondary d-flex flex-column h-100 ${textColor}`} style={{ backgroundColor: cardBg }}>
          <div className="modal-header border-secondary py-2">
            <h5 className="modal-title font-monospace fw-bold text-info">
              Previsualización: {documento.titulo}
            </h5>
            <button
              type="button"
              className={`btn-close ${isDarkMode ? 'btn-close-white' : ''}`}
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-0 flex-grow-1 bg-black d-flex justify-content-center align-items-center">
            {cargando ? (
              <div className="spinner-border text-info" role="status"></div>
            ) : !blobUrl ? (
              <p className="text-white">No se pudo cargar el archivo.</p>
            ) : ext === 'PDF' ? (
              <iframe
                src={blobUrl}
                title={documento.titulo}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
            ) : ['JPG', 'JPEG', 'PNG'].includes(ext || '') ? (
              <img
                src={blobUrl}
                alt={documento.titulo}
                style={{ maxHeight: '90vh', maxWidth: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div className="text-center p-5">
                <i className="bi bi-file-earmark-word text-primary display-1 mb-3"></i>
                <h4>Previsualización directa no soportada para archivos Office ({documento.tipoArchivo}).</h4>
                <a
                  href={blobUrl}
                  download={documento.nombreArchivoOriginal || documento.titulo}
                  className="btn btn-outline-info mt-2 text-white"
                >
                  Descargar Archivo
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
