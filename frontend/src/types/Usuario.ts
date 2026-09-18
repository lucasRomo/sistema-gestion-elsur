// src/types/Usuario.ts
// src/types/Usuario.ts
import type { Persona } from './Persona';
import type { Rol } from './Rol';

export interface Usuario {
    idUsuario?: number;
    nombreUsuario: string;
    password?: string; // Mapea a 'contrasena' mediante JPA en tu back
    persona: Persona;
    rol: Rol;
    // Campos @Transient del lado del backend (ver Usuario.java): permiten mandar,
    // en el MISMO POST /usuarios, los datos que antes viajaban en un segundo POST
    // a /empleados. UsuarioServiceImpl.guardar() los usa para crear/actualizar el
    // legajo de Empleado asociado en la misma transacción.
    salario?: number;
    estado?: string;
    cargo?: string;
    fechaContratacion?: string;
}