import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { clienteService } from '../services/clienteService';
import type { CategoriaCliente } from '../types/CategoriaCliente';

interface CategoriaClienteModalProps {
  onCerrar: () => void;
}

export const CategoriaClienteModal: React.FC<CategoriaClienteModalProps> = ({ onCerrar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables adaptativas según el tema
  const modalBg = isDark ? '#1b1b1b' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
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

  // Estados principales
  const [categorias, setCategorias] = useState<CategoriaCliente[]>([]);
  const [nombre, setNombre] = useState('');
  const [descuento, setDescuento] = useState<number>(0);

  // Estados para el Modal de Edición
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [categoriaEditar, setCategoriaEditar] = useState<CategoriaCliente | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescuento, setEditDescuento] = useState<number>(0);

  // Estado para el Modal de Éxito
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const cargarCategorias = async () => {
    try {
      const data = await clienteService.getCategorias();
      setCategorias(data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await clienteService.crearCategoria({ 
        nombre, 
        descuentoAutomatico: descuento 
      });
      setNombre('');
      setDescuento(0);
      cargarCategorias();
      setMensajeExito("Categoría creada con éxito");
      setMostrarModalExito(true);
    } catch (err) {
      alert("Error guardando la categoría");
    }
  };

  const abrirModalEditar = (cat: CategoriaCliente) => {
    setCategoriaEditar(cat);
    setEditNombre(cat.nombre);
    setEditDescuento(cat.descuentoAutomatico);
    setMostrarModalEditar(true);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaEditar?.idCategoria) return;

    try {
      await clienteService.actualizarCategoria(categoriaEditar.idCategoria, {
        nombre: editNombre,
        descuentoAutomatico: editDescuento
      });
      setMostrarModalEditar(false);
      setCategoriaEditar(null);
      cargarCategorias();

      // Desplegar modal de éxito
      setMensajeExito("Categoría actualizada con éxito");
      setMostrarModalExito(true);
    } catch (err) {
      alert("Error al actualizar la categoría");
    }
  };

  const handleEliminar = async (id?: number) => {
    if (!id || !confirm("¿Seguro de eliminar esta categoría?")) return;
    try {
      await clienteService.eliminarCategoria(id);
      cargarCategorias();
    } catch (err) {
      alert("Error al eliminar la categoría");
    }
  };

  return (
    <>
      {/* Modal Principal */}
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content shadow-lg font-monospace" style={{ backgroundColor: modalBg, border: `1px solid ${modalBorder}`, color: titleColor }}>
            
            <div className={`modal-header border-bottom ${borderDivider}`}>
              <h5 className="modal-title font-monospace fw-bold" style={{ color: titleColor }}>
                <i className="bi bi-tag-fill text-info me-2"></i> Categorías de Clientes y Descuentos
              </h5>
              <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onCerrar}></button>
            </div>

            <div className="modal-body p-4">
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
                          <div className="d-flex justify-content-center gap-2">
                            <button 
                              className="btn btn-outline-warning btn-sm rounded-2 d-inline-flex align-items-center justify-content-center" 
                              style={{ width: '32px', height: '32px' }}
                              title="Editar categoría"
                              onClick={() => abrirModalEditar(c)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button 
                              className="btn btn-outline-danger btn-sm rounded-2 d-inline-flex align-items-center justify-content-center" 
                              style={{ width: '32px', height: '32px' }}
                              title="Eliminar categoría"
                              onClick={() => handleEliminar(c.idCategoria)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
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

            <div className={`modal-footer border-top ${borderDivider}`}>
              <button className="btn btn-secondary px-4 fw-semibold" style={{ color: '#ffffff' }} onClick={onCerrar}>
                Volver
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* --- SUB-MODAL DE EDICIÓN --- */}
      {mostrarModalEditar && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content shadow-lg font-monospace" style={{ backgroundColor: modalBg, border: `1px solid ${modalBorder}`, color: titleColor }}>
              <div className={`modal-header border-bottom ${borderDivider} py-2`}>
                <h6 className="modal-title font-monospace fw-bold" style={{ color: titleColor }}>
                  <i className="bi bi-pencil-square text-warning me-2"></i> Editar Categoría
                </h6>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setMostrarModalEditar(false)}></button>
              </div>

              <form onSubmit={handleGuardarEdicion}>
                <div className="modal-body p-3">
                  <div className="mb-3">
                    <label className="form-label small font-monospace fw-semibold" style={{ color: mutedText }}>
                      Nombre Categoría
                    </label>
                    <input 
                      type="text" 
                      className={`form-control ${inputTextColor}`} 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder }} 
                      value={editNombre} 
                      onChange={e => setEditNombre(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label small font-monospace fw-semibold" style={{ color: mutedText }}>
                      Descuento (%)
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className={`form-control ${inputTextColor}`} 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder }} 
                      value={editDescuento} 
                      onChange={e => setEditDescuento(Number(e.target.value))} 
                      required 
                    />
                  </div>
                </div>

                <div className={`modal-footer border-top ${borderDivider} p-2 d-flex justify-content-between`}>
                  <button type="button" className="btn btn-sm btn-danger fw-semibold" onClick={() => setMostrarModalEditar(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-sm btn-success text-white fw-bold">
                    Actualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-MODAL DE ÉXITO --- */}
      {mostrarModalExito && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content shadow-lg font-monospace text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #7216af', borderRadius: '12px' }}>
              <div className="modal-body text-center py-3">
                <div className="d-flex justify-content-center mb-2">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: 'transparent', border: '2px solid #267c34' }}>
                    <i className="bi bi-check-lg" style={{ fontSize: '2.2rem', color: '#267c34' }}></i>
                  </div>
                </div>
                <h6 className="fw-bold my-2 text-white">{mensajeExito}</h6>
                <button 
                  className="btn btn-sm px-4 fw-bold mt-2" 
                  style={{ backgroundColor: '#267c34', color: '#ffffff', borderRadius: '6px', border: 'none' }} 
                  onClick={() => setMostrarModalExito(false)}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};