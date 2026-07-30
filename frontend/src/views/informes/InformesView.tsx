import React, { useState, useEffect} from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { pedidoService } from '../../services/pedidoService';
import { cajaService, type MovimientoCaja } from '../../services/cajaService';
import type { Pedido, DetallePedido } from '../../types/Pedido';
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

        {/* Solo mostramos el desglose si la consulta es de UN SOLO DÍA */}
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
    // Por Días
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

export const InformesView: React.FC = () => {
  const hoy = new Date().toLocaleDateString('sv-SE');

  const [fechaDesdeInput, setFechaDesdeInput] = useState(hoy);
  const [fechaHastaInput, setFechaHastaInput] = useState(hoy);

  const [fechaDesde, setFechaDesde] = useState(hoy);
  const [fechaHasta, setFechaHasta] = useState(hoy);
  
  const [pedidosRaw, setPedidosRaw] = useState<any[]>([]);
  const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCaja[]>([]);
  const [cargando, setCargando] = useState(false);
  const [listaProductos, setListaProductos] = useState<any[]>([]);
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
    categoriasMasVendidas: []
  });


  
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const [dataPedidos, dataCaja, dataProductos] = await Promise.all([
          pedidoService.obtenerTodos(),
          cajaService.obtenerMovimientosDia(),
          getProductos()
        ]);

        setPedidosRaw(dataPedidos || []);
        setMovimientosCaja(dataCaja || []);
        setListaProductos(dataProductos || []);
      } catch (error) {
        console.error("Error al sincronizar datos para Informes:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  
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

   // --- 5. PRODUCTOS MÁS VENDIDOS Y CATEGORÍAS MÁS VENDIDAS ---
    const mapaProductos: { [key: string]: { cantidad: number; nombre: string } } = {};
    const mapaCategorias: { [key: string]: number } = {};

    pedidosEnRango.forEach((p: Pedido) => {
      const detalles = p.detalles || [];

      if (Array.isArray(detalles) && detalles.length > 0) {
        detalles.forEach((item: any) => {
          const prodObj = item.producto;

          // 1. Extraemos el ID y el Nombre usando exactamente las claves de tu API
          const idProd = prodObj?.idProducto || item.idProducto;
          const nombreReal = prodObj?.nombreProducto || prodObj?.nombre || prodObj?.descripcion;

          // Fallback en caso de que no venga el nombre
          const nombreFinal = nombreReal || (idProd ? `Producto #${idProd}` : 'Producto Sin Nombre');
          const key = String(idProd || nombreFinal);
          const cantidad = Number(item.cantidad || 1);

          if (!mapaProductos[key]) {
            mapaProductos[key] = { cantidad: 0, nombre: nombreFinal };
          }
          mapaProductos[key].cantidad += cantidad;

          // Categoría
          let nombreCat = prodObj?.categoria?.nombre || 'General';
          mapaCategorias[nombreCat] = (mapaCategorias[nombreCat] || 0) + cantidad;
        });
      }
    });

    // Ordenamos de mayor a menor ventas y tomamos el Top 5
    const top5Productos = Object.values(mapaProductos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // Formateamos para el gráfico: el 'name' para la leyenda dirá "Top 1", "Top 2", etc.
    // y guardamos 'nombreReal' para mostrarlo en el tooltip/hover.
    const productosMasVendidos = top5Productos.map((item, index) => ({
      name: `Top ${index + 1}`,      // Para la leyenda de abajo (Top 1, Top 2, etc.)
      nombreReal: item.nombre,       // Nombre verdadero del producto
      value: item.cantidad,           // Cantidad vendida
      color: COLORES_TORTA[index % COLORES_TORTA.length]     
    }));

    // Categorías
    const categoriasMasVendidas = Object.keys(mapaCategorias)
      .map((nombre) => ({
        name: nombre,
        ventas: mapaCategorias[nombre]
      }))
      .sort((a, b) => b.ventas - a.ventas);


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

    // Sumamos la recaudación de caja e incrementamos pedidos de caja si no fueron contados antes
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

      // Si el movimiento proviene de un pedido y no lo habíamos contado desde la lista general:
      const idPed = m.idPedido || m.id_pedido || m.pedido?.id || m.pedido?.idPedido;
      if (idPed && !pedidosContados.has(idPed)) {
        mapaEmpleados[nombreEmp].pedidos += 1;
        pedidosContados.add(idPed);
      } else if (!idPed && m.descripcion?.toUpperCase().includes('PEDIDO')) {
        // Si no trae ID explícito pero es una venta/pedido directa de caja
        mapaEmpleados[nombreEmp].pedidos += 1;
      }
    });
    // Sumamos los montos pendientes
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
    
    // Si hay más de 365 días (o más de 1 año de diferencia), agrupa por años
    const esPorAnios = diffAnios >= 1 && diffDias > 365; 
    
    // Si hay más de 2 meses y menos de 1 año, agrupa por meses
    const esPorMeses = !esPorAnios && (diffMeses >= 2 || diffDias > 60); 
    
    // Si hay entre 14 y 60 días, agrupa por semanas
    const esPorSemanas = !esPorAnios && !esPorMeses && diffDias > 14;

    // --- 1. EVOLUCIÓN DE INGRESOS ---
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
      esPorSemanas, // 👈 AÑADIR ESTE PARÁMETRO
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

    // --- 2. DETALLE DE EGRESOS ---
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

    // --- 3. LOS CLIENTES CON MÁS INGRESOS (CON EXTRACCIÓN DE NOMBRE MEJORADA Y SIN EGRESOS) ---
    const mapaClientes: { [key: string]: { nombre: string; totalGastado: number; cantidadPedidos: number } } = {};

    // Helper robusto para obtener y formatear el nombre real del cliente
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

      // Solo si realmente el texto dice explícitamente venta rápida, caja o está totalmente vacío, es Consumidor Final
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

      // Retorna el nombre formateado manteniendo mayúsculas/minúsculas originales
      return clienteNombre;
    };

    const idsPedidosProcesados = new Set<string | number>();

    // 1. Procesar Pedidos en Rango
    pedidosEnRango.forEach((p: any) => {
      const estado = (p.estado || '').toUpperCase();
      if (estado === 'CANCELADO') return;

      const idPedido = p.idPedido || p.id_pedido || p.id;
      if (idPedido) {
        idsPedidosProcesados.add(idPedido);
        idsPedidosProcesados.add(String(idPedido));
      }

      // Se verifica cliente en el pedido (p.cliente), en el nombre explícito o en campos anidados
      const clienteNombre = obtenerNombreCliente(p.cliente, p.clienteNombre || p.nombreCliente || p.nombre_cliente);
      const monto = Number(p.monto_total || p.montoTotal || p.total || p.precioTotal || p.monto_abonado || 0);

      if (!mapaClientes[clienteNombre]) {
        mapaClientes[clienteNombre] = { nombre: clienteNombre, totalGastado: 0, cantidadPedidos: 0 };
      }

      mapaClientes[clienteNombre].totalGastado += monto;
      mapaClientes[clienteNombre].cantidadPedidos += 1;
    });

    // 2. Procesar Movimientos de Caja (Filtrando EGRESOS)
    ingresosCaja.forEach((m: any) => {
      // FILTRO CLAVE: Verificar si es un EGRESO/GASTO para NO sumarlo como ingreso
      const tipoMovimiento = (m.tipo || m.tipoMovimiento || '').toUpperCase();
      const montoOriginal = Number(m.monto || 0);

      if (tipoMovimiento === 'EGRESO' || tipoMovimiento === 'GASTO' || montoOriginal < 0) {
        return; // Omitir egresos por completo
      }

      const idPed = m.idPedido || m.id_pedido || m.pedido?.id || m.pedido?.idPedido;
      const descripcion = (m.descripcion || m.concepto || '').toLowerCase();

      // Descartar si está vinculado a un pedido existente
      if (idPed && idPed !== '-' && idPed !== '0' && idPed !== 0) {
        if (idsPedidosProcesados.has(idPed) || idsPedidosProcesados.has(String(idPed))) {
          return;
        }
      }

      // Descartar descripciones referentes a pedidos/señas
      if (
        descripcion.includes('pedido') || 
        descripcion.includes('seña') || 
        descripcion.includes('sena') || 
        descripcion.includes('adelanto')
      ) {
        return;
      }

      // Descartar Venta Rápida duplicada
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

    // 3. Top 5 Formateado
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

    // --- 4. MÉTRICA MOCK: MÁQUINAS AVERIADAS ---
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
    estado = 'FINALIZADO';}
    mapaEstados[estado] = (mapaEstados[estado] || 0) + 1;});
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
    pedidosCompletadosPorEmpleado: pedidosCompletadosPorEmpleado.length > 0 ? pedidosCompletadosPorEmpleado : [{ name: 'Sin datos', value: 0 }], // 👈 Métrica agregada
    detalleEgresos,
    mermasPorPeriodo,
    averiasPorPeriodo,
    productosMasVendidos: productosMasVendidos.length > 0 ? productosMasVendidos : [{ name: 'Sin datos', value: 1 }],
    categoriasMasVendidas: categoriasMasVendidas.length > 0 ? categoriasMasVendidas : [{ name: 'Sin datos', ventas: 0 }]
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

      // Pasamos los datos directos sin esperar el re-render
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

  const COLORES_TORTA = ['#8e45e0', '#20c997', '#e22e2e', '#0dcaf0', '#ffc107'];
  const esMismoDia = fechaDesde === fechaHasta;

  if (cargando && movimientosCaja.length === 0) {
    return (
      <div className="text-center text-white mt-5">
        <div className="spinner-border text-info mb-3"></div>
        <h4>Consolidando métricas del sistema...</h4>
      </div>
    );
  }

  return (
    <div className="container-fluid text-white font-monospace pb-5">
      {/* HEADER CONTROLES */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom border-secondary gap-3" style={{ borderColor: '#2d2d30 !important' }}>
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge px-2 py-1 small" style={{ backgroundColor: '#8e45e0' }}>BUSINESS INTELLIGENCE</span>
            <h2 className="fw-bold mb-0" style={{ color: '#ffffff' }}>Métricas e Informes</h2>
          </div>
          <p className="text-white-50 mb-0 small mt-1">Análisis consolidado de caja, producción y recursos</p>
        </div>

        <div className="d-flex align-items-center gap-2 p-2 rounded-3 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
          <i className="bi bi-calendar-range ms-2 text-muted"></i>
          <input 
            type="date" 
            className="form-control form-control-sm bg-dark text-white border-0 font-monospace" 
            value={fechaDesdeInput} 
            onChange={(e) => setFechaDesdeInput(e.target.value)} 
          />
          <span className="text-muted">→</span>
          <input 
            type="date" 
            className="form-control form-control-sm bg-dark text-white border-0 font-monospace" 
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

      {/* SECCIÓN PRINCIPAL DE GRÁFICOS */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-8">
          <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-4" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-activity me-2" style={{ color: '#8e45e0' }}></i>Evolución de Ingresos a Caja
            </h5>
            <div style={{ height: '300px', width: '100%' }}>
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
          <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-4" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-pie-chart-fill me-2" style={{ color: '#20c997' }}></i>Tipos / Medios de Pago
            </h5>
            <div style={{ height: '300px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer>
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
      </div>

      {/* SECCIÓN INFERIOR: ESTADOS Y OPERARIOS */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-diagram-3-fill me-2" style={{ color: '#ffc107' }}></i>Distribución por Estados
            </h5>
            <div style={{ height: '250px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={metricas.distribucionEstados} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
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

        <div className="col-12 col-xl-8">
          <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-person-badge-fill me-2" style={{ color: '#0dcaf0' }}></i>Recaudación de Empleado por Pago Completado
            </h5>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer>
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
      </div>

      {/* SECCIÓN CATEGORÍAS (IZQ) Y PRODUCTOS (DER) */}
      <div className="row g-4 mb-4">
        {/* Categorías Más Vendidas (Izquierda - col-xl-8) */}
        <div className="col-12 col-xl-8">
          <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-tags-fill me-2" style={{ color: '#8e45e0' }}></i>Categorías Más Vendidas
            </h5>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={metricas?.categoriasMasVendidas || []} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={40}>
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

        {/* Productos Más Vendidos (Derecha - col-xl-4) */}
        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-box-seam-fill me-2" style={{ color: '#20c997' }}></i>Productos Más Vendidos
            </h5>
            <div style={{ height: '250px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie 
                    data={metricas?.productosMasVendidos || []} 
                    cx="50%" 
                    cy="45%" 
                    innerRadius={50} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value" 
                    stroke="none"
                  >
                    {(metricas?.productosMasVendidos || []).map((_: any, index: number) => (
                      <Cell key={`cell-prod-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                    ))}
                  </Pie>
                  
                  {/* Tooltip personalizado: Lee 'nombreReal' guardado en procesarMetricas */}
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const colorSlice = data.color || '#20c997'; // Color por defecto de respaldo

                        return (
                          <div 
                            className="p-2 rounded-3 shadow-lg" 
                            style={{ 
                              backgroundColor: '#222122', 
                              border: `1px solid ${colorSlice}`, // 👈 Borde del color de la porción
                              color: '#fff' 
                            }}
                          >
                            <p className="fw-bold mb-1" style={{ color: colorSlice }}> {/* 👈 Texto del color de la porción */}
                              {data.nombreReal || data.name}
                            </p>
                            <p className="small mb-0">
                              {data.name} — Unidades vendidas: <span className="text-white fw-bold">{data.value}</span>
                            </p>
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

      {/* SECCIÓN PEDIDOS COMPLETADOS Y EGRESOS */}
<div className="row g-4 mb-4">
  {/* 1. IZQUIERDA: Pedidos Completados por Empleado (col-xl-4) */}
  <div className="col-12 col-xl-4">
    <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
      <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
        <i className="bi bi-check2-square me-2" style={{ color: '#0dcaf0' }}></i>Pedidos Completados por Empleado
      </h5>
      <div style={{ height: '250px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={metricas.pedidosCompletadosPorEmpleado}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={80}
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
                    <div
                      className="p-2 rounded-3 shadow-lg"
                      style={{
                        backgroundColor: '#222122',
                        border: `1px solid ${colorSlice}`,
                        color: '#fff',
                        fontSize: '0.85rem'
                      }}
                    >
                      <p className="fw-bold mb-1" style={{ color: colorSlice }}>
                        {data.name}
                      </p>
                      <p className="small mb-0 text-white">
                        Pedidos finalizados: <span className="fw-bold">{data.value}</span>
                      </p>
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

  {/* 2. DERECHA: Egresos y Salidas de Caja Detallados (col-xl-8) */}
  <div className="col-12 col-xl-8">
    <div className="p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
      <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
        <i className="bi bi-arrow-down-right-circle-fill me-2" style={{ color: '#e22e2e' }}></i>Egresos y Salidas de Caja Detallados
      </h5>
      {metricas.detalleEgresos && metricas.detalleEgresos.length > 0 ? (
        <div style={{ height: '250px', width: '100%' }}>
          <ResponsiveContainer>
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

      {/* SECCIÓN ARQUEOS Y TOP CLIENTES */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-8">
          <div className="p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: '#f43f5e' }}></i>Diferencias de Arqueo por Empleado
              </h5>
              <span className="badge bg-dark border border-warning text-warning px-2 py-1">MOCK DATA</span>
            </div>

            {incongruenciasArqueo && incongruenciasArqueo.length > 0 ? (
              <div style={{ height: '250px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incongruenciasArqueo} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                    <XAxis dataKey="empleado" stroke="#a1a1aa" tick={false} axisLine={false} tickLine={false} />
                    <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                    <RechartsTooltip cursor={{ fill: '#222122' }} content={<CustomArqueoTooltip />} />
                    <Bar dataKey="montoDiferencia" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-white-50 text-center py-4">Sin datos de arqueos registrados.</div>
            )}
          </div>
        </div>

        {/* PIE CHART CORREGIDO DE TOP 5 CLIENTES */}
        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-trophy-fill me-2" style={{ color: '#ffc107' }}></i>Los Clientas con Mas Ingresos
            </h5>
            
            {topClientes && topClientes.length > 0 ? (
              <div style={{ height: '250px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topClientes}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
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
                            <div 
                              className="p-2 rounded-3 shadow-lg" 
                              style={{ 
                                backgroundColor: '#222122', 
                                border: `1px solid ${colorSlice}`, 
                                color: '#fff' 
                              }}
                            >
                              <p className="fw-bold mb-1" style={{ color: colorSlice }}>
                                {data.nombreReal || data.name}
                              </p>
                              <p className="small mb-1 text-white">
                                Total Pagado: <span className="fw-bold">${Number(data.totalGastado).toLocaleString('es-AR')}</span>
                              </p>
                              <p className="small mb-0 text-white-50">
                                Pedidos creados: {data.cantidadPedidos}
                              </p>
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
              <div className="text-white-50 text-center py-4">Sin datos de clientes en este período.</div>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN MERMAS Y AVERÍAS EN LA MISMA LÍNEA */}
      <div className="row g-4">
        {/* MERMAS GENERADAS */}
        <div className="col-12 col-xl-6">
          <div className="p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-trash3-fill me-2" style={{ color: '#ffc107' }}></i>Mermas Generadas
              </h5>
              <span className="badge bg-dark border border-warning text-warning px-2 py-1">MOCK DATA</span>
            </div>
            {metricas.mermasPorPeriodo && metricas.mermasPorPeriodo.length > 0 ? (
              <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer>
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
              <div className="text-white-50 text-center py-4">No se registraron mermas en el período seleccionado.</div>
            )}
          </div>
        </div>

        {/* MÁQUINAS AVERIADAS */}
        <div className="col-12 col-xl-6">
          <div className="p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-tools me-2" style={{ color: '#fd7e14' }}></i>Máquinas Averiadas
              </h5>
              <span className="badge bg-dark border border-warning text-warning px-2 py-1">MOCK DATA</span>
            </div>
            {metricas.averiasPorPeriodo && metricas.averiasPorPeriodo.length > 0 ? (
              <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer>
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
              <div className="text-white-50 text-center py-4">No se registraron averías de máquinas en el período seleccionado.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};