export interface Direccion {
  idDireccion?: number;
  calle: string;
  numero: string;
  piso?: string;
  departamento?: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  pais?: string;
}

export interface TipoProveedor {
  idTipoProveedor: number;
  descripcion: string;
}

export interface Proveedor {
  idProveedor?: number;
  nombreComercial: string;
  contactoNombre: string;
  emailContacto: string;
  estado: string;
  direccion?: Direccion;
  tipoProveedor?: TipoProveedor;
}