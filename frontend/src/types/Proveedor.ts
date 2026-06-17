import type { Direccion } from './Direccion';
import type { TipoProveedor } from './TipoProveedor';

export interface Proveedor {
    idProveedor?: number;
    nombreComercial: string;
    contactoNombre: string;
    emailContacto: string;
    estado: string;
    direccion?: Direccion;
    tipoProveedor?: TipoProveedor;
}