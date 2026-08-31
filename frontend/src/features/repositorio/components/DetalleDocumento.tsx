import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import type { DocumentoDigital } from '../types/Repositorio';
import { repositorioService } from '../services/repositorioService';

// Configuración del worker de PDF.js usando CDN compatible
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface Props {
  documento: DocumentoDigital | null;
  getIconoArchivo: (tipo: string) => React.ReactNode;
  onPrevisualizar: () => void;
  isDarkMode: boolean;
  cardBg: string;
  cardBorder: string;
}

export const DetalleDocumento: React.FC<Props> = ({
  documento,
  getIconoArchivo,
  onPrevisualizar,
  isDarkMode,
  cardBg,
  cardBorder,
}) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cargandoPdf, setCargandoPdf] = useState(false);

  const ext = documento?.tipoArchivo?.toUpperCase();

  const formatearTamano = (bytes: number) => {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleVerDetallesProducto = () => {
    if (documento?.producto) {
      navigate('/productos', { state: { productoEditar: documento.producto } });
    }
  };

  const handleCrearPedido = () => {
    if (documento?.producto) {
      navigate('/crear-pedido', { state: { productoAutoAgregar: documento.producto } });
    } else {
      navigate('/crear-pedido');
    }
  };

  // Renderizador nativo mediante Canvas (Sin iframe, sin barras de scroll, sin fondos negros)
  // Renderizador nativo mediante Canvas con tipado corregido para pdfjs-dist
  useEffect(() => {
    let isCancelled = false;

    if (ext === 'PDF' && documento?.urlArchivoLocal) {
      const renderPdfPage = async () => {
        setCargandoPdf(true);
        try {
          const url = repositorioService.getUrlArchivo(documento.urlArchivoLocal);
          // Se pasa la URL dentro de un objeto DocumentInitParameters
          const loadingTask = pdfjsLib.getDocument({ url });
          const pdf = await loadingTask.promise;

          if (isCancelled) return;

          const page = await pdf.getPage(1); // Carga exclusivamente la página 1

          if (isCancelled || !canvasRef.current || !containerRef.current) return;

          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          if (!context) return;

          // Calcula la escala para ajustar la página exactamente al ancho y alto del contenedor
          const containerWidth = containerRef.current.clientWidth || 300;
          const containerHeight = containerRef.current.clientHeight || 400;
          const unscaledViewport = page.getViewport({ scale: 1 });

          const scaleX = containerWidth / unscaledViewport.width;
          const scaleY = containerHeight / unscaledViewport.height;
          const scale = Math.min(scaleX, scaleY);

          const viewport = page.getViewport({ scale });

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          };

          await page.render(renderContext).promise;
        } catch (error) {
          console.error('Error al renderizar la vista previa del PDF:', error);
        } finally {
          if (!isCancelled) setCargandoPdf(false);
        }
      };

      renderPdfPage();
    }

    return () => {
      isCancelled = true;
    };
  }, [documento, ext]);

  return (
  <div
    className="card p-3 rounded-3 shadow-lg"
    style={{
      backgroundColor: cardBg,
      borderColor: cardBorder,
      color: 'inherit',
    }}
  >
    {documento ? (
      <div className="d-flex flex-column">
        <div className="d-flex flex-column" style={{ minHeight: 0 }}>
          {/* CONTENEDOR VISTA PREVIA (CANVAS) */}
          <div
            ref={containerRef}
            className="w-100 rounded mb-3 d-flex justify-content-center align-items-center position-relative overflow-hidden"
            style={{
              backgroundColor: isDarkMode ? '#121212' : '#f8f9fa',
              border: `1px solid ${cardBorder}`,
              flex: '1 1 550px', 
              minHeight: '150px',
            }}
          >
            {ext === 'PDF' ? (
              <>
                {cargandoPdf && (
                  <div className="position-absolute text-center text-muted">
                    <div className="spinner-border spinner-border-sm mb-1" role="status"></div>
                    <p className="small mb-0">Cargando vista previa...</p>
                  </div>
                )}
                <canvas ref={canvasRef} className="shadow-sm rounded" style={{ display: cargandoPdf ? 'none' : 'block' }} />
              </>
            ) : ['JPG', 'JPEG', 'PNG'].includes(ext || '') ? (
              <img
                src={repositorioService.getUrlArchivo(documento.urlArchivoLocal)}
                alt={documento.titulo}
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div className="text-center p-3 text-muted">
                {getIconoArchivo(documento.tipoArchivo)}
                <p className="mt-2 mb-0 small text-info fw-bold">{documento.nombreArchivoOriginal}</p>
                <span className="badge bg-secondary mt-1 font-monospace">{ext}</span>
              </div>
            )}
          </div>

          {/* DETALLES DEL DOCUMENTO */}
          <div className="small space-y-1 mb-2">
            <p className="mb-1"><strong className="text-secondary">Nombre:</strong> {documento.titulo}</p>
            <p className="mb-1"><strong className="text-secondary">Autor:</strong> {documento.autor}</p>
            <p className="mb-1">
              <strong className="text-secondary">Cantidad de Páginas:</strong>{' '}
              <span className="badge bg-info text-dark">{documento.cantidadPaginas} pág.</span>
            </p>
            <p className="mb-1"><strong className="text-secondary">Tamaño de Archivo:</strong> {formatearTamano(documento.tamanoBytes)}</p>
            <p className="mb-1">
              <strong className="text-secondary">Institución / Cátedra:</strong>{' '}
              {documento.area?.institucion?.nombreInstitucion} — {documento.area?.nombreArea}
            </p>
            {documento.producto && (
              <p className="mb-1 text-success fw-bold">Precio Base Registrado: ${documento.producto.precioBase}</p>
            )}
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
         <div className="d-flex flex-column gap-2 mt-2">
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm flex-fill fw-bold text-white"
              style={{ backgroundColor: '#5a8ab8', border: 'none' }}
              onClick={onPrevisualizar}
            >
              Ver (Pantalla Completa)
            </button>
            <button
              type="button"
              className="btn btn-success btn-sm flex-fill fw-bold text-white"
              style={{ backgroundColor: '#28a745', border: 'none' }}
              onClick={handleCrearPedido}
            >
              Crear Pedido de Impresión
            </button>
          </div>
          {documento.producto && (
            <button
              type="button"
              className="btn btn-sm w-100 fw-bold text-white"
              onClick={handleVerDetallesProducto}
              style={{ backgroundColor: '#e4ca36', border: 'none' }}
            >
              Ver Detalles Producto
            </button>
          )}
        </div>
      </div>
    ) : (
        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted my-auto">
        <i className="bi bi-file-earmark-arrow-up fs-1 mb-2"></i>
        <p>Seleccione un documento de la lista para ver su detalle.</p>
      </div>
    )}
  </div>
);
};