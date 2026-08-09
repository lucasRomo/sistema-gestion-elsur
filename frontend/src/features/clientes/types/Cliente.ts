import type { Persona } from '../../../types/Persona';
import type { CategoriaCliente } from './CategoriaCliente';

export interface Cliente {
  idCliente?: number;
  razonSocial: string; 
  saldoDeudor: number; 
  limiteCredito: number;
  categoriaCliente?: CategoriaCliente;
  estado: string; 
  personaDeContacto: string; 
  condicionDePago: string;
  persona: Persona;
}