import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { API_BASE_URL, apiFetch } from '../../../config/api';
import { formatearMonto, normalizarTexto } from '../../../utils/formato';
import { EstadoBadge } from '../../common/EstadoBadge';
import { ContadorTiempo } from '../../../features/pedidos/pedidospendientes/components/ContadorTiempo';

// Cola del taller en el celular: el administrador ve cómo vienen los pedidos (solo consulta,
// no se cambian estados ni se cobran). Tocar una tarjeta despliega productos y observaciones.

export type FiltroPedidos = 'TALLER' | 'ATRASADOS' | 'PRESUPUESTOS';
type Filtro = FiltroPedidos;

const ESTADOS_SIN_ATRASO = ['FINALIZADO', 'PRESUPUESTO'];

const nombreCliente = (p: any) =>
  p.cliente?.persona
    ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido}`
    : (p.cliente?.razon_social || p.cliente?.razonSocial || p.cliente?.nombre || 'Consumidor Final');

const estaAtrasado = (p: any) =>
  !ESTADOS_SIN_ATRASO.includes(String(p.estado).toUpperCase()) &&
  !!p.fecha_entrega_estimada && new Date(p.fecha_entrega_estimada).getTime() < Date.now();

export const PedidosMovil: React.FC<{ filtroInicial?: FiltroPedidos }> = ({ filtroInicial = 'TALLER' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [pedidos, setPedidos] = useState<any[] | null>(null);
  const [error, setError] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial);
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setError(false);
    try {
      const res = await apiFetch(`${API_BASE_URL}/pedidos/activos`, { skipLoading: true });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
      setPedidos((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const conteo = useMemo(() => {
    const lista = pedidos ?? [];
    return {
      TALLER: lista.filter((p) => String(p.estado).toUpperCase() !== 'PRESUPUESTO').length,
      ATRASADOS: lista.filter(estaAtrasado).length,
      PRESUPUESTOS: lista.filter((p) => String(p.estado).toUpperCase() === 'PRESUPUESTO').length,
    };
  }, [pedidos]);

  const visibles = useMemo(() => {
    const q = normalizarTexto(busqueda.trim());
    return (pedidos ?? [])
      .filter((p) => {
        const estado = String(p.estado).toUpperCase();
        if (filtro === 'PRESUPUESTOS') return estado === 'PRESUPUESTO';
        if (filtro === 'ATRASADOS') return estaAtrasado(p);
        return estado !== 'PRESUPUESTO';
      })
      .filter((p) => !q || normalizarTexto(`${p.id_pedido} ${nombreCliente(p)}`).includes(q))
      .sort((a, b) => new Date(a.fecha_entrega_estimada).getTime() - new Date(b.fecha_entrega_estimada).getTime());
  }, [pedidos, filtro, busqueda]);

  const tarjetaBg = isDark ? '#18181b' : '#ffffff';
  const borde = isDark ? '#3f3f46' : '#e2e8f0';
  const texto = isDark ? '#ffffff' : '#0f172a';
  const suave = isDark ? '#a1a1aa' : '#64748b';

  const chips: { clave: Filtro; texto: string }[] = [
    { clave: 'TALLER', texto: 'Taller' },
    { clave: 'ATRASADOS', texto: 'Atrasados' },
    { clave: 'PRESUPUESTOS', texto: 'Presupuestos' },
  ];

  return (
    <div className="container-fluid font-monospace py-3" style={{ color: texto }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="fw-bold mb-0">Pedidos</h5>
        <button className="btn btn-sm btn-outline-secondary" onClick={cargar} aria-label="Actualizar">
          <i className="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      <div className="d-flex gap-2 mb-2 overflow-auto pb-1">
        {chips.map((c) => {
          const activo = filtro === c.clave;
          const color = c.clave === 'ATRASADOS' ? '#dc3545' : '#8e45e0';
          return (
            <button
              key={c.clave}
              type="button"
              className="btn btn-sm rounded-pill fw-semibold text-nowrap"
              style={{
                backgroundColor: activo ? color : 'transparent',
                color: activo ? '#ffffff' : texto,
                border: `1px solid ${activo ? color : borde}`,
              }}
              onClick={() => { setFiltro(c.clave); setAbierto(null); }}
            >
              {c.texto} <span className="ms-1 opacity-75">{conteo[c.clave]}</span>
            </button>
          );
        })}
      </div>

      <input
        type="search"
        className="form-control form-control-sm mb-3"
        placeholder="Buscar por cliente o N°…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ backgroundColor: tarjetaBg, color: texto, borderColor: borde }}
      />

      {pedidos === null ? (
        <div className="text-center py-5" style={{ color: suave }}>
          <div className="spinner-border spinner-border-sm me-2" role="status"></div>Cargando pedidos...
        </div>
      ) : error && pedidos.length === 0 ? (
        <div className="text-center py-5" style={{ color: suave }}>
          <i className="bi bi-wifi-off fs-2 d-block mb-2"></i>No se pudieron cargar los pedidos.
        </div>
      ) : visibles.length === 0 ? (
        <div className="text-center py-5" style={{ color: suave }}>
          <i className="bi bi-inbox fs-2 d-block mb-2"></i>
          {filtro === 'ATRASADOS' ? 'No hay pedidos atrasados.' : 'No hay pedidos para mostrar.'}
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {visibles.map((p) => {
            const atrasado = estaAtrasado(p);
            const total = Number(p.monto_total ?? 0);
            const sena = Number(p.monto_pago_adelantado ?? 0);
            const expandido = abierto === p.id_pedido;
            return (
              <div
                key={p.id_pedido}
                className="rounded-3 p-3"
                style={{ backgroundColor: tarjetaBg, border: `1px solid ${atrasado ? '#dc3545' : borde}`, cursor: 'pointer' }}
                onClick={() => setAbierto(expandido ? null : p.id_pedido)}
                role="button"
                aria-expanded={expandido}
              >
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div className="min-w-0">
                    <div className="fw-bold">#{p.id_pedido}</div>
                    <div className="small text-truncate" style={{ color: suave }}>{nombreCliente(p)}</div>
                  </div>
                  <EstadoBadge estado={p.estado} tamano="sm" />
                </div>

                <div className="d-flex justify-content-between align-items-end mt-2 small">
                  <div>
                    <div style={{ color: suave }}>Entrega</div>
                    <ContadorTiempo fechaEstimadaIso={p.fecha_entrega_estimada} />
                  </div>
                  <div className="text-end">
                    <div className="fw-bold">${formatearMonto(total)}</div>
                    <div style={{ color: sena >= total ? '#22c55e' : suave }}>
                      {sena >= total && total > 0 ? 'Pagado' : `Seña $${formatearMonto(sena)}`}
                    </div>
                  </div>
                </div>

                {expandido && (
                  <div className="mt-2 pt-2 small" style={{ borderTop: `1px dashed ${borde}` }}>
                    {(p.detalles ?? []).length === 0 ? (
                      <div style={{ color: suave }}>Sin productos cargados.</div>
                    ) : (
                      <ul className="list-unstyled mb-0">
                        {(p.detalles ?? []).map((d: any, i: number) => (
                          <li key={d.id_detalle ?? i} className="d-flex justify-content-between gap-2 py-1">
                            <span className="text-truncate">{d.cantidad} × {d.producto?.nombreProducto ?? 'Producto'}</span>
                            <span className="text-nowrap">${formatearMonto(Number(d.subtotal ?? 0))}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {p.ubicacion_estante && (
                      <div className="mt-1" style={{ color: suave }}><i className="bi bi-geo-alt me-1"></i>Estante {p.ubicacion_estante}</div>
                    )}
                    {p.observaciones && (
                      <div className="mt-1" style={{ color: suave, whiteSpace: 'pre-wrap' }}><i className="bi bi-chat-left-text me-1"></i>{p.observaciones}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
