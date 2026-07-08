import React, { useState, useEffect } from 'react';
import type { Producto, Categoria } from '../../types/Producto';

interface Props {
  show: boolean;
  producto: Producto | null;
  onClose: () => void;
  onGuardar: (data: any) => void; // Ya no es opcional, es obligatorio recibir el data
}

export const ProductoRegistroModal: React.FC<Props> = ({ show, producto, onClose, onGuardar }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [showCategorias, setShowCategorias] = useState<boolean>(false);
  const [nuevaCategoria, setNuevaCategoria] = useState<string>('');
  
  const [formData, setFormData] = useState({
    nombreProducto: '',
    precioBase: '',
    stock: '0', // NUEVO ESTADO INICIAL
    idCategoria: '',
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

  useEffect(() => {
    if (show) {
      cargarCategorias();
      if (producto) {
        setFormData({
          nombreProducto: producto.nombreProducto,
          precioBase: producto.precioBase.toString(),
          stock: producto.stock?.toString() || '0', // CARGAMOS EL STOCK AL EDITAR
          idCategoria: producto.categoria?.idCategoria?.toString() || '',
          estado: producto.estado
        });
      } else {
        // Limpiamos el formulario si es un producto nuevo
        setFormData({
          nombreProducto: '',
          precioBase: '',
          stock: '0',
          idCategoria: '',
          estado: 'Activo'
        });
      }
    }
  }, [show, producto]);

  const handleCrearCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    try {
      const res = await fetch('http://localhost:8080/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevaCategoria.trim() })
      });
      if (res.ok) {
        setNuevaCategoria('');
        cargarCategorias();
      }
    } catch (error) { alert("Error al guardar la nueva categoría"); }
  };

  const handleEliminarCategoria = async (id: number) => {
    if (!confirm("¿Seguro que querés eliminar esta categoría?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/categorias/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (formData.idCategoria === id.toString()) {
          setFormData(prev => ({ ...prev, idCategoria: '' }));
        }
        cargarCategorias();
      } else {
        alert("No se pudo eliminar, es posible que tenga productos asociados.");
      }
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
    }
  };

  // Dentro de ProductoRegistroModal.tsx -> handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const payload = {
    ...producto,
    nombreProducto: formData.nombreProducto,
    precioBase: parseFloat(formData.precioBase),
    stock: parseInt(formData.stock) || 0,
    categoria: { idCategoria: parseInt(formData.idCategoria) },
    estado: formData.estado
  };

  // YA NO HAGAS FETCH AQUÍ. Solo llama a la función que viene de afuera:
  await onGuardar(payload);
};

  if (!show) return null;

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content text-white font-monospace" style={{ backgroundColor: '#1e1e24', border: '1px solid #3f3f46' }}>
            <div className="modal-header border-bottom border-secondary">
              <h5 className="modal-title text-info fw-bold">
                <i className="bi bi-box-seam me-2"></i> {producto ? 'Modificar Producto' : 'Registrar Producto'}
              </h5>
              <button className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small">Nombre del Producto</label>
                  <input className="form-control bg-dark text-white border-secondary" 
                   value={formData.nombreProducto} 
                   onChange={e => setFormData({...formData, nombreProducto: e.target.value})} 
                   required pattern="[A-Za-z0-9Á-Úá-ú\s]+"
                   onInvalid={(e: any) => {
                   if (e.target.validity.valueMissing) e.target.setCustomValidity("El nombre del producto es obligatorio");
                   else if (e.target.validity.patternMismatch) e.target.setCustomValidity("Nombre inválido");
                   }}
                   onInput={(e: any) => e.target.setCustomValidity("")}/>
                </div>
                

                {/* Agrupamos Precio y Stock en la misma fila para que no quede tan largo el modal */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label small">Precio Base</label>
                    <input className="form-control bg-dark text-white border-secondary" type="number" step="0.01" value={formData.precioBase} onChange={e => setFormData({...formData, precioBase: e.target.value})} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Stock Inicial</label>
                    <input className="form-control bg-dark text-white border-secondary" type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                  </div>
                </div>
                <div className="mb-3">
                <label className="form-label small">Estado del Producto</label>
                <select 
                className="form-select bg-dark text-white border-secondary"
                value={formData.estado} 
                onChange={e => setFormData({...formData, estado: e.target.value})}
                >
                <option value="Activo">Activo</option>
                <option value="Desactivado">Desactivado</option>
                </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small">Categoría</label>
                  <div className="input-group">
                    <select className="form-select bg-dark text-white border-secondary" value={formData.idCategoria} onChange={e => setFormData({...formData, idCategoria: e.target.value})} required>
                      <option value="">Seleccionar Categoría</option>
                      {categorias.map(c => <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>)}
                    </select>
                    <button type="button" className="btn btn-outline-info" onClick={() => setShowCategorias(true)}>
                      <i className="bi bi-gear-fill"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer border-top border-secondary">
                <button type="button" className="btn btn-secondary px-4" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-info text-dark fw-bold px-4">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showCategorias && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content text-white font-monospace" style={{ backgroundColor: '#18181b', border: '1px solid #ffc107' }}>
              <div className="modal-header border-bottom border-secondary">
                <h6 className="modal-title text-warning fw-bold"><i className="bi bi-gear-fill me-2"></i>Administrar Categorías</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCategorias(false)}></button>
              </div>
              <div className="modal-body">
                <div className="input-group mb-3">
                  <input className="form-control bg-dark text-white border-secondary" placeholder="Nueva categoría..." value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} />
                  <button className="btn btn-success" onClick={handleCrearCategoria}>Agregar</button>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {categorias.map(c => (
                    <div key={c.idCategoria} className="bg-dark p-2 rounded mb-1 border border-secondary d-flex justify-content-between align-items-center">
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