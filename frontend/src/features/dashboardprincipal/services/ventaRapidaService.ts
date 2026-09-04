import type { Producto } from '../../productos/types/Producto';
import type { CategoriaCliente } from '../../clientes/types/CategoriaCliente';
import type { Maquina } from '../../maquinas/types/Maquina';
import { apiFetch } from '../../../config/api';

const API_BASE = 'http://localhost:8080/api';

export interface EstadoCajaNotificacion {
  cajaAbierta: boolean;
  datosTurno: any | null;
  ingresosTurno: number;
  egresosTurno: number;
}

export interface PedidoNotificacion {
  id: number;
  cliente: string;
  estadoTiempo: 'vencido' | 'urgente';
  minDiferencia: number;
}

interface PedidoBackend {
  id_pedido: number;
  cliente?: {
    persona?: {
      nombre?: string;
      apellido?: string;
    };
    razonSocial?: string;
    razon_social?: string;
    nombre?: string;
  };
  fecha_entrega_estimada: string;
  estado: string;
  observaciones?: string;
  observacion?: string;
  estante?: string;
}

export const ventaRapidaService = {
  async getProductosActivos(): Promise<Producto[]> {
    const res = await apiFetch(`${API_BASE}/productos`);
    if (!res.ok) throw new Error('Error al obtener productos');
    const data: Producto[] = await res.json();
    return data.filter((p) => p.estado === 'Activo');
  },

  async getCategorias(): Promise<CategoriaCliente[]> {
    const res = await apiFetch(`${API_BASE}/categorias-cliente`);
    if (!res.ok) throw new Error('Error al obtener categorías');
    const data = await res.json();
    return data.map((cat: any) => ({
      idCategoriaCliente: cat.idCategoria ?? cat.id_categoria ?? cat.idCategoriaCliente ?? cat.id,
      nombreCategoria: cat.nombre ?? cat.nombreCategoria ?? cat.nombre_categoria ?? 'Sin nombre',
      porcentajeDescuento: cat.descuentoAutomatico ?? cat.descuento_automatico ?? cat.porcentajeDescuento ?? cat.descuento ?? 0
    }));
  },

  async getMaquinas(): Promise<Maquina[]> {
    const res = await apiFetch(`${API_BASE}/maquinas`);
    if (!res.ok) throw new Error('Error al obtener máquinas');
    return res.json();
  },

  async procesarVentaRapida(payload: {
    montoTotal: number;
    porcentajeDescuento: number;
    nombreCategoria?: string;
    detalles: any[];
    idUsuario: number;
  }) {
    const fechaActualIso = new Date().toISOString().slice(0, 19);

    // 1. Crear Pedido
    const payloadPedido = {
      pedido: {
        cliente: { id_cliente: 1 },
        fecha_finalizacion: fechaActualIso,
        monto_total: payload.montoTotal,
        monto_pago_adelantado: 0,
        es_cuenta_corriente: false,
        es_presupuesto: false,
        observaciones: `Venta Rápida ${payload.porcentajeDescuento > 0 ? `(Categoría: ${payload.nombreCategoria} - ${payload.porcentajeDescuento}% Desc.)` : ''}`,
        detalles: payload.detalles
      },
      idEmpleado: payload.idUsuario,
      idUsuario: payload.idUsuario,
      tipoPago: 'EFECTIVO'
    };

    const resCrear = await apiFetch(`${API_BASE}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadPedido)
    });
    if (!resCrear.ok) throw new Error(await resCrear.text());
    const pedidoGuardado = await resCrear.json();
    const idPedido = pedidoGuardado.id_pedido || pedidoGuardado.idPedido;

    await new Promise((resolve) => setTimeout(resolve, 300));

    // 2. Registrar Pago en Caja
    const formDataPago = new FormData();
    formDataPago.append("payload", JSON.stringify({
      monto: payload.montoTotal,
      tipoPago: 'EFECTIVO',
      idUsuario: payload.idUsuario
    }));

    const resPago = await apiFetch(`${API_BASE}/pedidos/${idPedido}/pagos`, {
      method: 'POST',
      body: formDataPago
    });
    if (!resPago.ok) throw new Error(await resPago.text() || "Error al registrar cobro en caja.");

    // 3. Cambiar estado a FINALIZADO
    const resEstado = await apiFetch(`${API_BASE}/pedidos/${idPedido}/cambiar-estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nuevoEstado: 'FINALIZADO',
        observaciones: `Venta Rápida ${payload.porcentajeDescuento > 0 ? `(Categoría: ${payload.nombreCategoria} - ${payload.porcentajeDescuento}% Desc.)` : ''}`,
        idUsuario: payload.idUsuario
      })
    });
    if (!resEstado.ok) throw new Error(await resEstado.text() || "Error al actualizar estado.");

    return pedidoGuardado;
  },

  // --- MÉTODOS DE NOTIFICACIONES ---

  async getEstadoCajaNotificacion(): Promise<EstadoCajaNotificacion> {
    const resCaja = await fetch(`${API_BASE}/turnos/estado-caja`);
    if (!resCaja.ok) {
      return { cajaAbierta: false, datosTurno: null, ingresosTurno: 0, egresosTurno: 0 };
    }

    const textRes = await resCaja.text();
    if (!textRes) {
      return { cajaAbierta: false, datosTurno: null, ingresosTurno: 0, egresosTurno: 0 };
    }

    const dataCaja = JSON.parse(textRes);
    let ingresosTurno = 0;
    let egresosTurno = 0;

    try {
      const resTotales = await fetch(`${API_BASE}/movimientos-caja/totales`);
      if (resTotales.ok) {
        const dataTotales = await resTotales.json();
        ingresosTurno = dataTotales.totalIngresos || 0;
        egresosTurno = dataTotales.totalEgresos || 0;
      }
    } catch (error) {
      console.error("Error al obtener totales de caja:", error);
    }

    return {
      cajaAbierta: true,
      datosTurno: dataCaja,
      ingresosTurno,
      egresosTurno
    };
  },

  async getPedidosUrgentesNotificacion(): Promise<PedidoNotificacion[]> {
    const resPedidos = await fetch(`${API_BASE}/pedidos`);
    if (!resPedidos.ok) throw new Error("Error al consultar pedidos");

    const dataPedidos: PedidoBackend[] = await resPedidos.json();
    const ahora = new Date().getTime();
    const urgentesOExcedidos: PedidoNotificacion[] = [];

    dataPedidos.forEach((p) => {
      const obs = (p.observaciones || p.observacion || '').toLowerCase();
      const esVentaRapida = obs.includes('venta rápida') || p.estante === 'Venta Rápida';
      if (esVentaRapida) return;

      const estadoUpper = (p.estado || '').toUpperCase().trim();
      if (
        !estadoUpper ||
        estadoUpper === 'PRESUPUESTO' ||
        estadoUpper === 'ENTREGADO' ||
        estadoUpper === 'CANCELADO' ||
        estadoUpper === 'FINALIZADO' ||
        estadoUpper === 'COMPLETADO'
      ) {
        return;
      }

      if (!p.fecha_entrega_estimada) return;

      const fechaEntrega = new Date(p.fecha_entrega_estimada).getTime();
      const diffMs = fechaEntrega - ahora;
      const diffMin = Math.floor(diffMs / (1000 * 60));

      const nombreCliente = p.cliente?.persona
        ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido || ''}`.trim()
        : (p.cliente?.razonSocial || p.cliente?.razon_social || p.cliente?.nombre || 'Consumidor Final');

      if (diffMin <= 0) {
        urgentesOExcedidos.push({
          id: p.id_pedido,
          cliente: nombreCliente,
          estadoTiempo: 'vencido',
          minDiferencia: Math.abs(diffMin),
        });
      } else if (diffMin <= 60) {
        urgentesOExcedidos.push({
          id: p.id_pedido,
          cliente: nombreCliente,
          estadoTiempo: 'urgente',
          minDiferencia: diffMin,
        });
      }
    });

    urgentesOExcedidos.sort((a, b) => {
      if (a.estadoTiempo === 'vencido' && b.estadoTiempo !== 'vencido') return -1;
      if (a.estadoTiempo !== 'vencido' && b.estadoTiempo === 'vencido') return 1;
      return a.minDiferencia - b.minDiferencia;
    });

    return urgentesOExcedidos;
  }
};