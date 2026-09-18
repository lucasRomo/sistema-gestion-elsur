// src/hooks/useProductos.ts
import { useState, useEffect } from 'react';
import { getProductos, guardarProducto } from '../services/productoService';
import type { Producto } from '../types/Producto';

export const useProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  // NUEVO (bug reportado: "agregar en las tablas que aparezca un círculo de
  // cargando"): antes este hook no exponía ningún estado de carga, así que la
  // tabla pasaba de vacía a llena sin ningún indicador visual mientras
  // esperaba la respuesta del backend.
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (err) { console.error("Error al cargar productos:", err); }
    finally { setCargando(false); }
  };

  const guardar = async (producto: any) => {
    await guardarProducto(producto);
    await cargar();
  };

  useEffect(() => { cargar(); }, []);

  return { productos, guardar, cargar, cargando };
};