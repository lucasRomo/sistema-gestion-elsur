export interface RegistroActividad {
  idRegAct: number;
  fecha: string;
  usuario?: {
    idUsuario: number;
    nombreUsuario: string;
    persona?: {
      nombre: string;
      apellido: string;
    };
  };
  accion: string;
  tablaAfectada: string;
  columnaAfectada: string;
  idRegistroMod: number;
  datosAnteriores: string | null;
  datosNuevos: string | null;
}