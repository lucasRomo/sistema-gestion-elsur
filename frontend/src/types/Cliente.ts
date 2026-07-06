import type { Persona } from './Persona';

export interface Cliente {
  idCliente?: number;
  razonSocial: string; 
  saldoDeudor: number; 
  limiteCredito: number;
  estado: string; 
  personaDeContacto: string; 
  condicionDePago: string;
  persona: Persona;
}