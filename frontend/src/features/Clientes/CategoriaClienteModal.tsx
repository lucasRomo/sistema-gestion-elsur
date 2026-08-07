import React, { useState, useEffect } from 'react';
import { useTheme } from '../../Context/ThemeContext';

interface Categoria {
  idCategoria?: number;
  nombre: string;
  descuentoAutomatico: number;
}

export const CategoriaClienteModal = ({ onCerrar }: { onCerrar: () => void }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables adaptativas según el tema
  const modalBg = isDark ? '#1b1b1b' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? 'text-white' : 'text-dark';
  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : '#64748b';
  const borderDivider = isDark ? 'border-secondary' : 'border-light-subtle';
  const cardBg = isDark ? '#1b1b1b' : '#f8fafc';
  const inputBg = isDark ? '#181818' : '#ffffff';
  const inputTextColor = isDark ? 'text-white' : 'text-dark';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';

  // Estilos de tabla limpia adaptativa
  const tableContainerBg = isDark ? '#1a1a1c' : '#ffffff';
  const tableText = isDark ? '#ffffff' : '#0f172a';
  const tableContainerBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const tableHeaderBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const tableRowBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const hoverRowBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc';
  const emptyTextColor = isDark ? 'text-white-50' : 'text-muted';

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState('');
  const [descuento, setDescuento] = useState<number>(0);

  const cargarCategorias = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/categorias-cliente');
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/api/categorias-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descuentoAutomatico: descuento })
      });
      if (res.ok) {
        setNombre('');
        setDescuento(0);
        cargarCategorias();
      }
    } catch (err) {
      alert("Error guardando categoría");
    }
  };

  const handleEliminar = async (id?: number) => {
    if (!id || !confirm("¿Seguro de eliminar esta categoría?")) return;
    try {
      await fetch(`http://localhost:8080/api/categorias-cliente/${id}`, { method: 'DELETE' });
      cargarCategorias();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg font-monospace" style={{ backgroundColor: modalBg, border: `1px solid ${modalBorder}`, color: titleColor }}>
          
          {/* Encabezado */}
          <div className={`modal-header border-bottom ${borderDivider}`}>
            <h5 className="modal-title font-monospace fw-bold" style={{ color: titleColor }}>
              <i className="bi bi-tag-fill text-info me-2"></i> Categorías de Clientes y Descuentos
            </h5>
            <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onCerrar}></button>
          </div>

          <div className="modal-body p-4">
            {/* Formulario de Alta */}
            <form 
              onSubmit={handleCrear} 
              className="row g-3 mb-4 p-3 rounded border shadow-sm align-items-end" 
              style={{ backgroundColor: cardBg, borderColor: inputBorder }}
            >
              <div className="col-md-6">
                <label className="form-label small font-monospace fw-semibold" style={{ color: mutedText }}>
                  Nombre (ej. Estudiantes, Juzgados)
                </label>
                <input 
                  type="text"
                  className={`form-control ${inputTextColor}`} 
                  style={{ backgroundColor: inputBg, borderColor: inputBorder }} 
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)} 
                  required 
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small font-monospace fw-semibold" style={{ color: mutedText }}>
                  Descuento (%)
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  className={`form-control ${inputTextColor}`} 
                  style={{ backgroundColor: inputBg, borderColor: inputBorder }} 
                  value={descuento} 
                  onChange={e => setDescuento(Number(e.target.value))} 
                  required 
                />
              </div>

              <div className="col-md-2">
                <button type="submit" className="btn btn-success w-100 fw-bold shadow-sm" style={{ color: '#ffffff' }}>
                  Guardar
                </button>
              </div>
            </form>

            {/* Tabla Adaptativa (sin la clase .table) */}
            <div 
              className="table-responsive rounded shadow-sm" 
              style={{ 
                maxHeight: '40vh', 
                overflowY: 'auto',
                backgroundColor: tableContainerBg,
                border: `1px solid ${tableContainerBorder}`,
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <table 
                className="align-middle m-0" 
                style={{ 
                  width: '100%',
                  borderCollapse: 'separate', 
                  borderSpacing: 0,
                  color: tableText 
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `2px solid ${tableHeaderBorder}`, backgroundColor: tableContainerBg }}>
                    <th className="py-3 px-3 font-monospace small" style={{ color: tableText, width: '60px', whiteSpace: 'nowrap' }}>ID</th>
                    <th className="py-3 px-3 font-monospace small" style={{ color: tableText }}>Categoría</th>
                    <th className="py-3 px-3 font-monospace small" style={{ color: tableText }}>Descuento Predefinido</th>
                    <th className="py-3 px-3 font-monospace small text-center" style={{ color: tableText }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map(c => (
                    <tr 
                      key={c.idCategoria}
                      style={{ borderBottom: `1px solid ${tableRowBorder}`, transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverRowBg} 
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className="px-3 py-3 font-monospace small" style={{ color: tableText, whiteSpace: 'nowrap' }}>{c.idCategoria}</td>
                      <td className="px-3 py-3 fw-bold" style={{ color: tableText }}>{c.nombre}</td>
                      <td className="px-3 py-3">
                        <span className="badge rounded-pill bg-info bg-opacity-75 font-monospace px-3 py-2 text-white" style={{ color: '#ffffff' }}>
                          {c.descuentoAutomatico}% OFF
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button 
                          className="btn btn-outline-danger btn-sm rounded-2 d-inline-flex align-items-center justify-content-center" 
                          style={{ width: '32px', height: '32px' }}
                          title="Eliminar categoría"
                          onClick={() => handleEliminar(c.idCategoria)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categorias.length === 0 && (
                    <tr>
                      <td colSpan={4} className={`text-center py-5 ${emptyTextColor}`}>
                        <i className="bi bi-tag display-5 d-block mb-2 opacity-50"></i>
                        <span className="font-monospace">No hay categorías cargadas.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className={`modal-footer border-top ${borderDivider}`}>
            <button className="btn btn-danger px-4 fw-semibold" style={{ color: '#ffffff' }} onClick={onCerrar}>
              Volver
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};