import React from 'react';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type SeccionInforme = 'MENU' | 'finanzas' | 'ventas' | 'operaciones' | 'clientes' | 'control';
export type TipoComparacion = 'dia' | 'semana' | 'mes' | 'personalizado';
export type InformeComparacion = 
  | 'ingresos' 
  | 'mediosPago' 
  | 'egresos' 
  | 'estados' 
  | 'productos' 
  | 'categorias' 
  | 'recaudacionEmpleados' 
  | 'pedidosEmpleados' 
  | 'clientes' 
  | 'categoriasCliente';

export interface KpiCard {
  label: string;
  sub: string;
  val: string | number;
  color: string;
  icon: string;
  points: string;
  changePercent?: number;
}

export interface PeriodoRango {
  desde: string;
  hasta: string;
}

export interface ComparacionDataState {
  actual: any;
  anterior: any;
  periodoActual: PeriodoRango;
  periodoAnterior: PeriodoRango;
}

export interface MermaItem {
  id: number;
  fecha: string;
  cantidad: number;
  insumo: string;
  motivo: string;
}

export interface AveriaItem {
  id: number;
  fecha: string;
  cantidad: number;
  maquina: string;
  detalle: string;
}

// ==========================================
// CONSTANTS & MOCK DATA
// ==========================================

export const COLORES_TORTA: string[] = ['#8e45e0', '#20c997', '#e22e2e', '#0dcaf0', '#ffc107'];

export const MERMAS_MOCK: MermaItem[] = [
  { id: 1, fecha: new Date().toISOString(), cantidad: 3, insumo: 'Papel Ilustración 300g (A3)', motivo: 'Error de impresión / Mancha de tinta' },
  { id: 2, fecha: new Date(Date.now() - 3600000 * 2).toISOString(), cantidad: 1, insumo: 'Vinilo Impreso M2', motivo: 'Corte defectuoso de guillotina' },
  { id: 3, fecha: new Date(Date.now() - 86400000 * 1).toISOString(), cantidad: 5, insumo: 'Papel Obra 80g (A4)', motivo: 'Papel atascado y arrugado' },
  { id: 4, fecha: new Date(Date.now() - 86400000 * 3).toISOString(), cantidad: 2, insumo: 'Lona Frontlit M2', motivo: 'Vinilo mal alineado' },
  { id: 5, fecha: new Date(Date.now() - 86400000 * 30).toISOString(), cantidad: 8, insumo: 'Tinta Negra Sublimación (ml)', motivo: 'Fallo de calibración de color' }
];

export const AVERIAS_MOCK: AveriaItem[] = [
  { id: 1, fecha: new Date().toISOString(), cantidad: 1, maquina: 'Plotter Roland VG3', detalle: 'Atasco en cabezal principal' },
  { id: 2, fecha: new Date(Date.now() - 3600000 * 3).toISOString(), cantidad: 1, maquina: 'Guillotina Industrial', detalle: 'Fallo en sensor de seguridad' },
  { id: 3, fecha: new Date(Date.now() - 86400000 * 1).toISOString(), cantidad: 2, maquina: 'Impresora Ricoh C7200', detalle: 'Sobrecalentamiento en fusor' }
];

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Genera un sparkline "tipo bolsa": muchos puntos con variaciones chicas y acotadas,
 * determinístico según una semilla.
 */
export function generarPuntosSparkline(
  semilla: number,
  cantidadPuntos: number = 36,
  amplitud: number = 6,
  base: number = 25
): string {
  let s = semilla;
  const random = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  let y = base;
  const puntos: string[] = [];
  const paso = 200 / (cantidadPuntos - 1);

  for (let i = 0; i < cantidadPuntos; i++) {
    const delta = (random() - 0.5) * amplitud;
    y = Math.max(8, Math.min(42, y + delta));
    puntos.push(`${(i * paso).toFixed(1)},${y.toFixed(1)}`);
  }

  return puntos.join(' ');
}

/**
 * Agrupa una colección de items por períodos de tiempo (Horas, Días, Semanas, Meses, Años)
 */
export function agruparPorPeriodo<T>(
  items: T[],
  desde: Date,
  hasta: Date,
  esUnSoloDia: boolean,
  esPorSemanas: boolean,
  esPorMeses: boolean,
  esPorAnios: boolean,
  getFecha: (item: T) => Date,
  getValor: (item: T) => number
): { name: string; valor: number }[] {
  const obtenerEtiqueta = (fecha: Date): string => {
    if (esUnSoloDia) {
      return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (esPorAnios) {
      return `${fecha.getFullYear()}`;
    }
    if (esPorMeses) {
      return fecha.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
    }
    if (esPorSemanas) {
      const fNorm = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 12, 0, 0);
      const primerDiaAno = new Date(fecha.getFullYear(), 0, 1, 12, 0, 0);
      const dias = Math.floor((fNorm.getTime() - primerDiaAno.getTime()) / (1000 * 60 * 60 * 24));
      const numeroSemana = Math.ceil((dias + primerDiaAno.getDay() + 1) / 7);
      return `Sem ${numeroSemana}`;
    }
    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  };

  const mapa: { [key: string]: number } = {};

  if (!esUnSoloDia) {
    if (esPorAnios) {
      for (let y = desde.getFullYear(); y <= hasta.getFullYear(); y++) {
        mapa[`${y}`] = 0;
      }
    } else if (esPorMeses) {
      let curr = new Date(desde.getFullYear(), desde.getMonth(), 1, 12, 0, 0);
      const fin = new Date(hasta.getFullYear(), hasta.getMonth(), 1, 12, 0, 0);
      while (curr <= fin) {
        mapa[obtenerEtiqueta(curr)] = 0;
        curr.setMonth(curr.getMonth() + 1);
      }
    } else if (esPorSemanas) {
      let curr = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate(), 12, 0, 0);
      const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate(), 12, 0, 0);
      while (curr <= fin) {
        mapa[obtenerEtiqueta(curr)] = 0;
        curr.setDate(curr.getDate() + 7);
      }
    } else {
      let curr = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate(), 12, 0, 0);
      const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate(), 12, 0, 0);
      while (curr <= fin) {
        mapa[obtenerEtiqueta(curr)] = 0;
        curr.setDate(curr.getDate() + 1);
      }
    }
  }

  items.forEach((item) => {
    const f = getFecha(item);
    const tag = obtenerEtiqueta(f);
    const val = getValor(item);

    if (mapa[tag] !== undefined) {
      mapa[tag] += val;
    } else {
      mapa[tag] = val;
    }
  });

  return Object.keys(mapa).map((key) => ({
    name: key,
    valor: mapa[key]
  }));
}

/**
 * Calcula rangos de comparación actual vs anterior según el tipo seleccionado.
 */
export function calcularPeriodoComparacion(fDesde: string, fHasta: string, tipo: TipoComparacion) {
  const parse = (v: string) => {
    const [y, m, d] = v.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const format = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const desde = parse(fDesde);
  const hasta = parse(fHasta);

  if (tipo === 'personalizado' || tipo === 'dia') {
    const cantidadDias = Math.max(1, Math.round((hasta.getTime() - desde.getTime()) / 86400000) + 1);
    const anteriorDesde = new Date(desde);
    const anteriorHasta = new Date(hasta);

    anteriorDesde.setDate(anteriorDesde.getDate() - cantidadDias);
    anteriorHasta.setDate(anteriorHasta.getDate() - cantidadDias);

    return {
      actual: { desde: format(desde), hasta: format(hasta) },
      anterior: { desde: format(anteriorDesde), hasta: format(anteriorHasta) }
    };
  }

  if (tipo === 'semana') {
    const actualHasta = parse(fHasta);
    const actualDesde = new Date(actualHasta);
    actualDesde.setDate(actualDesde.getDate() - 6);

    const anteriorHasta = new Date(actualDesde);
    anteriorHasta.setDate(anteriorHasta.getDate() - 1);
    const anteriorDesde = new Date(anteriorHasta);
    anteriorDesde.setDate(anteriorDesde.getDate() - 6);

    return {
      actual: { desde: format(actualDesde), hasta: format(actualHasta) },
      anterior: { desde: format(anteriorDesde), hasta: format(anteriorHasta) }
    };
  }

  // tipo === 'mes'
  const actualHasta = parse(fHasta);
  const actualDesde = new Date(actualHasta.getFullYear(), actualHasta.getMonth(), 1);
  const anteriorHasta = new Date(actualDesde);
  anteriorHasta.setDate(anteriorHasta.getDate() - 1);
  const anteriorDesde = new Date(anteriorHasta.getFullYear(), anteriorHasta.getMonth(), 1);

  return {
    actual: { desde: format(actualDesde), hasta: format(actualHasta) },
    anterior: { desde: format(anteriorDesde), hasta: format(anteriorHasta) }
  };
}

/**
 * Devuelve el título legible correspondiente a una clave de informe de comparación.
 */
export function obtenerNombreInforme(informe: InformeComparacion | null): string {
  const nombres: Record<InformeComparacion, string> = {
    ingresos: 'Evolución de Ingresos a Caja',
    mediosPago: 'Tipos / Medios de Pago',
    egresos: 'Egresos y Salidas de Caja Detallados',
    estados: 'Distribución por Estados',
    productos: 'Productos Más Vendidos',
    categorias: 'Categorías Más Vendidas',
    recaudacionEmpleados: 'Recaudación de Empleado por Pago Completado',
    pedidosEmpleados: 'Pedidos Completados por Empleado',
    clientes: 'Clientes Más Activos',
    categoriasCliente: 'Ventas por Categoría de Cliente'
  };
  return informe ? nombres[informe] : '';
}

/**
 * Formatea un objeto Date a formato ISO (YYYY-MM-DD) para controles `<input type="date">`.
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ==========================================
// RECHARTS CUSTOM TOOLTIPS
// ==========================================

export const CustomAreaTooltip: React.FC<any> = ({ active, payload, label, esMismoDia }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const saldoAcumulado = payload[0].value;
    const esEgreso = data.esEgreso; 
    const montoMovimiento = data.montoMovimiento || 0;

    return (
      <div 
        className="p-2 rounded-3 shadow-lg im-surface" 
        style={{ border: `1px solid ${esEgreso ? '#e22e2e' : '#8e45e0'}`, fontSize: '0.85rem' }}
      >
        <div className="d-flex align-items-center justify-content-between gap-3 mb-2 pb-1 border-bottom border-secondary border-opacity-25">
          <span className="fw-bold text-body-secondary">{label}</span>
          {esMismoDia && (
            <span className={`fw-bold badge ${esEgreso ? 'bg-danger' : 'bg-success'}`}>
              {esEgreso ? `- $${Math.abs(montoMovimiento).toLocaleString('es-AR')}` : `+ $${Math.abs(montoMovimiento).toLocaleString('es-AR')}`}
            </span>
          )}
        </div>
        <div className="d-flex align-items-center justify-content-between gap-2">
          <span className="text-body-secondary">Estado Caja:</span>
          <span className="fw-bold" style={{ color: '#20c997' }}>
            ${saldoAcumulado.toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const CustomEgresoTooltip: React.FC<any> = ({ active, payload, esMismoDia }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #e22e2e', fontSize: '0.85rem' }}>
        <div className="fw-bold text-body-secondary mb-1 border-bottom border-secondary border-opacity-25 pb-1">
          {data.ejeX}
        </div>
        <div className="fw-bold text-danger mb-1">
          Total Egreso: - ${Math.abs(data.monto).toLocaleString('es-AR')}
        </div>
        {esMismoDia && (
          <div className="small text-body-secondary">
            <strong className="text-body">Razón / Desc:</strong> {data.descripcion || 'Sin descripción'}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const CustomMermaTooltip: React.FC<any> = ({ active, payload, esMismoDia }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #ffc107', fontSize: '0.85rem' }}>
        <div className="fw-bold text-warning mb-1 border-bottom border-secondary border-opacity-25 pb-1">
          {data.ejeX} - {data.cantidad} un. desperdiciadas
        </div>

        {esMismoDia && (
          <div className="mt-2">
            {data.insumo && (
              <div className="small text-body mb-1">
                <strong className="text-warning">Insumo:</strong> {data.insumo}
              </div>
            )}
            {data.motivo && (
              <div className="small text-body-secondary">
                <strong className="text-warning">Motivo:</strong> {data.motivo}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const CustomAveriaTooltip: React.FC<any> = ({ active, payload, esMismoDia }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #fd7e14', fontSize: '0.85rem' }}>
        <div className="fw-bold mb-1 border-bottom border-secondary border-opacity-25 pb-1" style={{ color: '#fd7e14' }}>
          {data.ejeX} - {data.cantidad} avería(s)
        </div>
        {esMismoDia && (
          <>
            <div className="small text-body-secondary"><strong className="text-body">Equipo:</strong> {data.maquina || 'No especificado'}</div>
            <div className="small text-body-secondary"><strong className="text-body">Falla:</strong> {data.detalle || 'Sin detalle'}</div>
          </>
        )}
      </div>
    );
  }
  return null;
};

export const CustomEmpleadoTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #0dcaf0', fontSize: '0.85rem' }}>
        <div className="fw-bold text-info mb-1 border-bottom border-secondary border-opacity-25 pb-1">
          {data.name}
        </div>
        <div className="text-body-secondary">
          <strong className="text-body">Ventas / Recaudación:</strong> ${Number(data.ventas || 0).toLocaleString('es-AR')}
        </div>
        <div className="text-body-secondary">
          <strong className="text-body">Pedidos completados:</strong> {data.pedidosCompletados || 0}
        </div>
      </div>
    );
  }
  return null;
};

export const CustomArqueoTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #f43f5e', fontSize: '0.85rem' }}>
        <div className="fw-bold text-body mb-1 border-bottom border-secondary border-opacity-25 pb-1">
          {data.empleado}
        </div>
        <div className="text-danger fw-bold mb-1">
          Total Faltante / Ajuste: ${Number(data.montoDiferencia || 0).toLocaleString('es-AR')}
        </div>
        <div className="small text-body-secondary">
          Incongruencias detectadas: {data.cantidadIncongruencias}
        </div>
      </div>
    );
  }
  return null;
};