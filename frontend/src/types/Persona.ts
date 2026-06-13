// src/types/Persona.ts
// src/types/Persona.ts
import type { Direccion } from './Direccion';
import type { TipoDocumento } from './TipoDocumento';
import type { TipoPersona } from './TipoPersona';

export interface Persona {
    idPersona?: number;
    nombre: string;
    apellido: string;
    numeroDocumento: string;
    telefono: string;
    email: string;
    tipoDocumento: TipoDocumento;
    direccion: Direccion;
    tipoPersona: TipoPersona;
}