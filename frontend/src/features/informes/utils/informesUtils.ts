import { COLORES_TORTA } from '../charts/Colores';

export interface IncongruenciaEmpleado {
  empleado: string;
  montoDiferencia: number;
  cantidadIncongruencias: number;
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

export function calcularIncongruenciasArqueo(
  turnos: any[],
  fDesde: string,
  fHasta: string
): IncongruenciaEmpleado[] {
  const desde = new Date(`${fDesde}T00:00:00`);
  const hasta = new Date(`${fHasta}T23:59:59.999`);

  const acumulado: Record<string, { monto: number; cantidad: number }> = {};

  (turnos || []).forEach((turno) => {
    if (turno.estado !== 'CERRADO' || !turno.fechaCierre) return;

    const fechaCierre = new Date(turno.fechaCierre);
    if (fechaCierre < desde || fechaCierre > hasta) return;

    const diferencia = Number(turno.diferenciaArqueo || 0);
    if (Math.abs(diferencia) <= 0.01) return; // arqueo exacto, no es incongruencia

    const nombreEmpleado = turno.usuario?.nombreUsuario || 'Sin usuario asignado';

    if (!acumulado[nombreEmpleado]) {
      acumulado[nombreEmpleado] = { monto: 0, cantidad: 0 };
    }
    acumulado[nombreEmpleado].monto += Math.abs(diferencia);
    acumulado[nombreEmpleado].cantidad += 1;
  });

  return Object.entries(acumulado)
    .map(([empleado, { monto, cantidad }]) => ({
      empleado,
      montoDiferencia: monto,
      cantidadIncongruencias: cantidad
    }))
    .sort((a, b) => b.montoDiferencia - a.montoDiferencia);
}

// Procesa todas las métricas del sistema para un rango de fechas dado
export function procesarMetricas(
  fDesde: string,
  fHasta: string,
  pedidosLista: any[] = [],
  cajaLista: any[] = [],
  mermasLista: any[] = [],
  deudoresLista: any[] = [],
  averiasLista: any[] = [],
  categoriasClienteLista: any[] = []
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

  // --- AGRUPAMIENTO DE MOVIMIENTOS POR CATEGORÍA DE INGRESOS Y EGRESOS ---
  const mapaCategoriasIngreso: { [key: string]: { cantidad: number; total: number } } = {};
  const mapaCategoriasEgreso: { [key: string]: { cantidad: number; total: number } } = {};

  movimientosEnRango.forEach((m: any) => {
    const esEgreso = esMovimientoEgreso(m);
    const montoAbs = Math.abs(Number(m.monto || 0));

    let cat = (m.categoria || m.tipoCategoria || m.categoriaMovimiento || '').toString().toUpperCase().trim();
    if (!cat) {
      cat = esEgreso ? 'EGRESOS GENERALES' : 'INGRESOS GENERALES';
    }

    if (cat === 'CTA_CTE' || cat === 'CUENTA_CORRIENTE' || cat === 'COBRO_CTA_CTE') {
      cat = 'Cuenta Corriente';
    } else if (cat === 'MANTENIMIENTO' || cat === 'EGRESO_MANTENIMIENTO') {
      cat = 'Mantenimiento';
    } else if (cat === 'INSUMOS' || cat === 'EGRESO_INSUMOS') {
      cat = 'Insumos';
    } else if (cat === 'INGRESO' || cat === 'INGRESOS') {
      cat = 'Ingresos Generales';
    } else if (
      cat === 'EGRESO' ||
      cat === 'EGRESOS' ||
      cat === 'VARIOS' ||
      cat === 'EGRESO_VARIOS' ||
      cat === 'GASTOS VARIOS'
    ) {
      cat = 'Egresos Generales';
    }

    if (esEgreso) {
      if (!mapaCategoriasEgreso[cat]) mapaCategoriasEgreso[cat] = { cantidad: 0, total: 0 };
      mapaCategoriasEgreso[cat].cantidad += 1;
      mapaCategoriasEgreso[cat].total += montoAbs;
    } else {
      if (!mapaCategoriasIngreso[cat]) mapaCategoriasIngreso[cat] = { cantidad: 0, total: 0 };
      mapaCategoriasIngreso[cat].cantidad += 1;
      mapaCategoriasIngreso[cat].total += montoAbs;
    }
  });

  const distribucionCategoriasIngreso = Object.keys(mapaCategoriasIngreso).map((cat, index) => ({
    name: cat,
    value: mapaCategoriasIngreso[cat].total,
    cantidad: mapaCategoriasIngreso[cat].cantidad,
    color: COLORES_TORTA[index % COLORES_TORTA.length]
  }));

  const distribucionCategoriasEgreso = Object.keys(mapaCategoriasEgreso).map((cat, index) => ({
    name: cat,
    value: mapaCategoriasEgreso[cat].total,
    cantidad: mapaCategoriasEgreso[cat].cantidad,
    color: COLORES_TORTA[(index + 2) % COLORES_TORTA.length]
  }));

  // --- PRODUCTOS Y CATEGORÍAS MÁS VENDIDAS ---
  const mapaProductos: { [key: string]: { cantidad: number; nombre: string } } = {};
  const mapaCategorias: { [key: string]: number } = {};
  const mapaCategoriasCliente: { [key: string]: { cantidad: number; monto: number; ahorro: number } } = {};

  pedidosEnRango.forEach((p: any) => {
    const clienteObj = p.cliente;
    const catClienteObj = clienteObj?.categoriaCliente || clienteObj?.categoria || p.categoriaCliente;

    // 1. Extraemos el nombre ya sea que venga como Objeto o como String directo
    let nombreCatRaw = '';
    if (typeof catClienteObj === 'string') {
      nombreCatRaw = catClienteObj;
    } else {
      nombreCatRaw = catClienteObj?.nombreCategoria || catClienteObj?.nombre || '';
    }

    let porcentajeDescuento = Number(catClienteObj?.descuento || catClienteObj?.porcentajeDescuento || 0);

    const obs = p.observaciones || '';
    const matchDescuento = obs.match(/\[Descuento aplicado:\s*([^\]]+)\]/i);
    const descTexto = matchDescuento && matchDescuento[1] ? matchDescuento[1] : '';

    // 2. Unificamos todos los textos posibles donde puede estar la categoría para hacer una búsqueda segura
    const textoBusqueda = `${nombreCatRaw} ${descTexto} ${obs}`.toLowerCase();

    // 3. Asignación estricta y dinámica
    let nombreCatCliente = 'Sin Categoría / General';

    // Primero verificamos si el objeto pedido ya trae un nombre de categoría válido
    if (nombreCatRaw && !textoBusqueda.includes('sin categoría') && !textoBusqueda.includes('consumidor final')) {
      nombreCatCliente = nombreCatRaw;
    } else {
      // Si no viene directo, buscamos dinámicamente en las categorías traídas de la base de datos
      const categoriaEncontrada = (categoriasClienteLista || []).find((cat: any) =>
        textoBusqueda.includes((cat.nombre || '').toLowerCase())
      );

      if (categoriaEncontrada) {
        nombreCatCliente = categoriaEncontrada.nombre;
      }
    }

    // Extraemos el porcentaje si no venía en el objeto pero sí en el texto
    if (porcentajeDescuento === 0) {
      const numMatch = descTexto.match(/(\d+(\.\d+)?)/);
      if (numMatch) {
        porcentajeDescuento = Number(numMatch[1]);
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
    name: item.nombre,
    rank: index + 1,
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

  // --- RECAUDACIÓN, RENDIMIENTO Y TIEMPOS DE EMPLEADOS (OPERACIONES Y RRHH) ---
  const mapaEmpleados: {
    [key: string]: {
      ventas: number;
      pedidos: number;
      sumaMinutos: number;
      maxMinutos: number;
    }
  } = {};

  const mapaDevueltosPorEmpleado: { [key: string]: number } = {};
  const normalizarTexto = (str: any) =>
    (str || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const obtenerNombreOperario = (empObj: any) => {
    if (!empObj) return 'Sin Asignar';
    return empObj.persona
      ? `${empObj.persona.nombre} ${empObj.persona.apellido}`
      : empObj.nombre || `Emp #${empObj.idEmpleado || empObj.id_empleado || empObj.idUsuario}`;
  };

  const pedidosContados = new Set<string | number>();
  let sumaTiempoGeneralMinutos = 0;
  let tiempoMaximoGeneralMinutos = 0;
  let cantidadPedidosConTiempo = 0;

  pedidosEnRango.forEach((p) => {
    const idPed = p.idPedido || p.id_pedido || p.id;
    const estado = (p.estado || '').toUpperCase();

    // Métrica de Pedidos Devueltos / Cancelados por Empleado
    const listaHistoriales = p.historiales || p.historialEstadoPedidos || [];

    const historialDevolucion = listaHistoriales.find((h: any) =>
      h.estado_nuevo === 'DEVUELTO' ||
      h.estadoNuevo === 'DEVUELTO' ||
      normalizarTexto(h.observaciones).includes('devolucion')
    );

    const huboDevolucion =
      estado === 'DEVUELTO' ||
      estado === 'CANCELADO' ||
      estado === 'DEVOLUCION' ||
      normalizarTexto(p.observaciones).includes('devolucion') ||
      Boolean(historialDevolucion);

    if (huboDevolucion) {
      const ultimaAsignacion =
        p.asignaciones && p.asignaciones.length > 0 ? p.asignaciones[p.asignaciones.length - 1] : null;

      const nombreEmp = obtenerNombreOperario(ultimaAsignacion?.empleado || p.empleado);

      mapaDevueltosPorEmpleado[nombreEmp] = (mapaDevueltosPorEmpleado[nombreEmp] || 0) + 1;
    }

    // Cálculo de tiempos de resolución
    const fechaInicioStr = p.fecha_creacion || p.fechaCreacion || p.fecha;
    const fechaFinStr = p.fecha_finalizacion || p.fechaFinalizacion || p.fecha_entrega || p.fechaEntrega;

    let duracionMinutos = 0;
    let tieneTiempoValido = false;

    if (fechaInicioStr && fechaFinStr) {
      const inicio = new Date(fechaInicioStr).getTime();
      const fin = new Date(fechaFinStr).getTime();
      if (!isNaN(inicio) && !isNaN(fin) && fin >= inicio) {
        duracionMinutos = Math.round((fin - inicio) / (1000 * 60));
        tieneTiempoValido = true;
      }
    }

    if (tieneTiempoValido) {
      sumaTiempoGeneralMinutos += duracionMinutos;
      cantidadPedidosConTiempo += 1;
      if (duracionMinutos > tiempoMaximoGeneralMinutos) {
        tiempoMaximoGeneralMinutos = duracionMinutos;
      }
    }

    if (estado === 'ENTREGADO' || estado === 'COMPLETADO' || estado === 'FINALIZADO') {
      const ultimaAsignacion =
        p.asignaciones && p.asignaciones.length > 0 ? p.asignaciones[p.asignaciones.length - 1] : null;
      const nombreEmp = obtenerNombreOperario(ultimaAsignacion?.empleado || p.empleado);

      if (!mapaEmpleados[nombreEmp]) {
        mapaEmpleados[nombreEmp] = { ventas: 0, pedidos: 0, sumaMinutos: 0, maxMinutos: 0 };
      }

      mapaEmpleados[nombreEmp].pedidos += 1;

      if (tieneTiempoValido) {
        mapaEmpleados[nombreEmp].sumaMinutos += duracionMinutos;
        if (duracionMinutos > mapaEmpleados[nombreEmp].maxMinutos) {
          mapaEmpleados[nombreEmp].maxMinutos = duracionMinutos;
        }
      }

      if (idPed) pedidosContados.add(idPed);
    }
  });

  const pedidosDevueltosPorEmpleado = Object.keys(mapaDevueltosPorEmpleado).map((nombre, index) => ({
    name: nombre,
    value: mapaDevueltosPorEmpleado[nombre],
    color: COLORES_TORTA[index % COLORES_TORTA.length]
  }));

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
      mapaEmpleados[nombreEmp] = { ventas: 0, pedidos: 0, sumaMinutos: 0, maxMinutos: 0 };
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
      mapaEmpleados[nombreEmp] = { ventas: 0, pedidos: 0, sumaMinutos: 0, maxMinutos: 0 };
    }
    mapaEmpleados[nombreEmp].ventas += Number(p.monto_total || p.total || 0);
  });

  const rendimientoEmpleados = Object.keys(mapaEmpleados).map((nombre) => ({
    name: nombre,
    ventas: mapaEmpleados[nombre].ventas,
    pedidosCompletados: mapaEmpleados[nombre].pedidos
  }));

  const tiempoPromedioPedidoPorEmpleado = Object.keys(mapaEmpleados).map((nombre, index) => {
    const emp = mapaEmpleados[nombre];
    const promedio = emp.pedidos > 0 ? Math.round(emp.sumaMinutos / emp.pedidos) : 0;
    return {
      name: nombre,
      valor: promedio,
      color: COLORES_TORTA[index % COLORES_TORTA.length]
    };
  });

  const tiempoMaximoEmpleado = Object.keys(mapaEmpleados).map((nombre, index) => {
    const emp = mapaEmpleados[nombre];
    return {
      name: nombre,
      valor: emp.maxMinutos,
      color: COLORES_TORTA[(index + 1) % COLORES_TORTA.length]
    };
  });

  const tiempoPromedioGeneralMinutos = cantidadPedidosConTiempo > 0
    ? Math.round(sumaTiempoGeneralMinutos / cantidadPedidosConTiempo)
    : 0;

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
  const obtenerNombreUsuarioMerma = (usuarioObj: any) => {
    if (!usuarioObj) return 'Sin Asignar';
    return usuarioObj.persona
      ? `${usuarioObj.persona.nombre} ${usuarioObj.persona.apellido}`
      : usuarioObj.nombreUsuario || `Usuario #${usuarioObj.idUsuario}`;
  };

  const mermasEnRango = (mermasLista || []).filter((item) => {
    const f = new Date(item.fecha_merma || item.fechaMerma);
    return f >= desde && f <= hasta;
  });

  let mermasPorPeriodo: any[] = [];
  if (esUnSoloDia) {
    mermasPorPeriodo = mermasEnRango.map((item, idx) => {
      const horaLabel = new Date(item.fecha_merma || item.fechaMerma).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      return {
        ejeX: `${horaLabel}#${idx}`,   // clave ÚNICA para el eje (evita colisiones de Recharts)
        horaLabel,                      // texto real que se muestra
        cantidad: Number(item.cantidad) || 0,
        insumo: item.insumo?.nombreInsumo || null,
        producto: item.producto?.nombreProducto || null,
        empleado: obtenerNombreUsuarioMerma(item.usuario),
        motivo: item.descripcion || item.motivo || ''
      };
    });
  } else {
    const mermasAgrupadas = agruparPorPeriodo(
      mermasEnRango,
      desde,
      hasta,
      esUnSoloDia,
      esPorSemanas,
      esPorMeses,
      esPorAnios,
      (item) => new Date(item.fecha_merma || item.fechaMerma),
      (item) => Number(item.cantidad) || 0
    );

    mermasPorPeriodo = mermasAgrupadas.map((item) => ({
      ejeX: item.name,
      cantidad: item.valor
    }));
  }

  const averiasEnRango = (averiasLista || []).filter((item) => {
    const f = new Date(item.fechaReporte || item.fecha_reporte);
    return f >= desde && f <= hasta;
  });

  let averiasPorPeriodo: any[] = [];
  if (esUnSoloDia) {
    averiasPorPeriodo = averiasEnRango.map((item, idx) => ({
      ejeX: `${new Date(item.fechaReporte).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}#${idx}`,
      cantidad: 1,
      maquina: item.maquina?.nombre || 'Sin especificar',
      detalle: item.descripcion || 'Sin detalle'
    }));
  } else {
    const averiasAgrupadas = agruparPorPeriodo(
      averiasEnRango, desde, hasta, esUnSoloDia, esPorSemanas, esPorMeses, esPorAnios,
      (item) => new Date(item.fechaReporte),
      () => 1
    );
    averiasPorPeriodo = averiasAgrupadas.map((item) => ({ ejeX: item.name, cantidad: item.valor }));
  }

  // --- CLIENTES CON MÁS INGRESOS ---
  const mapaClientes: { [key: string]: { nombre: string; totalGastado: number; cantidadPedidos: number } } = {};

  const obtenerNombreCliente = (clienteObj: any, fallbackStr?: string): string => {
    let clienteNombre = '';

    if (typeof clienteObj === 'string' && clienteObj.trim()) {
      clienteNombre = clienteObj;
    } else if (clienteObj && typeof clienteObj === 'object') {
      const razonSocialLimpia = (clienteObj.razonSocial || '').trim().toLowerCase();
      const razonSocialValida =
        clienteObj.razonSocial &&
        razonSocialLimpia !== '' &&
        razonSocialLimpia !== 'ninguna' &&
        razonSocialLimpia !== 'ninguno' &&
        razonSocialLimpia !== 'n/a' &&
        razonSocialLimpia !== 'na';

      if (razonSocialValida) {
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
      name: item.nombre,
      rank: index + 1,
      totalGastado: item.totalGastado,
      cantidadPedidos: item.cantidadPedidos,
      color: COLORES_TORTA[index % COLORES_TORTA.length]
    }));

  const topDeudores = (deudoresLista || [])
    .slice()
    .sort((a: any, b: any) => Number(b.saldoDeudor) - Number(a.saldoDeudor))
    .slice(0, 5)
    .map((item: any, index: number) => ({
      name: item.nombre,
      rank: index + 1,
      saldoDeudor: Number(item.saldoDeudor) || 0,
      limiteCredito: Number(item.limiteCredito) || 0,
      totalPagado: Number(item.totalPagado) || 0,
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
    tiempoPromedioGeneralMinutos,
    tiempoMaximoGeneralMinutos,
    tiempoPromedioPedidoPorEmpleado: tiempoPromedioPedidoPorEmpleado.length > 0
      ? tiempoPromedioPedidoPorEmpleado
      : [{ name: 'Sin datos', valor: 0, color: '#52525b' }],
    tiempoMaximoEmpleado: tiempoMaximoEmpleado.length > 0
      ? tiempoMaximoEmpleado
      : [{ name: 'Sin datos', valor: 0, color: '#52525b' }],
    ventasPorPeriodo,
    distribucionMediosPago: distribucionMediosPago.length > 0 ? distribucionMediosPago : [{ name: 'EFECTIVO', value: totalIngresosBrutos }],
    distribucionEstados: distribucionEstados.length > 0 ? distribucionEstados : [{ name: 'Sin datos', value: 1 }],
    rendimientoEmpleados: rendimientoEmpleados.length > 0 ? rendimientoEmpleados : [{ name: 'Sin datos', ventas: 0 }],
    pedidosCompletadosPorEmpleado: pedidosCompletadosPorEmpleado.length > 0 ? pedidosCompletadosPorEmpleado : [{ name: 'Sin datos', value: 0 }],
    pedidosDevueltosPorEmpleado: pedidosDevueltosPorEmpleado.length > 0
      ? pedidosDevueltosPorEmpleado
      : [{ name: 'Sin datos', value: 0, color: '#52525b' }],
    detalleEgresos,
    mermasPorPeriodo,
    averiasPorPeriodo,
    productosMasVendidos: productosMasVendidos.length > 0 ? productosMasVendidos : [{ name: 'Sin datos', value: 1 }],
    categoriasMasVendidas: categoriasMasVendidas.length > 0 ? categoriasMasVendidas : [{ name: 'Sin datos', ventas: 0 }],
    ventasPorCategoriaCliente: ventasPorCategoriaCliente.length > 0 ? ventasPorCategoriaCliente : [{ name: 'Sin datos', ventas: 0, montoTotal: 0 }],
    topClientes: topClientesFormateados,
    topDeudores,
    distribucionCategoriasIngreso: distribucionCategoriasIngreso.length > 0
      ? distribucionCategoriasIngreso
      : [{ name: 'Sin datos', value: 0, cantidad: 0, color: '#52525b' }],
    distribucionCategoriasEgreso: distribucionCategoriasEgreso.length > 0
      ? distribucionCategoriasEgreso
      : [{ name: 'Sin datos', value: 0, cantidad: 0, color: '#52525b' }]
  };
}