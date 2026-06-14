// src/views/auth/RegisterView.tsx
import React, { useState } from 'react';
import { PersonaForm } from '../../components/auth/PersonaForm';
import { EmpleadoModal } from '../../components//auth/EmpleadoModal';
import { ExitoModal } from '../../components/auth/ExitoModal';
import type { Usuario } from '../../types/Usuario';
import type { Empleado } from '../../types/Empleado';

interface RegisterViewProps {
  onVolver: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onVolver }) => {
  // Estado agrupado de la Persona
  const [personaData, setPersonaData] = useState({
    nombre: '', apellido: '', tipoDocumento: '', numeroDocumento: '',
    email: '', telefono: '', calle: '', numero: '', piso: '',
    depto: '', codPostal: '', ciudad: '', provincia: '', pais: ''
  });

  // Estado agrupado del Empleado/Usuario
  const [empleadoData, setEmpleadoData] = useState({
    nombreUsuario: '', password: '', fechaContratacion: '', cargo: '', salario: ''
  });

  const [mostrarModalEmpleado, setMostrarModalEmpleado] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

  const handleSiguiente = (e: React.FormEvent) => {
    e.preventDefault();
    setMostrarModalEmpleado(true);
  };

  const handleRegistrarTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    const nuevoUsuario: Usuario = {
      nombreUsuario: empleadoData.nombreUsuario,
      password: empleadoData.password,
      rol: { idRol: 2 },
      persona: {
        nombre: personaData.nombre,
        apellido: personaData.apellido,
        numeroDocumento: personaData.numeroDocumento,
        telefono: personaData.telefono,
        email: personaData.email,
        tipoDocumento: { idTipoDocumento: parseInt(personaData.tipoDocumento) || 1 },
        tipoPersona: { idTipoPersona: 1 },
        direccion: {
          calle: personaData.calle,
          numero: personaData.numero,
          piso: personaData.piso || null,
          departamento: personaData.depto || null,
          codigoPostal: personaData.codPostal,
          ciudad: personaData.ciudad || 'Santa Fe',
          provincia: personaData.provincia || 'Santa Fe',
          pais: personaData.pais || 'Argentina'
        }
      }
    };

    try {
      const responseUsuario = await fetch('http://localhost:8080/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      });

      if (responseUsuario.ok) {
        const usuarioGuardado: Usuario = await responseUsuario.json();

        // Forzar formato YYYY-MM-DD para la fecha actual si viene vacía
        const fechaISO = empleadoData.fechaContratacion 
          ? empleadoData.fechaContratacion 
          : new Date().toISOString().split('T')[0];

        const nuevoEmpleado = {
          fechaContratacion: fechaISO, // Aseguramos formato estricto YYYY-MM-DD
          cargo: empleadoData.cargo || 'OPERARIO',
          salario: parseFloat(empleadoData.salario) || 0.0,
          estado: 'ACTIVO',
          // Le mandamos el objeto persona con el id correcto que retornó el back
          persona: { 
            idPersona: usuarioGuardado.persona.idPersona 
          }
        };

        const responseEmpleado = await fetch('http://localhost:8080/api/empleados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoEmpleado)
        });

        if (responseEmpleado.ok) {
          setMostrarModalEmpleado(false);
          setMostrarModalExito(true);
        } else {
          alert('Usuario creado, pero falló el alta del legajo de empleado.');
        }
      } else {
        alert('Error al registrar el usuario en el backend.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red con el puerto 8080.');
    }
  };

  return (
    <div className="container-fluid min-vh-100 py-4 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#18181b' }}>
      <div className="w-100 p-4 rounded-4 position-relative" style={{ maxWidth: '750px', backgroundColor: '#1e1e22', border: '1px solid #3f3f46' }}>
        
        <div className="position-absolute top-50 start-50 translate-middle opacity-5 text-center pointer-events-none" style={{ zIndex: 0 }}>
          <h1 style={{ fontSize: '10rem' }}>{"{G}"}</h1>
        </div>

        <div className="position-relative" style={{ zIndex: 1 }}>
          <PersonaForm 
            formData={personaData} 
            setFormData={setPersonaData} 
            onSiguiente={handleSiguiente} 
            onVolver={onVolver} 
          />
        </div>
      </div>

      {mostrarModalEmpleado && (
        <EmpleadoModal 
          formData={empleadoData} 
          setFormData={setEmpleadoData} 
          onRegistrar={handleRegistrarTodo} 
          onCerrar={() => setMostrarModalEmpleado(false)} 
        />
      )}

      {mostrarModalExito && (
        <ExitoModal onAceptar={() => { setMostrarModalExito(false); onVolver(); }} />
      )}
    </div>
  );
};