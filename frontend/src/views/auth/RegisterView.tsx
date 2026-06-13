import React, { useState } from 'react';
import type { Usuario } from '../../types/Usuario';
import type { Empleado } from '../../types/Empleado';

interface RegisterViewProps {
  onVolver: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onVolver }) => {
  // --- ESTADOS FORMULARIO PRINCIPAL: Persona y Dirección ---
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [calle, setCalle] = useState('');
  const [numero, setNumero] = useState('');
  const [piso, setPiso] = useState('');
  const [depto, setDepto] = useState('');
  const [codPostal, setCodPostal] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [pais, setPais] = useState('');

  // --- ESTADOS MODAL SECUNDARIO: Usuario y Empleado ---
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [fechaContratacion, setFechaContratacion] = useState('');
  const [cargo, setCargo] = useState('');
  const [salario, setSalario] = useState('');

  // --- CONTROL DE MODALES ---
  const [mostrarModalEmpleado, setMostrarModalEmpleado] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

  // Al dar "Siguiente", abrimos el modal secundario
  const handleSiguiente = (e: React.FormEvent) => {
    e.preventDefault();
    setMostrarModalEmpleado(true);
  };

  // Envío final conectado de forma funcional a la base de datos de El Sur
  const handleRegistrarTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Armamos el objeto Usuario mapeado según tus modelos de Java
    const nuevoUsuario: Usuario = {
      nombreUsuario: nombreUsuario,
      password: password, // Mapea a 'contrasena' en tu backend
      rol: { idRol: 2 },  // Rol predeterminado para empleados
      persona: {
        nombre: nombre,
        apellido: apellido,
        numeroDocumento: numeroDocumento,
        telefono: telefono,
        email: email,
        tipoDocumento: { idTipoDocumento: parseInt(tipoDocumento) || 1 },
        tipoPersona: { idTipoPersona: 1 }, // 1 para Persona Física
        direccion: {
          calle: calle,
          numero: numero,
          piso: piso || null,
          departamento: depto || null,
          codigoPostal: codPostal,
          ciudad: ciudad || 'Santa Fe',
          provincia: provincia || 'Santa Fe',
          pais: pais || 'Argentina'
        }
      }
    };

    try {
      // Intentamos guardar primero el Usuario (y por cascada la Persona y Dirección)
      const responseUsuario = await fetch('http://localhost:8080/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      });

      if (responseUsuario.ok) {
        // Obtenemos el objeto guardado que ya incluye el idPersona generado por MySQL
        const usuarioGuardado: Usuario = await responseUsuario.json();

        // 2. Mapeamos la entidad Empleado vinculando la Persona recién creada
        const nuevoEmpleado: Empleado = {
          fechaContratacion: fechaContratacion,
          cargo: cargo,
          salario: parseFloat(salario) || 0.0,
          estado: 'ACTIVO',
          persona: { idPersona: usuarioGuardado.persona.idPersona } as any
        };

        const responseEmpleado = await fetch('http://localhost:8080/api/empleados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoEmpleado)
        });

        if (responseEmpleado.ok) {
          setMostrarModalEmpleado(false);
          setMostrarModalExito(true);
        } else {
          alert('Usuario creado, pero hubo un error al dar de alta el legajo del empleado.');
        }
      } else {
        alert('Error al registrar el usuario en el servidor.');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      alert('No se pudo establecer comunicación con el backend (puerto 8080).');
    }
  };

  const handleCerrarModalExito = () => {
    setMostrarModalExito(false);
    onVolver();
  };

  return (
    <div className="container-fluid min-vh-100 py-4 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#18181b' }}>
      
      {/* FORMULARIO PRINCIPAL: REGISTRO DE USUARIO (DATOS PERSONALES) */}
      <div className="w-100 p-4 rounded-4 position-relative" style={{ maxWidth: '750px', backgroundColor: '#1e1e22', border: '1px solid #3f3f46' }}>
        
        {/* Marca de agua de fondo */}
        <div className="position-absolute top-50 start-50 translate-middle opacity-5 text-center pointer-events-none" style={{ zIndex: 0 }}>
          <h1 style={{ fontSize: '10rem' }}>{"{G}"}</h1>
        </div>

        <div className="position-relative" style={{ zIndex: 1 }}>
          <form onSubmit={handleSiguiente}>
            <h3 className="text-white text-center mb-4 fw-semibold">Registro de Usuario</h3>
            
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-light">Nombre:</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label text-light">Apellido:</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} required />
              </div>

              <div className="col-md-6">
                <label className="form-label text-light">Tipo de Documento:</label>
                <select className="form-select bg-dark text-white border-secondary" value={tipoDocumento} onChange={e => setTipoDocumento(e.target.value)} required>
                  <option value="">Seleccione Un Tipo</option>
                  <option value="1">DNI</option>
                  <option value="2">Pasaporte</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label text-light">N° de Documento:</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="N° de Documento" value={numeroDocumento} onChange={e => setNumeroDocumento(e.target.value)} required />
              </div>

              <div className="col-md-6">
                <label className="form-label text-light">Email:</label>
                <input type="email" className="form-control bg-dark text-white border-secondary" placeholder="Email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label text-light">Teléfono:</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
              </div>

              <div className="col-md-8">
                <label className="form-label text-light">Calle:</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Calle" value={calle} onChange={e => setCalle(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label text-light">Número:</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Número" value={numero} onChange={e => setNumero(e.target.value)} required />
              </div>

              <div className="col-md-6">
                <label className="form-label text-light">Piso:</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Piso (opcional)" value={piso} onChange={e => setPiso(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label text-light">Departamento:</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Departamento (Opcional)" value={depto} onChange={e => setDepto(e.target.value)} />
              </div>

              <div className="col-md-6">
                <label className="form-label text-light">Cód.Postal:</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Código Postal" value={codPostal} onChange={e => setCodPostal(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label text-light">Ciudad:</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Ciudad (Opcional)" value={ciudad} onChange={e => setCiudad(e.target.value)} />
              </div>

              <div className="col-md-6">
                <label className="form-label text-light">Provincia:</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Provincia (Opcional)" value={provincia} onChange={e => setProvincia(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label text-light">País:</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="País (Opcional)" value={pais} onChange={e => setPais(e.target.value)} />
              </div>
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button type="button" className="btn btn-danger px-5" onClick={onVolver} style={{ backgroundColor: '#a13b3b', border: 'none' }}>Volver</button>
              <button type="submit" className="btn btn-success px-5" style={{ backgroundColor: '#3b7a44', border: 'none' }}>Siguiente</button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL CHICO: DATOS ESPECÍFICOS DEL EMPLEADO */}
      {mostrarModalEmpleado && (
        <div className="modal d-block position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1040 }}>
          <div className="modal-dialog w-100 p-3" style={{ maxWidth: '440px' }}>
            <div className="modal-content p-4 rounded-4 border-secondary position-relative" style={{ backgroundColor: '#1e1e22', border: '1px solid #3f3f46' }}>
              
              {/* Marca de agua interna chica */}
              <div className="position-absolute top-50 start-50 translate-middle opacity-5 text-center pointer-events-none" style={{ zIndex: 0 }}>
                <h1 style={{ fontSize: '6rem' }}>{"{G}"}</h1>
              </div>

              <div className="position-relative" style={{ zIndex: 1 }}>
                <form onSubmit={handleRegistrarTodo}>
                  <h4 className="text-white text-center mb-4 fw-semibold">Datos Específicos del Empleado</h4>
                  
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label text-light small">Usuario:</label>
                      <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Ingrese un Nombre de Usuario" value={nombreUsuario} onChange={e => setNombreUsuario(e.target.value)} required />
                    </div>

                    <div className="col-12">
                      <label className="form-label text-light small">Contraseña:</label>
                      <input type="password" className="form-control bg-dark text-white border-secondary" placeholder="Ingrese una Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    <div className="col-12">
                      <label className="form-label text-light small">Fecha de Contratación:</label>
                      <input type="date" className="form-control bg-dark text-white border-secondary" value={fechaContratacion} onChange={e => setFechaContratacion(e.target.value)} required />
                    </div>

                    <div className="col-12">
                      <label className="form-label text-light small">Cargo:</label>
                      {/* SOLUCIONADO: Ahora se pasa e.target.value correctamente */}
                      <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Ingrese el Cargo" value={cargo} onChange={e => setCargo(e.target.value)} required />
                    </div>

                    <div className="col-12 mb-4">
                      <label className="form-label text-light small">Salario:</label>
                      <input type="number" step="0.01" className="form-control bg-dark text-white border-secondary" placeholder="Ingrese el Salario" value={salario} onChange={e => setSalario(e.target.value)} required />
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2 mt-2">
                    <button type="submit" className="btn btn-success w-100 py-2 fw-semibold" style={{ backgroundColor: '#3b7a44', border: 'none' }}>Registrar Nuevo Empleado</button>
                    <button type="button" className="btn btn-danger w-100 py-2" onClick={() => setMostrarModalEmpleado(false)} style={{ backgroundColor: '#a13b3b', border: 'none' }}>Volver</button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL CHICO: MENSAJE DE ÉXITO */}
      {mostrarModalExito && (
        <div className="modal d-block position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
          <div className="modal-dialog w-100 p-3" style={{ maxWidth: '420px' }}>
            <div className="modal-content border-0 p-4 text-center text-white" style={{ backgroundColor: '#1e1e22', borderRadius: '12px', borderLeft: '4px solid #a855f7', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
              <h4 className="fw-bold mb-3">¡Usuario Registrado Correctamente!</h4>
              <p className="text-secondary small mb-4">
                Su Usuario ha sido Registrado. Una vez Activado en el panel de Gestión de Usuarios podrá Ingresar al Sistema con sus Credenciales.
              </p>
              <button className="btn btn-danger w-100 py-2" style={{ backgroundColor: '#a13b3b', border: 'none', borderRadius: '8px' }} onClick={handleCerrarModalExito}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};