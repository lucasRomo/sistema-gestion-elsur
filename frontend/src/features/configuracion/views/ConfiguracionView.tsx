import React from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { useConfiguracion } from '../hooks/useConfiguracion';
import { AparienciaSection } from '../components/AparienciaSection';
import { AjustesPerfilCard } from '../components/AjustesPerfilCard';
import { RespaldoCard } from '../components/RespaldoCard';
import { ConfirmarRestauracionModal } from '../components/ConfirmarRestauracionModal';
import { ConfirmarAccionModal } from '../components/ConfirmarAccionModal';
import { useIsMobile } from '../../../hook/useIsMobile'; 

export const ConfiguracionView: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const esOscuro = theme === 'dark';
  const config = useConfiguracion();
  const isMobile = useIsMobile(); // Hook detector de pantalla responsive

  // Clases dinámicas según el tema
  const cardBg = esOscuro ? '#18181b' : '#ffffff';
  const cardBorder = esOscuro ? '#3f3f46' : '#e4e4e7';
  const subBg = esOscuro ? '#222122' : '#f4f4f5';
  const textColor = esOscuro ? '#ffffff' : '#18181b';
  const mutedTextColor = esOscuro ? 'text-white-50' : 'text-muted';
  const inputBgClass = esOscuro ? 'bg-dark text-white border-secondary' : 'bg-light text-dark border-secondary';

  return (
    <div className={`container-fluid font-monospace pb-5 ${esOscuro ? 'text-white' : 'text-dark'}`}>
      <div className="mb-4 pb-3" style={{ borderColor: esOscuro ? '#2d2d30' : '#dee2e6' }}>
        <div className="text-center">
          <h3 className="fw-bold mb-0" style={{ color: textColor, fontSize: '1.5rem' }}>
            {isMobile ? 'Configuración' : 'Configuración y Respaldo'}
          </h3>
        </div>
      </div>

      {/* Switch de Modo Claro / Oscuro */}
      <AparienciaSection 
        esOscuro={esOscuro}
        toggleTheme={toggleTheme}
        cardBg={cardBg}
        cardBorder={cardBorder}
        textColor={textColor}
        mutedTextColor={mutedTextColor}
      />

      <div className="row g-4">
        {/* Cambios de Credenciales / Usuario */}
        <AjustesPerfilCard 
          config={config}
          cardBg={cardBg}
          cardBorder={cardBorder}
          subBg={subBg}
          textColor={textColor}
          mutedTextColor={mutedTextColor}
          inputBgClass={inputBgClass}
        />

        {/* Solo se muestra RespaldoCard si NO es Mobile */}
        {!isMobile && (
          <RespaldoCard 
            config={config}
            esOscuro={esOscuro}
            cardBg={cardBg}
            cardBorder={cardBorder}
            subBg={subBg}
            mutedTextColor={mutedTextColor}
            inputBgClass={inputBgClass}
          />
        )}
      </div>

      {config.mostrarModalConfirmacion && (
        <ConfirmarRestauracionModal 
          cardBg={cardBg}
          textColor={textColor}
          mutedTextColor={mutedTextColor}
          onClose={() => config.setMostrarModalConfirmacion(false)}
          onConfirm={config.ejecutarRestauracion}
        />
      )}

      {config.modalConfirmacionPerfil?.mostrar && (
        <ConfirmarAccionModal 
          titulo={config.modalConfirmacionPerfil.titulo}
          mensaje={config.modalConfirmacionPerfil.mensaje}
          cardBg={cardBg}
          textColor={textColor}
          mutedTextColor={mutedTextColor}
          onClose={() => config.setModalConfirmacionPerfil(null)}
          onConfirm={config.modalConfirmacionPerfil.onConfirm}
        />
      )}
    </div>
  );
};