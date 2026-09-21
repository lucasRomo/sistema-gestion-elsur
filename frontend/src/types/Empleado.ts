import type { Persona } from './Persona';

export interface Empleado {
    idEmpleado?: number;
    fechaContratacion: string; 
    cargo: string;
    salario: number; 
    estado: string;
    persona: Persona;
}

