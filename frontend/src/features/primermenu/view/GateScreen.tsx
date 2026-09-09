import React, { useState } from 'react';
import { API_BASE_URL } from '../../../config/api'; // ajustá el path si hace falta

interface GateScreenProps {
  onAutorizado: () => void;
}

export const GateScreen: React.FC<GateScreenProps> = ({ onAutorizado }) => {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

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
      style={{ background: '#24065249' }}
    >
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-3 shadow-lg"
        style={{ width: '100%', maxWidth: '320px', backgroundColor: '#1b1a1c', border: '1.5px solid #a855f7' }}
      >
        <h2 className="text-center fw-bold mb-4 fs-4 text-white">Acceso restringido</h2>

        <div className="mb-3">
          <label className="form-label small text-white">Clave de acceso</label>
          <input
            type="password"
            className="form-control"
            value={clave}
            onChange={e => setClave(e.target.value)}
            required
            autoFocus
          />
        </div>

        {error && <p className="text-danger small">{error}</p>}

        <button type="submit" className="btn w-100 fw-semibold py-2" disabled={cargando}
          style={{ backgroundColor: 'transparent', border: '1px solid #8e45e0', color: '#ffffff' }}>
          {cargando ? 'Verificando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};