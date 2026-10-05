import React, { useMemo, useState } from 'react';
import { useTheme } from '../../../../Context/ThemeContext';

import { normalizarTexto } from '../../../../utils/formato';
// Reemplaza al desplegable de clientes: con cientos de clientes había que bajar a mano hasta
// encontrarlo. Se escribe nombre, razón social o documento y se elige de la lista.

const idDeCliente = (c: any) => c?.id_cliente ?? c?.idCliente ?? c?.id;

const nombreDeCliente = (c: any) =>
  c?.persona ? `${c.persona.nombre} ${c.persona.apellido}`.trim() : (c?.razon_social || c?.razonSocial || `Cliente #${idDeCliente(c)}`);

interface Props {
  clientes: any[];
  clienteId: string;
  onSeleccionar: (id: string) => void;
  onNuevoCliente?: () => void;
}

export const BuscadorCliente: React.FC<Props> = ({ clientes, clienteId, onSeleccionar, onNuevoCliente }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);

  const seleccionado = clientes.find((c) => String(idDeCliente(c)) === clienteId);

  const filtrados = useMemo(() => {
    const q = normalizarTexto(texto.trim());
    const lista = q
      ? clientes.filter((c) =>
          normalizarTexto(nombreDeCliente(c)).includes(q) ||
          normalizarTexto(String(c?.razon_social || c?.razonSocial || '')).includes(q) ||
          String(c?.persona?.numeroDocumento || '').includes(q))
      : clientes;
    return lista.slice(0, 50);
  }, [clientes, texto]);

  const borde = isDark ? '#3f3f46' : '#cbd5e1';

  return (
    <div className="d-flex gap-2">
      <div className="position-relative flex-grow-1">
        <input
          type="text"
          className="form-control bg-dark text-white border-secondary"
          placeholder="Buscar por nombre, razón social o documento..."
          value={abierto ? texto : (seleccionado ? nombreDeCliente(seleccionado) : texto)}
          onChange={(e) => { setTexto(e.target.value); setAbierto(true); if (clienteId) onSeleccionar(''); }}
          onFocus={() => { setAbierto(true); setTexto(''); }}
          onBlur={() => setTimeout(() => setAbierto(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && abierto && filtrados.length > 0) {
              e.preventDefault();
              onSeleccionar(String(idDeCliente(filtrados[0])));
              setAbierto(false);
            }
          }}
          aria-label="Buscar cliente"
        />
        {abierto && (
          <div
            className={`position-absolute w-100 shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
            style={{ maxHeight: '220px', zIndex: 1050, border: `1px solid ${borde}`, left: 0 }}
          >
            {filtrados.length === 0 ? (
              <div className="p-3 small text-center" style={{ color: isDark ? '#a1a1aa' : '#64748b' }}>
                No se encontraron clientes{onNuevoCliente ? ' — usá "+ Nuevo" para registrarlo.' : '.'}
              </div>
            ) : (
              filtrados.map((c) => {
                const id = String(idDeCliente(c));
                return (
                  <div
                    key={`cli-${id}`}
                    className="p-2 border-bottom d-flex justify-content-between align-items-center small"
                    style={{ cursor: 'pointer', backgroundColor: id === clienteId ? '#0284c7' : (isDark ? '#27272a' : '#f8fafc') }}
                    onMouseDown={() => { onSeleccionar(id); setAbierto(false); }}
                  >
                    <span className="fw-semibold">{nombreDeCliente(c)}</span>
                    {c?.persona?.numeroDocumento && <span style={{ color: isDark ? '#a1a1aa' : '#64748b' }}>{c.persona.numeroDocumento}</span>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      {onNuevoCliente && (
        <button type="button" className="btn btn-outline-success fw-bold text-nowrap" onClick={onNuevoCliente} title="Registrar un cliente nuevo sin salir del pedido">
          <i className="bi bi-person-plus me-1" aria-hidden="true"></i>Nuevo
        </button>
      )}
    </div>
  );
};
