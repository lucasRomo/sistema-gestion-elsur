import type { Maquina } from '../types/Maquina';

const API_MAQUINAS = 'http://localhost:8080/api/maquinas';
const API_INCIDENCIAS = 'http://localhost:8080/api/incidencias';

export const getUsuarioActualId = (): number => {
  const usrStr = localStorage.getItem('usuario_logueado');
  if (usrStr) {
    try {
      const obj = JSON.parse(usrStr);
      return obj.idEmpleado || obj.idUsuario || obj.id_usuario || 1;
    } catch (e) {
      return 1;
    }
  }
  return 1;
};

export const fetchMaquinas = async (): Promise<Maquina[]> => {
  const res = await fetch(API_MAQUINAS);
  if (!res.ok) throw new Error('Error al cargar máquinas');
  return res.json();
};

export const guardarMaquinaAPI = async (maquina: Maquina & { observacion?: string }): Promise<void> => {
  const url = maquina.idMaquina ? `${API_MAQUINAS}/${maquina.idMaquina}` : API_MAQUINAS;
  const method = maquina.idMaquina ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idMaquina: maquina.idMaquina,
      nombre: maquina.nombre,
      estado: maquina.estado
    })
  });

  if (!res.ok) throw new Error('No se pudo procesar la solicitud de la máquina.');

  // Sincronización con incidencias según observación
  if (maquina.idMaquina && maquina.observacion) {
    try {
      const incRes = await fetch(`${API_INCIDENCIAS}/maquina/${maquina.idMaquina}`);
      if (incRes.ok) {
        const incidencias: any[] = await incRes.json();
        const pendiente = incidencias.find((i: any) => i.estadoIncidencia === 'PENDIENTE');

        if (maquina.estado === 'OPERATIVA' && pendiente) {
          await fetch(`${API_INCIDENCIAS}/${pendiente.idIncidencia}/resolver`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              resolucion: maquina.observacion,
              idEmpleadoResuelve: getUsuarioActualId()
            })
          });
        } else if (maquina.estado === 'MANTENIMIENTO' && !pendiente) {
          await fetch(`${API_INCIDENCIAS}/reportar`, {
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
          await fetch(`${API_INCIDENCIAS}/reportar`, {
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
  const res = await fetch(`${API_INCIDENCIAS}/reportar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      idMaquina, 
      descripcion, 
      prioridad,
      idEmpleadoReporta: getUsuarioActualId()
    })
  });

  if (!res.ok) throw new Error('Error al reportar la incidencia.');
};

export const eliminarMaquinaAPI = async (id: number): Promise<void> => {
  const res = await fetch(`${API_MAQUINAS}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar la máquina.');
};