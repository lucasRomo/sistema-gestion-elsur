// src/features/configuracion/components/AjustesPerfilCard.tsx
import React from 'react';
import { useConfiguracion } from '../hooks/useConfiguracion';

interface Props {
  config: ReturnType<typeof useConfiguracion>;
  cardBg: string;
  cardBorder: string;
  subBg: string;
  textColor: string;
  mutedTextColor: string;
  inputBgClass: string;
}

export const AjustesPerfilCard: React.FC<Props> = ({
  config,
  cardBg,
  cardBorder,
  subBg,
  textColor,
  mutedTextColor,
  inputBgClass
}) => {
  const {
    usuario,
    opcionPerfil, setOpcionPerfil,
    passwords, setPasswords, mensajePass, cargandoPass, handleCambiarPassword,
    datosUsuario, setDatosUsuario, mensajeUsuario, cargandoUsuario, handleCambiarUsuario,
    datosEmail, setDatosEmail, mensajeEmail, cargandoEmail, handleCambiarEmail
  } = config;

  return (
    <div className="col-12 col-lg-5">
      <div className="p-4 rounded-4 shadow h-100 d-flex flex-column" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded" style={{ backgroundColor: subBg, borderLeft: '4px solid #8e45e0' }}>
          <i className="bi bi-person-bounding-box fs-3" style={{ color: '#8e45e0' }}></i>
          <div>
            <h6 className="mb-0 fw-bold" style={{ color: textColor }}>{usuario?.persona?.nombre} {usuario?.persona?.apellido}</h6>
            <span className={`${mutedTextColor} small`}>Usuario: <b>@{usuario?.nombreUsuario}</b></span>
          </div>
        </div>

        {/* Menú Tabs */}
        <div className="btn-group w-100 mb-4 p-1 rounded" style={{ backgroundColor: subBg, border: `1px solid ${cardBorder}` }}>
          <button
            type="button"
            className={`btn btn-sm fw-bold ${opcionPerfil === 'usuario' ? 'btn-primary' : mutedTextColor}`}
            style={opcionPerfil === 'usuario' ? { backgroundColor: '#8e45e0', borderColor: '#8e45e0' } : {}}
            onClick={() => setOpcionPerfil('usuario')}
          >
            <i className="bi bi-person me-1"></i> Usuario
          </button>
          <button
            type="button"
            className={`btn btn-sm fw-bold ${opcionPerfil === 'password' ? 'btn-primary' : mutedTextColor}`}
            style={opcionPerfil === 'password' ? { backgroundColor: '#8e45e0', borderColor: '#8e45e0' } : {}}
            onClick={() => setOpcionPerfil('password')}
          >
            <i className="bi bi-key me-1"></i> Contraseña
          </button>
          <button
            type="button"
            className={`btn btn-sm fw-bold ${opcionPerfil === 'email' ? 'btn-primary' : mutedTextColor}`}
            style={opcionPerfil === 'email' ? { backgroundColor: '#8e45e0', borderColor: '#8e45e0' } : {}}
            onClick={() => setOpcionPerfil('email')}
          >
            <i className="bi bi-envelope me-1"></i> Email
          </button>
        </div>

        {/* FORMULARIO 1: CAMBIAR USUARIO */}
        {opcionPerfil === 'usuario' && (
          <div>
            <h5 className="fw-bold mb-3" style={{ color: '#8e45e0' }}>
              <i className="bi bi-person-gear me-2"></i>Modificar Nombre de Usuario
            </h5>

            {mensajeUsuario && (
              <div className={`alert ${mensajeUsuario.tipo === 'error' ? 'alert-danger bg-danger text-white' : 'alert-success bg-success text-white'} border-0 py-2 small fw-bold mb-3`}>
                <i className={`bi ${mensajeUsuario.tipo === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'} me-2`}></i>
                {mensajeUsuario.texto}
              </div>
            )}

            <form onSubmit={handleCambiarUsuario}>
              <div className="mb-3">
                <label className={`form-label ${mutedTextColor} small`}>Usuario Actual</label>
                <input 
                  type="text" 
                  className={`form-control ${inputBgClass} font-monospace`}
                  value={datosUsuario.actual}
                  onChange={(e) => setDatosUsuario({ ...datosUsuario, actual: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className={`form-label ${mutedTextColor} small`}>Nuevo Usuario</label>
                <input 
                  type="text" 
                  className={`form-control ${inputBgClass} font-monospace text-muted`}
                  placeholder="Ingrese nuevo nombre de usuario"
                  value={datosUsuario.nuevo}
                  onChange={(e) => setDatosUsuario({ ...datosUsuario, nuevo: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                disabled={cargandoUsuario}
                className="btn w-100 py-2 fw-bold shadow" 
                style={{ backgroundColor: '#8e45e0', color: '#ffffff', borderRadius: '8px' }}
              >
                {cargandoUsuario ? 'Actualizando...' : 'Guardar Nuevo Usuario'}
              </button>
            </form>
          </div>
        )}

        {/* FORMULARIO 2: CAMBIAR CONTRASEÑA */}
        {opcionPerfil === 'password' && (
          <div>
            <h5 className="fw-bold mb-3" style={{ color: '#8e45e0' }}>
              <i className="bi bi-shield-lock me-2"></i>Cambiar Contraseña Propia
            </h5>

            {mensajePass && (
              <div className={`alert ${mensajePass.tipo === 'error' ? 'alert-danger bg-danger text-white' : 'alert-success bg-success text-white'} border-0 py-2 small fw-bold mb-3`}>
                <i className={`bi ${mensajePass.tipo === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'} me-2`}></i>
                {mensajePass.texto}
              </div>
            )}

            <form onSubmit={handleCambiarPassword}>
              <div className="mb-3">
                <label className={`form-label ${mutedTextColor} small`}>Contraseña Actual</label>
                <input 
                  type="password" 
                  className={`form-control ${inputBgClass} font-monospace`}
                  placeholder="••••••••"
                  value={passwords.actual}
                  onChange={(e) => setPasswords({ ...passwords, actual: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className={`form-label ${mutedTextColor} small`}>Nueva Contraseña</label>
                <input 
                  type="password" 
                  className={`form-control ${inputBgClass} font-monospace`}
                  placeholder="Mínimo 4 caracteres"
                  value={passwords.nueva}
                  onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className={`form-label ${mutedTextColor} small`}>Confirmar Nueva Contraseña</label>
                <input 
                  type="password" 
                  className={`form-control ${inputBgClass} font-monospace`}
                  placeholder="Repite la nueva contraseña"
                  value={passwords.confirmar}
                  onChange={(e) => setPasswords({ ...passwords, confirmar: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                disabled={cargandoPass}
                className="btn w-100 py-2 fw-bold shadow" 
                style={{ backgroundColor: '#8e45e0', color: '#ffffff', borderRadius: '8px' }}
              >
                {cargandoPass ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </form>
          </div>
        )}

        {/* FORMULARIO 3: CAMBIAR EMAIL */}
        {opcionPerfil === 'email' && (
          <div>
            <h5 className="fw-bold mb-3" style={{ color: '#8e45e0' }}>
              <i className="bi bi-envelope-at me-2"></i>Modificar Correo Electrónico
            </h5>

            {mensajeEmail && (
              <div className={`alert ${mensajeEmail.tipo === 'error' ? 'alert-danger bg-danger text-white' : 'alert-success bg-success text-white'} border-0 py-2 small fw-bold mb-3`}>
                <i className={`bi ${mensajeEmail.tipo === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'} me-2`}></i>
                {mensajeEmail.texto}
              </div>
            )}

            <form onSubmit={handleCambiarEmail}>
              <div className="mb-3">
                <label className={`form-label ${mutedTextColor} small`}>Email Actual</label>
                <input 
                  type="email" 
                  className={`form-control ${inputBgClass} font-monospace`}
                  value={datosEmail.actual}
                  onChange={(e) => setDatosEmail({ ...datosEmail, actual: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className={`form-label ${mutedTextColor} small`}>Nuevo Email</label>
                <input 
                  type="email" 
                  className={`form-control ${inputBgClass} font-monospace`}
                  placeholder="ejemplo@correo.com"
                  value={datosEmail.nuevo}
                  onChange={(e) => setDatosEmail({ ...datosEmail, nuevo: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                disabled={cargandoEmail}
                className="btn w-100 py-2 fw-bold shadow" 
                style={{ backgroundColor: '#8e45e0', color: '#ffffff', borderRadius: '8px' }}
              >
                {cargandoEmail ? 'Actualizando...' : 'Guardar Nuevo Email'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};