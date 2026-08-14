import { useState } from 'react';
import type { Usuario } from '../../../types/Usuario';

export const useRegister = () => {
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
  const [mensajeExito, setMensajeExito] = useState('');

  const abrirModalEmpleado = () => setMostrarModalEmpleado(true);
  const cerrarModalEmpleado = () => setMostrarModalEmpleado(false);
  const cerrarModalExito = () => setMostrarModalExito(false);

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

        const esPrimerAdmin = usuarioGuardado.rol?.idRol === 1 || usuarioGuardado.rol?.nombreRol === 'ADMIN';

        const fechaISO = empleadoData.fechaContratacion 
          ? empleadoData.fechaContratacion 
          : new Date().toISOString().split('T')[0];

        const nuevoEmpleado = {
          fechaContratacion: fechaISO,
          cargo: esPrimerAdmin ? 'ADMINISTRADOR' : (empleadoData.cargo || 'OPERARIO'),
          salario: parseFloat(empleadoData.salario) || 0.0,
          estado: esPrimerAdmin ? 'Activo' : 'Pendiente',
          persona: { idPersona: usuarioGuardado.persona?.idPersona }
        };

        const responseEmpleado = await fetch('http://localhost:8080/api/empleados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoEmpleado)
        });

        if (responseEmpleado.ok) {
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
        const mensajeError = await responseUsuario.text();

        if (responseUsuario.status === 409) {
          alert(mensajeError);
        } else {
          alert('Error al registrar el usuario en el backend.');
        }
      }
    } catch (error) {
      console.error(error);
      alert('Error de red con el puerto 8080.');
    }
  };

  return {
    personaData,
    setPersonaData,
    empleadoData,
    setEmpleadoData,
    mostrarModalEmpleado,
    abrirModalEmpleado,
    cerrarModalEmpleado,
    mostrarModalExito,
    cerrarModalExito,
    mensajeExito,
    handleRegistrarTodo
  };
};