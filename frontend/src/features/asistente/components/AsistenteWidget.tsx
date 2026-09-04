import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { asistenteService, type MensajeChat } from '../services/asistenteService';

interface AsistenteWidgetProps {
  /** Nombre del módulo actual (el mismo "activeItem" del SidebarLayout). */
  modulo: string;
}

export const AsistenteWidget: React.FC<AsistenteWidgetProps> = ({ modulo }) => {
  const { theme } = useTheme();
  const esOscuro = theme === 'dark';

  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listaRef = useRef<HTMLDivElement>(null);
  const moduloAnteriorRef = useRef(modulo);

  const panelBg = esOscuro ? '#222122' : '#ffffff';
  const borderColor = esOscuro ? '#2d2d30' : '#cbd5e1';
  const textColor = esOscuro ? '#ffffff' : '#0f172a';
  const mutedText = esOscuro ? '#a1a1aa' : '#64748b';
  const burbujaUsuarioBg = '#8e45e0';
  const burbujaAsistenteBg = esOscuro ? '#2d2d30' : '#f1f5f9';

  // Si el usuario cambia de módulo mientras el chat está abierto, avisamos
  // en el propio historial que el contexto cambió (sin perder la conversación).
  useEffect(() => {
    if (moduloAnteriorRef.current !== modulo) {
      moduloAnteriorRef.current = modulo;
      if (abierto && mensajes.length > 0) {
        setMensajes((prev) => [
          ...prev,
          { rol: 'asistente', texto: `Veo que ahora estás en "${modulo}". Si tu pregunta es sobre esta pantalla, contame en qué te puedo ayudar.` },
        ]);
      }
    }
  }, [modulo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensajes, cargando]);

  const enviarMensaje = async () => {
    const texto = input.trim();
    if (!texto || cargando) return;

    const nuevoHistorial: MensajeChat[] = [...mensajes, { rol: 'usuario', texto }];
    setMensajes(nuevoHistorial);
    setInput('');
    setError(null);
    setCargando(true);

    try {
      const respuesta = await asistenteService.preguntar(texto, modulo, nuevoHistorial);
      setMensajes((prev) => [...prev, { rol: 'asistente', texto: respuesta }]);
    } catch (e: any) {
      setError(e?.message || 'Ocurrió un error al consultar al asistente.');
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  return (
    <>
      {/* Botón fijo arriba a la derecha, visible en cualquier módulo */}
      <button
        onClick={() => setAbierto((v) => !v)}
        title="Ayuda del sistema"
        className="d-flex align-items-center justify-content-center d-print-none"
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1.5rem',
          zIndex: 1050,
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#8e45e0',
          color: '#fff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
          cursor: 'pointer',
        }}
      >
        <i className={`bi ${abierto ? 'bi-x-lg' : 'bi-question-lg'}`} style={{ fontSize: '1.1rem' }}></i>
      </button>

      {abierto && (
        <div
          className="d-print-none"
          style={{
            position: 'fixed',
            top: '4rem',
            right: '1.5rem',
            zIndex: 1049,
            width: '340px',
            maxWidth: '90vw',
            height: '440px',
            maxHeight: '70vh',
            backgroundColor: panelBg,
            border: `1px solid ${borderColor}`,
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.65rem 0.9rem',
              borderBottom: `1px solid ${borderColor}`,
              backgroundColor: esOscuro ? '#2d2d30' : '#f8fafc',
            }}
          >
            <div className="fw-bold" style={{ fontSize: '0.85rem', color: textColor }}>
              Asistente de ayuda
            </div>
            <div style={{ fontSize: '0.7rem', color: mutedText }}>
              Módulo actual: {modulo}
            </div>
          </div>

          {/* Mensajes */}
          <div ref={listaRef} style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {mensajes.length === 0 && (
              <div style={{ fontSize: '0.78rem', color: mutedText }}>
                Hola 👋 Soy el asistente del sistema. Preguntame cómo hacer algo en <b>{modulo}</b> o en cualquier otro módulo.
              </div>
            )}

            {mensajes.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.rol === 'usuario' ? 'flex-end' : 'flex-start',
                  backgroundColor: m.rol === 'usuario' ? burbujaUsuarioBg : burbujaAsistenteBg,
                  color: m.rol === 'usuario' ? '#fff' : textColor,
                  borderRadius: '10px',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.8rem',
                  maxWidth: '85%',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.texto}
              </div>
            ))}

            {cargando && (
              <div style={{ alignSelf: 'flex-start', color: mutedText, fontSize: '0.78rem' }}>
                Escribiendo...
              </div>
            )}

            {error && (
              <div style={{ color: '#dc3545', fontSize: '0.75rem' }}>{error}</div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '0.5rem', borderTop: `1px solid ${borderColor}`, display: 'flex', gap: '0.4rem' }}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Escribí tu pregunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={cargando}
              style={{ fontSize: '0.8rem' }}
            />
            <button
              onClick={enviarMensaje}
              disabled={cargando || !input.trim()}
              className="btn btn-sm"
              style={{ backgroundColor: '#8e45e0', color: '#fff', border: 'none' }}
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
