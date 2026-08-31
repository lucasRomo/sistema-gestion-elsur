import React, { useState } from 'react';
import { useTheme } from '../../Context/ThemeContext';

interface UbicacionViewModalProps {
  cliente: any; // Pasamos el cliente completo para estructurar la petición al backend
  onCerrar: () => void;
  onConfirmar: (clienteActualizado: any) => Promise<void>;
}

export const UbicacionViewModal: React.FC<UbicacionViewModalProps> = ({ cliente, onCerrar, onConfirmar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Estilos dinámicos adaptativos según el tema
  const modalBg = isDark ? '#1a1a1c' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? '#a1a1aa' : '#64748b';
  const borderDivider = isDark ? '#3f3f46' : '#e2e8f0';

  // Inputs y contenedores de lectura (reemplaza el bg-black fijo)
  const boxBg = isDark ? '#121214' : '#f8fafc';
  const boxBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const boxTextColor = isDark ? '#ffffff' : '#0f172a';

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
    pais: direccionOriginal.pais || ''
  });

  const handleChange = (field: string, value: string) => {
    setDirData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMostrarConfirmacion(true);
  };

  const handleGuardarDefinitivo = async () => {
  const clienteActualizado = {
    ...cliente,
    persona: {
      ...cliente.persona,
      direccion: {
        ...dirData,
        piso: dirData.piso || '',
        departamento: dirData.departamento || '',
        ciudad: dirData.ciudad || '',       
        provincia: dirData.provincia || '', 
        pais: dirData.pais || ''            
      }
    }
  };

  await onConfirmar(clienteActualizado);
  setMostrarConfirmacion(false);
  setModoEdicion(false);
};

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
        <div className="modal-dialog modal-md modal-dialog-centered">
          <div 
  className="modal-content p-4 font-monospace shadow-lg" 
  style={{ 
    backgroundColor: modalBg, 
    border: '1.5px solid #f1ca18',
    borderRadius: '14px', 
    color: titleColor 
  }}
>
            
            {/* Encabezado */}
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: borderDivider }}>
              <h4 className="m-0 fw-bold d-flex align-items-center" style={{ color: '#f1ca18' }}>
                <i className={`bi bi-house-door ${modoEdicion ? 'text-warning' : ''} me-2`}></i>
                {modoEdicion ? 'Modificar Ubicación' : 'Ubicación del Cliente'}
              </h4>
              <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onCerrar}></button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="row g-3">
                {/* Calle */}
                <div className="col-md-8">
                  <label className="form-label small font-monospace fw-medium m-0" style={{ color: labelColor }}>Calle</label>
                  {modoEdicion ? (
                    <input 
                      type="text" 
                      className="form-control form-control-sm font-monospace" 
                      style={{ backgroundColor: boxBg, borderColor: boxBorder, color: boxTextColor }}
                      value={dirData.calle} 
                      onChange={e => handleChange('calle', e.target.value)} 
                      required 
                      pattern="[A-Za-zÁ-Úá-ú\s\.]+"
                      onInvalid={(e: any) => {
                        if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo calle No puede Estar Vacío");
                        else e.target.setCustomValidity("El Campo Calle solo debe Contener Letras");
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")} 
                    />
                  ) : (
                    <div className="p-2 rounded font-monospace" style={{ backgroundColor: boxBg, border: `1px solid ${boxBorder}`, color: boxTextColor }}>
                      {dirData.calle || '—'}
                    </div>
                  )}
                </div>

                {/* Número */}
                <div className="col-md-4">
                  <label className="form-label small font-monospace fw-medium m-0" style={{ color: labelColor }}>Número</label>
                  {modoEdicion ? (
                    <input 
                      type="text" 
                      className="form-control form-control-sm font-monospace" 
                      style={{ backgroundColor: boxBg, borderColor: boxBorder, color: boxTextColor }}
                      value={dirData.numero} 
                      onChange={e => handleChange('numero', e.target.value)} 
                      required 
                      pattern="[0-9]+"
                      onInvalid={(e: any) => {
                        if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo Número No puede Estar Vacío");
                        else e.target.setCustomValidity("En este campo Solo se permiten números");
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")}
                    />
                  ) : (
                    <div className="p-2 rounded font-monospace" style={{ backgroundColor: boxBg, border: `1px solid ${boxBorder}`, color: boxTextColor }}>
                      {dirData.numero || '—'}
                    </div>
                  )}
                </div>

                {/* Piso */}
                <div className="col-md-3">
                  <label className="form-label small font-monospace fw-medium m-0" style={{ color: labelColor }}>Piso</label>
                  {modoEdicion ? (
                    <input 
                      type="text" 
                      placeholder="Opcional"
                      className="form-control form-control-sm font-monospace" 
                      style={{ backgroundColor: boxBg, borderColor: boxBorder, color: boxTextColor }}
                      value={dirData.piso} 
                      onChange={e => handleChange('piso', e.target.value)} 
                    />
                  ) : (
                    <div className="p-2 rounded font-monospace" style={{ backgroundColor: boxBg, border: `1px solid ${boxBorder}`, color: boxTextColor }}>
                      {dirData.piso || '—'}
                    </div>
                  )}
                </div>

                {/* Depto */}
                <div className="col-md-3">
                  <label className="form-label small font-monospace fw-medium m-0" style={{ color: labelColor }}>Depto</label>
                  {modoEdicion ? (
                    <input 
                      type="text" 
                      placeholder="Opcional"
                      className="form-control form-control-sm font-monospace" 
                      style={{ backgroundColor: boxBg, borderColor: boxBorder, color: boxTextColor }}
                      value={dirData.departamento} 
                      onChange={e => handleChange('departamento', e.target.value)} 
                    />
                  ) : (
                    <div className="p-2 rounded font-monospace" style={{ backgroundColor: boxBg, border: `1px solid ${boxBorder}`, color: boxTextColor }}>
                      {dirData.departamento || '—'}
                    </div>
                  )}
                </div>

                {/* Cód Postal */}
                <div className="col-md-6">
                  <label className="form-label small font-monospace fw-medium m-0" style={{ color: labelColor }}>Código Postal</label>
                  {modoEdicion ? (
                    <input 
                      type="text" 
                      className="form-control form-control-sm font-monospace" 
                      style={{ backgroundColor: boxBg, borderColor: boxBorder, color: boxTextColor }}
                      value={dirData.codigoPostal} 
                      onChange={e => handleChange('codigoPostal', e.target.value)} 
                      required 
                      pattern="[0-9]+"
                      onInvalid={(e: any) => {
                        if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo Código Postal No puede Estar Vacío");
                        else e.target.setCustomValidity("En el Campo Código Postal Solo se permiten números");
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")}
                    />
                  ) : (
                    <div className="p-2 rounded font-monospace" style={{ backgroundColor: boxBg, border: `1px solid ${boxBorder}`, color: boxTextColor }}>
                      {dirData.codigoPostal || '—'}
                    </div>
                  )}
                </div>

                {/* Ciudad */}
                <div className="col-md-4">
                  <label className="form-label small font-monospace fw-medium m-0" style={{ color: labelColor }}>Ciudad</label>
                  {modoEdicion ? (
                    <input 
                      type="text" 
                      placeholder="Opcional"
                      className="form-control form-control-sm font-monospace" 
                      style={{ backgroundColor: boxBg, borderColor: boxBorder, color: boxTextColor }}
                      value={dirData.ciudad} 
                      onChange={e => handleChange('ciudad', e.target.value)} 
                      pattern="^$|[A-Za-zÁ-Úá-ú\s]+"
                      onInvalid={(e: any) => {
                        if (e.target.validity.patternMismatch) e.target.setCustomValidity("En el campo Ciudad solo se permiten letras");
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")} 
                    />
                  ) : (
                    <div className="p-2 rounded font-monospace" style={{ backgroundColor: boxBg, border: `1px solid ${boxBorder}`, color: boxTextColor }}>
                      {dirData.ciudad || '—'}
                    </div>
                  )}
                </div>

                {/* Provincia */}
                <div className="col-md-4">
                  <label className="form-label small font-monospace fw-medium m-0" style={{ color: labelColor }}>Provincia</label>
                  {modoEdicion ? (
                    <input 
                      type="text" 
                      placeholder="Opcional"
                      className="form-control form-control-sm font-monospace" 
                      style={{ backgroundColor: boxBg, borderColor: boxBorder, color: boxTextColor }}
                      value={dirData.provincia} 
                      onChange={e => handleChange('provincia', e.target.value)} 
                      pattern="^$|[A-Za-zÁ-Úá-ú\s]+"
                      onInvalid={(e: any) => {
                        if (e.target.validity.patternMismatch) e.target.setCustomValidity("En el campo Provincia solo se permiten letras");
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")} 
                    />
                  ) : (
                    <div className="p-2 rounded font-monospace" style={{ backgroundColor: boxBg, border: `1px solid ${boxBorder}`, color: boxTextColor }}>
                      {dirData.provincia || '—'}
                    </div>
                  )}
                </div>

                {/* País */}
                <div className="col-md-4">
                  <label className="form-label small font-monospace fw-medium m-0" style={{ color: labelColor }}>País</label>
                  {modoEdicion ? (
                    <input 
                      type="text" 
                      placeholder="Opcional"
                      className="form-control form-control-sm font-monospace" 
                      style={{ backgroundColor: boxBg, borderColor: boxBorder, color: boxTextColor }}
                      value={dirData.pais} 
                      onChange={e => handleChange('pais', e.target.value)} 
                      pattern="^$|[A-Za-zÁ-Úá-ú\s]+"
                      onInvalid={(e: any) => {
                        if (e.target.validity.patternMismatch) e.target.setCustomValidity("En el campo País solo se permiten letras");
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")} 
                    />
                  ) : (
                    <div className="p-2 rounded font-monospace" style={{ backgroundColor: boxBg, border: `1px solid ${boxBorder}`, color: boxTextColor }}>
                      {dirData.pais || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* BARRA DE ACCIONES DINÁMICA */}
              <div className="d-flex justify-content-between gap-2 mt-4 pt-3 border-top" style={{ borderColor: borderDivider }}>
                <div>
                  {!modoEdicion ? (
                    <button type="button" className="btn btn-outline-warning px-3 font-monospace" style={{ borderRadius: '8px' }} onClick={() => setModoEdicion(true)}>
                      <i className="bi bi-pencil-square me-1"></i>Habilitar Edición
                    </button>
                  ) : (
                    <button type="button" className="btn btn-outline-danger px-3 font-monospace" style={{ borderRadius: '8px' }} onClick={() => setModoEdicion(false)}>
                      Cancelar Edición
                    </button>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-secondary px-4 fw-semibold font-monospace" style={{ borderRadius: '8px', color: '#ffffff' }} onClick={onCerrar}>
                    Cerrar
                  </button>
                  {modoEdicion && (
                    <button 
                      type="submit" 
                      className="btn btn-warning px-4 fw-semibold font-monospace" 
                      style={{ borderRadius: '8px', color: '#ffffff' }}
                    >
                      Confirmar
                    </button>
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
            <div className="modal-content p-4 text-white text-center font-monospace shadow-lg" style={{ backgroundColor: '#1a1a1c', border: '2px solid #8e45e0', borderRadius: '12px' }}>
              <i className="bi bi-exclamation-circle fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Modificar Ubicación?</h5>
              <p className="small" style={{ color: '#a1a1aa' }}>Se actualizará la dirección asociada de forma permanente.</p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-outline-light btn-sm px-3" style={{ borderRadius: '6px', backgroundColor: '#e22e2e', borderColor: '#8d1414', color: '#ffffff'}} onClick={() => setMostrarConfirmacion(false)}>
                  Volver
                </button>
                <button className="btn text-white btn-sm px-3 fw-bold" style={{ borderRadius: '6px', backgroundColor: '#2e9225', borderColor: '#25741e', color: '#ffffff' }} onClick={handleGuardarDefinitivo}>
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};