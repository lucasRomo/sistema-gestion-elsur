export interface Direccion {
    idDireccion?: number; 
    calle: string;
    numero: string;
    piso?: string | null;
    departamento?: string | null;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string;
}