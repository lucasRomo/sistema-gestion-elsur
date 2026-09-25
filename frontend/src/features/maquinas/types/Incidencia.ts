import type { Empleado } from '../../../types/Empleado';

export interface Incidencia {
  idIncidencia?: number;
  descripcion: string;
  notaMantenimiento?: string;
  fechaMantenimiento?: string;
  empleadoMantenimiento?: Empleado;
  resolucion?: string;
  estadoIncidencia?: string;
  prioridad?: string;
  fechaReporte?: string;
  fechaResolucion?: string;
  empleadoReporta?: Empleado;
  empleadoResuelve?: Empleado;
  pagado?: boolean;
  montoPagado?: number;
}