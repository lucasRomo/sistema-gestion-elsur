import React, { useState, useEffect } from 'react';

interface UsuarioEditModalProps {
  usuario: any;
  onCerrar: () => void;
  onConfirmar: (usuarioActualizado: any) => Promise<void>;
}

export const UsuarioEditModal: React.FC<UsuarioEditModalProps> = ({ usuario, onCerrar, onConfirmar }) => {
  const [roles, setRoles] = useState<any[]>([]);
  
  const [editData, setEditData] = useState<any>({
    idUsuario: usuario.idUsuario,
    nombreUsuario: usuario.nombreUsuario || '',
    password: usuario.password || '',
    salario: usuario.salario || 0,
    estado: usuario.estado || 'Activo',
    rol: { 
      idRol: usuario.rol?.idRol || 4 
    },
    persona: {
      ...usuario.persona, // Mantenemos el resto de los datos de la persona intactos
      nombre: usuario.persona?.nombre || '',
      apellido: usuario.persona?.apellido || '',
    }
  });

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  useEffect(() => {
    // Simulamos la carga de roles desde Spring Boot
    setRoles([
      { idRol: 1, nombre: 'Admin' },
      { idRol: 2, nombre: 'Gerente' },
      { idRol: 3, nombre: 'Mostrador' },
      { idRol: 4, nombre: 'Operario' },
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
          <div className="modal-content border-secondary text-white" style={{ border: '1px solid #3f3f46', backgroundColor: '#1a1a1c', borderRadius: '14px' }}>
            
            <div className="d-flex justify-content-between align-items-center px-4 pt-4 pb-2">
              <h4 className="m-0 fw-bold text-info d-flex align-items-center">
                <i className="bi bi-person-lines-fill me-2"></i>Modificar Usuario
              </h4>
              <button type="button" className="btn-close btn-close-white" onClick={onCerrar}></button>
            </div>

            <form onSubmit={handleFormSubmit} className="px-4 pb-4">
              <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden', paddingRight: '8px' }}>
                
                {/* SECCIÓN 1: DATOS DE ACCESO */}
                <h5 className="border-bottom pb-2 mb-3 mt-2" style={{ color: '#e4e4e7', borderColor: '#3f3f46 !important', fontSize: '1.05rem', fontWeight: '600' }}>
                  1. Credenciales de Acceso
                </h5>
                <div className="row g-3 mb-4 mx-0">
                  <div className="col-md-6 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Usuario (Login)</label>
                    <input type="text" className="form-control text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.nombreUsuario} onChange={e => setEditData({...editData, nombreUsuario: e.target.value})} required />
                  </div>
                  <div className="col-md-6 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Contraseña</label>
                    <input type="text" className="form-control text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})} required />
                  </div>
                </div>

                {/* SECCIÓN 2: DATOS DEL EMPLEADO */}
                <h5 className="border-bottom pb-2 mb-3" style={{ color: '#e4e4e7', borderColor: '#3f3f46 !important', fontSize: '1.05rem', fontWeight: '600' }}>
                  2. Perfil y Permisos
                </h5>
                <div className="row g-3 mb-2 mx-0">
                  <div className="col-md-6 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Nombre</label>
                    <input type="text" className="form-control text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.persona.nombre} onChange={e => handlePersonaChange('nombre', e.target.value)} required />
                  </div>
                  <div className="col-md-6 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Apellido</label>
                    <input type="text" className="form-control text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.persona.apellido} onChange={e => handlePersonaChange('apellido', e.target.value)} required />
                  </div>
                  
                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Rol del Sistema</label>
                    <select 
                      className="form-select text-white" 
                      style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }}
                      value={editData.rol.idRol}
                      onChange={e => setEditData({ ...editData, rol: { idRol: Number(e.target.value) } })}
                    >
                      {roles.map((r: any) => (
                        <option key={r.idRol} value={r.idRol} style={{ backgroundColor: '#1a1a1c' }}>{r.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Salario ($)</label>
                    <input type="number" className="form-control text-white font-monospace" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.salario} onChange={e => setEditData({...editData, salario: Number(e.target.value)})} />
                  </div>
                  <div className="col-md-4 px-1">
                    <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Estado</label>
                    <select className="form-select text-white" style={{ backgroundColor: '#222226', borderColor: '#3f3f46' }} value={editData.estado} onChange={e => setEditData({ ...editData, estado: e.target.value })}>
                      <option value="Activo" style={{ backgroundColor: '#1a1a1c' }}>Activo</option>
                      <option value="Pendiente" style={{ backgroundColor: '#1a1a1c' }}>Pendiente</option>
                      <option value="Desactivado" style={{ backgroundColor: '#1a1a1c' }}>Desactivado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top" style={{ borderColor: '#3f3f46 !important' }}>
                <button type="button" className="btn btn-secondary px-4" style={{ borderRadius: '8px' }} onClick={onCerrar}>Cancelar</button>
                <button type="submit" className="btn btn-info px-4 fw-semibold text-dark" style={{ borderRadius: '8px' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content p-4 text-white text-center" style={{ border: '2px solid #3b82f6', backgroundColor: '#1a1a1c', borderRadius: '12px' }}>
              <i className="bi bi-shield-lock text-info fs-1 mb-2"></i>
              <h5 className="fw-bold">¿Actualizar Perfil?</h5>
              <p className="small" style={{ color: '#a1a1aa' }}>Se modificarán las credenciales y permisos de acceso para este usuario.</p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-outline-secondary btn-sm px-3 text-white" style={{ borderRadius: '6px' }} onClick={() => setMostrarConfirmacion(false)}>Revisar</button>
                <button className="btn btn-info btn-sm px-3 text-dark fw-bold" style={{ borderRadius: '6px' }} onClick={handleGuardarDefinitivo}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};