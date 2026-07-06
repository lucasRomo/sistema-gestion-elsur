// src/views/auth/RegisterView.tsx
import React, { useState } from 'react';
import { PersonaForm } from '../../features/auth/PersonaForm';
import { EmpleadoModal } from '../../features/auth/EmpleadoModal';
import { ExitoModal } from '../../features/auth/ExitoModal';
import type { Usuario } from '../../types/Usuario';
import type { Empleado } from '../../types/Empleado';
import logoGestaG from '../../assets/logo-gestaprog.png';
import fondoImg from '../../assets/fondo-izq.png';

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
          estado: 'Activo',
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
    <div 
  className="container-fluid min-vh-100 d-flex justify-content-center align-items-center" 
  style={{ 
    // Gradiente con mayor contraste: de un tono casi púrpura oscuro a un gris profundo
    background: 'linear-gradient(145deg, #240f47 20%, #0c0c0e 80%)',
    minHeight: '100vh'
  }}
>
      
      {/* Contenedor principal con padding reducido de p-5 a p-4 */}
      <div className="w-100 p-4 rounded-3 position-relative" 
           style={{ 
             maxWidth: '750px', 
             backgroundColor: '#1a1a1c', 
             border: '1px solid #3f3f46' 
           }}>
        
        {/* Logo GestaPro como marca de agua */}
        <div className="position-absolute top-50 start-50 translate-middle opacity-10" style={{ zIndex: 0 }}>
          <img src={logoGestaG} alt="GestaPro" style={{ width: '360px' }} />
        </div>

        {/* Título y Formulario */}
        <div className="position-relative" style={{ zIndex: 1 }}>
          <div className="text-center mb-3"> {/* mb-5 reducido a mb-3 */}
          </div>

          <PersonaForm 
            formData={personaData} 
            setFormData={setPersonaData} 
            onSiguiente={() => setMostrarModalEmpleado(true)} // Aseguramos la apertura
            onVolver={onVolver} 
            titulo="Registrar Nuevo Usuario"
          />
        </div>
      </div>

      {/* MODALES - Deben estar aquí para renderizarse */}
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