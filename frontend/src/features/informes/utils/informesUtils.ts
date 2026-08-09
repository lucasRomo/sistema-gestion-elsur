// --- MOCK DATA TEMPORAL DE MERMAS Y AVERÍAS ---
export const MERMAS_MOCK = [
  { id: 1, fecha: new Date().toISOString(), cantidad: 3, insumo: 'Papel Ilustración 300g (A3)', motivo: 'Error de impresión / Mancha de tinta' },
  { id: 2, fecha: new Date(Date.now() - 3600000 * 2).toISOString(), cantidad: 1, insumo: 'Vinilo Impreso M2', motivo: 'Corte defectuoso de guillotina' },
  { id: 3, fecha: new Date(Date.now() - 86400000 * 1).toISOString(), cantidad: 5, insumo: 'Papel Obra 80g (A4)', motivo: 'Papel atascado y arrugado' },
  { id: 4, fecha: new Date(Date.now() - 86400000 * 3).toISOString(), cantidad: 2, insumo: 'Lona Frontlit M2', motivo: 'Vinilo mal alineado' },
  { id: 5, fecha: new Date(Date.now() - 86400000 * 30).toISOString(), cantidad: 8, insumo: 'Tinta Negra Sublimación (ml)', motivo: 'Fallo de calibración de color' }
];

export const AVERIAS_MOCK = [
  { id: 1, fecha: new Date().toISOString(), cantidad: 1, maquina: 'Plotter Roland VG3', detalle: 'Atasco en cabezal principal' },
  { id: 2, fecha: new Date(Date.now() - 3600000 * 3).toISOString(), cantidad: 1, maquina: 'Guillotina Industrial', detalle: 'Fallo en sensor de seguridad' },
  { id: 3, fecha: new Date(Date.now() - 86400000 * 1).toISOString(), cantidad: 2, maquina: 'Impresora Ricoh C7200', detalle: 'Sobrecalentamiento en fusor' }
];

export const COLORES_TORTA = ['#8e45e0', '#20c997', '#e22e2e', '#0dcaf0', '#ffc107'];

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

// Convierte un objeto Date a formato YYYY-MM-DD
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Genera un sparkline "tipo bolsa": variaciones chicas y acotadas
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

// Agrupa una lista de ítems por período (Día, Semanas, Meses, Años)
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

// Retorna el nombre legible del informe seleccionado
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

// Calcula los rangos de fechas (actual vs anterior) según el tipo de comparación
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

// Procesa todas las métricas del sistema para un rango de fechas dado
export function procesarMetricas(
  fDesde: string,
  fHasta: string,
  pedidosLista: any[] = [],
  cajaLista: any[] = []
) {
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

  const ticketPromedio = ticketsFinales > 0 ? (totalIngresosBrutos / ticketsFinales).toFixed(2) : '0.00';

  const cantidadMovimientos = movimientosEnRango.length;

  // --- PRODUCTOS Y CATEGORÍAS MÁS VENDIDAS ---
  const mapaProductos: { [key: string]: { cantidad: number; nombre: string } } = {};
  const mapaCategorias: { [key: string]: number } = {};
  const mapaCategoriasCliente: { [key: string]: { cantidad: number; monto: number; ahorro: number } } = {};

  pedidosEnRango.forEach((p: any) => {
    const clienteObj = p.cliente;
    const catClienteObj = clienteObj?.categoriaCliente || clienteObj?.categoria || p.categoriaCliente;
    let nombreCatCliente = catClienteObj?.nombreCategoria || catClienteObj?.nombre;
    let porcentajeDescuento = Number(catClienteObj?.descuento || catClienteObj?.porcentajeDescuento || 0);

    if (!nombreCatCliente) {
      const obs = p.observaciones || '';
      const matchDescuento = obs.match(/\[Descuento aplicado:\s*([^\]]+)\]/i);

      if (matchDescuento && matchDescuento[1]) {
        const descTexto = matchDescuento[1].trim();
        nombreCatCliente = `Estudiante (${descTexto})`;
        const numMatch = descTexto.match(/(\d+(\.\d+)?)/);
        if (numMatch && porcentajeDescuento === 0) {
          porcentajeDescuento = Number(numMatch[1]);
        }
      } else {
        nombreCatCliente = 'Sin Categoría / General';
      }
    }

    const montoPedido = Number(p.monto_total || p.montoTotal || p.total || 0);
    let montoAhorrado = 0;
    if (porcentajeDescuento > 0) {
      const montoOriginal = montoPedido / (1 - porcentajeDescuento / 100);
      montoAhorrado = montoOriginal - montoPedido;
    } else if (p.montoAhorrado || p.descuentoTotal) {
      montoAhorrado = Number(p.montoAhorrado || p.descuentoTotal || 0);
    }

    if (!mapaCategoriasCliente[nombreCatCliente]) {
      mapaCategoriasCliente[nombreCatCliente] = { cantidad: 0, monto: 0, ahorro: 0 };
    }

    mapaCategoriasCliente[nombreCatCliente].cantidad += 1;
    mapaCategoriasCliente[nombreCatCliente].monto += montoPedido;
    mapaCategoriasCliente[nombreCatCliente].ahorro += montoAhorrado;

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
    montoTotal: mapaCategoriasCliente[nombreCat].monto,
    montoAhorrado: mapaCategoriasCliente[nombreCat].ahorro
  }));

  // --- RECAUDACIÓN Y RENDIMIENTO DE EMPLEADOS ---
  const mapaEmpleados: { [key: string]: { ventas: number; pedidos: number } } = {};

  const obtenerNombreOperario = (empObj: any) => {
    if (!empObj) return 'Sin Asignar';
    return empObj.persona
      ? `${empObj.persona.nombre} ${empObj.persona.apellido}`
      : empObj.nombre || `Emp #${empObj.idEmpleado || empObj.id_empleado || empObj.idUsuario}`;
  };

  const pedidosContados = new Set<string | number>();
  pedidosEnRango.forEach((p) => {
    const idPed = p.idPedido || p.id_pedido || p.id;
    const estado = (p.estado || '').toUpperCase();

    if (estado === 'ENTREGADO' || estado === 'COMPLETADO' || estado === 'FINALIZADO') {
      const ultimaAsignacion =
        p.asignaciones && p.asignaciones.length > 0 ? p.asignaciones[p.asignaciones.length - 1] : null;
      const nombreEmp = obtenerNombreOperario(ultimaAsignacion?.empleado || p.empleado);

      if (!mapaEmpleados[nombreEmp]) {
        mapaEmpleados[nombreEmp] = { ventas: 0, pedidos: 0 };
      }

      mapaEmpleados[nombreEmp].pedidos += 1;
      if (idPed) pedidosContados.add(idPed);
    }
  });

  ingresosCaja.forEach((m: any) => {
    let nombreEmp = 'Sin Asignar';

    if (m.pedido) {
      const p = m.pedido;
      const ultimaAsignacion =
        p.asignaciones && p.asignaciones.length > 0 ? p.asignaciones[p.asignaciones.length - 1] : null;
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
    const ultimaAsignacion =
      p.asignaciones && p.asignaciones.length > 0 ? p.asignaciones[p.asignaciones.length - 1] : null;
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

  // --- AGRUPAMIENTO POR PERÍODO ---
  const diffTiempoMs = Math.abs(hasta.getTime() - desde.getTime());
  const diffDias = Math.ceil(diffTiempoMs / (1000 * 60 * 60 * 24));
  const diffMeses = (hasta.getFullYear() - desde.getFullYear()) * 12 + (hasta.getMonth() - desde.getMonth());
  const diffAnios = hasta.getFullYear() - desde.getFullYear();

  const esUnSoloDia = fDesde === fHasta;
  const esPorAnios = diffAnios >= 1 && diffDias > 365;
  const esPorMeses = !esPorAnios && (diffMeses >= 2 || diffDias > 60);
  const esPorSemanas = !esPorAnios && !esPorMeses && diffDias > 14;

  let ventasPorPeriodo: any[] = [];

  if (esUnSoloDia) {
    const mapaHoras: { [hora: string]: { delta: number; esEgreso: boolean } } = {};
    const movsOrdenados = [...movimientosEnRango].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

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

  // --- MERMAS Y AVERÍAS ---
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

  // --- CLIENTES CON MÁS INGRESOS ---
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

    if (tipoMovimiento === 'EGRESO' || tipoMovimiento === 'GASTO' || montoOriginal < 0) return;

    const idPed = m.idPedido || m.id_pedido || m.pedido?.id || m.pedido?.idPedido;
    const descripcion = (m.descripcion || m.concepto || '').toLowerCase();

    if (idPed && idPed !== '-' && idPed !== '0' && idPed !== 0) {
      if (idsPedidosProcesados.has(idPed) || idsPedidosProcesados.has(String(idPed))) return;
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

  // --- TIPOS DE PAGO ---
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

  return {
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
    ventasPorCategoriaCliente: ventasPorCategoriaCliente.length > 0 ? ventasPorCategoriaCliente : [{ name: 'Sin datos', ventas: 0, montoTotal: 0 }],
    topClientes: topClientesFormateados
  };
}