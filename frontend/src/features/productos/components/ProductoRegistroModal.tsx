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
  
  // Estados para los menús desplegables custom
  const [textoMaquina, setTextoMaquina] = useState<string>('No aplica');
  const [showDropdownEstado, setShowDropdownEstado] = useState<boolean>(false);
  const [showDropdownMaquina, setShowDropdownMaquina] = useState<boolean>(false);
  const [showDropdownCategorias, setShowDropdownCategorias] = useState<boolean>(false);
  
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

  useEffect(() => {
    if (formData.idMaquinaNecesaria === '') {
      setTextoMaquina('No aplica');
    } else if (maquinas.length > 0) {
      const m = maquinas.find((maq: any) => maq.idMaquina.toString() === formData.idMaquinaNecesaria);
      if (m) {
        setTextoMaquina(`${m.nombre || m.nombre} (${m.estado})`);
      }
    }
  }, [formData.idMaquinaNecesaria, maquinas]);

  const handleCrearCategoria = async () => {
    const nombreLimpio = nuevaCategoria.trim();
    if (!nombreLimpio) return;

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
                
                {/* Nombre */}
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
                
                {/* Precio y Stock */}
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

                {/* Estado y Máquina */}
                <div className="row mb-3">
                  {/* Dropdown Custom: Estado del Producto */}
                  <div className="col-6">
                    <label className="form-label small fw-semibold" style={{ color: mutedText }}>Estado del Producto</label>
                    <div className="position-relative">
                      <input 
                        type="text"
                        readOnly
                        className={`form-control shadow-none ${textColor}`}
                        style={{ backgroundColor: inputBg, borderColor: inputBorder, cursor: 'pointer' }}
                        value={formData.estado} 
                        onClick={() => setShowDropdownEstado(true)}
                        onBlur={() => setTimeout(() => setShowDropdownEstado(false), 200)}
                      />
                      {showDropdownEstado && (
                        <div 
                          className={`position-absolute w-100 shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
                          style={{ maxHeight: '180px', zIndex: 1060, border: `1px solid ${inputBorder}`, top: '100%', left: 0 }}
                        >
                          {['Activo', 'Desactivado'].map((est) => (
                            <div
                              key={est}
                              className="p-2 border-bottom text-truncate"
                              style={{ 
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                backgroundColor: est === formData.estado ? '#0284c7' : (isDark ? '#27272a' : '#f8fafc'),
                                color: est === formData.estado ? '#ffffff' : (isDark ? '#e4e4e7' : '#1e293b')
                              }}
                              onMouseDown={() => {
                                setFormData({...formData, estado: est});
                                setShowDropdownEstado(false);
                              }}
                            >
                              <span className="fw-semibold">{est}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Custom: Máquina Necesaria */}
                  <div className="col-6">
                    <label className="form-label small fw-semibold" style={{ color: mutedText }}>Máquina Necesaria</label>
                    <div className="position-relative">
                      <input 
                        type="text"
                        autoComplete="off"
                        className={`form-control shadow-none ${textColor}`}
                        style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                        placeholder="Buscar máquina..."
                        value={textoMaquina} 
                        onChange={(e) => {
                          setTextoMaquina(e.target.value);
                          setFormData({...formData, idMaquinaNecesaria: ''}); 
                        }}
                        onFocus={() => setShowDropdownMaquina(true)}
                        onBlur={() => setTimeout(() => setShowDropdownMaquina(false), 200)}
                      />
                      {showDropdownMaquina && (
                        <div 
                          className={`position-absolute w-100 shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
                          style={{ maxHeight: '180px', zIndex: 1060, border: `1px solid ${inputBorder}`, top: '100%', left: 0 }}
                        >
                          {/* Opción por defecto */}
                          <div
                            className="p-2 border-bottom text-truncate"
                            style={{ 
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              backgroundColor: formData.idMaquinaNecesaria === '' ? '#0284c7' : (isDark ? '#27272a' : '#f8fafc'),
                              color: formData.idMaquinaNecesaria === '' ? '#ffffff' : (isDark ? '#e4e4e7' : '#1e293b')
                            }}
                            onMouseDown={() => {
                              setFormData({...formData, idMaquinaNecesaria: ''});
                              setTextoMaquina('No aplica');
                              setShowDropdownMaquina(false);
                            }}
                          >
                            <span className="fw-semibold">No aplica</span>
                          </div>
                          
                          {/* Lista de máquinas filtradas */}
                          {maquinas
                            .filter((m: any) => {
                              if (textoMaquina === 'No aplica' && formData.idMaquinaNecesaria === '') return true; 
                              const nombreStr = `${m.nombre || m.nombreMaquina} (${m.estado})`;
                              return nombreStr.toLowerCase().includes(textoMaquina.toLowerCase());
                            })
                            .map((m: any) => {
                              const isSelected = m.idMaquina.toString() === formData.idMaquinaNecesaria;
                              const displayNombre = `${m.nombre || m.nombreMaquina} (${m.estado})`;
                              return (
                                <div
                                  key={m.idMaquina}
                                  className="p-2 border-bottom text-truncate"
                                  style={{ 
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    backgroundColor: isSelected ? '#0284c7' : (isDark ? '#27272a' : '#f8fafc'),
                                    color: isSelected ? '#ffffff' : (isDark ? '#e4e4e7' : '#1e293b')
                                  }}
                                  onMouseDown={() => {
                                    setFormData({...formData, idMaquinaNecesaria: m.idMaquina.toString()});
                                    setTextoMaquina(displayNombre); 
                                    setShowDropdownMaquina(false);
                                  }}
                                >
                                  <span className="fw-semibold">{displayNombre}</span>
                                </div>
                              );
                            })
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dropdown Custom: Categoría */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold" style={{ color: mutedText }}>Categoría</label>
                  <div className="input-group position-relative">
                    <input 
                      type="text"
                      autoComplete="off"
                      className={`form-control shadow-none ${textColor}`} 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                      placeholder="Escribe para buscar o ingresar categoría..."
                      value={formData.nombreCategoria} 
                      onChange={e => setFormData({...formData, nombreCategoria: e.target.value})}
                      onFocus={() => setShowDropdownCategorias(true)}
                      onBlur={() => setTimeout(() => setShowDropdownCategorias(false), 200)}
                      required
                    />
                    <button type="button" className="btn btn-outline-info" onClick={() => setShowCategorias(true)}>
                      <i className="bi bi-gear-fill"></i>
                    </button>
                    
                    {showDropdownCategorias && (
                      <div 
                        className={`position-absolute shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
                        style={{ maxHeight: '180px', zIndex: 1060, border: `1px solid ${inputBorder}`, top: '100%', left: 0, right: 0 }}
                      >
                        {categorias.filter(c => c.nombre.toLowerCase().includes(formData.nombreCategoria.toLowerCase())).length === 0 ? (
                          <div className="p-2 small text-muted text-center">Sin coincidencias</div>
                        ) : (
                          categorias
                            .filter(c => c.nombre.toLowerCase().includes(formData.nombreCategoria.toLowerCase()))
                            .map((c) => {
                              const isSelected = c.nombre === formData.nombreCategoria;
                              return (
                                <div
                                  key={c.idCategoria}
                                  className="p-2 border-bottom text-truncate"
                                  style={{ 
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    backgroundColor: isSelected ? '#0284c7' : (isDark ? '#27272a' : '#f8fafc'),
                                    color: isSelected ? '#ffffff' : (isDark ? '#e4e4e7' : '#1e293b')
                                  }}
                                  onMouseDown={() => {
                                    setFormData({ ...formData, nombreCategoria: c.nombre });
                                    setShowDropdownCategorias(false);
                                  }}
                                >
                                  <span className="fw-semibold">{c.nombre}</span>
                                </div>
                              );
                            })
                        )}
                      </div>
                    )}
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