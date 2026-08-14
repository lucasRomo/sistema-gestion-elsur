export interface Institucion {
  idInstitucion: number;
  nombreInstitucion: string;
  tipoInstitucion?: string;
}

export interface AreaCurso {
  idArea: number;
  nombreArea: string;
  institucion: Institucion;
}

export interface ProductoAsociado {
  idProducto: number;
  nombreProducto: string;
  precioBase: number;
  stock?: number;
  estado?: string;
}

export interface DocumentoDigital {
  idDocumento: number;
  titulo: string;
  autor: string;
  descripcion?: string;
  nombreArchivoOriginal: string;
  urlArchivoLocal: string;
  cantidadPaginas: number;
  tamanoBytes: number;
  tipoArchivo: string; // PDF, DOCX, JPG, PNG, etc.
  estado: string;
  fechaSubida: string;
  area: AreaCurso;
  producto?: ProductoAsociado;
}