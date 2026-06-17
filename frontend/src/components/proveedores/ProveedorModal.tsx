import React, { useState, useEffect } from 'react';
import type { Proveedor } from '../../types/Proveedor';

interface ProveedorModalProps {
  show: boolean;
  onClose: () => void;
  isEditing: boolean;
  formState: Proveedor;
  setFormState: React.Dispatch<React.SetStateAction<Proveedor>>;
  onSave: (e: React.FormEvent) => void;
}

export const ProveedorModal: React.FC<ProveedorModalProps> = ({
  show,
  onClose,
  isEditing,
  formState,
  setFormState,
  onSave
}) => {
  const [tiposProveedor, setTiposProveedor] = useState<any[]>([]);
  const [showCategorias, setShowCategorias] = useState<boolean>(false);
  const [nuevaCategoria, setNuevaCategoria] = useState<string>('');

  const cargarCategorias = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/tipos-proveedor');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTiposProveedor(data);
    } catch (error) {
      setTiposProveedor([
        { idTipoProveedor: 1, descripcion: 'Insumos Gráficos' },
        { idTipoProveedor: 2, descripcion: 'Papelería' },
        { idTipoProveedor: 3, descripcion: 'Servicios Técnicos' }
      ]);
    }
  };

  useEffect(() => {
    if (show) {
      cargarCategorias();
    }
  }, [show]);

  const handleCrearCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    try {
      const res = await fetch('http://localhost:8080/api/tipos-proveedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: nuevaCategoria.trim() })
      });
      if (res.ok) {
        setNuevaCategoria('');
        cargarCategorias();
      }
    } catch (error) {
      alert("Error al guardar la nueva categoría");
    }
  };

  const handleEliminarCategoria = async (id: number) => {
    if (!confirm("¿Seguro que querés eliminar esta categoría? Se quitará de los proveedores asociados.")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/tipos-proveedor/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (formState.tipoProveedor?.idTipoProveedor === id) {
          setFormState(prev => ({ ...prev, tipoProveedor: undefined }));
        }
        cargarCategorias();
      }
    } catch (error) {
      alert("No se pudo eliminar la categoría (puede que esté en uso por otra entidad).");
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content text-white font-monospace" style={{ backgroundColor: '#1e1e24', border: '1px solid #3f3f46' }}>
            
            <div className="modal-header border-bottom border-secondary">
              <h5 className="modal-title text-info fw-bold">
                <i className="bi bi-pencil-square me-2"></i> {isEditing ? 'Modificar Proveedor' : 'Registrar Nuevo Proveedor'}
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>

            <form onSubmit={onSave}>
              <div className="modal-body">
                
                <h6 className="text-white-50 border-bottom border-dark pb-1 mb-3">1. Datos Comerciales</h6>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small">Nombre Comercial / Empresa</label>
                    <input 
                      type="text" required className="form-control bg-dark text-white border-secondary"
                      value={formState.nombreComercial || ''}
                      onChange={(e) => setFormState({ ...formState, nombreComercial: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small">Nombre del Contacto</label>
                    <input 
                      type="text" className="form-control bg-dark text-white border-secondary"
                      value={formState.contactoNombre || ''}
                      onChange={(e) => setFormState({ ...formState, contactoNombre: e.target.value })}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label small">Email de Contacto</label>
                    <input 
                      type="email" className="form-control bg-dark text-white border-secondary"
                      value={formState.emailContacto || ''}
                      onChange={(e) => setFormState({ ...formState, emailContacto: e.target.value })}
                    />
                  </div>
                  
                  <div className="col-md-4">
                    <label className="form-label small">Tipo de Proveedor</label>
                    <div className="input-group">
                      <select 
                        required
                        className="form-select bg-dark text-white border-secondary"
                        value={formState.tipoProveedor?.idTipoProveedor || ""} 
                        onChange={(e) => {
                          const idSel = Number(e.target.value);
                          const objetoSeleccionado = tiposProveedor.find(t => t.idTipoProveedor === idSel);
                          setFormState({ ...formState, tipoProveedor: objetoSeleccionado });
                        }}
                      >
                        <option value="">Seleccione Tipo</option>
                        {tiposProveedor.map((t) => (
                          <option key={t.idTipoProveedor} value={t.idTipoProveedor}>
                            {t.descripcion}
                          </option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        className="btn btn-outline-info" 
                        title="Gestionar Categorías"
                        onClick={() => setShowCategorias(true)}
                      >
                        <i className="bi bi-gear-fill"></i>
                      </button>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small">Estado de Cuenta</label>
                    <select 
                      className="form-select bg-dark text-white border-secondary"
                      value={formState.estado || 'Activo'}
                      onChange={(e) => setFormState({ ...formState, estado: e.target.value })}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Desactivado">Desactivado</option>
                    </select>
                  </div>
                </div>

                <h6 className="text-white-50 border-bottom border-dark pb-1 mb-3">2. Dirección / Localización</h6>
                
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small">Calle</label>
                    <input 
                      type="text" required className="form-control bg-dark text-white border-secondary"
                      value={formState.direccion?.calle || ''}
                      onChange={(e) => setFormState({
                        ...formState, direccion: { ...formState.direccion!, calle: e.target.value }
                      })}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">Número</label>
                    <input 
                      type="text" required className="form-control bg-dark text-white border-secondary"
                      value={formState.direccion?.numero || ''}
                      onChange={(e) => setFormState({
                        ...formState, direccion: { ...formState.direccion!, numero: e.target.value }
                      })}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">Piso</label>
                    <input 
                      type="text" className="form-control bg-dark text-white border-secondary" placeholder="Opcional"
                      value={formState.direccion?.piso || ''}
                      onChange={(e) => setFormState({
                        ...formState, direccion: { ...formState.direccion!, piso: e.target.value }
                      })}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">Depto</label>
                    <input 
                      type="text" className="form-control bg-dark text-white border-secondary" placeholder="Opcional"
                      value={formState.direccion?.departamento || ''}
                      onChange={(e) => setFormState({
                        ...formState, direccion: { ...formState.direccion!, departamento: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label small">Cód. Postal</label>
                    <input 
                      type="text" required className="form-control bg-dark text-white border-secondary" placeholder="Ej: 3000"
                      value={formState.direccion?.codigoPostal || ''}
                      onChange={(e) => setFormState({
                        ...formState, direccion: { ...formState.direccion!, codigoPostal: e.target.value }
                      })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small">Ciudad</label>
                    <input 
                      type="text" required className="form-control bg-dark text-white border-secondary"
                      value={formState.direccion?.ciudad || ''}
                      onChange={(e) => setFormState({
                        ...formState, direccion: { ...formState.direccion!, ciudad: e.target.value }
                      })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small">Provincia</label>
                    <input 
                      type="text" required className="form-control bg-dark text-white border-secondary"
                      value={formState.direccion?.provincia || ''}
                      onChange={(e) => setFormState({
                        ...formState, direccion: { ...formState.direccion!, provincia: e.target.value }
                      })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small">País</label>
                    <input 
                      type="text" required className="form-control bg-dark text-white border-secondary"
                      value={formState.direccion?.pais || 'Argentina'}
                      onChange={(e) => setFormState({
                        ...formState, direccion: { ...formState.direccion!, pais: e.target.value }
                      })}
                    />
                  </div>
                </div>

              </div>
              <div className="modal-footer border-top border-secondary">
                <button style={{ backgroundColor: '#b91c1c', border: 'none' }} type="button" className="btn btn-secondary px-4" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-info text-dark fw-bold px-4">Aceptar</button>
              </div>
            </form>

          </div>
        </div>
      </div>

      {/* SUB-MODAL GESTIÓN DE CATEGORÍAS */}
      {showCategorias && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content text-white font-monospace border-warning" style={{ backgroundColor: '#18181b', border: '1px solid' }}>
              
              <div className="modal-header border-bottom border-secondary">
                <h6 className="modal-title text-warning fw-bold">
                  <i className="bi bi-gear-fill me-2"></i>Administrar Categorías
                </h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCategorias(false)}></button>
              </div>

              <div className="modal-body">
                <label className="form-label small text-white-50">Nueva Categoría de Proveedor:</label>
                <div className="input-group mb-3">
                  <input 
                    type="text" 
                    className="form-control bg-dark text-white border-secondary" 
                    placeholder="Ej: Insumos de Computación"
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                  />
                  <button className="btn btn-success" type="button" onClick={handleCrearCategoria}>
                    <i className="bi bi-plus-lg"></i> Agregar
                  </button>
                </div>

                <label className="form-label small text-white-50 d-block border-bottom border-dark pb-1 mb-2">Categorías Existentes:</label>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="pe-1">
                  {tiposProveedor.length === 0 ? (
                    <div className="text-muted small py-2 text-center">No hay categorías registradas.</div>
                  ) : (
                    tiposProveedor.map((t) => (
                      <div key={t.idTipoProveedor} className="d-flex justify-content-between align-items-center bg-dark p-2 rounded mb-1 border border-secondary">
                        <span className="small">{t.descripcion}</span>
                        <button 
                          type="button" 
                          className="btn btn-sm p-0 text-danger fs-5 border-0 bg-transparent"
                          title="Eliminar Categoría"
                          onClick={() => handleEliminarCategoria(t.idTipoProveedor)}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="modal-footer border-top border-secondary py-2">
                <button style={{ backgroundColor: '#b91c1c', border: 'none' }} type="button" className="btn btn-sm btn-secondary" onClick={() => setShowCategorias(false)}>Cerrar</button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};