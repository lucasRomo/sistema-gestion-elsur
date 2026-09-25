import { useState } from 'react';
import type { Usuario } from '../../../types/Usuario';
import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../config/api'; // Ajustá la profundidad si tus carpetas difieren

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

  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  const abrirModalEmpleado = () => setMostrarModalEmpleado(true);
  const cerrarModalEmpleado = () => setMostrarModalEmpleado(false);
  const cerrarModalExito = () => setMostrarModalExito(false);
  const cerrarModalError = () => setMostrarModalError(false);

  const mostrarError = (mensaje: string) => {
    setMensajeError(mensaje);
    setMostrarModalError(true);
  };

  const handleRegistrarTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    const salarioNumerico = parseFloat(empleadoData.salario);
    if (isNaN(salarioNumerico)) {
      mostrarError('Por favor ingresá un salario numérico válido.');
      return;
    }

    const nuevoUsuario: Usuario = {
      nombreUsuario: empleadoData.nombreUsuario,
      password: empleadoData.password,
      rol: { idRol: 2 },
      cargo: empleadoData.cargo || undefined,
      salario: salarioNumerico,
      fechaContratacion: empleadoData.fechaContratacion || new Date().toISOString().split('T')[0],
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
      const responseUsuario = await apiFetch('/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      });

      if (responseUsuario.ok) {
        const usuarioGuardado: Usuario = await responseUsuario.json();

        const esPrimerAdmin = usuarioGuardado.rol?.idRol === 1 || usuarioGuardado.rol?.nombreRol === 'ADMIN';

        if (esPrimerAdmin) {
          setMensajeExito("¡Felicidades! Al ser el primer registro del sistema, fuiste configurado como ADMINISTRADOR (Dueño). Ya puedes iniciar sesión.");
        } else {
          setMensajeExito("Su Usuario ha sido Registrado exitosamente. Una vez verificado podrá Ingresar al Sistema con sus Credenciales.");
        }

        setMostrarModalEmpleado(false);
        setMostrarModalExito(true);
      } else {
        const mensaje = await extraerMensajeError(
          responseUsuario,
          'Error al registrar el usuario en el backend.'
        );
        mostrarError(mensaje);
      }
    } catch (error) {
      console.error(error);
      mostrarError('Error de red al conectar con el servidor.');
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
    mostrarModalError,
    cerrarModalError,
    mensajeError,
    handleRegistrarTodo
  };
};
