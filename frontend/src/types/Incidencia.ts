export interface Incidencia {
  idIncidencia?: number;
  maquina?: { idMaquina: number; nombre: string };
  descripcion: string;
  prioridad?: string;
  estadoIncidencia?: 'PENDIENTE' | 'RESUELTA';
  fechaReporte?: string;
  resolucion?: string;
  fechaResolucion?: string;
  empleadoReporta?: { idEmpleado: number; persona?: { nombre: string; apellido: string } };
  empleadoResuelve?: { idEmpleado: number; persona?: { nombre: string; apellido: string } };
}