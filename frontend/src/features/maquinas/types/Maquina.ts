export interface Maquina {
  idMaquina?: number;
  nombre: string;
  estado: 'OPERATIVA' | 'FALLA' | 'FUERA DE SERVICIO' | 'MANTENIMIENTO' | string;
  activo?: boolean;
}