import { useState } from 'react';
import type { CartItem } from '../../pedidos/general/types/Pedido';
import type { Producto } from '../../productos/types/Producto';
import type { CategoriaCliente } from '../../clientes/types/CategoriaCliente';

export const useCarrito = (categorias: CategoriaCliente[]) => {
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState<string>('');

  const agregarProducto = (producto: Producto, cantidad: number) => {
    if (!producto || cantidad <= 0) return;
    setCarrito((prev) => [...prev, { producto, cantidad, subtotal: producto.precioBase * cantidad }]);
  };

  const eliminarItem = (index: number) => {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    setCategoriaSeleccionadaId('');
  };

  const subtotalVenta = carrito.reduce((acc, item) => acc + item.subtotal, 0);

  const categoriaActual = categorias.find((c) => {
    const id = c.idCategoriaCliente ?? (c as any).idCategoria ?? (c as any).id_categoria ?? (c as any).id;
    return id?.toString() === categoriaSeleccionadaId;
  });

  const porcentajeDescuento = categoriaActual
    ? (categoriaActual.porcentajeDescuento ?? (categoriaActual as any).descuentoAutomatico ?? 0)
    : 0;

  const montoDescuento = (subtotalVenta * porcentajeDescuento) / 100;
  const totalFinal = subtotalVenta - montoDescuento;

  return {
    carrito,
    categoriaSeleccionadaId,
    setCategoriaSeleccionadaId,
    categoriaActual,
    porcentajeDescuento,
    subtotalVenta,
    montoDescuento,
    totalFinal,
    agregarProducto,
    eliminarItem,
    vaciarCarrito
  };
};