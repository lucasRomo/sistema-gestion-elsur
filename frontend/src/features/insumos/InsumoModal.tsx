import React, { useState, useEffect } from 'react';
import type { Insumo, UnidadMedida } from '../../types/Insumo';
import type { Proveedor } from '../../types/Proveedor';
import { GestionUnidadesModal } from './GestionUnidadesModal';
import { RelacionesModal } from './RelacionesModal';

interface InsumoModalProps {
  show: boolean;
  insumoEditando: Insumo | null;
  onClose: () => void;
  onGuardar: (insumo: any) => void;
}

export const InsumoModal: React.FC<InsumoModalProps> = ({ show, insumoEditando, onClose, onGuardar }) => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  
  // Modales secundarios
  const [showGestionUnidadesModal, setShowGestionUnidadesModal] = useState(false);
  const [showRelacionesModal, setShowRelacionesModal] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    idInsumo: '',
    nombreInsumo: '',
    precio: 0,
    stockActual: 0,
    stockEmpaquetado: 0,
    stockMinimo: 0,
    factorConversion: '',
    idUnidad: '',
    idUnidadCompra: '',
    estado: 'Activo',
    idProveedor: ''
  });

  const cargarUnidadesMedida = () => {
  fetch('http://localhost:8080/api/unidades-medida')
    .then(res => {
      if (!res.ok) throw new Error('Error al consultar unidades');
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data)) {
        setUnidadesMedida(data);
      }
    })
    .catch(err => {
      console.error("No se pudieron cargar las unidades desde el servidor:", err);
      setUnidadesMedida([]); // Dejar vacío para forzar al usuario a crearlas desde el modal
    });
};

  useEffect(() => {
    if (show) {
      // Cargar Proveedores
      fetch('http://localhost:8080/api/proveedores')
        .then(res => {
          if (!res.ok) throw new Error('Error al obtener proveedores');
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) setProveedores(data);
        })
        .catch(err => console.error("Error cargando proveedores:", err));

      cargarUnidadesMedida();
    }
  }, [show]);

  useEffect(() => {
    if (insumoEditando) {
      setFormData({
        idInsumo: insumoEditando.idInsumo?.toString() || '',
        nombreInsumo: insumoEditando.nombreInsumo || '',
        precio: insumoEditando.precio || 0,
        stockActual: insumoEditando.stockActual || 0,
        stockEmpaquetado: insumoEditando.stockEmpaquetado || 0,
        stockMinimo: insumoEditando.stockMinimo || 0,
        factorConversion: insumoEditando.factorConversion?.toString() || '',
        idUnidad: insumoEditando.unidadMedida?.idUnidad?.toString() || '',
        idUnidadCompra: insumoEditando.unidadCompra?.idUnidad?.toString() || '',
        estado: insumoEditando.estado || 'Activo',
        idProveedor: insumoEditando.proveedor?.idProveedor?.toString() || ''
      });
    } else {
      setFormData({
        idInsumo: '',
        nombreInsumo: '',
        precio: 0,
        stockActual: 0,
        stockEmpaquetado: 0,
        stockMinimo: 0,
        factorConversion: '',
        idUnidad: '',
        idUnidadCompra: '',
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
    
    const insumoAGuardar = {
      ...(formData.idInsumo && { idInsumo: parseInt(formData.idInsumo) }),
      nombreInsumo: formData.nombreInsumo,
      precio: parseFloat(formData.precio.toString()),
      stockActual: parseFloat(formData.stockActual.toString()),
      stockEmpaquetado: parseFloat(formData.stockEmpaquetado.toString() || '0'),
      stockMinimo: parseFloat(formData.stockMinimo.toString()),
      factorConversion: formData.factorConversion ? parseFloat(formData.factorConversion) : null,
      estado: formData.estado,
      ...(formData.idUnidad && { unidadMedida: { idUnidad: parseInt(formData.idUnidad) } }),
      ...(formData.idUnidadCompra && { unidadCompra: { idUnidad: parseInt(formData.idUnidadCompra) } }),
      ...(formData.idProveedor && { proveedor: { idProveedor: parseInt(formData.idProveedor) } })
    };

    onGuardar(insumoAGuardar);
  };

  if (!show) return null;

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1055 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content text-white font-monospace" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            
            <div className="modal-header border-bottom border-secondary">
              <h5 className="modal-title fw-bold" style={{ color: '#0bc9f8' }}>
                <i className="bi bi-box-seam me-2"></i> 
                {insumoEditando ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">
                
                <div className="row">
                  <div className="col-md-8 mb-3">
                    <label className="form-label text-white-50 small">Nombre del Insumo</label>
                    <input 
                      type="text" 
                      className="form-control bg-dark border-secondary text-white" 
                      name="nombreInsumo" 
                      value={formData.nombreInsumo} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label text-white-50 small">Precio ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control bg-dark border-secondary text-white" 
                      name="precio" 
                      value={formData.precio} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>

                {/* SECCIÓN UNIDADES DE MEDIDA Y FACTOR CONVERSIÓN */}
                <div className="p-3 mb-3 rounded" style={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-info m-0">Configuración de Unidades y Empaque</h6>
                    <div className="d-flex gap-2">
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-info d-flex align-items-center gap-1 py-1"
                        onClick={() => setShowRelacionesModal(true)}
                        title="Ver tabla de relaciones"
                      >
                        <i className="bi bi-diagram-3-fill"></i>
                        <span className="d-none d-sm-inline">Ver Relaciones</span>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1 py-1"
                        onClick={() => setShowGestionUnidadesModal(true)}
                        title="Gestionar Unidades de Medida"
                      >
                        <i className="bi bi-gear-fill"></i>
                        <span className="d-none d-sm-inline">Unidades</span>
                      </button>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-2">
                      <label className="form-label text-white-50 small">Unidad Suelta (Consumo)</label>
                      <select 
                        className="form-select bg-dark border-secondary text-white" 
                        name="idUnidad" 
                        value={formData.idUnidad} 
                        onChange={handleChange}
                      >
                        <option value="">Ej. Hoja / ml / Unidad</option>
                        {unidadesMedida.map(u => (
                          <option key={u.idUnidad} value={u.idUnidad}>{u.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4 mb-2">
                      <label className="form-label text-white-50 small">Unidad Empaque (Compra)</label>
                      <select 
                        className="form-select bg-dark border-secondary text-white" 
                        name="idUnidadCompra" 
                        value={formData.idUnidadCompra} 
                        onChange={handleChange}
                      >
                        <option value="">Ej. Resma / Caja / Botella</option>
                        {unidadesMedida.map(u => (
                          <option key={u.idUnidad} value={u.idUnidad}>{u.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4 mb-2">
                      <label className="form-label text-white-50 small">Factor Conversión</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control bg-dark border-secondary text-white" 
                        placeholder="Ej. 500"
                        name="factorConversion" 
                        value={formData.factorConversion} 
                        onChange={handleChange} 
                      />
                      <small className="text-white-50" style={{ fontSize: '0.7rem' }}>Cant. de consumo por empaque</small>
                    </div>
                  </div>
                </div>

                {/* STOCKS */}
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label text-white-50 small">Stock Empaquetado (Bultos)</label>
                    <input 
                      type="number" 
                      step="1" 
                      className="form-control bg-dark border-secondary text-white" 
                      name="stockEmpaquetado" 
                      value={formData.stockEmpaquetado} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label text-white-50 small">Stock Suelto (Actual)</label>
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

                  <div className="col-md-4 mb-3">
                    <label className="form-label text-white-50 small">Stock Mínimo (Suelto)</label>
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

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-white-50 small">Proveedor Principal</label>
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

                  <div className="col-md-6 mb-3">
                    <label className="form-label text-white-50 small">Estado</label>
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

              </div>

              <div className="modal-footer border-top border-secondary py-2">
                <button type="button" className="btn btn-sm btn-secondary px-4" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-sm px-4 fw-bold text-white" style={{ backgroundColor: '#16a34a' }}>
                  {insumoEditando ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>

      {/* Submodales integrados */}
      <GestionUnidadesModal
        show={showGestionUnidadesModal}
        unidades={unidadesMedida}
        onClose={() => setShowGestionUnidadesModal(false)}
        onActualizar={cargarUnidadesMedida}
      />

      <RelacionesModal
        show={showRelacionesModal}
        onClose={() => setShowRelacionesModal(false)}
      />
    </>
  );
};