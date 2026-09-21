import { useState, useEffect } from 'react';
import type { Producto } from '../../../productos/types/Producto';
import type { Pedido } from '../../general/types/Pedido';
import type { Maquina } from '../../../maquinas/types/Maquina';
import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../../config/api';

export const useRegistrarPedido = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [pedidosPendientes, setPedidosPendientes] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const [
          resProductos, 
          resClientes, 
          resEmpleados, 
          resMaquinas, 
          resProductoInsumo,
          resPedidos
        ] = await Promise.all([
          apiFetch(`${API_BASE_URL}/productos`),
          apiFetch(`${API_BASE_URL}/clientes`),
          apiFetch(`${API_BASE_URL}/empleados`),
          apiFetch(`${API_BASE_URL}/maquinas`),
          apiFetch(`${API_BASE_URL}/producto-insumo`),
          apiFetch(`${API_BASE_URL}/pedidos`)
        ]);

        const rawProductos = resProductos.ok ? await resProductos.json() : [];
        const rawRecetas = resProductoInsumo.ok ? await resProductoInsumo.json() : [];
        const rawPedidos = resPedidos.ok ? await resPedidos.json() : [];

        const pendientes = rawPedidos.filter((p: any) => 
          p.estado && (
            p.estado.toUpperCase().includes('PENDIENTE') || 
            p.estado.toUpperCase().includes('PROCESO') ||
            p.estado.toUpperCase().includes('EN ESPERA')
          )
        );

        setPedidosPendientes(pendientes);

        const productosConReceta = rawProductos.map((p: any) => {
          const receta = rawRecetas.filter((r: any) => 
            (r.idProducto ?? r.producto?.idProducto) === p.idProducto
          );
          return {
            ...p,
            receta: receta.length > 0 ? receta : (p.productoInsumos || [])
          };
        });

        setProductos(productosConReceta);
        setClientes(resClientes.ok ? await resClientes.json() : []);
        setEmpleados(resEmpleados.ok ? await resEmpleados.json() : []);
        setMaquinas(resMaquinas.ok ? await resMaquinas.json() : []);
        setPedidosPendientes(pendientes);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      }
    };

    cargarDatosIniciales();
  }, []);

  const enviarPedido = async (
    payload: {
      pedido: any;
      idEmpleado: number;
      idUsuario: number | null;
      tipoPago: string;
      idSucursal?: number;
      confirmarMaquinaNoDisponible?: boolean;
    },
    fileComprobante?: File | null
  ): Promise<any> => {
    setCargando(true);
    try {
      let respuesta: Response;

      if (fileComprobante) {
        const formData = new FormData();

        formData.append(
          'payload',
          new Blob([JSON.stringify(payload)], { type: 'application/json' })
        );

        formData.append('comprobante', fileComprobante);

        respuesta = await apiFetch(`${API_BASE_URL}/pedidos`, {
          method: 'POST',
          body: formData
        });
      } else {
        respuesta = await apiFetch(`${API_BASE_URL}/pedidos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!respuesta.ok) {
        throw new Error(await extraerMensajeError(respuesta, "Error del servidor al crear el pedido"));
      }

      return await respuesta.json();
    } catch (error: any) {
      console.error("Error en enviarPedido:", error.message);
      throw error;
    } finally {
      setCargando(false);
    }
  };

  return {
    productos,
    clientes,
    empleados,
    maquinas,
    pedidosPendientes,
    cargando,
    enviarPedido
  };
};