// src/types/Empleado.ts
// src/types/Empleado.ts
import type { Persona } from './Persona';

export interface Empleado {
    idEmpleado?: number;
    fechaContratacion: string; // Formato YYYY-MM-DD para mapear con LocalDate
    cargo: string;
    salario: number; // Mapea con BigDecimal
    estado: string;
    persona: Persona;
}

