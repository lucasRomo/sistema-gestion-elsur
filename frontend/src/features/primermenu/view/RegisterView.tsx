import React from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { PersonaForm } from '../../auth/persona/view/PersonaForm';
import { EmpleadoModal } from '../../usuarios/components/EmpleadoModal';
import { ExitoModal } from '../../../components/modals/ExitoModal';
import { useRegister } from '../hooks/useRegister';

interface RegisterViewProps {
  onVolver: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onVolver }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const backgroundGradient = isDark 
    ? 'linear-gradient(145deg, #240f47 20%, #0c0c0e 80%)' 
    : 'linear-gradient(145deg, #e2e8f0 20%, #f1f5f9 80%)';
  const containerBg = isDark ? '#1a1a1c' : '#ffffff';
  const containerBorder = isDark ? '#3f3f46' : '#cbd5e1';

  const {
    personaData,
    setPersonaData,
    empleadoData,
    setEmpleadoData,
    mostrarModalEmpleado,
    abrirModalEmpleado,
    cerrarModalEmpleado,
    mostrarModalExito,
    cerrarModalExito,
    mensajeExito,
    handleRegistrarTodo
  } = useRegister();

  return (
    <div 
      className="container-fluid min-vh-100 d-flex justify-content-center align-items-center" 
      style={{ background: backgroundGradient, minHeight: '100vh' }}>
      
      <div className="w-100 p-4 rounded-3 position-relative shadow-lg" 
     style={{ maxWidth: '750px', backgroundColor: containerBg, border: '1.5px solid #a855f7' }}>
        
        <div className="position-relative" style={{ zIndex: 1 }}>
          <PersonaForm 
            formData={personaData} 
            setFormData={setPersonaData} 
            onSiguiente={abrirModalEmpleado} 
            onVolver={onVolver} 
            titulo="Registrar Nuevo Usuario"
          />
        </div>
      </div>

      {mostrarModalEmpleado && (
        <EmpleadoModal 
          formData={empleadoData} 
          setFormData={setEmpleadoData} 
          onRegistrar={handleRegistrarTodo} 
          onCerrar={cerrarModalEmpleado} 
        />
      )}

      {mostrarModalExito && (
        <ExitoModal 
          message={mensajeExito} 
          onAceptar={() => {
            cerrarModalExito();
            onVolver();
          }} 
        />
      )}
    </div>
  );
};