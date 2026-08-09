import { useState, useEffect } from 'react';
import type { Producto } from '../../productos/types/Producto';
import type { Pedido } from '../types/Pedido';
import type { Maquina } from '../../maquinas/types/Maquina';

const API_BASE_URL = 'http://localhost:8080/api'; 

export const useRegistrarPedido = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const [resProductos, resClientes, resEmpleados, resMaquinas] = await Promise.all([
          fetch(`${API_BASE_URL}/productos`),
          fetch(`${API_BASE_URL}/clientes`),
          fetch(`${API_BASE_URL}/empleados`),
          fetch(`${API_BASE_URL}/maquinas`)
        ]);

        if (resProductos.ok) setProductos(await resProductos.json());
        if (resClientes.ok) setClientes(await resClientes.json());
        if (resEmpleados.ok) setEmpleados(await resEmpleados.json());
        if (resMaquinas.ok) setMaquinas(await resMaquinas.json());
      } catch (error) {
        console.error("Error al conectar con la API de El Sur:", error);
      }
    };

    cargarDatosIniciales();
  }, []);

  // ➔ "enviarPedido" acepta el archivo opcional "fileComprobante"
  const enviarPedido = async (
    payload: { pedido: Pedido; idEmpleado: number; idUsuario?: number | null },
    fileComprobante?: File | null
  ) => {
    setCargando(true);
    try {
      let respuesta;

      // 1. Si el usuario adjuntó un archivo de comprobante, usamos FormData
      if (fileComprobante) {
        const formData = new FormData();
        
        // Adjuntamos el JSON estructurado como un Blob con su respectivo tipo
        formData.append(
          'payload', 
          new Blob([JSON.stringify(payload)], { type: 'application/json' })
        );
        
        // Adjuntamos el archivo físico del comprobante
        formData.append('comprobante', fileComprobante);

        respuesta = await fetch(`${API_BASE_URL}/pedidos`, {
          method: 'POST',
          // NOTA: No seteamos 'Content-Type' manualmente al usar FormData.
          // El navegador lo calculará automáticamente incluyendo la frontera (boundary) correcta.
          body: formData
        });
      } else {
        // 2. Si no hay archivo, seguimos enviando JSON puro como siempre
        respuesta = await fetch(`${API_BASE_URL}/pedidos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!respuesta.ok) {
        const errorTexto = await respuesta.text();
        throw new Error(errorTexto || "Error del servidor al crear el pedido");
      }

      return true;
    } catch (error: any) {
      console.error("Error en enviarPedido:", error.message);     
      throw error;
    } finally {
      setCargando(false);
    }
  };

  return { productos, clientes, empleados, maquinas, enviarPedido, cargando };
};