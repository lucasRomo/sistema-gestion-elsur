import React, { useState } from 'react';
import fondoImg from '/src/assets/fondo-izq.webp';
import logoGesta from '/src/assets/logo-gestapro.webp';
import { API_BASE_URL } from '../../config/api';
import { conCargaDeArranque } from '../../config/loadingStore';
import { useTheme } from '../../Context/ThemeContext';
import { useIsMobile } from '../../hook/useIsMobile';

type Perfil = 'duenio' | 'empleado';

// Pantalla de entrada de la demo pública: reemplaza al portón y al inicio de sesión.
export const DemoEntrada: React.FC = () => {
  const { theme } = useTheme();
  const esOscuro = theme === 'dark';
  const isMobile = useIsMobile();
  const [error, setError] = useState('');

  const bgDerecho = esOscuro ? '#1a1a1c' : '#ffffff';
  const textColor = esOscuro ? '#ffffff' : '#0f172a';
  const textoSuave = esOscuro ? '#b9b3c9' : '#475569';

  const entrar = async (perfil: Perfil) => {
    setError('');
    try {
      const res = await conCargaDeArranque('Entrando a la demo...', () =>
        fetch(`${API_BASE_URL}/demo/entrar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ perfil })
        })
      );
      if (!res.ok) {
        setError('La demo se está preparando. Probá de nuevo en un minuto.');
        return;
      }
      const data = await res.json();
      localStorage.setItem('usuario_logueado', JSON.stringify(data.usuario));
      localStorage.setItem('token_sesion', data.token);
      window.location.href = isMobile ? '/informes' : '/dashboard';
    } catch {
      setError('No se pudo conectar con la demo. Probá de nuevo en un minuto.');
    }
  };

  const Boton: React.FC<{ perfil: Perfil; titulo: string; detalle: string; principal?: boolean }> =
    ({ perfil, titulo, detalle, principal }) => (
      <button
        className="btn w-100 py-3 px-3 text-start shadow-sm"
        onClick={() => entrar(perfil)}
        style={{
          backgroundColor: principal ? '#8e45e0' : 'transparent',
          border: '1px solid #8e45e0',
          color: principal ? '#ffffff' : (esOscuro ? '#ffffff' : '#8e45e0'),
          borderRadius: '8px'
        }}
      >
        <span className="d-block fw-bold">{titulo}</span>
        <small className="d-block" style={{ opacity: 0.85 }}>{detalle}</small>
      </button>
    );

  return (
    <div className="container-fluid min-vh-100 p-0 m-0 d-flex flex-column flex-md-row overflow-x-hidden">
      <div
        className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center p-4 text-center"
        style={{
          minHeight: '28vh',
          backgroundColor: '#1a0b2e',
          backgroundImage: `url(${fondoImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: '1px solid #4c1d95'
        }}
      >
        <img src={logoGesta} alt="GestaPro" className="img-fluid" style={{ maxWidth: '280px', width: '100%', height: 'auto' }} />
      </div>

      <div
        className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center p-4 flex-grow-1"
        style={{ backgroundColor: bgDerecho, minHeight: '72vh' }}
      >
        <div className="w-100" style={{ maxWidth: '360px' }}>
          <span className="badge mb-3" style={{ backgroundColor: '#8e45e0' }}>DEMO · Muestra de Proyecto Final 2026</span>
          <h2 className="fw-bold mb-2 fs-3" style={{ color: textColor }}>Probá GestaPro</h2>
          <p className="mb-4" style={{ color: textoSuave }}>
            Es el sistema funcionando con datos de prueba: clientes, pedidos y stock inventados.
            Tocá lo que quieras, no afecta a ningún negocio real.
          </p>

          <div className="d-flex flex-column gap-3">
            <Boton perfil="duenio" principal titulo="Entrar como Dueña"
                   detalle={isMobile ? 'El resumen del negocio desde el celular.' : 'Ve todo: caja, informes, usuarios y permisos.'} />
            {!isMobile && (
              <Boton perfil="empleado" titulo="Entrar como Empleado"
                     detalle="Ve solo lo del mostrador y el taller." />
            )}
          </div>

          {error && <div className="alert alert-warning mt-3 mb-0 small">{error}</div>}

          <p className="small mt-4 mb-0" style={{ color: textoSuave }}>
            Los datos vuelven a empezar todas las mañanas. Desarrollado por Geekers · ISAUI – UPC.
          </p>
        </div>
      </div>
    </div>
  );
};
