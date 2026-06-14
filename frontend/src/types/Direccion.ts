// src/types/Direccion.ts
export interface Direccion {
    idDireccion?: number; // Opcional porque lo autogenera la BD al insertar
    calle: string;
    numero: string;
    piso?: string | null;
    departamento?: string | null;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string; // Por defecto "Argentina" en tu back
}