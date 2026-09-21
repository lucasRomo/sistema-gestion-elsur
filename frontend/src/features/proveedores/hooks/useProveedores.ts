import { useState, useEffect, useCallback } from 'react';
import { getProveedores, guardarProveedor } from '../services/proveedorService';
import type { Proveedor } from '../types/Proveedor';

export const useProveedores = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await getProveedores();
      setProveedores(data);
    } catch (err) {
      console.error("Error en hook:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  const guardar = async (datos: Proveedor) => {
    await guardarProveedor(datos);
    await cargar();
  };

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { proveedores, guardar, cargar, cargando };
};