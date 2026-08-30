import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { DocumentoDigital } from '../types/Repositorio';

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

  return (
    <div className="card p-3 rounded-3 d-flex flex-column justify-content-between" style={{ backgroundColor: cardBg, borderColor: cardBorder, color: 'inherit', minHeight: '520px' }}>
      {documento ? (
        <>
          <div>
            <div className="d-flex flex-column align-items-center justify-content-center p-4 rounded mb-3" style={{ backgroundColor: isDarkMode ? '#1a1919' : '#ececec', border: `1px solid ${cardBorder}`, minHeight: '200px' }}>
              {getIconoArchivo(documento.tipoArchivo)}
              <span className="fw-bold mt-2 text-info fs-5 text-center">{documento.nombreArchivoOriginal}</span>
              <span className="badge bg-secondary mt-1 font-monospace">{documento.tipoArchivo?.toUpperCase()}</span>
            </div>

            <div className="small space-y-2">
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

          <div className="d-flex flex-column gap-2 mt-3">
            <div className="d-flex gap-2">
              <button className="btn btn-primary btn-sm flex-fill fw-bold text-white" style={{ backgroundColor: '#5a8ab8', border: 'none' }} onClick={onPrevisualizar}>
                Ver (Pantalla Completa)
              </button>
              <button 
  className="btn btn-success btn-sm flex-fill fw-bold text-white" 
  style={{ backgroundColor: '#28a745', border: 'none' }} 
  onClick={handleCrearPedido}
>
  Crear Pedido de Impresión
</button>
            </div>
            {documento.producto && (
              <button 
                className="btn btn-sm w-100 fw-bold text-white" 
                onClick={handleVerDetallesProducto}
                style={{ backgroundColor: '#e4ca36', border: 'none' }}
              >
                <i className="bi me-1"></i> Ver Detalles Producto
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted my-auto">
          <i className="bi bi-file-earmark-arrow-up fs-1 mb-2"></i>
          <p>Seleccione un documento de la lista para ver su detalle.</p>
        </div>
      )}
    </div>
  );
};