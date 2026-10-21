import React, { useState } from 'react';
import fondoImg from '/src/assets/fondo-izq.webp';
import logoGesta from '/src/assets/logo-gestapro.webp';
import { API_BASE_URL } from '../../config/api';
import { conCargaDeArranque } from '../../config/loadingStore';
import { useTheme } from '../../Context/ThemeContext';
import { useIsMobile } from '../../hook/useIsMobile';

type Perfil = 'duenio' | 'empleado';

const VIOLETA = '#8e45e0';

// Lo que se puede probar en la demo, para que el visitante sepa por dónde arrancar.
const PARA_PROBAR = [
  { icono: 'bi-cash-coin', texto: 'La caja y las ventas del día' },
  { icono: 'bi-kanban', texto: 'Los pedidos que están en el taller' },
  { icono: 'bi-bar-chart-line', texto: 'Los informes del negocio' },
  { icono: 'bi-printer', texto: 'El estado de las máquinas' }
];

// Pantalla de entrada de la demo pública: reemplaza al portón y al inicio de sesión.
export const DemoEntrada: React.FC = () => {
  const { theme } = useTheme();
  const esOscuro = theme === 'dark';
  const isMobile = useIsMobile();
  const [error, setError] = useState('');

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

  const avisoError = error && <div className="alert alert-warning mt-3 mb-0 small">{error}</div>;

  // ---------- Celular: es lo que abre quien escanea el QR del póster ----------
  if (isMobile) {
    return (
      <div
        className="min-vh-100 d-flex flex-column text-white"
        style={{
          background: 'linear-gradient(165deg, #1a0b2e 0%, #2e1760 55%, #5b2db0 100%)',
          padding: '64px 24px calc(28px + env(safe-area-inset-bottom))'
        }}
      >
        <img src={logoGesta} alt="GestaPro" style={{ width: '62%', maxWidth: 240, alignSelf: 'center' }} />

        <h1 className="fw-bold mt-4 mb-2" style={{ fontSize: '1.9rem', lineHeight: 1.15 }}>
          Probá GestaPro<br />desde tu celular
        </h1>
        <p className="mb-4" style={{ color: '#d8cdf3', fontSize: '1rem' }}>
          El sistema de gestión para centros de copiado, funcionando con datos de prueba.
          Tocá lo que quieras: no afecta a ningún negocio real.
        </p>

        <div className="d-flex flex-column gap-2 mb-4">
          {PARA_PROBAR.map(({ icono, texto }) => (
            <div key={texto} className="d-flex align-items-center gap-3 rounded-3 px-3 py-2"
                 style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,182,245,0.18)' }}>
              <i className={`bi ${icono}`} style={{ color: '#c9b6f5', fontSize: '1.15rem' }} />
              <span style={{ fontSize: '0.95rem' }}>{texto}</span>
            </div>
          ))}
        </div>

        <button
          className="btn w-100 fw-bold mt-auto"
          onClick={() => entrar('duenio')}
          style={{ backgroundColor: '#ffffff', color: '#2e1760', borderRadius: 14, padding: '16px', fontSize: '1.1rem',
                   boxShadow: '0 8px 24px rgba(10, 4, 30, 0.45)' }}
        >
          Entrar a la demo
        </button>
        {avisoError}

        <p className="text-center small mt-3 mb-0" style={{ color: '#b9a9e6' }}>
          Desarrollado por <b className="text-white">Geekers</b> · ISAUI – UPC
        </p>
      </div>
    );
  }

  // ---------- Computadora: la notebook del stand ----------
  const bgDerecho = esOscuro ? '#1a1a1c' : '#ffffff';
  const textColor = esOscuro ? '#ffffff' : '#0f172a';
  const textoSuave = esOscuro ? '#b9b3c9' : '#475569';

  const Boton: React.FC<{ perfil: Perfil; titulo: string; detalle: string; principal?: boolean }> =
    ({ perfil, titulo, detalle, principal }) => (
      <button
        className="btn w-100 py-3 px-3 text-start shadow-sm"
        onClick={() => entrar(perfil)}
        style={{
          backgroundColor: principal ? VIOLETA : 'transparent',
          border: `1px solid ${VIOLETA}`,
          color: principal ? '#ffffff' : (esOscuro ? '#ffffff' : VIOLETA),
          borderRadius: '8px'
        }}
      >
        <span className="d-block fw-bold">{titulo}</span>
        <small className="d-block" style={{ opacity: 0.85 }}>{detalle}</small>
      </button>
    );

  return (
    <div className="container-fluid min-vh-100 p-0 m-0 d-flex flex-row overflow-x-hidden">
      <div
        className="col-6 d-flex flex-column justify-content-center align-items-center p-4 text-center"
        style={{
          backgroundColor: '#1a0b2e',
          backgroundImage: `url(${fondoImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <img src={logoGesta} alt="GestaPro" className="img-fluid" style={{ maxWidth: '280px', width: '100%', height: 'auto' }} />
      </div>

      <div className="col-6 d-flex flex-column justify-content-center align-items-center p-4" style={{ backgroundColor: bgDerecho }}>
        <div className="w-100" style={{ maxWidth: '380px' }}>
          <h2 className="fw-bold mb-2 fs-3" style={{ color: textColor }}>Probá GestaPro</h2>
          <p className="mb-4" style={{ color: textoSuave }}>
            Es el sistema funcionando con datos de prueba: clientes, pedidos y stock inventados.
            Tocá lo que quieras, no afecta a ningún negocio real.
          </p>

          <div className="d-flex flex-column gap-3">
            <Boton perfil="duenio" principal titulo="Entrar como Dueña" detalle="Ve todo: caja, informes, usuarios y permisos." />
            <Boton perfil="empleado" titulo="Entrar como Empleado" detalle="Ve solo lo del mostrador y el taller." />
          </div>
          {avisoError}

          <p className="small mt-4 mb-0" style={{ color: textoSuave }}>
            Los datos vuelven a empezar todas las mañanas. Desarrollado por Geekers · ISAUI – UPC.
          </p>
        </div>
      </div>
    </div>
  );
};
