import React, { useState, useEffect } from 'react';
import { useTheme } from '../../Context/ThemeContext';

interface UsuarioEditModalProps {
  usuario: any;
  onCerrar: () => void;
  onConfirmar: (usuarioActualizado: any) => Promise<void>;
}

export const UsuarioEditModal: React.FC<UsuarioEditModalProps> = ({ usuario, onCerrar, onConfirmar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables adaptativas según el tema
  const modalBg = isDark ? '#1a1a1c' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const sectionTitleColor = isDark ? '#e4e4e7' : '#1e293b';
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const inputBg = isDark ? '#222226' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const inputTextColor = isDark ? '#ffffff' : '#0f172a';

  const [roles, setRoles] = useState<any[]>([]);
  
  const [editData, setEditData] = useState<any>({
    idUsuario: usuario.idUsuario,
    nombreUsuario: usuario.nombreUsuario || '',
    password: usuario.password || '',
    salario: usuario.salario || 0,
    estado: usuario.estado || 'Activo',
    cargo: usuario.cargo || '', 
    rol: { 
      idRol: usuario.rol?.idRol || 2 
    },
    persona: {
      ...usuario.persona, 
      nombre: usuario.persona?.nombre || '',
      apellido: usuario.persona?.apellido || '',
      documento: usuario.persona?.numeroDocumento || '',
    }
  });

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  useEffect(() => {
    setRoles([
      { idRol: 1, nombre: 'ADMIN' },
      { idRol: 2, nombre: 'EMPLEADO' }
    ]);
  }, []);

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
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered" style={{ maxWidth: '800px' }}>
          <div className="modal-content shadow-lg" style={{ border: `1px solid ${modalBorder}`, backgroundColor: modalBg, color: textColor, borderRadius: '14px' }}>
            
            <div className="d-flex justify-content-between align-items-center px-4 pt-4 pb-2">
              <h4 className="m-0 fw-bold text-info d-flex align-items-center">
                <i className="bi bi-person-lines-fill me-2"></i>Modificar Usuario
              </h4>
              <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onCerrar}></button>
            </div>

            <form onSubmit={handleFormSubmit} className="px-4 pb-4">
              <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden', paddingRight: '8px' }}>
                
                {/* SECCIÓN 1: DATOS DE ACCESO */}
                <h5 className="border-bottom pb-2 mb-3 mt-2" style={{ color: sectionTitleColor, borderColor: inputBorder, fontSize: '1.05rem', fontWeight: '600' }}>
                  1. Credenciales de Acceso
                </h5>
                <div className="row g-3 mb-4 mx-0">
                  <div className="col-md-6 px-1">
                    <label className="form-label small fw-medium" style={{ color: labelColor }}>Usuario (Login)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
                      value={editData.nombreUsuario} 
                      onChange={e => setEditData({...editData, nombreUsuario: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="col-md-6 px-1">
                    <label className="form-label small fw-medium" style={{ color: labelColor }}>Contraseña</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
                      value={editData.password} 
                      onChange={e => setEditData({...editData, password: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                {/* SECCIÓN 2: DATOS DEL EMPLEADO */}
                <h5 className="border-bottom pb-2 mb-3" style={{ color: sectionTitleColor, borderColor: inputBorder, fontSize: '1.05rem', fontWeight: '600' }}>
                  2. Perfil y Permisos
                </h5>

                <div className="row g-3 mb-2 mx-0">
                  <div className="col-md-6 px-1">
                    <label className="form-label small fw-medium" style={{ color: labelColor }}>Nombre</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
                      value={editData.persona.nombre} 
                      onChange={e => handlePersonaChange('nombre', e.target.value)} 
                      required pattern="[A-Za-zÁ-Úá-ú\s]+"
                      onInvalid={(e: any) => {
                        if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Nombre No puede Estar Vacío");
                        else if (e.target.validity.patternMismatch) e.target.setCustomValidity("El Campo de Nombre solo puede contener letras");
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")}
                    />
                  </div>

                  <div className="col-md-6 px-1">
                    <label className="form-label small fw-medium" style={{ color: labelColor }}>Apellido</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
                      value={editData.persona.apellido} 
                      onChange={e => handlePersonaChange('apellido', e.target.value)} 
                      required pattern="[A-Za-zÁ-Úá-ú\s]+"
                      onInvalid={(e: any) => {
                        if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Apellido No puede Estar Vacío");
                        else if (e.target.validity.patternMismatch) e.target.setCustomValidity("El Campo de Apellido solo puede contener letras");
                      }}
                      onInput={(e: any) => e.target.setCustomValidity("")}
                    />
                  </div>

                  <div className="col-md-6 px-1 mt-3">
                    <label className="form-label small fw-medium" style={{ color: labelColor }}>Número de Documento</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
                      value={editData.persona.numeroDocumento} 
                      onChange={e => handlePersonaChange('documento', e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="col-md-3 px-1">
                    <label className="form-label small fw-medium" style={{ color: labelColor }}>Rol del Sistema</label>
                    <select 
                      className="form-select" 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }}
                      value={editData.rol.idRol}
                      onChange={e => setEditData({ ...editData, rol: { idRol: Number(e.target.value) } })}
                    >
                      {roles.map((r: any) => (
                        <option key={r.idRol} value={r.idRol} style={{ backgroundColor: inputBg, color: inputTextColor }}>
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3 px-1">
                    <label className="form-label small fw-medium" style={{ color: labelColor }}>Cargo</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
                      placeholder="Ej: Programador"
                      value={editData.cargo} 
                      onChange={e => setEditData({ ...editData, cargo: e.target.value })} 
                      required pattern="[A-Za-z\s]+"
                      onInvalid={(e: any) => {
                        if (e.target.validity.valueMissing) e.target.setCustomValidity("El Campo de Cargo No puede Estar Vacío");
                        else if (e.target.validity.patternMismatch) e.target.setCustomValidity("El Campo de Cargo solo debe contener letras");
                      }} 
                      onInput={(e: any) => e.target.setCustomValidity("")}
                    />
                  </div>

                  <div className="col-md-3 px-1">
                    <label className="form-label small fw-medium" style={{ color: labelColor }}>Salario ($)</label>
                    <input 
                      type="text" 
                      className="form-control font-monospace" 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
                      placeholder="0"
                      value={editData.salario === 0 ? '' : editData.salario} 
                      onChange={e => {
                        const valor = e.target.value;
                        if (valor === '') {
                          setEditData({ ...editData, salario: '' });
                        } else {
                          const numero = Number(valor);
                          if (!isNaN(numero)) {
                            setEditData({ ...editData, salario: numero });
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="col-md-3 px-1">
                    <label className="form-label small fw-medium" style={{ color: labelColor }}>Estado</label>
                    <select 
                      className="form-select" 
                      style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }} 
                      value={editData.estado} 
                      onChange={e => setEditData({ ...editData, estado: e.target.value })}
                    >
                      <option value="Activo" style={{ backgroundColor: inputBg, color: inputTextColor }}>Activo</option>
                      <option value="Pendiente" style={{ backgroundColor: inputBg, color: inputTextColor }}>Pendiente</option>
                      <option value="Desactivado" style={{ backgroundColor: inputBg, color: inputTextColor }}>Desactivado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top" style={{ borderColor: inputBorder }}>
                <button 
                  type="button" 
                  className="btn btn-danger px-4" 
                  style={{ borderRadius: '8px', color: '#ffffff' }} 
                  onClick={onCerrar}
                >
                  Cancelar
                </button>
                <button 
  type="submit" 
  className="btn btn-info px-4 fw-semibold" 
  style={{ borderRadius: '8px', color: '#ffffff' }}
>
  Guardar Cambios
</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content p-4 text-center shadow-lg" style={{ border: '2px solid #8e45e0', backgroundColor: modalBg, color: textColor, borderRadius: '12px' }}>
              <i className="bi bi-shield-lock fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Actualizar Perfil?</h5>
              <p className="small" style={{ color: labelColor }}>Se modificarán las credenciales y permisos de acceso para este usuario.</p>
              
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button 
                  className="btn btn-outline-light btn-sm px-3" 
                  style={{ borderRadius: '6px', backgroundColor: '#e22e2e', borderColor: '#e62020', color: '#ffffff' }} 
                  onClick={() => setMostrarConfirmacion(false)}
                >
                  Volver
                </button>
                <button 
                  className="btn btn-sm px-3 text-white fw-bold" 
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
    </>
  );
};