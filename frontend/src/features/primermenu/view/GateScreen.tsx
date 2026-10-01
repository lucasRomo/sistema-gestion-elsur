import React, { useState } from 'react';
import { API_BASE_URL } from '../../../config/api';
import { useTheme } from '../../../Context/ThemeContext';

interface GateScreenProps {
  onAutorizado: () => void;
}

export const GateScreen: React.FC<GateScreenProps> = ({ onAutorizado }) => {
  const { theme } = useTheme();
  const esOscuro = theme === 'dark';

  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Colores según el tema
  const bgFondo = esOscuro ? '#24065249' : '#f3effa';
  const bgCard = esOscuro ? '#1b1a1c' : '#ffffff';
  const textColor = esOscuro ? '#ffffff' : '#0f172a';
  const botonColor = esOscuro ? '#ffffff' : '#8e45e0';
  const bgInput = esOscuro ? '#2a292c' : '#ffffff';
  const borderInput = esOscuro ? '#4c4a50' : '#cbd5e1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/acceso/validar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token_sesion', data.token);
        onAutorizado();
      } else {
        setError('Clave incorrecta.');
      }
    } catch {
      setError('Error de red al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="container-fluid min-vh-100 d-flex justify-content-center align-items-center"
      style={{ background: bgFondo, transition: 'background 0.3s ease' }}
    >
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-3 shadow-lg"
        style={{
          width: '100%',
          maxWidth: '320px',
          backgroundColor: bgCard,
          border: '1.5px solid #a855f7',
          transition: 'background-color 0.3s ease'
        }}
      >
        <h2
          className="text-center fw-bold mb-4 fs-4"
          style={{ color: textColor }}
        >
          Acceso restringido
        </h2>

        <div className="mb-3">
          <label className="form-label small" style={{ color: textColor }}>
            Clave de acceso
          </label>
          <input
            type="password"
            className="form-control"
            value={clave}
            onChange={e => setClave(e.target.value)}
            required
            autoFocus
            style={{
              backgroundColor: bgInput,
              color: textColor,
              border: `1px solid ${borderInput}`
            }}
          />
        </div>

        {error && <p className="text-danger small">{error}</p>}

        <button
          type="submit"
          className="btn w-100 fw-semibold py-2"
          disabled={cargando}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #8e45e0',
            color: botonColor,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#8e45e0';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = botonColor;
          }}
        >
          {cargando ? 'Verificando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};