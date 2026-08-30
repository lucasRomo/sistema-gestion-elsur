import { useState, useEffect } from 'react';
import { configuracionService } from '../services/configuracionService';
import type { RespaldoLog } from '../services/configuracionService';

export const useConfiguracion = () => {
  const [opcionPerfil, setOpcionPerfil] = useState<'usuario' | 'password' | 'email'>('password');
  
  const usuarioGuardado = localStorage.getItem('usuario_logueado');
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const token = localStorage.getItem('token') || '';

  // Estados Perfil
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [mensajePass, setMensajePass] = useState<{ texto: string; tipo: 'error' | 'exito' } | null>(null);
  const [cargandoPass, setCargandoPass] = useState(false);

  const [datosUsuario, setDatosUsuario] = useState({ actual: usuario?.nombreUsuario || '', nuevo: '' });
  const [mensajeUsuario, setMensajeUsuario] = useState<{ texto: string; tipo: 'error' | 'exito' } | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(false);

  const [datosEmail, setDatosEmail] = useState({ actual: usuario?.persona?.email || '', nuevo: '' });
  const [mensajeEmail, setMensajeEmail] = useState<{ texto: string; tipo: 'error' | 'exito' } | null>(null);
  const [cargandoEmail, setCargandoEmail] = useState(false);

  // Estado Modal de Confirmación para cambios de Perfil
  const [modalConfirmacionPerfil, setModalConfirmacionPerfil] = useState<{
    mostrar: boolean;
    titulo: string;
    mensaje: string;
    onConfirm: () => void;
  } | null>(null);

  // Estados Respaldos
  const [historialRespaldos, setHistorialRespaldos] = useState<RespaldoLog[]>([]);
  const [cargandoRespaldo, setCargandoRespaldo] = useState(false);
  const [mensajeRespaldo, setMensajeRespaldo] = useState<{ texto: string; tipo: 'error' | 'exito' } | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [cargandoRestaurar, setCargandoRestaurar] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);

  useEffect(() => {
  const rolNombre = typeof usuario?.rol === 'string' 
    ? usuario.rol 
    : usuario?.rol?.nombreRol || usuario?.rol?.nombre || '';

  const esAdmin = rolNombre.toString().toUpperCase() === 'ADMIN';

  if (token && esAdmin) {
    cargarHistorialRespaldos();
  }
}, []);

  const cargarHistorialRespaldos = async () => {
    try {
      const data = await configuracionService.getHistorialRespaldos(token);
      setHistorialRespaldos(data);
    } catch (error) {
      console.error("Error al cargar historial de respaldos:", error);
    }
  };

  // --- EJECUCIONES Y HANDLERS DE PERFIL ---

  const ejecutarCambioPassword = async () => {
    setModalConfirmacionPerfil(null);
    setCargandoPass(true);
    try {
      const response = await configuracionService.cambiarPassword(usuario?.idUsuario || 1, token, passwords);
      if (response.ok) {
        setMensajePass({ texto: '¡Contraseña actualizada con éxito!', tipo: 'exito' });
        setPasswords({ actual: '', nueva: '', confirmar: '' });
      } else {
        const err = await response.text();
        setMensajePass({ texto: err || 'Error al cambiar la contraseña.', tipo: 'error' });
      }
    } catch {
      setMensajePass({ texto: 'Error de conexión con el backend.', tipo: 'error' });
    } finally {
      setCargandoPass(false);
    }
  };

  const handleCambiarPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMensajePass(null);
    if (!passwords.actual || !passwords.nueva || !passwords.confirmar) {
      setMensajePass({ texto: 'Por favor completa todos los campos.', tipo: 'error' });
      return;
    }
    if (passwords.nueva !== passwords.confirmar) {
      setMensajePass({ texto: 'Las nuevas contraseñas no coinciden.', tipo: 'error' });
      return;
    }

    setModalConfirmacionPerfil({
      mostrar: true,
      titulo: 'Confirmar Cambio de Contraseña',
      mensaje: '¿Estás seguro de que deseas actualizar tu contraseña?',
      onConfirm: ejecutarCambioPassword
    });
  };

  const ejecutarCambioUsuario = async () => {
    setModalConfirmacionPerfil(null);
    setCargandoUsuario(true);
    try {
      const response = await configuracionService.cambiarUsuario(usuario?.idUsuario || 1, token, datosUsuario);
      if (response.ok) {
        setMensajeUsuario({ texto: '¡Nombre de usuario actualizado!', tipo: 'exito' });
        if (usuario) {
          usuario.nombreUsuario = datosUsuario.nuevo;
          localStorage.setItem('usuario_logueado', JSON.stringify(usuario));
        }
        setDatosUsuario({ actual: datosUsuario.nuevo, nuevo: '' });
      } else {
        const errText = await response.text();
        setMensajeUsuario({ texto: errText || 'Error al actualizar usuario.', tipo: 'error' });
      }
    } catch {
      setMensajeUsuario({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    } finally {
      setCargandoUsuario(false);
    }
  };

  const handleCambiarUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeUsuario(null);
    if (!datosUsuario.actual.trim() || !datosUsuario.nuevo.trim()) {
      setMensajeUsuario({ texto: 'Completa ambos campos de usuario.', tipo: 'error' });
      return;
    }

    setModalConfirmacionPerfil({
      mostrar: true,
      titulo: 'Confirmar Cambio de Usuario',
      mensaje: `¿Estás seguro de que deseas cambiar tu nombre de usuario a "${datosUsuario.nuevo}"?`,
      onConfirm: ejecutarCambioUsuario
    });
  };

  const ejecutarCambioEmail = async () => {
    setModalConfirmacionPerfil(null);
    setCargandoEmail(true);
    try {
      const response = await configuracionService.cambiarEmail(usuario?.idUsuario || 1, token, datosEmail);
      if (response.ok) {
        setMensajeEmail({ texto: '¡Email actualizado con éxito!', tipo: 'exito' });
        if (usuario?.persona) {
          usuario.persona.email = datosEmail.nuevo;
          localStorage.setItem('usuario_logueado', JSON.stringify(usuario));
        }
        setDatosEmail({ actual: datosEmail.nuevo, nuevo: '' });
      } else {
        const errText = await response.text();
        setMensajeEmail({ texto: errText || 'Error al actualizar email.', tipo: 'error' });
      }
    } catch {
      setMensajeEmail({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    } finally {
      setCargandoEmail(false);
    }
  };

  const handleCambiarEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeEmail(null);
    if (!datosEmail.actual.trim() || !datosEmail.nuevo.trim() || !datosEmail.nuevo.includes('@')) {
      setMensajeEmail({ texto: 'Ingresa un correo electrónico válido.', tipo: 'error' });
      return;
    }

    setModalConfirmacionPerfil({
      mostrar: true,
      titulo: 'Confirmar Cambio de Email',
      mensaje: `¿Estás seguro de que deseas cambiar tu correo electrónico a "${datosEmail.nuevo}"?`,
      onConfirm: ejecutarCambioEmail
    });
  };

  const handleGenerarRespaldo = async () => {
    setCargandoRespaldo(true);
    setMensajeRespaldo(null);
    try {
      const response = await configuracionService.generarRespaldo(usuario?.nombreUsuario || 'Operario', token);
      if (!response.ok) throw new Error();
      setMensajeRespaldo({ texto: 'Respaldo generado correctamente.', tipo: 'exito' });
      cargarHistorialRespaldos();
    } catch {
      setMensajeRespaldo({ texto: 'No se pudo generar el respaldo.', tipo: 'error' });
    } finally {
      setCargandoRespaldo(false);
    }
  };

  const handleDescargarRespaldoHistorial = async (idRespaldo: number, nombreArchivo: string) => {
    try {
      const blob = await configuracionService.descargarRespaldo(idRespaldo, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No se pudo descargar el archivo seleccionado.");
    }
  };

  const handleEliminarRespaldo = async (idRespaldo: number) => {
    if (!window.confirm("¿Deseas eliminar este respaldo?")) return;
    try {
      const response = await configuracionService.eliminarRespaldo(idRespaldo, token);
      if (response.ok) {
        setMensajeRespaldo({ texto: 'Respaldo eliminado con éxito.', tipo: 'exito' });
        cargarHistorialRespaldos();
      }
    } catch {
      setMensajeRespaldo({ texto: 'Error al eliminar el respaldo.', tipo: 'error' });
    }
  };

  const ejecutarRestauracion = async () => {
    setMostrarModalConfirmacion(false);
    setCargandoRestaurar(true);
    setMensajeRespaldo(null);
    const formData = new FormData();
    if (archivoSeleccionado) formData.append('archivo', archivoSeleccionado);

    try {
      const response = await configuracionService.restaurarRespaldo(formData, token);
      if (response.ok) {
        setMensajeRespaldo({ texto: '¡Base de datos restaurada con éxito!', tipo: 'exito' });
        setArchivoSeleccionado(null);
      } else {
        const errorText = await response.text();
        setMensajeRespaldo({ texto: `Error al restaurar: ${errorText}`, tipo: 'error' });
      }
    } catch {
      setMensajeRespaldo({ texto: 'Error de conexión al restaurar.', tipo: 'error' });
    } finally {
      setCargandoRestaurar(false);
    }
  };

  return {
    usuario,
    opcionPerfil, setOpcionPerfil,
    passwords, setPasswords, mensajePass, cargandoPass, handleCambiarPassword,
    datosUsuario, setDatosUsuario, mensajeUsuario, cargandoUsuario, handleCambiarUsuario,
    datosEmail, setDatosEmail, mensajeEmail, cargandoEmail, handleCambiarEmail,
    modalConfirmacionPerfil, setModalConfirmacionPerfil,
    historialRespaldos, cargandoRespaldo, mensajeRespaldo, archivoSeleccionado, setArchivoSeleccionado,
    cargandoRestaurar, mostrarModalConfirmacion, setMostrarModalConfirmacion,
    handleGenerarRespaldo, handleDescargarRespaldoHistorial, handleEliminarRespaldo, ejecutarRestauracion
  };
};