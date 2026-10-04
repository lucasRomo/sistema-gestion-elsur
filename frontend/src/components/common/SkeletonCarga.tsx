import React from 'react';

// Esqueletos de carga: muestran la forma del contenido mientras llega, en vez de un spinner
// sobre una pantalla vacía. La espera se percibe más corta y la pantalla no "salta".
// Estilos (.skeleton-linea) en index.css.

const Linea: React.FC<{ ancho: string; alto?: number }> = ({ ancho, alto = 12 }) => (
  <span className="skeleton-linea" style={{ width: ancho, height: `${alto}px` }} />
);

export const SkeletonTarjetas: React.FC<{ cantidad?: number }> = ({ cantidad = 4 }) => (
  <div className="d-flex flex-column gap-2" aria-busy="true" aria-label="Cargando">
    {Array.from({ length: cantidad }).map((_, i) => (
      <div key={i} className="card w-100 p-3" style={{ borderRadius: '12px' }}>
        <div className="d-flex align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3" style={{ flex: 1 }}>
            <Linea ancho="40px" alto={18} />
            <Linea ancho="35%" alto={14} />
          </div>
          <Linea ancho="120px" />
          <Linea ancho="90px" alto={22} />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonFilasTabla: React.FC<{ filas?: number; columnas: number }> = ({ filas = 6, columnas }) => (
  <>
    {Array.from({ length: filas }).map((_, i) => (
      <tr key={i} aria-busy="true">
        {Array.from({ length: columnas }).map((__, j) => (
          <td key={j} className="py-3 px-3">
            <Linea ancho={j === 1 ? '80%' : '60%'} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export const SkeletonTabla: React.FC<{ filas?: number; columnas?: number }> = ({ filas = 8, columnas = 6 }) => (
  <table className="table m-0 align-middle" style={{ backgroundColor: 'transparent' }}>
    <tbody>
      <SkeletonFilasTabla filas={filas} columnas={columnas} />
    </tbody>
  </table>
);
