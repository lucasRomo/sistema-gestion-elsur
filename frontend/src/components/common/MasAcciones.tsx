import React, { useEffect, useRef, useState } from 'react';

// Acciones secundarias de la barra de abajo (Mermas, Modificar varios precios, Ver relaciones…).
// En pantallas anchas (>= 1600 px) se muestran todas en línea como siempre; en notebooks y
// pantallas más chicas se agrupan en un botón "Más acciones ▾" para que la barra entre en una
// sola fila sin achicar los botones hasta volverlos ilegibles.

export interface AccionSecundaria {
  texto: string;
  icono: string;
  onClick: () => void;
  /** Clases de color del botón en la vista ancha (ej. "btn-outline-warning"). */
  claseBoton?: string;
  /** Estilo del botón en la vista ancha (para los colores puestos a mano). */
  estilo?: React.CSSProperties;
  disabled?: boolean;
}

interface Props {
  acciones: AccionSecundaria[];
}

export const MasAcciones: React.FC<Props> = ({ acciones }) => {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrarAfuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const cerrarConEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setAbierto(false); }
    };
    document.addEventListener('mousedown', cerrarAfuera);
    document.addEventListener('keydown', cerrarConEsc, true);
    return () => {
      document.removeEventListener('mousedown', cerrarAfuera);
      document.removeEventListener('keydown', cerrarConEsc, true);
    };
  }, [abierto]);

  return (
    <>
      {/* Pantallas anchas: en línea, como siempre */}
      {acciones.map((a) => (
        <button
          key={a.texto}
          type="button"
          className={`btn fw-semibold shadow-sm mas-acciones-en-linea ${a.claseBoton ?? ''}`}
          style={a.estilo}
          onClick={a.onClick}
          disabled={a.disabled}
        >
          <i className={`bi ${a.icono} me-2`} aria-hidden="true"></i>{a.texto}
        </button>
      ))}

      {/* Notebooks y pantallas chicas: agrupadas en un menú que se abre hacia arriba */}
      <div className="position-relative mas-acciones-menu" ref={ref}>
        <button
          type="button"
          className="btn btn-outline-secondary fw-semibold shadow-sm"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-haspopup="menu"
        >
          <i className="bi bi-three-dots me-2" aria-hidden="true"></i>Más acciones
          <i className={`bi ${abierto ? 'bi-chevron-down' : 'bi-chevron-up'} ms-2`} aria-hidden="true"></i>
        </button>
        {abierto && (
          <div className="mas-acciones-lista shadow-lg" role="menu">
            {acciones.map((a) => (
              <button
                key={a.texto}
                type="button"
                role="menuitem"
                className="mas-acciones-item"
                disabled={a.disabled}
                onClick={() => { setAbierto(false); a.onClick(); }}
              >
                <i className={`bi ${a.icono}`} aria-hidden="true"></i>
                <span>{a.texto}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
