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

  // NUEVO (Bug 3): reemplaza los alert() nativos de este flujo por un modal
  // con el estilo propio de la app (ver ErrorModal.tsx).
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

    // CORREGIDO (Bug 1 -- "se creó el usuario con éxito pero se produjo un
    // error en el legajo de empleado"): antes esto hacía DOS POST separados
    // (uno a /usuarios, otro a /empleados). El problema es que el token del
    // "portón" (con el que se registra el primer usuario del sistema, antes de
    // poder loguearse) solo autoriza altas mientras la tabla usuario esté
    // vacía -- y esa ventana se cierra apenas el PRIMER POST se completa. El
    // segundo POST a /empleados llegaba siempre con la ventana ya cerrada y
    // fallaba con un 403, sin ninguna excepción de por medio: por eso el
    // mensaje "se creó el usuario, pero falló el legajo" salía SIEMPRE, no de
    // vez en cuando. Ahora se manda todo en un único POST /usuarios: el
    // backend (ver UsuarioServiceImpl.guardar()) ya tenía un bloque que crea
    // el Empleado asociado en la misma transacción cuando el Usuario trae
    // salario/cargo/estado/fechaContratacion -- estos campos son @Transient en
    // la entidad Usuario, existen para reusarse acá.
    const nuevoUsuario: Usuario = {
      nombreUsuario: empleadoData.nombreUsuario,
      password: empleadoData.password,
      rol: { idRol: 2 },
      // El cargo definitivo para el primer usuario del sistema (ADMINISTRADOR)
      // y el estado (Activo/Pendiente) los decide el backend según corresponda
      // -- acá solo se manda lo que el usuario cargó en el formulario.
      cargo: empleadoData.cargo || undefined,
      salario: parseFloat(empleadoData.salario) || 0,
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
        // Antes: "await responseUsuario.text()" mostraba tal cual el JSON crudo que
        // devuelve GlobalExceptionHandler (ej. {"timestamp":...,"mensaje":"El nombre de
        // usuario ya está en uso",...}) en el alert de un 409 -- mismo problema ya
        // resuelto en el resto de los services esta sesión; acá faltaba.
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
