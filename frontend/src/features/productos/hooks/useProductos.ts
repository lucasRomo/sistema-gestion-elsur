// src/hooks/useProductos.ts
import { useState, useEffect } from 'react';
import { getProductos, guardarProducto } from '../services/productoService';
import type { Producto } from '../types/Producto';

export const useProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);

  const cargar = async () => {
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (err) { console.error("Error al cargar productos:", err); }
  };

  const guardar = async (producto: any) => {
    await guardarProducto(producto);
    await cargar();
  };

  useEffect(() => { cargar(); }, []);

  return { productos, guardar, cargar };
};