/**
 * Utilidades compartidas de formateo, extraídas de las múltiples
 * implementaciones locales duplicadas a lo largo del frontend
 * (ver auditoría de duplicación de código).
 */

/** Rellena con un cero a la izquierda un número de un solo dígito. */
export const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * Formatea una fecha (string ISO o Date) al formato "dd/mm/aaaa, hh:mm a. m./p. m."
 * usado por la mayoría de las vistas de pedidos e informes.
 *
 * Replica exactamente la lógica de `formatearFechaString` de TarjetaPedido.tsx
 * (que coincide con la de FilaHistorial.tsx): si la fecha es inválida devuelve
 * el valor original recibido (o '-' si no era un string), en vez de arrojar un error.
 */
export const formatearFechaHora = (fecha: string | Date | null | undefined): string => {
  if (!fecha) return '-';

  const dateObj = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(dateObj.getTime())) {
    return typeof fecha === 'string' ? fecha : '-';
  }

  const dia = pad(dateObj.getDate());
  const mes = pad(dateObj.getMonth() + 1);
  const anio = dateObj.getFullYear();

  let hh = dateObj.getHours();
  const mm = pad(dateObj.getMinutes());
  const ampm = hh >= 12 ? 'p. m.' : 'a. m.';
  hh = hh % 12 || 12;
  const hhFormat = pad(hh);

  return `${dia}/${mes}/${anio}, ${hhFormat}:${mm} ${ampm}`;
};

/**
 * Resuelve el nombre del empleado a partir de la última asignación de un pedido.
 * Replica el patrón repetido en TarjetaPedido.tsx / VistaTicketModal.tsx
 * (`ultimaAsignacion?.empleado?.persona ? "nombre apellido" : (empleado?.nombre ?? fallback)`).
 *
 * FilaHistorial.tsx y HistorialPedidosView.tsx usan el mismo patrón pero con
 * fallback 'Sistema' y sin el paso intermedio por `empleado?.nombre`; para esos
 * sitios se pasa `fallback: 'Sistema'` (ver reporte: la única diferencia de
 * comportamiento es que ahora, si existiera `empleado.nombre` sin `empleado.persona`,
 * se usaría ese nombre antes de caer a 'Sistema', en vez de ir directo a 'Sistema').
 */
export const resolverEmpleadoGestion = (pedido: any, fallback: string = 'Sin Asignar'): string => {
  const asignaciones = pedido?.asignaciones;
  const ultimaAsignacion = asignaciones && asignaciones.length > 0
    ? asignaciones[asignaciones.length - 1]
    : null;

  return ultimaAsignacion?.empleado?.persona
    ? `${ultimaAsignacion.empleado.persona.nombre} ${ultimaAsignacion.empleado.persona.apellido}`
    : (ultimaAsignacion?.empleado?.nombre ?? fallback);
};

/**
 * Resuelve el nombre a mostrar de un usuario.
 *
 * Por defecto replica el patrón de SidebarLayout.tsx:
 *   usuario?.persona?.nombre || usuario?.nombreUsuario || 'Usuario'
 * (solo el nombre de pila, fallback 'Usuario').
 *
 * Con `{ nombreCompleto: true }` replica el patrón de HistorialActividadView.tsx /
 * exportHistorialActividadUtils.ts:
 *   usuario?.persona ? `${persona.nombre} ${persona.apellido}` : (usuario?.nombreUsuario || fallback)
 * (nombre y apellido completos, fallback configurable — esos sitios usan 'Sistema').
 */
export const resolverNombreUsuario = (
  usuario: any,
  opciones?: { nombreCompleto?: boolean; fallback?: string }
): string => {
  const nombreCompleto = opciones?.nombreCompleto ?? false;
  const fallback = opciones?.fallback ?? 'Usuario';

  if (nombreCompleto) {
    if (usuario?.persona) {
      return `${usuario.persona.nombre} ${usuario.persona.apellido}`;
    }
    return usuario?.nombreUsuario || fallback;
  }

  return usuario?.persona?.nombre || usuario?.nombreUsuario || fallback;
};

/**
 * Determina la clase de color (Bootstrap `text-*`) según qué porcentaje del
 * límite de crédito representa un saldo deudor.
 * Replica exactamente `obtenerColorSaldo` de ClienteView.tsx.
 *
 * Umbrales: saldo 0 → éxito; sin límite (<=0) con saldo → peligro;
 * >=100% del límite → peligro; >=75% → advertencia; si no → éxito.
 */
export const colorPorSaldo = (saldo: number, limite: number): string => {
  const saldoAbs = Math.abs(Number(saldo || 0));
  const limiteNum = Number(limite || 0);

  if (saldoAbs === 0) return 'text-success';
  if (limiteNum <= 0) return 'text-danger';

  const porcentaje = (saldoAbs / limiteNum) * 100;

  if (porcentaje >= 100) return 'text-danger';
  if (porcentaje >= 75) return 'text-warning';
  return 'text-success';
};
