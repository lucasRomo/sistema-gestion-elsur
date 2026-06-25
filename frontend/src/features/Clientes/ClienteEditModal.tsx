import React, { useState, useEffect } from 'react';

interface ClienteEditModalProps {
  cliente: any;
  onCerrar: () => void;
  onConfirmar: (clienteActualizado: any) => Promise<void>;
}

export const ClienteEditModal: React.FC<ClienteEditModalProps> = ({ cliente, onCerrar, onConfirmar }) => {
  // Lista dinámica traída del backend
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
  
  const [editData, setEditData] = useState<any>({
    idCliente: cliente.idCliente,
    razonSocial: cliente.razonSocial || '',
    limiteCredito: cliente.limiteCredito || 0,
    saldoDeudor: cliente.saldoDeudor ?? 0,
    personaDeContacto: cliente.personaDeContacto || '',
    condicionDePago: cliente.condicionDePago || '',
    estado: cliente.estado === 'Desactivo' ? 'Desactivado' : (cliente.estado || 'Activo'),
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

  // Cargamos los tipos de documentos disponibles al montar el modal
  useEffect(() => {
    fetch('http://localhost:8080/api/tipos-documento') // Ajustá este endpoint según tu backend de Java
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => setTiposDocumento(data))
      .catch(() => {
        // Fallback estático de emergencia por si el endpoint no está creado todavía
        setTiposDocumento([
          { idTipoDocumento: 1, nombre: 'DNI' },
          { idTipoDocumento: 2, nombre: 'CUIT' },
          { idTipoDocumento: 3, nombre: 'CUIL' },
          { idTipoDocumento: 4, nombre: 'PASAPORTE' }
        ]);
      });
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
          <div className="modal-content border-secondary text-white" style={{ border: '1px solid #3f3f46', backgroundColor: '#1a1a1c', borderRadius: '14px' }}>
            
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
                <h5 className="border-bottom pb-2 mb-3 mt-2" style={{ color: '#e4e4e7', borderColor: '#3f3f46 !important', fontSize: '1.05rem', fontWeight: '600' }}>
                  1. Datos Personales
                </h5>
                
                <div className="row g-3 mb-4 mx-0">
                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Nombre/Empresa</label>
                    <input type="text" className="form-control text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.persona.nombre} onChange={e => handlePersonaChange('nombre', e.target.value)} required />
                  </div>
                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Apellido</label>
                    <input type="text" className="form-control text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.persona.apellido} onChange={e => handlePersonaChange('apellido', e.target.value)} required />
                  </div>
                  
                  {/* Selector dinámico de tipo de documento */}
                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Tipo de Doc.</label>
                    <select 
                      className="form-select text-white" 
                      style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }}
                      value={editData.persona.tipoDocumento.idTipoDocumento}
                      onChange={e => handleTipoDocChange(Number(e.target.value))}
                    >
                      {tiposDocumento.map((t: any) => (
                        <option key={t.idTipoDocumento} value={t.idTipoDocumento} style={{ backgroundColor: '#1a1a1c' }}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium font-monospace" style={{ color: '#a1a1aa' }}>N° Documento / CUIT</label>
                    <input type="text" className="form-control text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.persona.numeroDocumento} onChange={e => handlePersonaChange('numeroDocumento', e.target.value)} required />
                  </div>
                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Teléfono</label>
                    <input type="text" className="form-control text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.persona.telefono} onChange={e => handlePersonaChange('telefono', e.target.value)} />
                  </div>
                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Email</label>
                    <input type="email" className="form-control text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.persona.email} onChange={e => handlePersonaChange('email', e.target.value)} />
                  </div>
                </div>

                {/* SECCIÓN 2: DATOS COMERCIALES */}
                <h5 className="border-bottom pb-2 mb-3" style={{ color: '#e4e4e7', borderColor: '#3f3f46 !important', fontSize: '1.05rem', fontWeight: '600' }}>
                  2. Datos Comerciales
                </h5>
                
                <div className="row g-3 mb-2 mx-0">
                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Razón Social</label>
                    <input type="text" className="form-control text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.razonSocial} onChange={e => setEditData({ ...editData, razonSocial: e.target.value })} />
                  </div>
                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Persona de Contacto</label>
                    <input type="text" className="form-control text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.personaDeContacto} onChange={e => setEditData({ ...editData, personaDeContacto: e.target.value })} />
                  </div>
                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Límite de Crédito</label>
                    <input type="number" className="form-control text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.limiteCredito} onChange={e => setEditData({ ...editData, limiteCredito: Number(e.target.value) })} />
                  </div>
                  <div className="col-md-6 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Condición de Pago</label>
                    <input 
                      type="text" 
                      className="form-control text-white" 
                      style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }}
                      placeholder="Ej: Efectivo, Cuenta Corriente, 30 días..." 
                      value={editData.condicionDePago} 
                      onChange={e => setEditData({ ...editData, condicionDePago: e.target.value })} 
                    />
                  </div>
                  <div className="col-md-6 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Estado</label>
                    <select className="form-select text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.estado} onChange={e => setEditData({ ...editData, estado: e.target.value })}>
                      <option value="Activo" style={{ backgroundColor: '#1a1a1c' }}>Activo</option>
                      <option value="Desactivado" style={{ backgroundColor: '#1a1a1c' }}>Desactivado</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Botones de Acción Fijos Inferiores */}
              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top" style={{ borderColor: '#3f3f46 !important' }}>
                <button type="button" className="btn btn-secondary px-4" style={{ borderRadius: '8px' }} onClick={onCerrar}>Cancelar</button>
                <button type="submit" className="btn btn-info px-4 fw-semibold text-dark" style={{ borderRadius: '8px' }}>Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SUB-MODAL DE CONFIRMACIÓN */}
      {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content p-4 text-white text-center" style={{ border: '2px solid #eab308', backgroundColor: '#1a1a1c', borderRadius: '12px' }}>
              <i className="bi bi-exclamation-triangle text-warning fs-1 mb-2"></i>
              <h5 className="fw-bold">¿Confirmar Modificaciones?</h5>
              <p className="small" style={{ color: '#a1a1aa' }}>Se sobreescribirán de forma permanente los datos del cliente en la base de datos de El Sur.</p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-outline-secondary btn-sm px-3 text-white" style={{ borderRadius: '6px' }} onClick={() => setMostrarConfirmacion(false)}>Revisar</button>
                <button className="btn btn-warning btn-sm px-3 text-dark fw-bold" style={{ borderRadius: '6px' }} onClick={handleGuardarDefinitivo}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};