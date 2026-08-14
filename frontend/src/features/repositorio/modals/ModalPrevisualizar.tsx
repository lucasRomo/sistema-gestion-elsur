import React from 'react';
import type { DocumentoDigital } from '../types/Repositorio';
import { repositorioService } from '../services/repositorioService';

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
            {ext === 'PDF' ? (
              <iframe
                src={repositorioService.getUrlArchivo(documento.urlArchivoLocal)}
                title={documento.titulo}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
            ) : ['JPG', 'JPEG', 'PNG'].includes(ext || '') ? (
              <img
                src={repositorioService.getUrlArchivo(documento.urlArchivoLocal)}
                alt={documento.titulo}
                style={{ maxHeight: '90vh', maxWidth: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div className="text-center p-5">
                <i className="bi bi-file-earmark-word text-primary display-1 mb-3"></i>
                <h4>Previsualización directa no soportada para archivos Office ({documento.tipoArchivo}).</h4>
                <a
                  href={repositorioService.getUrlArchivo(documento.urlArchivoLocal)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-info mt-2 text-white"
                >
                  Descargar / Abrir Archivo
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};