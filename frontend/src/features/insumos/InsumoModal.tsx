import React, { useState, useEffect } from 'react';
import type { Insumo } from '../../types/Insumo';
import type { Proveedor } from '../../types/Proveedor';
import { useTheme } from '../../Context/ThemeContext';

interface InsumoModalProps {
  show: boolean;
  insumoEditando: Insumo | null;
  onClose: () => void;
  onGuardar: (insumo: any) => void;
}

export const InsumoModal: React.FC<InsumoModalProps> = ({ show, insumoEditando, onClose, onGuardar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    idInsumo: '',
    nombreInsumo: '',
    stockActual: 0,
    stockMinimo: 0,
    estado: 'Activo',
    idProveedor: ''
  });

  // Cargar lista de proveedores para el select
  useEffect(() => {
    if (show) {
      fetch('http://localhost:8080/api/proveedores')
        .then(res => res.json())
        .then(data => setProveedores(data))
        .catch(err => console.error("Error cargando proveedores:", err));
    }
  }, [show]);

  // Si estamos editando, cargamos los datos del insumo en el formulario
  useEffect(() => {
    if (insumoEditando) {
      setFormData({
        idInsumo: insumoEditando.idInsumo?.toString() || '',
        nombreInsumo: insumoEditando.nombreInsumo || '',
        stockActual: insumoEditando.stockActual || 0,
        stockMinimo: insumoEditando.stockMinimo || 0,
        estado: insumoEditando.estado || 'Activo',
        idProveedor: insumoEditando.proveedor?.idProveedor?.toString() || ''
      });
    } else {
      // Formulario vacío para "Nuevo Insumo"
      setFormData({
        idInsumo: '',
        nombreInsumo: '',
        stockActual: 0,
        stockMinimo: 0,
        estado: 'Activo',
        idProveedor: ''
      });
    }
  }, [insumoEditando, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Armamos el objeto tal cual lo espera Spring Boot
    const insumoAGuardar = {
      ...(formData.idInsumo && { idInsumo: parseInt(formData.idInsumo) }),
      nombreInsumo: formData.nombreInsumo,
      stockActual: parseFloat(formData.stockActual.toString()),
      stockMinimo: parseFloat(formData.stockMinimo.toString()),
      estado: formData.estado,
      // Relación con el proveedor (mandamos el objeto con el ID)
      ...(formData.idProveedor && { proveedor: { idProveedor: parseInt(formData.idProveedor) } })
    };

    onGuardar(insumoAGuardar);
  };

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content text-white font-monospace" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
          
          <div className="modal-header border-bottom border-secondary">
            <h5 className="modal-title fw-bold" style={{ color: '#0bc9f8' }}>
              <i className="bi bi-box-seam me-2"></i> 
              {insumoEditando ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}
            </h5>
            <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onClose}></button>
          </div>


          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label small" style={{ color: mutedText }}>Nombre del Insumo</label>
                <input 
                  type="text" 
                  className="form-control bg-dark border-secondary text-white" 
                  name="nombreInsumo" 
                  value={formData.nombreInsumo} 
                  onChange={handleChange} 
                  required onInvalid={(e: any) => {
                  if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Nombre de Insumo No puede Estar Vacío");
                  else if (e.target.validity.patternMismatch) e.target.setCustomValidity("El Campo de Nombre de Insumo solo debe contener Letras");
                  }}
                  onInput={(e: any) => e.target.setCustomValidity("")}/>
              </div>
              

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label small" style={{ color: mutedText }}>Stock Actual</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control bg-dark border-secondary text-white" 
                    name="stockActual" 
                    value={formData.stockActual} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label small" style={{ color: mutedText }}>Stock Mínimo</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control bg-dark border-secondary text-white" 
                    name="stockMinimo" 
                    value={formData.stockMinimo} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small" style={{ color: mutedText }}>Proveedor Principal</label>
                <select 
                  className="form-select bg-dark border-secondary text-white" 
                  name="idProveedor" 
                  value={formData.idProveedor} 
                  onChange={handleChange}
                >
                  <option value="">Seleccione un proveedor...</option>
                  {proveedores.map(p => (
                    <option key={p.idProveedor} value={p.idProveedor}>{p.nombreComercial}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small" style={{ color: mutedText }}>Estado</label>
                <select 
                  className="form-select bg-dark border-secondary text-white" 
                  name="estado" 
                  value={formData.estado} 
                  onChange={handleChange}
                >
                  <option value="Activo">Activo</option>
                  <option value="Desactivado">Desactivado</option>
                </select>
              </div>
            </div>

            <div className="modal-footer border-top border-secondary py-2">
  <button 
    type="button" 
    className="btn btn-sm btn-secondary px-4" 
    onClick={onClose}
  >
    Cancelar
  </button>
  <button 
    type="submit" 
    className="btn btn-sm px-4 fw-bold" 
    style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
  >
    {insumoEditando ? 'Actualizar' : 'Guardar'}
  </button>
</div>
          </form>

        </div>
      </div>
    </div>
  );
};