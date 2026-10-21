import React, { useState } from 'react';
import logoGesta from '/src/assets/logo-gestapro.webp';
import { API_BASE_URL } from '../../config/api';
import { conCargaDeArranque } from '../../config/loadingStore';
import { useIsMobile } from '../../hook/useIsMobile';

type Perfil = 'duenio' | 'empleado';

const FONDO = 'radial-gradient(circle at 85% 10%, rgba(165,123,245,0.45), transparent 45%), ' +
  'linear-gradient(160deg, #140826 0%, #2e1760 55%, #5b2db0 100%)';
const LILA = '#c9b6f5';
const LILA_SUAVE = '#d8cdf3';
const BORDE = '1px solid rgba(201,182,245,0.22)';

// Lo que se puede probar en la demo, para que el visitante sepa por dónde arrancar.
const PARA_PROBAR = [
  { icono: 'bi-cash-coin', texto: 'La caja y las ventas del día' },
  { icono: 'bi-kanban', texto: 'Los pedidos que están en el taller' },
  { icono: 'bi-bar-chart-line', texto: 'Los informes del negocio' },
  { icono: 'bi-printer', texto: 'El estado de las máquinas' }
];

const PERFILES: { perfil: Perfil; icono: string; titulo: string; detalle: string }[] = [
  { perfil: 'duenio', icono: 'bi-person-badge', titulo: 'Entrar como Dueño',
    detalle: 'Ve todo el negocio: caja, informes, usuarios y permisos.' },
  { perfil: 'empleado', icono: 'bi-person-workspace', titulo: 'Entrar como Empleado',
    detalle: 'Ve solo lo suyo: el mostrador y el taller.' }
];

// Pantalla de entrada de la demo pública: reemplaza al portón y al inicio de sesión.
export const DemoEntrada: React.FC = () => {
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

  const listaParaProbar = (
    <div className="d-flex flex-column gap-2">
      {PARA_PROBAR.map(({ icono, texto }) => (
        <div key={texto} className="d-flex align-items-center gap-3 rounded-3 px-3 py-2"
             style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: BORDE }}>
          <i className={`bi ${icono}`} style={{ color: LILA, fontSize: '1.15rem' }} />
          <span style={{ fontSize: '0.95rem' }}>{texto}</span>
        </div>
      ))}
    </div>
  );

  const pie = (
    <p className="text-center small mb-0" style={{ color: '#b9a9e6' }}>
      Desarrollado por <b className="text-white">Geekers</b> · ISAUI – Universidad Provincial de Córdoba
    </p>
  );

  // ---------- Celular: es lo que abre quien escanea el QR del póster ----------
  if (isMobile) {
    return (
      <div className="min-vh-100 d-flex flex-column text-white"
           style={{ background: FONDO, padding: '64px 24px calc(28px + env(safe-area-inset-bottom))' }}>
        <img src={logoGesta} alt="GestaPro" style={{ width: '62%', maxWidth: 240, alignSelf: 'center' }} />

        <h1 className="fw-bold mt-4 mb-2" style={{ fontSize: '1.9rem', lineHeight: 1.15 }}>
          Probá GestaPro<br />desde tu celular
        </h1>
        <p className="mb-4" style={{ color: LILA_SUAVE, fontSize: '1rem' }}>
          El sistema de gestión para centros de copiado, funcionando con datos de prueba.
          Tocá lo que quieras: no afecta a ningún negocio real.
        </p>

        <div className="mb-4">{listaParaProbar}</div>

        <button
          className="btn w-100 fw-bold mt-auto"
          onClick={() => entrar('duenio')}
          style={{ backgroundColor: '#ffffff', color: '#2e1760', borderRadius: 14, padding: '16px', fontSize: '1.1rem',
                   boxShadow: '0 8px 24px rgba(10, 4, 30, 0.45)' }}
        >
          Entrar a la demo <i className="bi bi-arrow-right ms-1" />
        </button>
        {avisoError}
        <div className="mt-3">{pie}</div>
      </div>
    );
  }

  // ---------- Computadora: la notebook del stand ----------
  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center text-white px-4 py-5"
         style={{ background: FONDO }}>
      <div className="w-100 d-flex flex-column gap-4" style={{ maxWidth: 980 }}>
        <div className="d-flex align-items-center gap-4 flex-wrap">
          <img src={logoGesta} alt="GestaPro" style={{ width: 230 }} />
          <div className="flex-grow-1" style={{ minWidth: 300 }}>
            <span className="badge rounded-pill mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: LILA, border: BORDE }}>
              DEMO · Muestra de Proyecto Final 2026
            </span>
            <h1 className="fw-bold mb-2" style={{ fontSize: '2.6rem', lineHeight: 1.1 }}>Probá GestaPro</h1>
            <p className="mb-0" style={{ color: LILA_SUAVE, fontSize: '1.1rem', maxWidth: 560 }}>
              El sistema de gestión para centros de copiado, funcionando con datos de prueba.
              Tocá lo que quieras: no afecta a ningún negocio real.
            </p>
          </div>
        </div>

        <div className="row g-3">
          {PERFILES.map(({ perfil, icono, titulo, detalle }, i) => (
            <div key={perfil} className="col-md-6">
              <button
                className="btn w-100 h-100 text-start d-flex align-items-center gap-3 p-4"
                onClick={() => entrar(perfil)}
                style={{
                  backgroundColor: i === 0 ? '#ffffff' : 'rgba(255,255,255,0.08)',
                  color: i === 0 ? '#2e1760' : '#ffffff',
                  border: i === 0 ? '1px solid #ffffff' : BORDE,
                  borderRadius: 18,
                  boxShadow: i === 0 ? '0 10px 30px rgba(10, 4, 30, 0.45)' : 'none',
                  transition: 'transform .15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <i className={`bi ${icono}`} style={{ fontSize: '2.2rem', color: i === 0 ? '#8e45e0' : LILA }} />
                <span className="flex-grow-1">
                  <span className="d-block fw-bold fs-5">{titulo}</span>
                  <span className="d-block" style={{ opacity: 0.8 }}>{detalle}</span>
                </span>
                <i className="bi bi-arrow-right fs-4" />
              </button>
            </div>
          ))}
        </div>
        {avisoError}

        <div>
          <div className="small fw-bold mb-2" style={{ color: LILA, letterSpacing: '.12em' }}>PARA PROBAR</div>
          <div className="row g-2">
            {PARA_PROBAR.map(({ icono, texto }) => (
              <div key={texto} className="col-md-6 col-lg-3">
                <div className="d-flex align-items-center gap-2 rounded-3 px-3 py-2 h-100"
                     style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: BORDE }}>
                  <i className={`bi ${icono}`} style={{ color: LILA }} />
                  <span className="small">{texto}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 small" style={{ color: '#b9a9e6' }}>
          <span>Los datos vuelven a empezar todas las mañanas.</span>
          {pie}
        </div>
      </div>
    </div>
  );
};
