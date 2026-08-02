import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { pedidoService } from '../../services/pedidoService';
import { cajaService, type MovimientoCaja } from '../../services/cajaService';
import type { Pedido } from '../../types/Pedido';
import { getProductos } from '../../services/productoService';

// --- MOCK DATA TEMPORAL DE MERMAS Y AVERÍAS ---
const MERMAS_MOCK = [
  { id: 1, fecha: new Date().toISOString(), cantidad: 3, insumo: 'Papel Ilustración 300g (A3)', motivo: 'Error de impresión / Mancha de tinta' },
  { id: 2, fecha: new Date(Date.now() - 3600000 * 2).toISOString(), cantidad: 1, insumo: 'Vinilo Impreso M2', motivo: 'Corte defectuoso de guillotina' },
  { id: 3, fecha: new Date(Date.now() - 86400000 * 1).toISOString(), cantidad: 5, insumo: 'Papel Obra 80g (A4)', motivo: 'Papel atascado y arrugado' },
  { id: 4, fecha: new Date(Date.now() - 86400000 * 3).toISOString(), cantidad: 2, insumo: 'Lona Frontlit M2', motivo: 'Vinilo mal alineado' },
  { id: 5, fecha: new Date(Date.now() - 86400000 * 30).toISOString(), cantidad: 8, insumo: 'Tinta Negra Sublimación (ml)', motivo: 'Fallo de calibración de color' }
];

const AVERIAS_MOCK = [
  { id: 1, fecha: new Date().toISOString(), cantidad: 1, maquina: 'Plotter Roland VG3', detalle: 'Atasco en cabezal principal' },
  { id: 2, fecha: new Date(Date.now() - 3600000 * 3).toISOString(), cantidad: 1, maquina: 'Guillotina Industrial', detalle: 'Fallo en sensor de seguridad' },
  { id: 3, fecha: new Date(Date.now() - 86400000 * 1).toISOString(), cantidad: 2, maquina: 'Impresora Ricoh C7200', detalle: 'Sobrecalentamiento en fusor' }
];

const COLORES_TORTA = ['#8e45e0', '#20c997', '#e22e2e', '#0dcaf0', '#ffc107'];

// Tooltip para Evolución de Caja
const CustomAreaTooltip = ({ active, payload, label, esMismoDia }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const saldoAcumulado = payload[0].value;
    const esEgreso = data.esEgreso;
    const montoMovimiento = data.montoMovimiento || 0;

    return (
      <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: `1px solid ${esEgreso ? '#e22e2e' : '#8e45e0'}`, color: '#fff', fontSize: '0.85rem' }}>
        <div className="d-flex align-items-center justify-content-between gap-3 mb-2 pb-1 border-bottom border-secondary" style={{ borderColor: '#3f3f46 !important' }}>
          <span className="fw-bold text-white-50">{label}</span>
          {esMismoDia && (
            <span className={`fw-bold badge ${esEgreso ? 'bg-danger' : 'bg-success'}`}>
              {esEgreso ? `- $${Math.abs(montoMovimiento).toLocaleString('es-AR')}` : `+ $${Math.abs(montoMovimiento).toLocaleString('es-AR')}`}
            </span>
          )}
        </div>
        <div className="d-flex align-items-center justify-content-between gap-2">
          <span className="text-white-50">Estado Caja:</span>
          <span className="fw-bold" style={{ color: '#20c997' }}>
            ${saldoAcumulado.toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip para Egresos
const CustomEgresoTooltip = ({ active, payload, esMismoDia }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: '1px solid #e22e2e', color: '#fff', fontSize: '0.85rem' }}>
        <div className="fw-bold text-white-50 mb-1 border-bottom border-secondary pb-1">
          {data.ejeX}
        </div>
        <div className="fw-bold text-danger mb-1">
          Total Egreso: - ${Math.abs(data.monto).toLocaleString('es-AR')}
        </div>
        {esMismoDia && (
          <div className="small text-white-50">
            <strong>Razón / Desc:</strong> {data.descripcion || 'Sin descripción'}
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Tooltip para Mermas Generadas
const CustomMermaTooltip = ({ active, payload, esMismoDia }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div 
        className="p-2 rounded-3 shadow-lg" 
        style={{ 
          backgroundColor: '#222122', 
          border: '1px solid #ffc107', 
          color: '#fff', 
          fontSize: '0.85rem' 
        }}
      >
        <div className="fw-bold text-warning mb-1 border-bottom border-secondary pb-1">
          {data.ejeX} - {data.cantidad} un. desperdiciadas
        </div>

        {esMismoDia && (
          <div className="mt-2">
            {data.insumo && (
              <div className="small text-white mb-1">
                <strong className="text-warning">Insumo:</strong> {data.insumo}
              </div>
            )}
            {data.motivo && (
              <div className="small text-white-50">
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

// Tooltip para Máquinas Averiadas
const CustomAveriaTooltip = ({ active, payload, esMismoDia }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: '1px solid #fd7e14', color: '#fff', fontSize: '0.85rem' }}>
        <div className="fw-bold text-white mb-1 border-bottom border-secondary pb-1" style={{ color: '#fd7e14' }}>
          {data.ejeX} - {data.cantidad} avería(s)
        </div>
        {esMismoDia && (
          <>
            <div className="small text-white-50"><strong>Equipo:</strong> {data.maquina || 'No especificado'}</div>
            <div className="small text-white-50"><strong>Falla:</strong> {data.detalle || 'Sin detalle'}</div>
          </>
        )}
      </div>
    );
  }
  return null;
};

// Tooltip para Rendimiento de Empleados
const CustomEmpleadoTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: '1px solid #0dcaf0', color: '#fff', fontSize: '0.85rem' }}>
        <div className="fw-bold text-info mb-1 border-bottom border-secondary pb-1">
          {data.name}
        </div>
        <div className="text-white-50">
          <strong className="text-white">Ventas / Recaudación:</strong> ${Number(data.ventas || 0).toLocaleString('es-AR')}
        </div>
        <div className="text-white-50">
          <strong className="text-white">Pedidos completados:</strong> {data.pedidosCompletados || 0}
        </div>
      </div>
    );
  }
  return null;
};

const CustomArqueoTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: '1px solid #f43f5e', color: '#fff', fontSize: '0.85rem' }}>
        <div className="fw-bold text-white mb-1 border-bottom border-secondary pb-1">
          {data.empleado}
        </div>
        <div className="text-danger fw-bold mb-1">
          Total Faltante / Ajuste: ${Number(data.montoDiferencia || 0).toLocaleString('es-AR')}
        </div>
        <div className="small text-white-50">
          Incongruencias detectadas: {data.cantidadIncongruencias}
        </div>
      </div>
    );
  }
  return null;
};

function agruparPorPeriodo<T>(
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
      const primerDiaAno = new Date(fecha.getFullYear(), 0, 1);
      const dias = Math.floor((fecha.getTime() - primerDiaAno.getTime()) / (1000 * 60 * 60 * 24));
      const numeroSemana = Math.ceil((dias + primerDiaAno.getDay() + 1) / 7);
      return `Sem ${numeroSemana} (${fecha.getFullYear()})`;
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
      let curr = new Date(desde.getFullYear(), desde.getMonth(), 1);
      const fin = new Date(hasta.getFullYear(), hasta.getMonth(), 1);
      while (curr <= fin) {
        mapa[obtenerEtiqueta(curr)] = 0;
        curr.setMonth(curr.getMonth() + 1);
      }
    } else if (esPorSemanas) {
      let curr = new Date(desde);
      while (curr <= hasta) {
        mapa[obtenerEtiqueta(curr)] = 0;
        curr.setDate(curr.getDate() + 7);
      }
    } else {
      let curr = new Date(desde);
      while (curr <= hasta) {
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

type SeccionInforme = 'MENU' | 'finanzas' | 'ventas' | 'operaciones' | 'clientes' | 'control';

export const InformesView: React.FC = () => {
  const hoy = new Date().toLocaleDateString('sv-SE');

  const [seccionActiva, setSeccionActiva] = useState<SeccionInforme>('MENU');

  const [fechaDesdeInput, setFechaDesdeInput] = useState(hoy);
  const [fechaHastaInput, setFechaHastaInput] = useState(hoy);

  const [fechaDesde, setFechaDesde] = useState(hoy);
  const [fechaHasta, setFechaHasta] = useState(hoy);
  
  const [pedidosRaw, setPedidosRaw] = useState<any[]>([]);
  const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCaja[]>([]);
  const [cargando, setCargando] = useState(false);
  const [, setListaProductos] = useState<any[]>([]);
  const [topClientes, setTopClientes] = useState<any[]>([]);
  const [incongruenciasArqueo, setIncongruenciasArqueo] = useState<any[]>([]);

  const [metricas, setMetricas] = useState<any>({
    ventasTotales: 0,
    ticketsGenerados: 0,
    ticketPromedio: 0,
    cantidadMovimientos: 0,
    ventasPorPeriodo: [],
    distribucionMediosPago: [],
    distribucionEstados: [],
    rendimientoEmpleados: [],
    detalleEgresos: [],
    mermasPorPeriodo: [],
    averiasPorPeriodo: [],
    productosMasVendidos: [],
    categoriasMasVendidas: [],
    ventasPorCategoriaCliente: []
  });

  const procesarMetricas = (
    fDesde: string, 
    fHasta: string, 
    pedidosLista = pedidosRaw, 
    cajaLista = movimientosCaja
  ) => {
    const parseFechaLocal = (fechaStr: string) => {
      if (!fechaStr) return new Date();
      const [year, month, day] = fechaStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const desde = parseFechaLocal(fDesde);
    desde.setHours(0, 0, 0, 0);

    const hasta = parseFechaLocal(fHasta);
    hasta.setHours(23, 59, 59, 999);

    const movimientosEnRango = cajaLista.filter((m) => {
      if (!m.fecha) return false;
      const fechaMov = new Date(m.fecha);
      return fechaMov >= desde && fechaMov <= hasta;
    });

    const esMovimientoEgreso = (m: any) => {
      const tipo = (m.tipoMovimiento || m.tipo || m.tipo_movimiento || '').toString().toUpperCase();
      const desc = (m.descripcion || '').toString().toUpperCase();
      const montoNum = Number(m.monto || 0);

      return (
        tipo === 'EGRESO' ||
        tipo === 'SALIDA' ||
        tipo === 'RETIRO' ||
        desc.includes('EGRESO') ||
        desc.includes('RETIRO DE CAJA') ||
        montoNum < 0
      );
    };

    const ingresosCaja = movimientosEnRango.filter((m) => !esMovimientoEgreso(m));
    const egresosCaja = movimientosEnRango.filter((m) => esMovimientoEgreso(m));

    const totalIngresosBrutos = ingresosCaja.reduce((acc, m) => acc + Math.abs(Number(m.monto || 0)), 0);

    const saldoNetoCaja = movimientosEnRango.reduce((acc, m) => {
      const esEgreso = esMovimientoEgreso(m);
      const montoAbs = Math.abs(Number(m.monto || 0));
      return esEgreso ? acc - montoAbs : acc + montoAbs;
    }, 0);

    const pedidosEnRango = (pedidosLista || []).filter((p) => {
      const fechaPedido = new Date(p.fecha_creacion || p.fechaCreacion || p.fecha);
      return fechaPedido >= desde && fechaPedido <= hasta;
    });

    const pedidosPendientes = pedidosEnRango.filter((p) => (p.estado || '').toUpperCase() === 'PENDIENTE');

    const ticketsGenerados = pedidosEnRango.filter((p) => {
      const estado = (p.estado || '').toUpperCase();
      return estado === 'ENTREGADO' || estado === 'COMPLETADO' || estado === 'FINALIZADO';
    }).length;

    const ticketsFinales = ticketsGenerados > 0 ? ticketsGenerados : pedidosEnRango.length;

    const ticketPromedio = ticketsFinales > 0 
      ? (totalIngresosBrutos / ticketsFinales).toFixed(2) 
      : '0.00';

    const cantidadMovimientos = movimientosEnRango.length;

    // --- PRODUCTOS MÁS VENDIDOS Y CATEGORÍAS MÁS VENDIDAS ---
    const mapaProductos: { [key: string]: { cantidad: number; nombre: string } } = {};
    const mapaCategorias: { [key: string]: number } = {};
    const mapaCategoriasCliente: { [key: string]: { cantidad: number; monto: number } } = {};

    pedidosEnRango.forEach((p: any) => {
      const clienteObj = p.cliente;
      const catClienteObj = clienteObj?.categoriaCliente || clienteObj?.categoria || p.categoriaCliente;
      let nombreCatCliente = catClienteObj?.nombreCategoria || catClienteObj?.nombre;

      if (!nombreCatCliente) {
        const obs = p.observaciones || '';
        const matchDescuento = obs.match(/\[Descuento aplicado:\s*([^\]]+)\]/i);

        if (matchDescuento && matchDescuento[1]) {
          const descTexto = matchDescuento[1].trim();
          nombreCatCliente = `Estudiante (${descTexto})`;
        } else {
          nombreCatCliente = 'Sin Categoría / General';
        }
      }

      const montoPedido = Number(p.monto_total || p.montoTotal || p.total || 0);

      if (!mapaCategoriasCliente[nombreCatCliente]) {
        mapaCategoriasCliente[nombreCatCliente] = { cantidad: 0, monto: 0 };
      }
      mapaCategoriasCliente[nombreCatCliente].cantidad += 1;
      mapaCategoriasCliente[nombreCatCliente].monto += montoPedido;

      const detalles = p.detalles || [];

      if (Array.isArray(detalles) && detalles.length > 0) {
        detalles.forEach((item: any) => {
          const prodObj = item.producto;

          const idProd = prodObj?.idProducto || item.idProducto;
          const nombreReal = prodObj?.nombreProducto || prodObj?.nombre || prodObj?.descripcion;

          const nombreFinal = nombreReal || (idProd ? `Producto #${idProd}` : 'Producto Sin Nombre');
          const key = String(idProd || nombreFinal);
          const cantidad = Number(item.cantidad || 1);

          if (!mapaProductos[key]) {
            mapaProductos[key] = { cantidad: 0, nombre: nombreFinal };
          }
          mapaProductos[key].cantidad += cantidad;

          let nombreCat = prodObj?.categoria?.nombre || 'General';
          mapaCategorias[nombreCat] = (mapaCategorias[nombreCat] || 0) + cantidad;
        });
      }
    });

    const top5Productos = Object.values(mapaProductos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    const productosMasVendidos = top5Productos.map((item, index) => ({
      name: `Top ${index + 1}`,
      nombreReal: item.nombre,
      value: item.cantidad,
      color: COLORES_TORTA[index % COLORES_TORTA.length]     
    }));

    const categoriasMasVendidas = Object.keys(mapaCategorias)
      .map((nombre) => ({
        name: nombre,
        ventas: mapaCategorias[nombre]
      }))
      .sort((a, b) => b.ventas - a.ventas);

    const ventasPorCategoriaCliente = Object.keys(mapaCategoriasCliente).map((nombreCat) => ({
      name: nombreCat,
      ventas: mapaCategoriasCliente[nombreCat].cantidad,
      montoTotal: mapaCategoriasCliente[nombreCat].monto
    }));

    // --- RECAUDACIÓN REAL + TRABAJOS PENDIENTES POR OPERARIO ---
    const mapaEmpleados: { [key: string]: { ventas: number; pedidos: number } } = {};

    const obtenerNombreOperario = (empObj: any) => {
      if (!empObj) return "Sin Asignar";
      return empObj.persona 
        ? `${empObj.persona.nombre} ${empObj.persona.apellido}` 
        : (empObj.nombre || `Emp #${empObj.idEmpleado || empObj.id_empleado || empObj.idUsuario}`);
    };

    const pedidosContados = new Set<string | number>();
    pedidosEnRango.forEach((p) => {
      const idPed = p.idPedido || p.id_pedido || p.id;
      const estado = (p.estado || '').toUpperCase();

      if (estado === 'ENTREGADO' || estado === 'COMPLETADO' || estado === 'FINALIZADO') {
        const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0
          ? p.asignaciones[p.asignaciones.length - 1]
          : null;
        const nombreEmp = obtenerNombreOperario(ultimaAsignacion?.empleado || p.empleado);

        if (!mapaEmpleados[nombreEmp]) {
          mapaEmpleados[nombreEmp] = { ventas: 0, pedidos: 0 };
        }

        mapaEmpleados[nombreEmp].pedidos += 1;
        if (idPed) pedidosContados.add(idPed);
      }
    });

    ingresosCaja.forEach((m: any) => {
      let nombreEmp = "Sin Asignar";

      if (m.pedido) {
        const p = m.pedido;
        const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0
          ? p.asignaciones[p.asignaciones.length - 1]
          : null;
        nombreEmp = obtenerNombreOperario(ultimaAsignacion?.empleado || p.empleado || m.usuario);
      } else if (m.usuario) {
        nombreEmp = obtenerNombreOperario(m.usuario);
      }

      if (!mapaEmpleados[nombreEmp]) {
        mapaEmpleados[nombreEmp] = { ventas: 0, pedidos: 0 };
      }

      mapaEmpleados[nombreEmp].ventas += Math.abs(Number(m.monto || 0));

      const idPed = m.idPedido || m.id_pedido || m.pedido?.id || m.pedido?.idPedido;
      if (idPed && !pedidosContados.has(idPed)) {
        mapaEmpleados[nombreEmp].pedidos += 1;
        pedidosContados.add(idPed);
      } else if (!idPed && m.descripcion?.toUpperCase().includes('PEDIDO')) {
        mapaEmpleados[nombreEmp].pedidos += 1;
      }
    });

    pedidosPendientes.forEach((p) => {
      const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0
        ? p.asignaciones[p.asignaciones.length - 1]
        : null;
      const nombreEmp = obtenerNombreOperario(ultimaAsignacion?.empleado || p.empleado);

      if (!mapaEmpleados[nombreEmp]) {
        mapaEmpleados[nombreEmp] = { ventas: 0, pedidos: 0 };
      }
      mapaEmpleados[nombreEmp].ventas += Number(p.monto_total || p.total || 0);
    });

    const rendimientoEmpleados = Object.keys(mapaEmpleados).map((nombre) => ({
      name: nombre,
      ventas: mapaEmpleados[nombre].ventas,
      pedidosCompletados: mapaEmpleados[nombre].pedidos
    }));

    // --- CÁLCULO DE DIFERENCIAS TEMPORALES ---
    const diffTiempoMs = Math.abs(hasta.getTime() - desde.getTime());
    const diffDias = Math.ceil(diffTiempoMs / (1000 * 60 * 60 * 24));
    const diffMeses = (hasta.getFullYear() - desde.getFullYear()) * 12 + (hasta.getMonth() - desde.getMonth());
    const diffAnios = hasta.getFullYear() - desde.getFullYear();

    const esUnSoloDia = fDesde === fHasta;
    const esPorAnios = diffAnios >= 1 && diffDias > 365; 
    const esPorMeses = !esPorAnios && (diffMeses >= 2 || diffDias > 60); 
    const esPorSemanas = !esPorAnios && !esPorMeses && diffDias > 14;

    // --- EVOLUCIÓN DE INGRESOS ---
    let ventasPorPeriodo: any[] = [];

    if (esUnSoloDia) {
      const mapaHoras: { [hora: string]: { delta: number; esEgreso: boolean } } = {};
      const movsOrdenados = [...movimientosEnRango].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

      movsOrdenados.forEach((m) => {
        const f = new Date(m.fecha);
        const horaStr = f.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
        const esEgreso = esMovimientoEgreso(m);
        const delta = esEgreso ? -Math.abs(Number(m.monto || 0)) : Math.abs(Number(m.monto || 0));

        if (!mapaHoras[horaStr]) {
          mapaHoras[horaStr] = { delta: 0, esEgreso: false };
        }

        mapaHoras[horaStr].delta += delta;
        mapaHoras[horaStr].esEgreso = mapaHoras[horaStr].delta < 0 || esEgreso;
      });

      let acumulado = 0;
      ventasPorPeriodo = Object.keys(mapaHoras).map((hora) => {
        acumulado += mapaHoras[hora].delta;
        return {
          name: hora,
          ventas: acumulado < 0 ? 0 : acumulado,
          esEgreso: mapaHoras[hora].esEgreso,
          montoMovimiento: mapaHoras[hora].delta
        };
      });

      if (ventasPorPeriodo.length === 0) {
        ventasPorPeriodo = [{ name: '00:00', ventas: 0, esEgreso: false, montoMovimiento: 0 }];
      }
    } else {
      const datosAgrupados = agruparPorPeriodo(
        movimientosEnRango,
        desde,
        hasta,
        esUnSoloDia,
        esPorSemanas,
        esPorMeses,
        esPorAnios,
        (m) => new Date(m.fecha),
        (m) => (esMovimientoEgreso(m) ? -Math.abs(Number(m.monto || 0)) : Math.abs(Number(m.monto || 0)))
      );

      ventasPorPeriodo = datosAgrupados.map((item) => ({
        name: item.name,
        ventas: item.valor < 0 ? 0 : item.valor,
        esEgreso: false,
        montoMovimiento: item.valor
      }));
    }

    // --- DETALLE DE EGRESOS ---
    let detalleEgresos: { ejeX: string; monto: number; descripcion?: string }[] = [];

    if (esUnSoloDia) {
      detalleEgresos = egresosCaja.map((m: any) => ({
        ejeX: new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        monto: Math.abs(Number(m.monto || 0)),
        descripcion: m.descripcion || 'Sin descripción'
      }));
    } else {
      const egresosAgrupados = agruparPorPeriodo(
        egresosCaja,
        desde,
        hasta,
        esUnSoloDia,
        esPorSemanas,
        esPorMeses,
        esPorAnios,
        (m) => new Date(m.fecha),
        (m) => Math.abs(Number(m.monto || 0))
      );

      detalleEgresos = egresosAgrupados.map((item) => ({
        ejeX: item.name,
        monto: item.valor
      }));
    }

    const mermasEnRango = MERMAS_MOCK.filter((item) => {
      const f = new Date(item.fecha);
      return f >= desde && f <= hasta;
    });

    let mermasPorPeriodo: any[] = [];
    if (esUnSoloDia) {
      mermasPorPeriodo = mermasEnRango.map((item) => ({
        ejeX: new Date(item.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        cantidad: item.cantidad,
        insumo: item.insumo,
        motivo: item.motivo
      }));
    } else {
      const mermasAgrupadas = agruparPorPeriodo(
        mermasEnRango,
        desde,
        hasta,
        esUnSoloDia,
        esPorSemanas,
        esPorMeses,
        esPorAnios,
        (item) => new Date(item.fecha),
        (item) => item.cantidad
      );

      mermasPorPeriodo = mermasAgrupadas.map((item) => ({
        ejeX: item.name,
        cantidad: item.valor
      }));
    }

    // --- LOS CLIENTES CON MÁS INGRESOS ---
    const mapaClientes: { [key: string]: { nombre: string; totalGastado: number; cantidadPedidos: number } } = {};

    const obtenerNombreCliente = (clienteObj: any, fallbackStr?: string): string => {
      let clienteNombre = '';

      if (typeof clienteObj === 'string' && clienteObj.trim()) {
        clienteNombre = clienteObj;
      } else if (clienteObj && typeof clienteObj === 'object') {
        if (clienteObj.razonSocial && clienteObj.razonSocial.trim()) {
          clienteNombre = clienteObj.razonSocial;
        } else if (clienteObj.persona) {
          const { nombre = '', apellido = '' } = clienteObj.persona;
          clienteNombre = `${nombre} ${apellido}`.trim();
        } else if (clienteObj.nombre) {
          const apellido = clienteObj.apellido || '';
          clienteNombre = `${clienteObj.nombre} ${apellido}`.trim();
        }
      }

      if (!clienteNombre && fallbackStr && typeof fallbackStr === 'string') {
        clienteNombre = fallbackStr;
      }

      const nombreLimpio = clienteNombre.trim().toLowerCase();

      if (
        !nombreLimpio || 
        nombreLimpio === 'ninguna' || 
        nombreLimpio === 'ninguno' || 
        nombreLimpio === 'null' || 
        nombreLimpio === 'undefined' ||
        nombreLimpio.includes('venta rápida') ||
        nombreLimpio.includes('venta rapida') ||
        nombreLimpio === 'caja'
      ) {
        return 'Consumidor Final';
      }

      return clienteNombre;
    };

    const idsPedidosProcesados = new Set<string | number>();

    pedidosEnRango.forEach((p: any) => {
      const estado = (p.estado || '').toUpperCase();
      if (estado === 'CANCELADO') return;

      const idPedido = p.idPedido || p.id_pedido || p.id;
      if (idPedido) {
        idsPedidosProcesados.add(idPedido);
        idsPedidosProcesados.add(String(idPedido));
      }

      const clienteNombre = obtenerNombreCliente(p.cliente, p.clienteNombre || p.nombreCliente || p.nombre_cliente);
      const monto = Number(p.monto_total || p.montoTotal || p.total || p.precioTotal || p.monto_abonado || 0);

      if (!mapaClientes[clienteNombre]) {
        mapaClientes[clienteNombre] = { nombre: clienteNombre, totalGastado: 0, cantidadPedidos: 0 };
      }

      mapaClientes[clienteNombre].totalGastado += monto;
      mapaClientes[clienteNombre].cantidadPedidos += 1;
    });

    ingresosCaja.forEach((m: any) => {
      const tipoMovimiento = (m.tipo || m.tipoMovimiento || '').toUpperCase();
      const montoOriginal = Number(m.monto || 0);

      if (tipoMovimiento === 'EGRESO' || tipoMovimiento === 'GASTO' || montoOriginal < 0) {
        return;
      }

      const idPed = m.idPedido || m.id_pedido || m.pedido?.id || m.pedido?.idPedido;
      const descripcion = (m.descripcion || m.concepto || '').toLowerCase();

      if (idPed && idPed !== '-' && idPed !== '0' && idPed !== 0) {
        if (idsPedidosProcesados.has(idPed) || idsPedidosProcesados.has(String(idPed))) {
          return;
        }
      }

      if (
        descripcion.includes('pedido') || 
        descripcion.includes('seña') || 
        descripcion.includes('sena') || 
        descripcion.includes('adelanto')
      ) {
        return;
      }

      if (descripcion.includes('venta rápida') || descripcion.includes('venta rapida')) {
        const coincideConPedido = pedidosEnRango.some((p: any) => {
          const montoPed = Number(p.monto_total || p.montoTotal || p.total || 0);
          return Math.abs(montoPed - montoOriginal) < 0.01;
        });

        if (coincideConPedido) return;
      }

      const clienteNombre = obtenerNombreCliente(m.cliente || m.pedido?.cliente, m.clienteNombre);

      if (!mapaClientes[clienteNombre]) {
        mapaClientes[clienteNombre] = { nombre: clienteNombre, totalGastado: 0, cantidadPedidos: 0 };
      }

      mapaClientes[clienteNombre].totalGastado += montoOriginal;
      mapaClientes[clienteNombre].cantidadPedidos += 1;
    });

    const topClientesFormateados = Object.values(mapaClientes)
      .sort((a, b) => b.totalGastado - a.totalGastado)
      .filter((item) => item.totalGastado > 0)
      .slice(0, 5)
      .map((item, index) => ({
        name: `Top ${index + 1}`,
        nombreReal: item.nombre,
        totalGastado: item.totalGastado,
        cantidadPedidos: item.cantidadPedidos,
        color: COLORES_TORTA[index % COLORES_TORTA.length]
      }));

    setTopClientes(topClientesFormateados);

    const mockIncongruenciasArqueo = [
      { empleado: 'Pepe', montoDiferencia: 1500, cantidadIncongruencias: 2 },
      { empleado: 'Martina', montoDiferencia: 850, cantidadIncongruencias: 1 },
      { empleado: 'Luca', montoDiferencia: 400, cantidadIncongruencias: 1 },
      { empleado: 'Anabel', montoDiferencia: 200, cantidadIncongruencias: 1 },
    ];

    setIncongruenciasArqueo(mockIncongruenciasArqueo);

    // --- MÁQUINAS AVERIADAS ---
    const averiasEnRango = AVERIAS_MOCK.filter((item) => {
      const f = new Date(item.fecha);
      return f >= desde && f <= hasta;
    });

    let averiasPorPeriodo: any[] = [];
    if (esUnSoloDia) {
      averiasPorPeriodo = averiasEnRango.map((item) => ({
        ejeX: new Date(item.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        cantidad: item.cantidad,
        maquina: item.maquina,
        detalle: item.detalle
      }));
    } else {
      const averiasAgrupadas = agruparPorPeriodo(
        averiasEnRango,
        desde,
        hasta,
        esUnSoloDia,
        esPorSemanas,
        esPorMeses,
        esPorAnios,
        (item) => new Date(item.fecha),
        (item) => item.cantidad
      );

      averiasPorPeriodo = averiasAgrupadas.map((item) => ({
        ejeX: item.name,
        cantidad: item.valor
      }));
    }

    // --- TIPOS / MEDIOS DE PAGO ---
    const mapaPagos: { [key: string]: number } = {};
    ingresosCaja.forEach((m: any) => {
      const montoAbs = Math.abs(Number(m.monto || 0));
      const medioTexto = (
        m.medioPago || m.medio_pago || m.metodoPago || m.metodo_pago ||
        m.formaPago || m.forma_pago || m.pedido?.medioPago || m.descripcion || ''
      ).toString().toUpperCase();

      const esTransferencia = 
        medioTexto.includes('TRANSFERENCIA') || medioTexto.includes('MERCADOPAGO') || 
        medioTexto.includes('MP') || medioTexto.includes('DEBITO') || medioTexto.includes('CREDITO');

      const claveMedio = esTransferencia ? 'TRANSFERENCIA' : 'EFECTIVO';
      mapaPagos[claveMedio] = (mapaPagos[claveMedio] || 0) + montoAbs;
    });

    const distribucionMediosPago = Object.keys(mapaPagos).map((key) => ({ name: key, value: mapaPagos[key] }));

    const pedidosCompletadosPorEmpleado = rendimientoEmpleados
      .filter((emp) => emp.pedidosCompletados > 0)
      .map((emp, index) => ({
        name: emp.name,
        value: emp.pedidosCompletados,
        color: COLORES_TORTA[index % COLORES_TORTA.length]
      }));

    // --- DISTRIBUCIÓN POR ESTADOS ---
    const mapaEstados: { [key: string]: number } = {};
    pedidosEnRango.forEach((p) => {
      let estado = (p.estado || 'PENDIENTE').toUpperCase();
      const descripcion = (p.descripcion || p.observaciones || p.tipo || '').toUpperCase();
      if (descripcion.includes('VENTA RÁPIDA') || descripcion.includes('VENTA RAPIDA') || p.esVentaRapida) {
        estado = 'FINALIZADO';
      }
      mapaEstados[estado] = (mapaEstados[estado] || 0) + 1;
    });
    const distribucionEstados = Object.keys(mapaEstados).map((key) => ({ name: key, value: mapaEstados[key] }));

    setMetricas({
      ventasTotales: saldoNetoCaja,
      ticketsGenerados: ticketsFinales,
      ticketPromedio,
      cantidadMovimientos,
      ventasPorPeriodo,
      distribucionMediosPago: distribucionMediosPago.length > 0 ? distribucionMediosPago : [{ name: 'EFECTIVO', value: totalIngresosBrutos }],
      distribucionEstados: distribucionEstados.length > 0 ? distribucionEstados : [{ name: 'Sin datos', value: 1 }],
      rendimientoEmpleados: rendimientoEmpleados.length > 0 ? rendimientoEmpleados : [{ name: 'Sin datos', ventas: 0 }],
      pedidosCompletadosPorEmpleado: pedidosCompletadosPorEmpleado.length > 0 ? pedidosCompletadosPorEmpleado : [{ name: 'Sin datos', value: 0 }],
      detalleEgresos,
      mermasPorPeriodo,
      averiasPorPeriodo,
      productosMasVendidos: productosMasVendidos.length > 0 ? productosMasVendidos : [{ name: 'Sin datos', value: 1 }],
      categoriasMasVendidas: categoriasMasVendidas.length > 0 ? categoriasMasVendidas : [{ name: 'Sin datos', ventas: 0 }],
      ventasPorCategoriaCliente: ventasPorCategoriaCliente.length > 0 ? ventasPorCategoriaCliente : [{ name: 'Sin datos', ventas: 0, montoTotal: 0 }]
    });
  };

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setCargando(true);
      try {
        const [dataPedidos, dataCaja, dataProductos] = await Promise.all([
          pedidoService.obtenerTodos(),
          cajaService.obtenerTodos(),
          getProductos()
        ]);

        const pedidosValidos = dataPedidos || [];
        const cajaValida = dataCaja || [];

        setPedidosRaw(pedidosValidos);
        setMovimientosCaja(cajaValida);
        setListaProductos(dataProductos || []);

        procesarMetricas(fechaDesdeInput, fechaHastaInput, pedidosValidos, cajaValida);
      } catch (error) {
        console.error("Error al cargar los informes iniciales:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosIniciales();
  }, []);

  const handleAnalizar = async () => {
    setCargando(true);
    try {
      setFechaDesde(fechaDesdeInput);
      setFechaHasta(fechaHastaInput);

      const [nuevosPedidos, nuevosMovimientos] = await Promise.all([
        pedidoService.obtenerTodos(),
        cajaService.obtenerTodos()
      ]);

      const pedidosValidos = nuevosPedidos || [];
      const cajaValida = nuevosMovimientos || [];

      setPedidosRaw(pedidosValidos);
      setMovimientosCaja(cajaValida);

      procesarMetricas(fechaDesdeInput, fechaHastaInput, pedidosValidos, cajaValida);
    } catch (error) {
      console.error("Error al recalcular informes:", error);
    } finally {
      setCargando(false);
    }
  };

  const esMismoDia = fechaDesde === fechaHasta;

  if (cargando && movimientosCaja.length === 0) {
    return (
      <div className="text-center text-white mt-5">
        <div className="spinner-border text-info mb-3"></div>
        <h4>Consolidando métricas del sistema...</h4>
      </div>
    );
  }

  // Lista de secciones para renderizar las tarjetas del menú
  const seccionesMenu: { id: SeccionInforme; label: string; desc: string; icon: string; color: string }[] = [
    { id: 'finanzas', label: 'FINANZAS Y CAJA', desc: 'Evolución de caja, egresos detallados y medios de pago', icon: 'bi-wallet2', color: '#8e45e0' },
    { id: 'ventas', label: 'VENTAS Y PRODUCTOS', desc: 'Estados de pedidos, productos y categorías con más rotación', icon: 'bi-bag-check-fill', color: '#20c997' },
    { id: 'operaciones', label: 'OPERACIONES Y RRHH', desc: 'Recaudación y pedidos finalizados por empleado', icon: 'bi-people-fill', color: '#0dcaf0' },
    { id: 'clientes', label: 'CLIENTES', desc: 'Clientes más activos y desglose por categorías', icon: 'bi-trophy-fill', color: '#ffc107' },
    { id: 'control', label: 'CONTROL INTERNO', desc: 'Reportes de mermas, diferencias de arqueo y fallas de máquinas', icon: 'bi-shield-check', color: '#f43f5e' }
  ];

  return (
    <div className="container-fluid text-white font-monospace pb-5">
      <style>{`
        .card-menu-item {
          background-color: #18181b;
          border: 1px solid #3f3f46;
          border-radius: 12px;
          transition: all 0.25s ease-in-out;
          cursor: pointer;
        }
        .card-menu-item:hover {
          background-color: #27272a !important;
          border-color: #52525b !important;
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
        }
        .card-menu-item:active {
          transform: translateY(0);
        }
        .btn-volver {
          background-color: #27272a;
          border: 1px solid #3f3f46;
          color: #fff;
          transition: all 0.2s ease;
        }
        .btn-volver:hover {
          background-color: #3f3f46;
          color: #fff;
        }
      `}</style>

      {/* HEADER CONTROLES DE FECHA (SIEMPRE VISIBLE) */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom border-secondary gap-3" style={{ borderColor: '#2d2d30 !important' }}>
        <div>
          <div className="d-flex align-items-center gap-2">
            <h2 className="fw-bold mb-0" style={{ color: '#ffffff' }}>Métricas e Informes</h2>
          </div>
          <p className="text-white-50 mb-0 small mt-1">Análisis consolidado de caja, producción y recursos</p>
        </div>

        {/* SELECTOR DE FECHAS */}
        <div className="d-flex align-items-center gap-2 p-2 rounded-3 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
  <i className="bi bi-calendar-range ms-2 text-white"></i>
  <input 
    type="date" 
    className="form-control form-control-sm bg-dark text-white border-0 font-monospace" 
    style={{ colorScheme: 'dark' }}
    value={fechaDesdeInput} 
    onChange={(e) => setFechaDesdeInput(e.target.value)} 
  />
  <span className="text-muted">→</span>
  <input 
    type="date" 
    className="form-control form-control-sm bg-dark text-white border-0 font-monospace" 
    style={{ colorScheme: 'dark' }}
    value={fechaHastaInput} 
    onChange={(e) => setFechaHastaInput(e.target.value)} 
  />
  <button 
    onClick={handleAnalizar} 
    className="btn btn-sm px-3 fw-bold text-white ms-1" 
    style={{ backgroundColor: '#8e45e0', borderRadius: '6px' }}
  >
    Analizar
  </button>
</div>
      </div>

      {/* BOTÓN VOLVER (SI ESTAMOS EN UNA SECCIÓN) */}
      {seccionActiva !== 'MENU' && (
        <div className="mb-4 d-flex align-items-center justify-content-between">
          <button 
            onClick={() => setSeccionActiva('MENU')} 
            className="btn btn-volver btn-sm px-3 py-2 fw-bold d-flex align-items-center gap-2 rounded-3"
          >
            <i className="bi bi-arrow-left"></i> Volver al Menú Principal
          </button>
          <span className="text-white-50 small">
            Período: <strong>{fechaDesde}</strong> al <strong>{fechaHasta}</strong>
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 0: MENÚ PRINCIPAL                                  */}
      {/* ========================================================= */}
      {seccionActiva === 'MENU' && (
        <div>
          {/* KPI CARDS GLOBALES */}
          <div className="row g-3 mb-4">
            {[
              { label: 'INGRESOS TOTALES', val: `$${metricas.ventasTotales.toLocaleString('es-AR')}`, color: '#8e45e0', icon: 'bi-currency-dollar' },
              { label: 'TICKETS GENERADOS', val: metricas.ticketsGenerados, color: '#20c997', icon: 'bi-receipt' },
              { label: 'TICKET PROMEDIO', val: `$${metricas.ticketPromedio}`, color: '#0dcaf0', icon: 'bi-graph-up-arrow' },
              { label: 'MOVIMIENTOS DE CAJA', val: `${metricas.cantidadMovimientos} reg`, color: '#ffc107', icon: 'bi-wallet2' }
            ].map((card, idx) => (
              <div className="col-12 col-sm-6 col-xl-3" key={idx}>
                <div className="p-3 rounded-4 position-relative overflow-hidden h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderTop: `4px solid ${card.color}` }}>
                  <div className="text-white-50 small mb-1 fw-semibold">{card.label}</div>
                  <h2 className="fw-bold mb-0 text-white" style={{ fontSize: '1.8rem' }}>{card.val}</h2>
                  <i className={`bi ${card.icon} position-absolute end-0 bottom-0 mb-1 me-3`} style={{ fontSize: '3.5rem', color: card.color, opacity: 0.15 }}></i>
                </div>
              </div>
            ))}
          </div>

          <h5 className="fw-bold mb-3 text-white-50 font-monospace" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>
            SELECCIONÁ UN MÓDULO PARA VER SUS INFORMES DETALLADOS:
          </h5>

          {/* TARJETAS DE SECCIÓN Y DESCARGA DE PDF (FILAS IGUALADAS CON ALIGN-ITEMS-STRETCH) */}
          <div className="row g-4 align-items-stretch">
            {seccionesMenu.map((sec) => (
              <div className="col-12 col-md-6 col-xl-4 d-flex" key={sec.id}>
                <div 
                  onClick={() => setSeccionActiva(sec.id)}
                  className="card-menu-item p-4 w-100 d-flex flex-column justify-content-between"
                  style={{ borderLeft: `5px solid ${sec.color}` }}
                >
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <i className={`bi ${sec.icon}`} style={{ fontSize: '2rem', color: sec.color }}></i>
                      <span className="badge bg-dark text-white-50 border border-secondary px-2 py-1">Ver Reportes →</span>
                    </div>
                    <h4 className="fw-bold text-white mb-2">{sec.label}</h4>
                    <p className="text-white-50 small mb-0">{sec.desc}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* SEXTA TARJETA: BOTÓN DESCARGAR INFORMES EN PDF */}
            <div className="col-12 col-md-6 col-xl-4 d-flex">
              <div 
                onClick={() => alert("Función de descarga en PDF en desarrollo.")}
                className="card-menu-item p-4 w-100 d-flex flex-column justify-content-between"
                style={{ borderLeft: '5px solid #e22e2e' }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: '2rem', color: '#e22e2e' }}></i>
                    <span className="badge bg-danger text-white px-2 py-1">Próximamente</span>
                  </div>
                  <h4 className="fw-bold text-white mb-2">EXPORTAR INFORMES</h4>
                  <p className="text-white-50 small mb-0">Generar y descargar un documento consolidado con las métricas del período</p>
                </div>

                <button 
                  type="button"
                  className="btn btn-sm text-white fw-bold w-100 mt-4 d-flex align-items-center justify-content-center gap-2 py-2"
                  style={{ backgroundColor: '#e22e2e', borderRadius: '8px' }}
                >
                  <i className="bi bi-file-earmark-arrow-down-fill fs-6"></i>
                  Descargar Informes en un PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 1. SECCIÓN: FINANZAS Y CAJA                */}
      {/* ========================================== */}
      {seccionActiva === 'finanzas' && (
        <>
          <div className="d-flex align-items-center gap-2 mb-4">
            <h3 className="fw-bold mb-0" style={{ color: '#8e45e0' }}>
              <i className="bi bi-wallet2 me-2"></i>Finanzas y Caja
            </h3>
          </div>

          <div className="row g-4 mb-4 align-items-stretch">
            <div className="col-12 col-xl-8">
              <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
                <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
                  <i className="bi bi-activity me-2" style={{ color: '#8e45e0' }}></i>Evolución de Ingresos a Caja
                </h5>
                <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metricas.ventasPorPeriodo} margin={{ top: 10, right: 35, left: 0, bottom: 15 }}>
                      <defs>
                        <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8e45e0" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8e45e0" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                      <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} dy={15} />
                      <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val/1000 + 'k' : val}`} />
                      <RechartsTooltip content={<CustomAreaTooltip esMismoDia={esMismoDia} />} />
                      <Area type="monotone" dataKey="ventas" stroke="#8e45e0" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-4">
              <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
                <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
                  <i className="bi bi-pie-chart-fill me-2" style={{ color: '#20c997' }}></i>Tipos / Medios de Pago
                </h5>
                <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={metricas.distribucionMediosPago} cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                        {metricas.distribucionMediosPago.map((_: any, index: number) => (
                          <Cell key={`cell-pago-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="p-4 rounded-4 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
                <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
                  <i className="bi bi-arrow-down-right-circle-fill me-2" style={{ color: '#e22e2e' }}></i>Egresos y Salidas de Caja Detallados
                </h5>
                {metricas.detalleEgresos && metricas.detalleEgresos.length > 0 ? (
                  <div style={{ height: '280px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metricas.detalleEgresos} margin={{ top: 10, right: 30, left: 20, bottom: 10 }} barSize={35}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                        <XAxis dataKey="ejeX" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val/1000 + 'k' : val}`} />
                        <RechartsTooltip cursor={{ fill: '#222122' }} content={<CustomEgresoTooltip esMismoDia={esMismoDia} />} />
                        <Bar dataKey="monto" fill="#e22e2e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-white-50 text-center py-4">No hay egresos registrados en el período seleccionado.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* 2. SECCIÓN: VENTAS Y PRODUCTOS             */}
      {/* ========================================== */}
      {seccionActiva === 'ventas' && (
        <>
          <div className="d-flex align-items-center gap-2 mb-4">
            <h3 className="fw-bold mb-0" style={{ color: '#20c997' }}>
              <i className="bi bi-bag-check-fill me-2"></i>Ventas y Productos
            </h3>
          </div>

          <div className="row g-4 mb-4 align-items-stretch">
            <div className="col-12 col-xl-4">
              <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
                <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
                  <i className="bi bi-diagram-3-fill me-2" style={{ color: '#ffc107' }}></i>Distribución por Estados
                </h5>
                <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={metricas.distribucionEstados} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
                        {metricas.distribucionEstados.map((_: any, index: number) => (
                          <Cell key={`cell-estado-${index}`} fill={COLORES_TORTA[(index + 2) % COLORES_TORTA.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-4">
              <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
                <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
                  <i className="bi bi-box-seam-fill me-2" style={{ color: '#20c997' }}></i>Productos Más Vendidos
                </h5>
                <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={metricas?.productosMasVendidos || []} 
                        cx="50%" 
                        cy="45%" 
                        innerRadius={60} 
                        outerRadius={95} 
                        paddingAngle={5} 
                        dataKey="value" 
                        stroke="none"
                      >
                        {(metricas?.productosMasVendidos || []).map((_: any, index: number) => (
                          <Cell key={`cell-prod-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const colorSlice = data.color || '#20c997';

                            return (
                              <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: `1px solid ${colorSlice}`, color: '#fff' }}>
                                <p className="fw-bold mb-1" style={{ color: colorSlice }}>{data.nombreReal || data.name}</p>
                                <p className="small mb-0">{data.name} — Unidades vendidas: <span className="text-white fw-bold">{data.value}</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-4">
              <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
                <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
                  <i className="bi bi-tags-fill me-2" style={{ color: '#8e45e0' }}></i>Categorías Más Vendidas
                </h5>
                <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricas?.categoriasMasVendidas || []} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={35}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                      <XAxis dataKey="name" stroke="#a1a1aa" tick={false} axisLine={false} tickLine={false} />
                      <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RechartsTooltip cursor={{ fill: '#222122' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#8e45e0', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="ventas" fill="#8e45e0" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* 3. SECCIÓN: OPERACIONES Y RECURSOS HUMANOS */}
      {/* ========================================== */}
      {seccionActiva === 'operaciones' && (
        <>
          <div className="d-flex align-items-center gap-2 mb-4">
            <h3 className="fw-bold mb-0" style={{ color: '#0dcaf0' }}>
              <i className="bi bi-people-fill me-2"></i>Operaciones y Recursos Humanos
            </h3>
          </div>

          <div className="row g-4 mb-4 align-items-stretch">
            <div className="col-12 col-xl-8">
              <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
                <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
                  <i className="bi bi-person-badge-fill me-2" style={{ color: '#0dcaf0' }}></i>Recaudación de Empleado por Pago Completado
                </h5>
                <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricas.rendimientoEmpleados} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                      <XAxis dataKey="name" stroke="#a1a1aa" tick={false} axisLine={false} tickLine={false} />
                      <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val/1000 + 'k' : val}`} />
                      <RechartsTooltip cursor={{ fill: '#222122' }} content={<CustomEmpleadoTooltip />} />
                      <Bar dataKey="ventas" fill="#0dcaf0" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-4">
              <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
                <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
                  <i className="bi bi-check2-square me-2" style={{ color: '#0dcaf0' }}></i>Pedidos Completados por Empleado
                </h5>
                <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metricas.pedidosCompletadosPorEmpleado}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {(metricas.pedidosCompletadosPorEmpleado || []).map((_: any, index: number) => (
                          <Cell key={`cell-emp-completado-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const colorSlice = data.color || '#0dcaf0';

                            return (
                              <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: `1px solid ${colorSlice}`, color: '#fff', fontSize: '0.85rem' }}>
                                <p className="fw-bold mb-1" style={{ color: colorSlice }}>{data.name}</p>
                                <p className="small mb-0 text-white">Pedidos finalizados: <span className="fw-bold">{data.value}</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* 4. SECCIÓN: CLIENTES                       */}
      {/* ========================================== */}
      {seccionActiva === 'clientes' && (
        <>
          <div className="d-flex align-items-center gap-2 mb-4">
            <h3 className="fw-bold mb-0" style={{ color: '#ffc107' }}>
              <i className="bi bi-trophy-fill me-2"></i>Clientes
            </h3>
          </div>

          <div className="row g-4 mb-4 align-items-stretch">
            <div className="col-12 col-xl-6">
              <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
                <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
                  <i className="bi bi-trophy-fill me-2" style={{ color: '#ffc107' }}></i>Clientes Más Activos
                </h5>
                
                {topClientes && topClientes.length > 0 ? (
                  <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topClientes}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={5}
                          dataKey="totalGastado"
                          stroke="none"
                        >
                          {topClientes.map((_: any, index: number) => (
                            <Cell key={`cell-cliente-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const colorSlice = data.color || '#ffc107';

                              return (
                                <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: `1px solid ${colorSlice}`, color: '#fff' }}>
                                  <p className="fw-bold mb-1" style={{ color: colorSlice }}>{data.nombreReal || data.name}</p>
                                  <p className="small mb-1 text-white">Total Pagado: <span className="fw-bold">${Number(data.totalGastado).toLocaleString('es-AR')}</span></p>
                                  <p className="small mb-0 text-white-50">Pedidos creados: {data.cantidadPedidos}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-white-50 text-center py-4 my-auto">Sin datos de clientes en este período.</div>
                )}
              </div>
            </div>

            <div className="col-12 col-xl-6">
              <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
                <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
                  <i className="bi bi-person-vcard-fill me-2" style={{ color: '#20c997' }}></i>Ventas por Categoría de Cliente
                </h5>
                
                {metricas.ventasPorCategoriaCliente && metricas.ventasPorCategoriaCliente.length > 0 ? (
                  <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metricas.ventasPorCategoriaCliente} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={35}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                        <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <RechartsTooltip 
                          cursor={{ fill: '#222122' }} 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: '1px solid #20c997', color: '#fff' }}>
                                  <p className="fw-bold mb-1 text-success">{data.name}</p>
                                  <p className="small mb-1 text-white">Pedidos solicitados: <span className="fw-bold">{data.ventas}</span></p>
                                  <p className="small mb-0 text-white-50">Monto total: <span className="fw-bold text-white">${Number(data.montoTotal || 0).toLocaleString('es-AR')}</span></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="ventas" fill="#20c997" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-white-50 text-center py-4 my-auto">Sin registros de categorías de clientes.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* 5. SECCIÓN: CONTROL INTERNO Y TALLER       */}
      {/* ========================================== */}
      {seccionActiva === 'control' && (
        <>
          <div className="d-flex align-items-center gap-2 mb-4">
            <h3 className="fw-bold mb-0" style={{ color: '#f43f5e' }}>
              <i className="bi bi-shield-check me-2"></i>Control Interno y Taller
            </h3>
          </div>

          <div className="row g-4 align-items-stretch">
            <div className="col-12 col-xl-4">
              <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: '#f43f5e' }}></i>Arqueos por Empleado
                  </h5>
                  <span className="badge bg-dark border border-warning text-warning px-2 py-1">MOCK</span>
                </div>

                {incongruenciasArqueo && incongruenciasArqueo.length > 0 ? (
                  <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incongruenciasArqueo} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={35}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                        <XAxis dataKey="empleado" stroke="#a1a1aa" tick={false} axisLine={false} tickLine={false} />
                        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                        <RechartsTooltip cursor={{ fill: '#222122' }} content={<CustomArqueoTooltip />} />
                        <Bar dataKey="montoDiferencia" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-white-50 text-center py-4 my-auto">Sin datos de arqueos registrados.</div>
                )}
              </div>
            </div>

            <div className="col-12 col-xl-4">
              <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                    <i className="bi bi-trash3-fill me-2" style={{ color: '#ffc107' }}></i>Mermas Generadas
                  </h5>
                  <span className="badge bg-dark border border-warning text-warning px-2 py-1">MOCK</span>
                </div>
                {metricas.mermasPorPeriodo && metricas.mermasPorPeriodo.length > 0 ? (
                  <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metricas.mermasPorPeriodo} margin={{ top: 10, right: 20, left: 0, bottom: 10 }} barSize={35}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                        <XAxis dataKey="ejeX" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <RechartsTooltip cursor={{ fill: '#222122' }} content={<CustomMermaTooltip esMismoDia={esMismoDia} />}/>
                        <Bar dataKey="cantidad" fill="#ffc107" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-white-50 text-center py-4 my-auto">No se registraron mermas en el período seleccionado.</div>
                )}
              </div>
            </div>

            <div className="col-12 col-xl-4">
              <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                    <i className="bi bi-tools me-2" style={{ color: '#fd7e14' }}></i>Máquinas Averiadas
                  </h5>
                  <span className="badge bg-dark border border-warning text-warning px-2 py-1">MOCK</span>
                </div>
                {metricas.averiasPorPeriodo && metricas.averiasPorPeriodo.length > 0 ? (
                  <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metricas.averiasPorPeriodo} margin={{ top: 10, right: 20, left: 0, bottom: 10 }} barSize={35}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                        <XAxis dataKey="ejeX" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <RechartsTooltip cursor={{ fill: '#222122' }} content={<CustomAveriaTooltip esMismoDia={esMismoDia} />} />
                        <Bar dataKey="cantidad" fill="#fd7e14" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-white-50 text-center py-4 my-auto">No se registraron averías de máquinas en el período seleccionado.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};