import React, { useState } from 'react';
import { PersonaForm } from '../../features/auth/PersonaForm';
import { EmpleadoModal } from '../../features/auth/EmpleadoModal';
import { ExitoModal } from '../../features/auth/ExitoModal';
import type { Usuario } from '../../types/Usuario';
import logoGestaG from '../../assets/logo-gestaprog.png';

interface RegisterViewProps {
  onVolver: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onVolver }) => {
  const [personaData, setPersonaData] = useState({
    nombre: '', apellido: '', tipoDocumento: '', numeroDocumento: '',
    email: '', telefono: '', calle: '', numero: '', piso: '',
    depto: '', codPostal: '', ciudad: '', provincia: '', pais: ''
  });

  const [empleadoData, setEmpleadoData] = useState({
    nombreUsuario: '', password: '', fechaContratacion: '', cargo: '', salario: ''
  });

  const [mostrarModalEmpleado, setMostrarModalEmpleado] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  // Nuevo estado para el mensaje dinámico
  const [mensajeExito, setMensajeExito] = useState('');

  const handleSiguiente = (e: React.FormEvent) => {
    e.preventDefault();
    setMostrarModalEmpleado(true);
  };

  const handleRegistrarTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    const nuevoUsuario: Usuario = {
      nombreUsuario: empleadoData.nombreUsuario,
      password: empleadoData.password,
      rol: { idRol: 2 },
      persona: {
        nombre: personaData.nombre,
        apellido: personaData.apellido,
        numeroDocumento: personaData.numeroDocumento,
        telefono: personaData.telefono,
        email: personaData.email,
        tipoDocumento: { idTipoDocumento: parseInt(personaData.tipoDocumento) || 1 },
        tipoPersona: { idTipoPersona: 1 },
        direccion: {
          calle: personaData.calle,
          numero: personaData.numero,
          piso: personaData.piso || null,
          departamento: personaData.depto || null,
          codigoPostal: personaData.codPostal,
          ciudad: personaData.ciudad || 'Santa Fe',
          provincia: personaData.provincia || 'Santa Fe',
          pais: personaData.pais || 'Argentina'
        }
      }
    };

    try {
      const responseUsuario = await fetch('http://localhost:8080/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      });

      if (responseUsuario.ok) {
        const usuarioGuardado: Usuario = await responseUsuario.json();

        const fechaISO = empleadoData.fechaContratacion 
          ? empleadoData.fechaContratacion 
          : new Date().toISOString().split('T')[0];

        const nuevoEmpleado = {
          fechaContratacion: fechaISO,
          cargo: empleadoData.cargo || 'OPERARIO',
          salario: parseFloat(empleadoData.salario) || 0.0,
          estado: 'Activo',
          persona: { idPersona: usuarioGuardado.persona?.idPersona }
        };

        const responseEmpleado = await fetch('http://localhost:8080/api/empleados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoEmpleado)
        });

        if (responseEmpleado.ok) {
          // CORRECCIÓN 5: Detectamos si es Admin y cambiamos el mensaje.
          const esPrimerAdmin = usuarioGuardado.rol?.nombreRol === 'ADMIN' || usuarioGuardado.rol?.idRol === 1;
          
          if (esPrimerAdmin) {
            setMensajeExito("¡Felicidades! Al ser el primer registro del sistema, fuiste configurado como ADMINISTRADOR (Dueño). Ya puedes iniciar sesión.");
          } else {
            setMensajeExito("Su Usuario ha sido Registrado exitosamente. Una vez verificado podrá Ingresar al Sistema con sus Credenciales.");
          }
          
          setMostrarModalEmpleado(false);
          setMostrarModalExito(true);
        } else {
          alert('Usuario creado, pero falló el alta del legajo de empleado.');
        }
      } else {
        alert('Error al registrar el usuario en el backend.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red con el puerto 8080.');
    }
  };

  return (
    <div 
  className="container-fluid min-vh-100 d-flex justify-content-center align-items-center" 
  style={{ background: 'linear-gradient(145deg, #240f47 20%, #0c0c0e 80%)', minHeight: '100vh' }}>
      
      <div className="w-100 p-4 rounded-3 position-relative" 
           style={{ maxWidth: '750px', backgroundColor: '#1a1a1c', border: '1px solid #3f3f46' }}>
        
        <div className="position-absolute top-50 start-50 translate-middle opacity-10" style={{ zIndex: 0 }}>
          <img src={logoGestaG} alt="GestaPro" style={{ width: '360px' }} />
        </div>

        <div className="position-relative" style={{ zIndex: 1 }}>
          <PersonaForm 
            formData={personaData} 
            setFormData={setPersonaData} 
            onSiguiente={() => setMostrarModalEmpleado(true)} 
            onVolver={onVolver} 
            titulo="Registrar Nuevo Usuario"
          />
        </div>
      </div>

      {mostrarModalEmpleado && (
        <EmpleadoModal 
          formData={empleadoData} 
          setFormData={setEmpleadoData} 
          onRegistrar={handleRegistrarTodo} 
          onCerrar={() => setMostrarModalEmpleado(false)} 
        />
      )}

      {mostrarModalExito && (
        <ExitoModal 
          message={mensajeExito} 
          onAceptar={() => { setMostrarModalExito(false); onVolver(); }} 
        />
      )}
    </div>
  );
};