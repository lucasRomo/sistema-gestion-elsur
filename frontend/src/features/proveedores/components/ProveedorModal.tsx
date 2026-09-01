import React, { useState, useEffect } from 'react';
import type { Proveedor } from '../types/Proveedor';
import { useTheme } from '../../../Context/ThemeContext';

interface ProveedorModalProps {
  show: boolean;
  onClose: () => void;
  isEditing: boolean;
  formState: Proveedor | null;
  setFormState: React.Dispatch<React.SetStateAction<Proveedor | null>>;
  onSave: (proveedorNormalizado?: Proveedor) => void;
  proveedores: Proveedor[];
}

export const ProveedorModal: React.FC<ProveedorModalProps> = ({
  show,
  onClose,
  isEditing,
  formState,
  setFormState,
  onSave,
  proveedores
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const modalBg = isDark ? '#1e1e24' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const inputBg = isDark ? '#121214' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';

  // --- CONFIGURACIÓN DE COLORES DINÁMICOS SEGÚN MODO (CREAR vs EDITAR) ---
  const borderColorModal = isEditing ? '#0dcaf0' : '#198754';
  const titleColorModal = isEditing 
    ? (isDark ? '#00d7ff' : '#0284c7') 
    : (isDark ? '#22c55e' : '#198754');
  const btnBgModal = isEditing 
    ? (isDark ? '#0dcaf0' : '#0284c7') 
    : '#198754';

  const [tiposProveedor, setTiposProveedor] = useState<any[]>([]);
  const [showCategorias, setShowCategorias] = useState<boolean>(false);
  const [nuevaCategoria, setNuevaCategoria] = useState<string>('');
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [idCategoriaAEliminar, setIdCategoriaAEliminar] = useState<number | null>(null);
  const [mostrarExitoEliminar, setMostrarExitoEliminar] = useState<boolean>(false);
  const [showTipoProveedor, setShowTipoProveedor] = useState(false);
  const [showEstado, setShowEstado] = useState(false);

  const cargarCategorias = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/tipos-proveedor');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTiposProveedor(data);
    } catch {
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

  const handleCrearCategoria = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nombreLimpio = nuevaCategoria.trim();
    if (!nombreLimpio) return;
    const inputElem = document.getElementById('inputNuevaCategoria') as HTMLInputElement;
    const yaExiste = tiposProveedor.some(
      (t) => t.descripcion.trim().toLowerCase() === nombreLimpio.toLowerCase()
    );

    if (yaExiste) {
      if (inputElem) {
        inputElem.setCustomValidity("Esta categoría ya existe");
        inputElem.reportValidity();
      }
      return;
    }

    try {
      const res = await fetch('http://localhost:8080/api/tipos-proveedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: nombreLimpio })
      });
      if (res.ok) {
        setNuevaCategoria('');
        if (inputElem) inputElem.setCustomValidity('');
        cargarCategorias();
      }
    } catch {
      alert("Error al guardar la nueva categoría");
    }
  };

  const handleEliminarCategoria = (id: number) => {
    setIdCategoriaAEliminar(id);
  };

  const ejecutarEliminacionCategoria = async () => {
    if (!idCategoriaAEliminar) return;

    try {
      const res = await fetch(`http://localhost:8080/api/tipos-proveedor/${idCategoriaAEliminar}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        if (formState?.tipoProveedor?.idTipoProveedor === idCategoriaAEliminar) {
          setFormState(prev => prev ? { ...prev, tipoProveedor: undefined } : null);
        }
        cargarCategorias();
        setIdCategoriaAEliminar(null);
        setMostrarExitoEliminar(true); 
      }
    } catch (error) {
      alert("No se pudo eliminar la categoría (puede que esté en uso por otra entidad).");
      setIdCategoriaAEliminar(null);
    }
  };

  const obtenerFormStateNormalizado = (): Proveedor | null => {
    if (!formState) return null;

    return {
      ...formState,
      direccion: formState.direccion
        ? {
            ...formState.direccion,
            ciudad: formState.direccion.ciudad?.trim() || '-',
            provincia: formState.direccion.provincia?.trim() || '-',
            pais: formState.direccion.pais?.trim() || '-',
            piso: formState.direccion.piso?.trim() || '-',
            departamento: formState.direccion.departamento?.trim() || '-',
          }
        : undefined,
    };
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const datosNormalizados = obtenerFormStateNormalizado();
    if (!datosNormalizados) return;

    if (isEditing) {
      setMostrarConfirmacion(true);
    } else {
      onSave(datosNormalizados); 
    }
  };

  const handleGuardarDefinitivo = () => {
    const datosNormalizados = obtenerFormStateNormalizado();
    if (datosNormalizados) {
      onSave(datosNormalizados);
    }
    setMostrarConfirmacion(false);
  };

  if (!show || !formState) return null;

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div 
            className="modal-content font-monospace shadow" 
            style={{ 
              backgroundColor: modalBg, 
              border: `1.5px solid ${borderColorModal}`, 
              color: textColor 
            }}
          >
            <div className="modal-header" style={{ borderBottom: `1px solid ${modalBorder}` }}>
              <h5 className="modal-title fw-bold" style={{ color: titleColorModal }}>
                <i className={`bi ${isEditing ? 'bi-pencil-square' : 'bi-plus-circle-fill'} me-2`}></i> 
                {isEditing ? 'Modificar Proveedor' : 'Registrar Nuevo Proveedor'}
              </h5>
              <button 
                type="button" 
                className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
                onClick={onClose}
              ></button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold" style={{ color: labelColor }}>
                      Nombre Comercial / Empresa
                    </label>
                    <input 
                      type="text" required pattern="[A-Za-zÁ-Úá-ú\s]+" 
                      className="form-control"
                      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                      value={formState.nombreComercial || ''}
                      onChange={(e) => setFormState({ ...formState, nombreComercial: e.target.value })}
                      onInvalid={(e: any) => {
                        if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Nombre Comercial No puede Estar Vacío");
                        else if (e.target.validity.patternMismatch) e.target.setCustomValidity("El Campo de Nombre Comercial solo debe contener letras");
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold" style={{ color: labelColor }}>
                      Nombre del Contacto
                    </label>
                    <input 
                      type="text" required pattern="[A-Za-zÁ-Úá-ú\s]+" 
                      className="form-control"
                      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                      value={formState.contactoNombre || ''}
                      onChange={(e) => setFormState({ ...formState, contactoNombre: e.target.value })}
                      onInvalid={(e: any) => {
                        if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Nombre de Contacto No puede Estar Vacío");
                        else if (e.target.validity.patternMismatch) e.target.setCustomValidity("El Campo de Nombre de Contacto solo debe contener letras");
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold" style={{ color: labelColor }}>
                      Email de Contacto
                    </label>
                    <input 
                      type="email" 
                      required 
                      className="form-control"
                      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                      value={formState.emailContacto || ''}
                      onChange={(e) => setFormState({ ...formState, emailContacto: e.target.value })}
                      onInvalid={(e: any) => {
                        const emailLimpio = formState.emailContacto?.trim().toLowerCase();

                        const existeEmail = proveedores?.some(
                          (p) => p.emailContacto?.trim().toLowerCase() === emailLimpio && p.idProveedor !== formState.idProveedor
                        );

                        if (e.target.validity.valueMissing) {
                          e.target.setCustomValidity("El Campo de Email No puede Estar Vacío");
                        } else if (e.target.validity.typeMismatch) {
                          e.target.setCustomValidity("Ingresa un formato de email válido (ej: nombre@dominio.com)");
                        } else if (existeEmail) {
                          e.target.setCustomValidity("Este correo electrónico ya está registrado en la base de datos");
                        }
                      }}
                      onInput={(e: any) => {
                        const emailLimpio = e.target.value.trim().toLowerCase();
                        const existeEmail = proveedores?.some(
                          (p) => p.emailContacto?.trim().toLowerCase() === emailLimpio && p.idProveedor !== formState.idProveedor
                        );

                        if (existeEmail) {
                          e.target.setCustomValidity("Este correo electrónico ya está registrado en la base de datos");
                        } else {
                          e.target.setCustomValidity("");
                        }
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold" style={{ color: labelColor }}>
                      Tipo de Proveedor
                    </label>
                    <div className="d-flex gap-2">
                      <div className="position-relative flex-grow-1">
                        <input
                          type="text"
                          readOnly
                          autoComplete="off"
                          className="form-control"
                          style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder, cursor: 'pointer' }}
                          value={formState.tipoProveedor?.descripcion || 'Seleccione Tipo'}
                          onFocus={() => setShowTipoProveedor(true)}
                          onClick={() => setShowTipoProveedor(true)}
                          onBlur={() => setTimeout(() => setShowTipoProveedor(false), 200)}
                        />
                        {showTipoProveedor && (
                          <div
                            className={`position-absolute w-100 shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
                            style={{ maxHeight: '180px', zIndex: 1060, border: `1px solid ${inputBorder}`, top: '100%', left: 0 }}
                          >
                            {tiposProveedor.map((t) => {
                              const isSelected = t.idTipoProveedor === formState.tipoProveedor?.idTipoProveedor;
                              return (
                                <div
                                  key={t.idTipoProveedor}
                                  className="p-2 border-bottom text-truncate"
                                  style={{
  cursor: 'pointer',
  fontSize: '0.875rem',
  backgroundColor: isSelected ? '#149bdf' : (isDark ? '#27272a' : '#f8fafc'),
  color: isSelected ? '#ffffff' : (isDark ? '#e4e4e7' : '#1e293b')
}}
                                  onMouseDown={() => {
                                    setFormState({ ...formState, tipoProveedor: t });
                                    setShowTipoProveedor(false);
                                  }}
                                >
                                  <span className="fw-semibold">{t.descripcion}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-warning"
                        title="Gestionar Categorías"
                        onClick={() => setShowCategorias(true)}
                        style={{ flexShrink: 0 }}
                      >
                        <i className="bi bi-gear-fill"></i>
                      </button>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold" style={{ color: labelColor }}>
                      Estado de Cuenta
                    </label>
                    <div className="position-relative">
                      <input
                        type="text"
                        readOnly
                        autoComplete="off"
                        className="form-control"
                        style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder, cursor: 'pointer' }}
                        value={formState.estado || 'Activo'}
                        onFocus={() => setShowEstado(true)}
                        onClick={() => setShowEstado(true)}
                        onBlur={() => setTimeout(() => setShowEstado(false), 200)}
                      />
                      {showEstado && (
                        <div
                          className={`position-absolute w-100 shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
                          style={{ maxHeight: '180px', zIndex: 1060, border: `1px solid ${inputBorder}`, top: '100%', left: 0 }}
                        >
                          {['Activo', 'Desactivado'].map((opcion) => {
                            const isSelected = opcion === (formState.estado || 'Activo');
                            return (
                              <div
                                key={opcion}
                                className="p-2 border-bottom text-truncate"
                                style={{
  cursor: 'pointer',
  fontSize: '0.875rem',
  backgroundColor: isSelected ? '#149bdf' : (isDark ? '#27272a' : '#f8fafc'),
  color: isSelected ? '#ffffff' : (isDark ? '#e4e4e7' : '#1e293b')
}}
                                onMouseDown={() => {
                                  setFormState({ ...formState, estado: opcion });
                                  setShowEstado(false);
                                }}
                              >
                                <span className="fw-semibold">{opcion}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <>
                    <h6 className="fw-bold pb-1 mb-3 mt-4" style={{ color: labelColor, borderBottom: `1px solid ${modalBorder}` }}>
                      2. Dirección / Localización
                    </h6>

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold" style={{ color: labelColor }}>Calle</label>
                        <input 
                          type="text" required pattern="[A-Za-zÁ-Úá-ú\s]+" 
                          className="form-control"
                          style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                          value={formState.direccion?.calle || ''}
                          onChange={(e) => setFormState({
                            ...formState, direccion: { ...formState.direccion!, calle: e.target.value }
                          })}
                          onInvalid={(e: any) => {
                            if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Calle No puede Estar Vacío");
                            else if (e.target.validity.patternMismatch) e.target.setCustomValidity("En el campo Calle solo se permiten letras");
                          }}
                          onInput={(e: any) => e.target.setCustomValidity("")}
                        />
                      </div>

                      <div className="col-md-2">
                        <label className="form-label small fw-semibold" style={{ color: labelColor }}>Número</label>
                        <input 
                          type="text" required pattern="[0-9]+" 
                          className="form-control"
                          style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                          value={formState.direccion?.numero || ''}
                          onChange={(e) => setFormState({
                            ...formState, direccion: { ...formState.direccion!, numero: e.target.value }
                          })}
                          onInvalid={(e: any) => {
                            if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Número No puede Estar Vacío");
                            else e.target.setCustomValidity("El Campo Número solo debe contener Números");
                          }}
                          onInput={(e: any) => e.target.setCustomValidity("")}
                        />
                      </div>

                      <div className="col-md-2">
                        <label className="form-label small fw-semibold" style={{ color: labelColor }}>Piso</label>
                        <input 
                          type="text" className="form-control" placeholder="Opcional"
                          style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                          value={formState.direccion?.piso || ''}
                          onChange={(e) => setFormState({
                            ...formState, direccion: { ...formState.direccion!, piso: e.target.value }
                          })}
                        />
                      </div>

                      <div className="col-md-2">
                        <label className="form-label small fw-semibold" style={{ color: labelColor }}>Depto</label>
                        <input 
                          type="text" className="form-control" placeholder="Opcional"
                          style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                          value={formState.direccion?.departamento || ''}
                          onChange={(e) => setFormState({
                            ...formState, direccion: { ...formState.direccion!, departamento: e.target.value }
                          })}
                        />
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold" style={{ color: labelColor }}>Cód. Postal</label>
                        <input 
                          type="text" required pattern="[0-9]+" className="form-control" placeholder="Ej: 3000"
                          style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                          value={formState.direccion?.codigoPostal || ''}
                          onChange={(e) => setFormState({
                            ...formState, direccion: { ...formState.direccion!, codigoPostal: e.target.value }
                          })}
                          onInvalid={(e: any) => {
                            if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Código Postal No puede Estar Vacío");
                            else e.target.setCustomValidity("El Campo Código Postal solo debe contener Números");
                          }}
                          onInput={(e: any) => e.target.setCustomValidity("")}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-semibold" style={{ color: labelColor }}>Ciudad (Opcional)</label>
                        <input 
                          type="text" 
                          pattern="^$|[A-Za-zÁ-Úá-ú\s]+" 
                          className="form-control"
                          placeholder="Opcional"
                          style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                          value={formState.direccion?.ciudad || ''}
                          onChange={(e) => setFormState({
                            ...formState, direccion: { ...formState.direccion!, ciudad: e.target.value }
                          })}
                          onInvalid={(e: any) => {
                            if (e.target.validity.patternMismatch) {
                              e.target.setCustomValidity("En el campo Ciudad solo se permiten letras");
                            }
                          }}
                          onInput={(e: any) => e.target.setCustomValidity("")}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-semibold" style={{ color: labelColor }}>Provincia (Opcional)</label>
                        <input 
                          type="text" 
                          pattern="^$|[A-Za-zÁ-Úá-ú\s]+" 
                          className="form-control"
                          placeholder="Opcional"
                          style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                          value={formState.direccion?.provincia || ''}
                          onChange={(e) => setFormState({
                            ...formState, direccion: { ...formState.direccion!, provincia: e.target.value }
                          })}
                          onInvalid={(e: any) => {
                            if (e.target.validity.patternMismatch) {
                              e.target.setCustomValidity("En el campo Provincia solo se permiten letras");
                            }
                          }}
                          onInput={(e: any) => e.target.setCustomValidity("")}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-semibold" style={{ color: labelColor }}>País (Opcional)</label>
                        <input 
                          type="text" 
                          pattern="^$|[A-Za-zÁ-Úá-ú\s]+" 
                          className="form-control" 
                          placeholder="Opcional"
                          style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                          value={formState.direccion?.pais || ''}
                          onChange={(e) => setFormState({
                            ...formState, 
                            direccion: { ...formState.direccion!, pais: e.target.value }
                          })}
                          onInvalid={(e: any) => {
                            if (e.target.validity.patternMismatch) { 
                              e.target.setCustomValidity("En el campo País solo se permiten letras");
                            }
                          }}
                          onInput={(e: any) => e.target.setCustomValidity("")}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer" style={{ borderTop: `1px solid ${modalBorder}` }}>
                <button 
                  type="button" 
                  className="btn btn-danger fw-bold px-4" 
                  style={{ color: '#ffffff' }} 
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn fw-bold px-4" 
                  style={{ 
                    color: '#ffffff', 
                    backgroundColor: btnBgModal, 
                    borderColor: 'transparent' 
                  }}
                >
                  Aceptar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-center shadow" 
              style={{ 
                border: '2px solid #8e45e0', 
                backgroundColor: isDark ? '#1a1a1c' : '#ffffff', 
                color: textColor,
                borderRadius: '12px' 
              }}
            >
              <i className="bi bi-exclamation-triangle fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Confirmar Modificaciones?</h5>
              <p className="small" style={{ color: labelColor }}>Se sobreescribirán de forma permanente los datos del proveedor.</p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button 
                  className="btn btn-outline-secondary btn-sm px-3 text-white" 
                  style={{ borderRadius: '6px', backgroundColor: '#e22e2e', borderColor: '#e62020'}} 
                  onClick={() => setMostrarConfirmacion(false)}
                >
                  Volver
                </button>
                <button 
                  className="btn btn-outline-secondary btn-sm px-3 text-white" 
                  style={{ borderRadius: '6px', backgroundColor: '#2e9225', borderColor: '#25741e' }} 
                  onClick={handleGuardarDefinitivo}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {idCategoriaAEliminar !== null && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-center shadow" 
              style={{ 
                border: '2px solid #8e45e0', 
                backgroundColor: isDark ? '#1a1a1c' : '#ffffff', 
                color: textColor,
                borderRadius: '12px' 
              }}
            >
              <i className="bi bi-exclamation-triangle fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Confirmar Eliminación?</h5>
              <p className="small" style={{ color: labelColor }}>
                Se quitará esta categoría de forma permanente y de los proveedores asociados.
              </p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button 
                  type="button"
                  className="btn btn-sm px-3 text-white fw-bold" 
                  style={{ borderRadius: '6px', backgroundColor: '#e22e2e', borderColor: '#e62020' }} 
                  onClick={() => setIdCategoriaAEliminar(null)}
                >
                  Volver
                </button>
                <button 
                  type="button"
                  className="btn btn-sm px-3 text-white fw-bold" 
                  style={{ borderRadius: '6px', backgroundColor: '#2e9225', borderColor: '#25741e' }} 
                  onClick={ejecutarEliminacionCategoria}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito al Eliminar Categoría */}
      {mostrarExitoEliminar && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-center shadow" 
              style={{ 
                border: '2px solid #8e45e0', 
                backgroundColor: isDark ? '#1a1a1c' : '#ffffff', 
                color: textColor,
                borderRadius: '12px' 
              }}
            >
              <div 
                className="d-inline-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#8e45e0',
                  color: '#ffffff'
                }}
              >
                <i className="bi bi-check-lg fs-2"></i>
              </div>
              <h4 className="fw-bold mb-2">¡Éxito!</h4>
              <p className="small mb-4" style={{ color: labelColor }}>
                Categoría eliminada correctamente
              </p>
              <div className="d-flex justify-content-center">
                <button 
                  type="button"
                  className="btn px-4 text-white fw-bold" 
                  style={{ borderRadius: '6px', backgroundColor: '#e22e2e', borderColor: '#e62020' }} 
                  onClick={() => setMostrarExitoEliminar(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCategorias && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div 
              className="modal-content font-monospace border-warning shadow" 
              style={{ backgroundColor: modalBg, color: textColor, border: `1px solid ${modalBorder}` }}
            >
              <div className="modal-header" style={{ borderBottom: `1px solid ${modalBorder}` }}>
                <h6 className="modal-title text-warning fw-bold">
                  <i className="bi bi-gear-fill me-2"></i>Administrar Categorías
                </h6>
                <button 
                  type="button" 
                  className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
                  onClick={() => setShowCategorias(false)}
                ></button>
              </div>

              <div className="modal-body">
                <label className="form-label small" style={{ color: labelColor }}>Nueva Categoría de Proveedor:</label>
                <form onSubmit={handleCrearCategoria} className="input-group mb-3">
                  <input 
                    id="inputNuevaCategoria"
                    type="text" 
                    required
                    className="form-control" 
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    placeholder="Ej: Insumos de Computación"
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                    onInput={(e: any) => e.target.setCustomValidity("")}
                    onInvalid={(e: any) => {
                      if (e.target.validity.valueMissing) {
                        e.target.setCustomValidity("Ingresa el nombre de la categoría");
                      }
                    }}
                  />
                  <button className="btn btn-success" type="submit">
                    <i className="bi bi-plus-lg"></i> Agregar
                  </button>
                </form>

                <label className="form-label small d-block pb-1 mb-2" style={{ color: labelColor, borderBottom: `1px solid ${modalBorder}` }}>
                  Categorías Existentes:
                </label>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="pe-1">
                  {tiposProveedor.length === 0 ? (
                    <div className="text-muted small py-2 text-center">No hay categorías registradas.</div>
                  ) : (
                    tiposProveedor.map((t) => (
                      <div 
                        key={t.idTipoProveedor} 
                        className="d-flex justify-content-between align-items-center p-2 rounded mb-1"
                        style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
                      >
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

              <div className="modal-footer py-2" style={{ borderTop: `1px solid ${modalBorder}` }}>
                <button 
                  type="button" 
                  className="btn btn-sm btn-secondary px-3 fw-bold" 
                  style={{ color: '#ffffff' }}
                  onClick={() => setShowCategorias(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};