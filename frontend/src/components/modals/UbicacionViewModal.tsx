import React, { useState } from 'react';

interface UbicacionViewModalProps {
  cliente: any; // Pasamos el cliente completo para estructurar la petición al backend
  onCerrar: () => void;
  onConfirmar: (clienteActualizado: any) => Promise<void>;
}

export const UbicacionViewModal: React.FC<UbicacionViewModalProps> = ({ cliente, onCerrar, onConfirmar }) => {
  const direccionOriginal = cliente.persona?.direccion || {};

  // Estado para controlar si estamos viendo o editando
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Estado local para los campos de la dirección
  const [dirData, setDirData] = useState({
    idDireccion: direccionOriginal.idDireccion,
    calle: direccionOriginal.calle || '',
    numero: direccionOriginal.numero || '',
    piso: direccionOriginal.piso || '',
    departamento: direccionOriginal.departamento || '',
    codigoPostal: direccionOriginal.codigoPostal || '',
    ciudad: direccionOriginal.ciudad || '',
    provincia: direccionOriginal.provincia || '',
    pais: direccionOriginal.pais || 'Argentina'
  });

  const handleChange = (field: string, value: string) => {
    setDirData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMostrarConfirmacion(true);
  };

  const handleGuardarDefinitivo = async () => {
    // Reconstruimos el objeto del cliente completo respetando el formato del backend
    const clienteActualizado = {
      ...cliente,
      persona: {
        ...cliente.persona,
        direccion: {
          ...dirData,
          piso: dirData.piso || null,
          departamento: dirData.departamento || null
        }
      }
    };

    await onConfirmar(clienteActualizado);
    setMostrarConfirmacion(false);
    setModoEdicion(false);
  };

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
        <div className="modal-dialog modal-md modal-dialog-centered">
          <div className="modal-content bg-dark border-secondary p-4 text-white" style={{ border: '1px solid #3f3f46' }}>
            
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
              <h4 className="m-0 fw-bold text-warning">
                <i className={`bi ${modoEdicion ? 'bi-geo-alt-fill text-info' : 'bi-house-door'} me-2`}></i>
                {modoEdicion ? 'Modificar Ubicación' : 'Ubicación del Cliente'}
              </h4>
              <button type="button" className="btn-close btn-close-white" onClick={onCerrar}></button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="row g-3">
                {/* Calle */}
                <div className="col-md-8">
                  <label className="form-label small text-secondary m-0">Calle</label>
                  {modoEdicion ? (
                    <input type="text" className="form-control form-control-sm bg-dark border-secondary text-white" value={dirData.calle} onChange={e => handleChange('calle', e.target.value)} required />
                  ) : (
                    <div className="p-2 rounded bg-black border border-secondary text-light">{dirData.calle || '—'}</div>
                  )}
                </div>

                {/* Número */}
                <div className="col-md-4">
                  <label className="form-label small text-secondary m-0">Número</label>
                  {modoEdicion ? (
                    <input type="text" className="form-control form-control-sm bg-dark border-secondary text-white" value={dirData.numero} onChange={e => handleChange('numero', e.target.value)} required />
                  ) : (
                    <div className="p-2 rounded bg-black border border-secondary text-light">{dirData.numero || '—'}</div>
                  )}
                </div>

                {/* Piso */}
                <div className="col-md-3">
                  <label className="form-label small text-secondary m-0">Piso</label>
                  {modoEdicion ? (
                    <input type="text" className="form-control form-control-sm bg-dark border-secondary text-white" value={dirData.piso} onChange={e => handleChange('piso', e.target.value)} />
                  ) : (
                    <div className="p-2 rounded bg-black border border-secondary text-light">{dirData.piso || '—'}</div>
                  )}
                </div>

                {/* Depto */}
                <div className="col-md-3">
                  <label className="form-label small text-secondary m-0">Depto</label>
                  {modoEdicion ? (
                    <input type="text" className="form-control form-control-sm bg-dark border-secondary text-white" value={dirData.departamento} onChange={e => handleChange('departamento', e.target.value)} />
                  ) : (
                    <div className="p-2 rounded bg-black border border-secondary text-light">{dirData.departamento || '—'}</div>
                  )}
                </div>

                {/* Cód Postal */}
                <div className="col-md-6">
                  <label className="form-label small text-secondary m-0">Código Postal</label>
                  {modoEdicion ? (
                    <input type="text" className="form-control form-control-sm bg-dark border-secondary text-white" value={dirData.codigoPostal} onChange={e => handleChange('codigoPostal', e.target.value)} required />
                  ) : (
                    <div className="p-2 rounded bg-black border border-secondary text-light font-monospace">{dirData.codigoPostal || '—'}</div>
                  )}
                </div>

                {/* Ciudad */}
                <div className="col-md-4">
                  <label className="form-label small text-secondary m-0">Ciudad</label>
                  {modoEdicion ? (
                    <input type="text" className="form-control form-control-sm bg-dark border-secondary text-white" value={dirData.ciudad} onChange={e => handleChange('ciudad', e.target.value)} required />
                  ) : (
                    <div className="p-2 rounded bg-black border border-secondary text-light">{dirData.ciudad || '—'}</div>
                  )}
                </div>

                {/* Provincia */}
                <div className="col-md-4">
                  <label className="form-label small text-secondary m-0">Provincia</label>
                  {modoEdicion ? (
                    <input type="text" className="form-control form-control-sm bg-dark border-secondary text-white" value={dirData.provincia} onChange={e => handleChange('provincia', e.target.value)} required />
                  ) : (
                    <div className="p-2 rounded bg-black border border-secondary text-light">{dirData.provincia || '—'}</div>
                  )}
                </div>

                {/* País */}
                <div className="col-md-4">
                  <label className="form-label small text-secondary m-0">País</label>
                  {modoEdicion ? (
                    <input type="text" className="form-control form-control-sm bg-dark border-secondary text-white" value={dirData.pais} onChange={e => handleChange('pais', e.target.value)} required />
                  ) : (
                    <div className="p-2 rounded bg-black border border-secondary text-light">{dirData.pais || '—'}</div>
                  )}
                </div>
              </div>

              {/* BARRA DE ACCIONES DINÁMICA */}
              <div className="d-flex justify-content-between gap-2 mt-4 pt-3 border-top border-secondary">
                <div>
                  {!modoEdicion ? (
                    <button type="button" className="btn btn-outline-info px-3" onClick={() => setModoEdicion(true)}>
                      <i className="bi bi-pencil-square me-1"></i>Habilitar Edición
                    </button>
                  ) : (
                    <button type="button" className="btn btn-outline-secondary px-3" onClick={() => setModoEdicion(false)}>
                      Cancelar Edición
                    </button>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-secondary px-4" onClick={onCerrar}>Cerrar</button>
                  {modoEdicion && (
                    <button type="submit" className="btn btn-info px-4 fw-semibold text-dark">Confirmar</button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SUB-MODAL DE CONFIRMACIÓN DE UBICACIÓN */}
      {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content bg-dark border-info p-4 text-white text-center" style={{ border: '2px solid #0dcaf0' }}>
              <i className="bi bi-exclamation-circle text-info fs-1 mb-2"></i>
              <h5 className="fw-bold">¿Modificar Ubicación?</h5>
              <p className="small text-secondary">Se actualizará la dirección asociada a este cliente de forma permanente.</p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-outline-secondary btn-sm px-3 text-white" onClick={() => setMostrarConfirmacion(false)}>Revisar</button>
                <button className="btn btn-info btn-sm px-3 text-dark fw-bold" onClick={handleGuardarDefinitivo}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};