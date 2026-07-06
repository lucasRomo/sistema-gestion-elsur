// src/types/Usuario.ts
// src/types/Usuario.ts
import type { Persona } from './Persona';
import type { Rol } from './Rol';

export interface Usuario {
    idUsuario?: number;
    nombreUsuario: string;
    password?: string; // Mapea a 'contrasena' mediante JPA en tu back
    persona: Persona;
    rol: Rol;
}