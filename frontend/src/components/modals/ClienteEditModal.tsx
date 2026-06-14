import React, { useState } from 'react';

interface ClienteEditModalProps {
  cliente: any;
  onCerrar: () => void;
  onConfirmar: (clienteActualizado: any) => Promise<void>;
}

export const ClienteEditModal: React.FC<ClienteEditModalProps> = ({ cliente, onCerrar, onConfirmar }) => {
  const [editData, setEditData] = useState<any>({
    idCliente: cliente.idCliente,
    razonSocial: cliente.razonSocial || '',
    limiteCredito: cliente.limiteCredito || 0,
    saldoDeudor: cliente.saldoDeudor ?? 0, // Mantenemos el saldo actual
    personaDeContacto: cliente.personaDeContacto || '',
    condicionDePago: cliente.condicionDePago || '',
    estado: cliente.estado === 'Desactivo' ? 'Desactivado' : (cliente.estado || 'Activo'), // Normaliza si viene con el formato viejo
    // Mantenemos la estructura de la persona y su dirección intacta para no romper el formato del backend,
    // pero NO mostramos inputs para editar la dirección aquí.
    persona: {
      idPersona: cliente.persona?.idPersona,
      nombre: cliente.persona?.nombre || '',
      apellido: cliente.persona?.apellido || '',
      numeroDocumento: cliente.persona?.numeroDocumento || '',
      telefono: cliente.persona?.telefono || '',
      email: cliente.persona?.email || '',
      tipoDocumento: { idTipoDocumento: cliente.persona?.tipoDocumento?.idTipoDocumento || 1 },
      tipoPersona: { idTipoPersona: cliente.persona?.tipoPersona?.idTipoPersona || 1 },
      direccion: cliente.persona?.direccion || null 
    }
  });

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const handlePersonaChange = (field: string, value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      persona: { ...prev.persona, [field]: value }
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
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content bg-dark border-secondary p-4 text-white" style={{ border: '1px solid #3f3f46' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="m-0 fw-bold text-info"><i className="bi bi-pencil-square me-2"></i>Modificar Cliente</h4>
              <button type="button" className="btn-close btn-close-white" onClick={onCerrar}></button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '5px' }}>
                
                {/* SECCIÓN 1: DATOS PERSONALES */}
                <h5 className="text-secondary border-bottom border-secondary pb-1 mb-3">1. Datos Personales</h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label small text-light">Nombre/Empresa</label>
                    <input type="text" className="form-control bg-dark border-secondary text-white" value={editData.persona.nombre} onChange={e => handlePersonaChange('nombre', e.target.value)} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-light">Apellido</label>
                    <input type="text" className="form-control bg-dark border-secondary text-white" value={editData.persona.apellido} onChange={e => handlePersonaChange('apellido', e.target.value)} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-light font-monospace">N° Documento / CUIT</label>
                    <input type="text" className="form-control bg-dark border-secondary text-white" value={editData.persona.numeroDocumento} onChange={e => handlePersonaChange('numeroDocumento', e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-light">Teléfono</label>
                    <input type="text" className="form-control bg-dark border-secondary text-white" value={editData.persona.telefono} onChange={e => handlePersonaChange('telefono', e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-light">Email</label>
                    <input type="email" className="form-control bg-dark border-secondary text-white" value={editData.persona.email} onChange={e => handlePersonaChange('email', e.target.value)} />
                  </div>
                </div>

                {/* SECCIÓN 2: DATOS COMERCIALES */}
                <h5 className="text-secondary border-bottom border-secondary pb-1 mb-3">2. Datos Comerciales</h5>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small text-light">Razón Social</label>
                    <input type="text" className="form-control bg-dark border-secondary text-white" value={editData.razonSocial} onChange={e => setEditData({ ...editData, razonSocial: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-light">Persona de Contacto</label>
                    <input type="text" className="form-control bg-dark border-secondary text-white" value={editData.personaDeContacto} onChange={e => setEditData({ ...editData, personaDeContacto: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-light">Límite de Crédito</label>
                    <input type="number" className="form-control bg-dark border-secondary text-white" value={editData.limiteCredito} onChange={e => setEditData({ ...editData, limiteCredito: Number(e.target.value) })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-light">Condición de Pago</label>
                    {/* Cambiado de <select> a un <input> de texto libre */}
                    <input 
                      type="text" 
                      className="form-control bg-dark border-secondary text-white" 
                      placeholder="Ej: Efectivo, Cuenta Corriente, 30 días..." 
                      value={editData.condicionDePago} 
                      onChange={e => setEditData({ ...editData, condicionDePago: e.target.value })} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-light">Estado</label>
                    <select className="form-select bg-dark border-secondary text-white" value={editData.estado} onChange={e => setEditData({ ...editData, estado: e.target.value })}>
                      <option value="Activo">Activo</option>
                      <option value="Desactivado">Desactivado</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary">
                <button type="button" className="btn btn-secondary px-4" onClick={onCerrar}>Cancelar</button>
                <button type="submit" className="btn btn-info px-4 fw-semibold text-dark">Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SUB-MODAL DE CONFIRMACIÓN */}
      {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content bg-dark border-warning p-4 text-white text-center" style={{ border: '2px solid #eab308' }}>
              <i className="bi bi-exclamation-triangle text-warning fs-1 mb-2"></i>
              <h5 className="fw-bold">¿Confirmar Modificaciones?</h5>
              <p className="small text-secondary">Se sobreescribirán de forma permanente los datos del cliente en la base de datos de El Sur.</p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-outline-secondary btn-sm px-3 text-white" onClick={() => setMostrarConfirmacion(false)}>Revisar</button>
                <button className="btn btn-warning btn-sm px-3 text-dark fw-bold" onClick={handleGuardarDefinitivo}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};