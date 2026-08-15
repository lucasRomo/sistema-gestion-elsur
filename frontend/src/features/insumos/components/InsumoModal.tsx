import React, { useState, useEffect } from 'react';
import type { Insumo, UnidadMedida } from '../types/Insumo';
import type { Proveedor } from '../../proveedores/types/Proveedor';
import { useTheme } from '../../../Context/ThemeContext';
import { GestionUnidadesModal } from './GestionUnidadesModal';
import { RelacionesModal } from './RelacionesModal';

interface InsumoModalProps {
  show: boolean;
  insumoEditando: Insumo | null;
  onClose: () => void;
  onGuardar: (insumo: any) => void;
}

export const InsumoModal: React.FC<InsumoModalProps> = ({ show, insumoEditando, onClose, onGuardar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Paleta dinámica según el tema
  const modalBg = isDark ? '#18181b' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const headerBorder = isDark ? '#27272a' : '#e2e8f0';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const inputBg = isDark ? '#18181b' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const boxBg = isDark ? '#18181b' : '#f8fafc';
  const boxBorder = isDark ? '#3f3f46' : '#e2e8f0';

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [errorUnidad, setErrorUnidad] = useState('');

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
    nombreUnidad: '',
    nombreUnidadCompra: '',
    estado: 'Activo',
    nombreProveedor: ''
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
        setUnidadesMedida([]);
      });
  };

  useEffect(() => {
    if (show) {
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
    setErrorUnidad('');
    if (insumoEditando) {
      setFormData({
        idInsumo: insumoEditando.idInsumo?.toString() || '',
        nombreInsumo: insumoEditando.nombreInsumo || '',
        precio: insumoEditando.precio || 0,
        stockActual: insumoEditando.stockActual || 0,
        stockEmpaquetado: insumoEditando.stockEmpaquetado || 0,
        stockMinimo: insumoEditando.stockMinimo || 0,
        factorConversion: insumoEditando.factorConversion?.toString() || '',
        nombreUnidad: insumoEditando.unidadMedida?.nombre || '',
        nombreUnidadCompra: insumoEditando.unidadCompra?.nombre || '',
        estado: insumoEditando.estado || 'Activo',
        nombreProveedor: insumoEditando.proveedor?.nombreComercial || ''
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
        nombreUnidad: '',
        nombreUnidadCompra: '',
        estado: 'Activo',
        nombreProveedor: ''
      });
    }
  }, [insumoEditando, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const unidadSuelteTrim = formData.nombreUnidad.trim().toLowerCase();
    const unidadCompraTrim = formData.nombreUnidadCompra.trim().toLowerCase();

    if (unidadSuelteTrim && unidadCompraTrim && unidadSuelteTrim === unidadCompraTrim) {
      setErrorUnidad('La unidad suelta y la unidad de empaque no pueden ser iguales.');
      return;
    }

    setErrorUnidad('');
    
    // Mapeo dinámico por nombre o generación de nuevo objeto si no existía el ID
    const unidadEncontrada = unidadesMedida.find(
      u => u.nombre?.toLowerCase() === formData.nombreUnidad.trim().toLowerCase()
    );
    const unidadCompraEncontrada = unidadesMedida.find(
      u => u.nombre?.toLowerCase() === formData.nombreUnidadCompra.trim().toLowerCase()
    );
    const proveedorEncontrado = proveedores.find(
      p => p.nombreComercial.toLowerCase() === formData.nombreProveedor.trim().toLowerCase()
    );

    const insumoAGuardar = {
      ...(formData.idInsumo && { idInsumo: parseInt(formData.idInsumo) }),
      nombreInsumo: formData.nombreInsumo,
      precio: parseFloat(formData.precio.toString()),
      stockActual: parseFloat(formData.stockActual.toString()),
      stockEmpaquetado: parseFloat(formData.stockEmpaquetado.toString() || '0'),
      stockMinimo: parseFloat(formData.stockMinimo.toString()),
      factorConversion: formData.factorConversion ? parseFloat(formData.factorConversion) : null,
      estado: formData.estado,
      
      unidadMedida: unidadEncontrada 
        ? { idUnidad: unidadEncontrada.idUnidad, nombre: unidadEncontrada.nombre }
        : formData.nombreUnidad.trim() ? { nombre: formData.nombreUnidad.trim() } : null,

      unidadCompra: unidadCompraEncontrada 
        ? { idUnidad: unidadCompraEncontrada.idUnidad, nombre: unidadCompraEncontrada.nombre }
        : formData.nombreUnidadCompra.trim() ? { nombre: formData.nombreUnidadCompra.trim() } : null,

      proveedor: proveedorEncontrado 
        ? { idProveedor: proveedorEncontrado.idProveedor }
        : formData.nombreProveedor.trim() ? { nombreComercial: formData.nombreProveedor.trim() } : null
    };

    onGuardar(insumoAGuardar);
  };

  if (!show) return null;

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1055 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div 
            className="modal-content font-monospace shadow-lg" 
            style={{ 
              backgroundColor: modalBg, 
              color: textColor, 
              border: `1.5px solid ${modalBorder}`, 
              borderRadius: '12px' 
            }}
          >
            
            <div className="modal-header border-bottom" style={{ borderColor: headerBorder }}>
              <h5 className="modal-title fw-bold" style={{ color: '#0bc9f8' }}>
                <i className="bi bi-box-seam me-2"></i> 
                {insumoEditando ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}
              </h5>
              <button 
                type="button" 
                className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
                onClick={onClose}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">

                {errorUnidad && (
                  <div className="alert alert-danger py-2 small mb-3" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {errorUnidad}
                  </div>
                )}
                
                {/* Nombre y Precio */}
                <div className="row">
                  <div className="col-md-8 mb-3">
                    <label className="form-label small fw-semibold" style={{ color: labelColor }}>Nombre del Insumo</label>
                    <input 
                      type="text" 
                      className="form-control shadow-none" 
                      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                      name="nombreInsumo" 
                      value={formData.nombreInsumo} 
                      onChange={handleChange} 
                      required 
                      onInvalid={(e: any) => {
                        if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Nombre de Insumo No puede Estar Vacío");
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label small fw-semibold" style={{ color: labelColor }}>Precio ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control shadow-none" 
                      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                      name="precio" 
                      value={formData.precio} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>

                {/* SECCIÓN UNIDADES DE MEDIDA Y FACTOR CONVERSIÓN */}
                <div className="p-3 mb-3 rounded" style={{ backgroundColor: boxBg, border: `1px solid ${boxBorder}` }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-info m-0">Configuración de Unidades y Empaque</h6>
                    <div className="d-flex gap-2">
                      <button 
                        type="button" 
                        className="btn btn-sm d-flex align-items-center gap-1 py-1 fw-bold"
                        style={{ backgroundColor: '#09a4ca', color: '#ffffff' }}
                        onClick={() => setShowRelacionesModal(true)}
                        title="Ver tabla de relaciones"
                      >
                        <i className="bi bi-diagram-3-fill"></i>
                        <span className="d-none d-sm-inline">Ver Relaciones</span>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-warning d-flex align-items-center gap-1 py-1 fw-bold"
                        style={{ color: '#ffffff' }}
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
                      <label className="form-label small fw-semibold" style={{ color: labelColor }}>Unidad Suelta (Consumo)</label>
                      <input 
                        list="unidades-sueltas-list"
                        className="form-control shadow-none" 
                        style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                        placeholder="Ej. Hoja / ml / Unidad"
                        name="nombreUnidad" 
                        value={formData.nombreUnidad} 
                        onChange={handleChange}
                      />
                      <datalist id="unidades-sueltas-list">
                        {unidadesMedida.map(u => (
                          <option key={u.idUnidad} value={u.nombre || ''} />
                        ))}
                      </datalist>
                    </div>

                    <div className="col-md-4 mb-2">
                      <label className="form-label small fw-semibold" style={{ color: labelColor }}>Unidad Empaque (Compra)</label>
                      <input 
                        list="unidades-compra-list"
                        className="form-control shadow-none" 
                        style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                        placeholder="Ej. Resma / Caja / Botella"
                        name="nombreUnidadCompra" 
                        value={formData.nombreUnidadCompra} 
                        onChange={handleChange}
                      />
                      <datalist id="unidades-compra-list">
                        {unidadesMedida.map(u => (
                          <option key={u.idUnidad} value={u.nombre} />
                        ))}
                      </datalist>
                    </div>

                    <div className="col-md-4 mb-2">
                      <label className="form-label small fw-semibold" style={{ color: labelColor }}>Factor Conversión</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control shadow-none" 
                        style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                        placeholder="Ej. 500"
                        name="factorConversion" 
                        value={formData.factorConversion} 
                        onChange={handleChange} 
                      />
                      <small style={{ color: labelColor, fontSize: '0.7rem' }}>Cant. de consumo por empaque</small>
                    </div>
                  </div>
                </div>

                {/* STOCKS */}
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label small fw-semibold" style={{ color: labelColor }}>Stock Empaquetado (Bultos)</label>
                    <input 
                      type="number" 
                      step="1" 
                      className="form-control shadow-none" 
                      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                      name="stockEmpaquetado" 
                      value={formData.stockEmpaquetado} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label small fw-semibold" style={{ color: labelColor }}>Stock Suelto (Actual)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control shadow-none" 
                      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                      name="stockActual" 
                      value={formData.stockActual} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label small fw-semibold" style={{ color: labelColor }}>Stock Mínimo (Suelto)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control shadow-none" 
                      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                      name="stockMinimo" 
                      value={formData.stockMinimo} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>

                {/* PROVEEDOR Y ESTADO */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold" style={{ color: labelColor }}>Proveedor Principal</label>
                    <input 
                      list="proveedores-list"
                      className="form-control shadow-none" 
                      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                      placeholder="Escriba para buscar o ingresar un proveedor..."
                      name="nombreProveedor" 
                      value={formData.nombreProveedor} 
                      onChange={handleChange}
                    />
                    <datalist id="proveedores-list">
                      {proveedores.map(p => (
                        <option key={p.idProveedor} value={p.nombreComercial} />
                      ))}
                    </datalist>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold" style={{ color: labelColor }}>Estado</label>
                    <select 
                      className="form-select shadow-none" 
                      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
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

              <div className="modal-footer border-top py-2" style={{ borderColor: headerBorder }}>
                <button 
                  type="button" 
                  className="btn btn-danger px-4" 
                  onClick={onClose}
                  style={{ color: '#ffffff' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success px-4 fw-bold" 
                  style={{ color: '#ffffff' }}
                >
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