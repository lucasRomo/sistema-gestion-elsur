export interface Persona {
  idPersona?: number;
  nombre: string;
  apellido: string;
}

export interface Empleado {
  idEmpleado: number;
  persona?: Persona;
  cargo?: string;
}

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