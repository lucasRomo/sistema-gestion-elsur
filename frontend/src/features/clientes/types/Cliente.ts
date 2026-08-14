import type { Persona } from '../../../types/Persona';
import type { CategoriaCliente } from './CategoriaCliente';

export interface Cliente {
  idCliente?: number;
  id_cliente?: number;
  razonSocial: string; 
  saldoDeudor: number; 
  limiteCredito: number;
  categoriaCliente?: CategoriaCliente;
  estado: string; 
  personaDeContacto: string; 
  condicionDePago: string;
  persona: Persona;
}

export interface MovimientoCuentaCorriente {
  idMovimiento?: number;
  id_movimiento?: number;
  fecha: string;
  tipo: 'CARGO' | 'PAGO';
  monto: number;
  descripcion: string;
  metodoPago?: string;
  comprobanteImagen?: string;
}