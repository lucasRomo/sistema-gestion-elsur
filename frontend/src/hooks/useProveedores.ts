// src/hooks/useProveedores.ts
import { useState, useEffect } from 'react';
import { getProveedores, guardarProveedor } from '../services/proveedorService';
import type { Proveedor } from '../types/Proveedor';

export const useProveedores = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const cargar = async () => {
    try {
      const data = await getProveedores();
      setProveedores(data);
    } catch (err) { console.error("Error en hook:", err); }
  };

  const guardar = async (datos: Proveedor) => {
    await guardarProveedor(datos);
    await cargar(); // Refresca automáticamente
  };

  useEffect(() => { cargar(); }, []);

  return { proveedores, guardar, cargar };
};