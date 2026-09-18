import type { Maquina } from '../types/Maquina';
import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../config/api';

const API_MAQUINAS = `${API_BASE_URL}/maquinas`;
const API_INCIDENCIAS = `${API_BASE_URL}/incidencias`;

// CORREGIDO: se quitó el fallback silencioso a "1" (atribuía incidencias a un
// usuario/empleado arbitrario cuando no había sesión reconocible). Ahora, si no se
// puede determinar el id, se devuelve undefined y el campo queda sin enviar en vez
// de mandar un id inventado. NOTA: esta función sigue mezclando dos espacios de id
// distintos (idEmpleado vs idUsuario) como si fueran intercambiables -- eso es un
// problema aparte del módulo de Incidencias/Empleados, fuera del alcance de este
// pase sobre Clientes/Proveedores/Máquinas.
export const getUsuarioActualId = (): number | undefined => {
  const usrStr = localStorage.getItem('usuario_logueado');
  if (usrStr) {
    try {
      const obj = JSON.parse(usrStr);
      return obj.idEmpleado || obj.idUsuario || obj.id_usuario || undefined;
    } catch (e) {
      return undefined;
    }
  }
  return undefined;
};

export const fetchMaquinas = async (): Promise<Maquina[]> => {
  const res = await apiFetch(API_MAQUINAS);
  if (!res.ok) throw new Error('Error al cargar máquinas');
  return res.json();
};

export const guardarMaquinaAPI = async (maquina: Maquina & { observacion?: string }): Promise<void> => {
  // CORREGIDO: nunca se enviaba idUsuario al backend, así que el 100% de las
  // altas/ediciones de máquinas quedaban mal atribuidas en el historial (el service
  // caía en el fallback de "primer usuario de la base"). Se replica el mismo patrón
  // ya usado en clienteService.ts / proveedorService.ts.
  const usuarioGuardado = localStorage.getItem('usuario_logueado');
  const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const idUsuarioActual = usuarioObj?.idUsuario || usuarioObj?.id_usuario;

  const baseUrl = maquina.idMaquina ? `${API_MAQUINAS}/${maquina.idMaquina}` : API_MAQUINAS;
  const url = idUsuarioActual ? `${baseUrl}?idUsuario=${idUsuarioActual}` : baseUrl;
  const method = maquina.idMaquina ? 'PUT' : 'POST';

  const res = await apiFetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idMaquina: maquina.idMaquina,
      nombre: maquina.nombre,
      estado: maquina.estado,
      activo: maquina.activo ?? true
    })
  });

  if (!res.ok) {
    throw new Error(await extraerMensajeError(res, 'No se pudo procesar la solicitud de la máquina.'));
  }

  if (maquina.idMaquina && maquina.observacion) {
    try {
      const incRes = await apiFetch(`${API_INCIDENCIAS}/maquina/${maquina.idMaquina}`);
      if (incRes.ok) {
        const incidencias: any[] = await incRes.json();
        const pendiente = incidencias.find((i: any) => i.estadoIncidencia === 'PENDIENTE');

        if (maquina.estado === 'OPERATIVA' && pendiente) {
          await apiFetch(`${API_INCIDENCIAS}/${pendiente.idIncidencia}/resolver`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              resolucion: maquina.observacion,
              idEmpleadoResuelve: getUsuarioActualId()
            })
          });
        } else if (maquina.estado === 'MANTENIMIENTO' && !pendiente) {
          await apiFetch(`${API_INCIDENCIAS}/reportar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idMaquina: maquina.idMaquina,
              descripcion: `[MANTENIMIENTO PROGRAMADO] ${maquina.observacion}`,
              prioridad: 'MEDIA',
              idEmpleadoReporta: getUsuarioActualId()
            })
          });
        } else if (['FUERA DE SERVICIO', 'FALLA'].includes(maquina.estado) && !pendiente) {
          await apiFetch(`${API_INCIDENCIAS}/reportar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idMaquina: maquina.idMaquina,
              descripcion: `[${maquina.estado}] ${maquina.observacion}`,
              prioridad: 'ALTA',
              idEmpleadoReporta: getUsuarioActualId()
            })
          });
        }
      }
    } catch (err) {
      console.error('Error al sincronizar historial:', err);
    }
  }
};

export const reportarFallaAPI = async (idMaquina: number, descripcion: string, prioridad: string): Promise<void> => {
  const res = await apiFetch(`${API_INCIDENCIAS}/reportar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      idMaquina, 
      descripcion, 
      prioridad,
      idEmpleadoReporta: getUsuarioActualId()
    })
  });

  if (!res.ok) {
    throw new Error(await extraerMensajeError(res, 'Error al reportar la incidencia.'));
  }
};

export const eliminarMaquinaAPI = async (id: number): Promise<void> => {
  const res = await apiFetch(`${API_MAQUINAS}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(await extraerMensajeError(res, 'Error al eliminar la máquina.'));
  }
};