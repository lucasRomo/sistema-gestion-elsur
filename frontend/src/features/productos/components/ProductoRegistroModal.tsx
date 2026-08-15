import React, { useState, useEffect } from 'react';
import type { Producto, Categoria } from '../types/Producto';
import type { Maquina } from '../../maquinas/types/Maquina';
import { useTheme } from '../../../Context/ThemeContext';

interface Props {
  show: boolean;
  producto: Producto | null;
  onClose: () => void;
  onGuardar: (data: any) => void;
}

export const ProductoRegistroModal: React.FC<Props> = ({ show, producto, onClose, onGuardar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const modalBg = isDark ? '#1e1e24' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const subModalBg = isDark ? '#18181b' : '#ffffff';
  const subModalBorder = isDark ? '#ffc107' : '#f59e0b';
  const textColor = isDark ? 'text-white' : 'text-dark';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';
  const inputBg = isDark ? '#121214' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const borderDivider = isDark ? 'border-secondary' : 'border-light-subtle';
  const itemCategoryBg = isDark ? '#121214' : '#f8fafc';

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [showCategorias, setShowCategorias] = useState<boolean>(false);
  const [nuevaCategoria, setNuevaCategoria] = useState<string>('');
  
  const [formData, setFormData] = useState({
    nombreProducto: '',
    precioBase: '',
    stock: '0',
    nombreCategoria: '',
    idMaquinaNecesaria: '',
    estado: 'Activo'
  });

  const cargarCategorias = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/categorias');
      if (res.ok) {
        const data = await res.json();
        setCategorias(data);
      }
    } catch (err) { console.error("Error cargando categorías:", err); }
  };

  const cargarMaquinas = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/maquinas');
      if (res.ok) {
        const data = await res.json();
        setMaquinas(data);
      }
    } catch (err) { console.error("Error cargando máquinas:", err); }
  };

  useEffect(() => {
    if (show) {
      cargarCategorias();
      cargarMaquinas();

      if (producto) {
        setFormData({
          nombreProducto: producto.nombreProducto || '',
          precioBase: producto.precioBase?.toString() || '',
          stock: producto.stock?.toString() || '0',
          nombreCategoria: producto.categoria?.nombre || '',
          idMaquinaNecesaria: (producto as any).maquinaNecesaria?.idMaquina?.toString() || '',
          estado: producto.estado || 'Activo'
        });
      } else {
        setFormData({
          nombreProducto: '',
          precioBase: '',
          stock: '0',
          nombreCategoria: '',
          idMaquinaNecesaria: '',
          estado: 'Activo'
        });
      }
    }
  }, [show, producto]);

  const handleCrearCategoria = async () => {
    const nombreLimpio = nuevaCategoria.trim();
    if (!nombreLimpio) return;

    // Validación preventiva en React
    const yaExiste = categorias.some(
      c => c.nombre.toLowerCase() === nombreLimpio.toLowerCase()
    );

    if (yaExiste) {
      alert(`La categoría "${nombreLimpio}" ya existe.`);
      return;
    }

    try {
      const res = await fetch('http://localhost:8080/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreLimpio })
      });

      if (res.ok) {
        setNuevaCategoria('');
        cargarCategorias();
      } else {
        alert("No se pudo crear la categoría.");
      }
    } catch (error) { 
      alert("Error al conectar con el servidor."); 
    }
  };

  const handleEliminarCategoria = async (id: number) => {
    if (!confirm("¿Seguro que querés eliminar esta categoría?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/categorias/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const catEliminada = categorias.find(c => c.idCategoria === id);
        if (catEliminada && formData.nombreCategoria === catEliminada.nombre) {
          setFormData(prev => ({ ...prev, nombreCategoria: '' }));
        }
        cargarCategorias();
      } else {
        alert("No se pudo eliminar, es posible que tenga productos asociados.");
      }
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const catEncontrada = categorias.find(
      c => c.nombre.toLowerCase() === formData.nombreCategoria.trim().toLowerCase()
    );
    
    const payload = {
      ...producto,
      nombreProducto: formData.nombreProducto,
      precioBase: parseFloat(formData.precioBase),
      stock: parseInt(formData.stock) || 0,
      categoria: catEncontrada 
        ? { idCategoria: catEncontrada.idCategoria, nombre: catEncontrada.nombre }
        : formData.nombreCategoria.trim() ? { nombre: formData.nombreCategoria.trim() } : null,
      maquinaNecesaria: formData.idMaquinaNecesaria ? { idMaquina: parseInt(formData.idMaquinaNecesaria) } : null,
      estado: formData.estado
    };

    await onGuardar(payload);
  };

  if (!show) return null;

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className={`modal-content ${textColor} font-monospace shadow-lg`} style={{ backgroundColor: modalBg, border: `1px solid ${modalBorder}` }}>
            <div className={`modal-header border-bottom ${borderDivider}`}>
              <h5 className="modal-title fw-bold" style={{ color: isDark ? '#0bc9f8' : '#0284c7' }}>
                <i className="bi bi-box-seam me-2"></i> {producto ? 'Modificar Producto' : 'Registrar Producto'}
              </h5>
              <button className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onClose}></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label small fw-semibold" style={{ color: mutedText }}>Nombre del Producto</label>
                  <input 
                    className={`form-control ${textColor}`} 
                    style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                    value={formData.nombreProducto} 
                    onChange={e => setFormData({...formData, nombreProducto: e.target.value})} 
                    required pattern="[A-Za-z0-9Á-Úá-ú\s]+"
                    onInvalid={(e: any) => {
                      if (e.target.validity.valueMissing) e.target.setCustomValidity("El nombre del producto es obligatorio");
                      else if (e.target.validity.patternMismatch) e.target.setCustomValidity("Nombre inválido");
                    }}
                    onInput={(e: any) => e.target.setCustomValidity("")}
                  />
                </div>
                
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold" style={{ color: mutedText }}>Precio Base</label>
                    <input 
                      className={`form-control ${textColor}`} 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                      type="number" 
                      step="0.01" 
                      value={formData.precioBase} 
                      onChange={e => setFormData({...formData, precioBase: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold" style={{ color: mutedText }}>Stock Inicial</label>
                    <input 
                      className={`form-control ${textColor}`} 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                      type="number" 
                      min="0" 
                      value={formData.stock} 
                      onChange={e => setFormData({...formData, stock: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold" style={{ color: mutedText }}>Estado del Producto</label>
                    <select 
                      className={`form-select ${textColor}`}
                      style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                      value={formData.estado} 
                      onChange={e => setFormData({...formData, estado: e.target.value})}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Desactivado">Desactivado</option>
                    </select>
                  </div>

                  <div className="col-6">
                    <label className="form-label small fw-semibold" style={{ color: mutedText }}>Máquina Necesaria</label>
                    <select 
                      className={`form-select ${textColor}`}
                      style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                      value={formData.idMaquinaNecesaria} 
                      onChange={e => setFormData({...formData, idMaquinaNecesaria: e.target.value})}
                    >
                      <option value="">No aplica</option>
                      {maquinas.map((m: any) => (
                        <option key={m.idMaquina} value={m.idMaquina}>
                          {m.nombre || m.nombreMaquina} ({m.estado})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold" style={{ color: mutedText }}>Categoría</label>
                  <div className="input-group">
                    <input 
                      list="categorias-list"
                      className={`form-control ${textColor}`} 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                      placeholder="Escribe para buscar o ingresar categoría..."
                      value={formData.nombreCategoria} 
                      onChange={e => setFormData({...formData, nombreCategoria: e.target.value})} 
                      required
                    />
                    <datalist id="categorias-list">
                      {categorias.map(c => (
                        <option key={c.idCategoria} value={c.nombre} />
                      ))}
                    </datalist>
                    <button type="button" className="btn btn-outline-info" onClick={() => setShowCategorias(true)}>
                      <i className="bi bi-gear-fill"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className={`modal-footer border-top ${borderDivider} py-2`}>
                <button type="button" className="btn btn-sm btn-danger px-4" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-sm btn-info px-4" style={{ backgroundColor: '#278114', borderColor: "#278114", color: 'white' }} >Guardar</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showCategorias && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className={`modal-content ${textColor} font-monospace shadow-lg`} style={{ backgroundColor: subModalBg, border: `1px solid ${subModalBorder}` }}>
              <div className={`modal-header border-bottom ${borderDivider}`}>
                <h6 className="modal-title text-warning fw-bold"><i className="bi bi-gear-fill me-2"></i>Administrar Categorías</h6>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setShowCategorias(false)}></button>
              </div>
              <div className="modal-body p-3">
                <div className="input-group mb-3">
                  <input 
                    className={`form-control ${textColor}`} 
                    style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                    placeholder="Nueva categoría..." 
                    value={nuevaCategoria} 
                    onChange={e => setNuevaCategoria(e.target.value)} 
                  />
                  <button className="btn btn-success" onClick={handleCrearCategoria}>Agregar</button>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {categorias.map(c => (
                    <div 
                      key={c.idCategoria} 
                      className={`p-2 rounded mb-1 border ${borderDivider} d-flex justify-content-between align-items-center`}
                      style={{ backgroundColor: itemCategoryBg }}
                    >
                      <span className="small">{c.nombre}</span>
                      <button 
                        type="button"
                        className="btn btn-sm text-danger border-0 bg-transparent" 
                        onClick={() => handleEliminarCategoria(c.idCategoria)}
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};