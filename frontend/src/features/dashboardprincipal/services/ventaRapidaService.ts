// services/ventaRapidaService.ts
import type { Producto } from '../../productos/types/Producto';
import type { CategoriaCliente } from '../../clientes/types/CategoriaCliente';
import type { Maquina } from '../../maquinas/types/Maquina';

const API_BASE = 'http://localhost:8080/api';

export const ventaRapidaService = {
  async getProductosActivos(): Promise<Producto[]> {
    const res = await fetch(`${API_BASE}/productos`);
    if (!res.ok) throw new Error('Error al obtener productos');
    const data: Producto[] = await res.json();
    return data.filter((p) => p.estado === 'Activo');
  },

  async getCategorias(): Promise<CategoriaCliente[]> {
    const res = await fetch(`${API_BASE}/categorias-cliente`);
    if (!res.ok) throw new Error('Error al obtener categorías');
    const data = await res.json();
    return data.map((cat: any) => ({
      idCategoriaCliente: cat.idCategoria ?? cat.id_categoria ?? cat.idCategoriaCliente ?? cat.id,
      nombreCategoria: cat.nombre ?? cat.nombreCategoria ?? cat.nombre_categoria ?? 'Sin nombre',
      porcentajeDescuento: cat.descuentoAutomatico ?? cat.descuento_automatico ?? cat.porcentajeDescuento ?? cat.descuento ?? 0
    }));
  },

  async getMaquinas(): Promise<Maquina[]> {
    const res = await fetch(`${API_BASE}/maquinas`);
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

    const resCrear = await fetch(`${API_BASE}/pedidos`, {
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

    const resPago = await fetch(`${API_BASE}/pedidos/${idPedido}/pagos`, {
      method: 'POST',
      body: formDataPago
    });
    if (!resPago.ok) throw new Error(await resPago.text() || "Error al registrar cobro en caja.");

    // 3. Cambiar estado a FINALIZADO
    const resEstado = await fetch(`${API_BASE}/pedidos/${idPedido}/cambiar-estado`, {
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
  }
};