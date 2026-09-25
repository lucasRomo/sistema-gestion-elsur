import type { Persona } from './Persona';
import type { Rol } from './Rol';

export interface Usuario {
    idUsuario?: number;
    nombreUsuario: string;
    password?: string;
    persona: Persona;
    rol: Rol;
    salario?: number;
    estado?: string;
    cargo?: string;
    fechaContratacion?: string;
    tienePermisosPersonalizados?: boolean;
}