import React, { useState, useEffect } from 'react';
import { clienteService, type TipoDocumento } from '../services/clienteService';

interface ClienteEditModalProps {
  cliente: any;
  onCerrar: () => void;
  onConfirmar: (clienteActualizado: any) => Promise<void>;
}

export const ClienteEditModal: React.FC<ClienteEditModalProps> = ({ cliente, onCerrar, onConfirmar }) => {
  // Lista dinámica traída desde el servicio
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [showTipoDoc, setShowTipoDoc] = useState(false);
  
  const [editData, setEditData] = useState<any>({
    id_cliente: cliente.id_cliente || cliente.idCliente,
    idCliente: cliente.idCliente || cliente.id_cliente,
    razonSocial: cliente.razonSocial || '',
    limiteCredito: cliente.limiteCredito || 0,
    saldoDeudor: cliente.saldoDeudor ?? 0,
    personaDeContacto: cliente.personaDeContacto || '',
    condicionDePago: cliente.condicionDePago || '',
    estado: cliente.estado || 'Activo',
    persona: {
      idPersona: cliente.persona?.idPersona,
      nombre: cliente.persona?.nombre || '',
      apellido: cliente.persona?.apellido || '',
      numeroDocumento: cliente.persona?.numeroDocumento || '',
      telefono: cliente.persona?.telefono || '',
      email: cliente.persona?.email || '',
      tipoDocumento: { 
        idTipoDocumento: cliente.persona?.tipoDocumento?.idTipoDocumento || 1 
      },
      tipoPersona: { idTipoPersona: cliente.persona?.tipoPersona?.idTipoPersona || 1 },
      direccion: cliente.persona?.direccion || null 
    }
  });

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  useEffect(() => {
    clienteService.getTiposDocumento()
      .then(data => setTiposDocumento(data));
  }, []);

  const handlePersonaChange = (field: string, value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      persona: { ...prev.persona, [field]: value }
    }));
  };

  const handleTipoDocChange = (id: number) => {
    setEditData((prev: any) => ({
      ...prev,
      persona: { 
        ...prev.persona, 
        tipoDocumento: { idTipoDocumento: id } 
      }
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMostrarConfirmacion(true);
  };

  const handleGuardarDefinitivo = async () => {
    await onConfirmar(editData);
    setMostrarConfirmacion(false);
  };

  return (
    <>
      {/* Contenedor del Modal Principal */}
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered" style={{ maxWidth: '850px' }}>
          <div 
            className="modal-content text-white" 
            style={{ 
              border: '1.5px solid #0dcaf0', 
              backgroundColor: '#1a1a1c', 
              borderRadius: '14px' 
            }}
          >
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center px-4 pt-4 pb-2">
              <h4 className="m-0 fw-bold text-info d-flex align-items-center">
                <i className="bi bi-pencil-square me-2"></i>Modificar Cliente
              </h4>
              <button type="button" className="btn-close btn-close-white" onClick={onCerrar}></button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleFormSubmit} className="px-4 pb-4">
              
              {/* Contenedor con Scroll Y Limpio - Sin desborde X */}
              <div style={{ maxHeight: '68vh', overflowY: 'auto', overflowX: 'hidden', paddingRight: '8px' }}>
                
                {/* SECCIÓN 1: DATOS PERSONALES */}
                <h5 className="border-bottom pb-2 mb-3 mt-2 font-monospace fw-bold text-dark-emphasis" style={{ fontSize: '1.05rem' }}>
                  1. Datos Personales
                </h5>
                
                <div className="row g-3 mb-4 mx-0">
                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Nombre/Empresa</label>
                    <input 
                      type="text" 
                      className="form-control text-white" 
                      style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} 
                      value={editData.persona.nombre} 
                      onChange={e => handlePersonaChange('nombre', e.target.value)} 
                      required 
                      pattern="[A-Za-zÁ-Úá-ú\s]+"
                      onInvalid={(e: any) => {
                        if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Nombre No puede Estar Vacío");
                        else e.target.setCustomValidity("El Campo de Nombre solo debe contener letras");
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")}
                    />
                  </div>

                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Apellido</label>
                    <input 
                      type="text" 
                      className="form-control text-white" 
                      style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} 
                      value={editData.persona.apellido} 
                      onChange={e => handlePersonaChange('apellido', e.target.value)} 
                      required 
                      pattern="[A-Za-zÁ-Úá-ú\s]+"
                      onInvalid={(e: any) => {
                        if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Apellido No puede Estar Vacío");
                        else e.target.setCustomValidity("El Campo de Apellido solo debe contener letras");
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")}
                    />
                  </div>

                  {/* Selector dinámico de tipo de documento */}
                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Tipo de Doc.</label>
                    <div className="position-relative">
                      <input
                        type="text"
                        readOnly
                        autoComplete="off"
                        className="form-control text-white"
                        style={{ backgroundColor: '#222226', borderColor: '#3f3f46', cursor: 'pointer' }}
                        value={
                          tiposDocumento.find((t: TipoDocumento) => t.idTipoDocumento === editData.persona.tipoDocumento?.idTipoDocumento)
                            ?.nombreTipo ||
                          tiposDocumento.find((t: TipoDocumento) => t.idTipoDocumento === editData.persona.tipoDocumento?.idTipoDocumento)
                            ?.nombre ||
                          'Seleccione Un Tipo'
                        }
                        onFocus={() => setShowTipoDoc(true)}
                        onClick={() => setShowTipoDoc(true)}
                        onBlur={() => setTimeout(() => setShowTipoDoc(false), 200)}
                      />
                      {showTipoDoc && (
                        <div
                          className="position-absolute w-100 shadow rounded mt-1 overflow-auto bg-dark text-white"
                          style={{ maxHeight: '180px', zIndex: 1060, border: '1px solid #3f3f46', top: '100%', left: 0 }}
                        >
                          {tiposDocumento.map((t: TipoDocumento) => {
                            const isSelected = t.idTipoDocumento === editData.persona.tipoDocumento?.idTipoDocumento;
                            return (
                              <div
                                key={t.idTipoDocumento}
                                className="p-2 border-bottom text-truncate"
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  backgroundColor: isSelected ? '#0284c7' : '#27272a',
                                  color: '#ffffff'
                                }}
                                onMouseDown={() => {
                                  handleTipoDocChange(t.idTipoDocumento);
                                  setShowTipoDoc(false);
                                }}
                              >
                                <span className="fw-semibold">{t.nombreTipo || t.nombre}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium font-monospace" style={{ color: '#a1a1aa' }}>N° Documento / CUIT</label>
                    <input 
                      type="text" 
                      className="form-control text-white" 
                      style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} 
                      value={editData.persona.numeroDocumento} 
                      onChange={e => handlePersonaChange('numeroDocumento', e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Teléfono</label>
                    <input 
                      type="text" 
                      className="form-control text-white" 
                      style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} 
                      value={editData.persona.telefono} 
                      onChange={e => handlePersonaChange('telefono', e.target.value)} 
                      required 
                      pattern="[0-9]+"
                      onInvalid={(e: any) => {
                        if (e.target.validity.valueMissing) {
                          e.target.setCustomValidity("El Campo de Teléfono No puede Estar Vacío");
                        } else if (e.target.validity.patternMismatch) {
                          e.target.setCustomValidity("El teléfono solo debe contener números");
                        }
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")}
                    />
                  </div>

                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Email</label>
                    <input 
                      type="email" 
                      className="form-control text-white" 
                      style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} 
                      value={editData.persona.email} 
                      onChange={e => handlePersonaChange('email', e.target.value)} 
                    />
                  </div>
                </div>

                {/* SECCIÓN 2: DATOS COMERCIALES */}
                <h5 className="border-bottom pb-2 mb-3 font-monospace fw-bold text-dark-emphasis" style={{ fontSize: '1.05rem' }}>
                  2. Datos Comerciales
                </h5>
                
                <div className="row g-3 mb-2 mx-0">
                  <div className="col-md-6 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Razón Social</label>
                    <input 
                      type="text" 
                      className="form-control text-white" 
                      style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} 
                      value={editData.razonSocial} 
                      onChange={e => setEditData({ ...editData, razonSocial: e.target.value })} 
                    />
                  </div>

                  <div className="col-md-6 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Persona de Contacto</label>
                    <input 
                      type="text" 
                      className="form-control text-white" 
                      style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} 
                      value={editData.personaDeContacto} 
                      onChange={e => setEditData({ ...editData, personaDeContacto: e.target.value })} 
                    />
                  </div>

                  <div className="col-md-12 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Estado</label>
                    <select 
                      className="form-select text-white" 
                      style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} 
                      value={editData.estado} 
                      onChange={e => setEditData({ ...editData, estado: e.target.value })}
                    >
                      <option value="Activo" style={{ backgroundColor: '#1a1a1c' }}>Activo</option>
                      <option value="Desactivado" style={{ backgroundColor: '#1a1a1c' }}>Desactivado</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Botones de Acción Fijos Inferiores */}
              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top" style={{ borderColor: '#3f3f46 !important' }}>
                <button type="button" className="btn btn-danger px-4 fw-semibold" style={{ borderRadius: '8px', color: '#ffffff' }} onClick={onCerrar}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-info px-4 fw-semibold" style={{ borderRadius: 'none', borderColor: '#149bdf', backgroundColor: '#149bdf' , color: '#ffffff' }}>Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SUB-MODAL DE CONFIRMACIÓN */}
      {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content p-4 text-white text-center" style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px' }}>
              <i className="bi bi-exclamation-triangle fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Confirmar Modificaciones?</h5>
              <p className="small" style={{ color: '#a1a1aa' }}>Se sobreescribirán de forma permanente los datos del cliente en la base de datos de El Sur.</p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-outline-secondary btn-sm px-3 text-white" style={{ borderRadius: '6px', backgroundColor: '#e22e2e', borderColor: '#e62020'}} onClick={() => setMostrarConfirmacion(false)}>Volver</button>
                <button className="btn btn-outline-secondary btn-sm px-3 text-white" style={{ borderRadius: '6px', backgroundColor: '#2e9225', borderColor: '#25741e' }} onClick={handleGuardarDefinitivo}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};