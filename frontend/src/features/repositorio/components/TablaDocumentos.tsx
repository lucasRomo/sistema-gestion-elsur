import React from 'react';
import type { DocumentoDigital } from '../types/Repositorio';

interface Props {
  documentos: DocumentoDigital[];
  cargando: boolean;
  documentoSeleccionado: DocumentoDigital | null;
  onSelectDocumento: (doc: DocumentoDigital) => void;
  onEliminar: (e: React.MouseEvent, id: number) => void;
  getIconoArchivo: (tipo: string) => React.ReactNode;
  isDarkMode: boolean;
  cardBg: string;
  cardBorder: string;
}

export const TablaDocumentos: React.FC<Props> = ({
  documentos,
  cargando,
  documentoSeleccionado,
  onSelectDocumento,
  onEliminar,
  getIconoArchivo,
  isDarkMode,
  cardBg,
  cardBorder,
}) => {
  return (
    <div 
      className="table-responsive rounded-3 shadow-sm font-monospace" 
      style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, maxHeight: '420px', overflowY: 'auto' }}
    >
      <table 
        className="table table-borderless align-middle m-0" 
        style={{ 
          color: isDarkMode ? '#ffffff' : '#0f172a',
          backgroundColor: 'transparent',
          '--bs-table-bg': 'transparent',
          '--bs-table-color': isDarkMode ? '#ffffff' : '#0f172a'
        } as React.CSSProperties}
      >
        <thead>
          <tr style={{ borderBottom: `2px solid ${cardBorder}`, backgroundColor: cardBg, fontSize: '0.85rem' }} className="text-uppercase fw-bold text-secondary">
            <th className="py-3 px-3">Icono</th>
            <th className="py-3 px-3">Nombre Arch.</th>
            <th className="py-3 px-3">Materia</th>
            <th className="py-3 px-3">Carrera / Inst.</th>
            <th className="py-3 px-3 text-center">Opciones</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '0.9rem' }}>
          {cargando ? (
            <tr><td colSpan={5} className="text-center py-4 text-muted">Cargando repositorio...</td></tr>
          ) : documentos.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-4 text-muted">No se encontraron archivos en el repositorio.</td></tr>
          ) : (
            documentos.map((doc) => {
              const esSeleccionado = documentoSeleccionado?.idDocumento === doc.idDocumento;
              return (
                <tr
                  key={doc.idDocumento}
                  onClick={() => onSelectDocumento(doc)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: esSeleccionado ? (isDarkMode ? '#1b1b1b' : '#f8f8f8') : 'transparent',
                    borderBottom: `1px solid ${cardBorder}`,
                    borderLeft: esSeleccionado ? '4px solid #8e45e0' : '4px solid transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <td className="py-3 px-3">{getIconoArchivo(doc.tipoArchivo)}</td>
                  <td className="py-3 px-3 fw-bold text-truncate" style={{ maxWidth: '150px' }}>{doc.titulo}</td>
                  <td className="py-3 px-3 text-truncate" style={{ maxWidth: '120px' }}>{doc.area?.nombreArea || 'S/N'}</td>
                  <td className="py-3 px-3 text-truncate" style={{ maxWidth: '120px' }}>{doc.area?.institucion?.nombreInstitucion || 'S/N'}</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      className="btn btn-sm text-danger border-0 p-0 ms-1"
                      title="Eliminar de forma lógica"
                      onClick={(e) => onEliminar(e, doc.idDocumento)}
                    >
                      <i className="bi bi-x-square-fill fs-5"></i>
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};