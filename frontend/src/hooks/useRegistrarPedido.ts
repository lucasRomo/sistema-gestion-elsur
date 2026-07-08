import { useState, useEffect } from 'react';
import type { Producto } from '../types/Producto';
import type { Pedido } from '../types/Pedido';

const API_BASE_URL = 'http://localhost:8080/api'; 

export const useRegistrarPedido = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const [resProductos, resClientes, resEmpleados] = await Promise.all([
          fetch(`${API_BASE_URL}/productos`),
          fetch(`${API_BASE_URL}/clientes`),
          fetch(`${API_BASE_URL}/empleados`)
        ]);

        if (resProductos.ok) setProductos(await resProductos.json());
        if (resClientes.ok) setClientes(await resClientes.json());
        if (resEmpleados.ok) setEmpleados(await resEmpleados.json());
      } catch (error) {
        console.error("Error al conectar con la API de El Sur:", error);
      }
    };

    cargarDatosIniciales();
  }, []);

  // Ahora recibe un payload explícito con pedido e idEmpleado
  const enviarPedido = async (payload: { pedido: Pedido; idEmpleado: number }) => {
    setCargando(true);
    try {
      const respuesta = await fetch(`${API_BASE_URL}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!respuesta.ok) {
        const errorTexto = await respuesta.text();
        throw new Error(errorTexto || "Error del servidor al crear el pedido");
      }

      return true;
    } catch (error: any) {
      console.error("Error en enviarPedido:", error.message);
      alert(`No se pudo registrar: ${error.message}`);
      throw error;
    } finally {
      setCargando(false);
    }
  };

  return { productos, clientes, empleados, enviarPedido, cargando };
};