// src/hooks/useInsumos.ts
import { useState, useEffect } from 'react';
import { getInsumos, guardarInsumo } from '../services/insumoService';
import type { Insumo } from '../types/Insumo';

export const useInsumos = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);

  const cargar = async () => {
    try {
      const data = await getInsumos();
      setInsumos(data);
    } catch (err) { console.error("Error al cargar insumos:", err); }
  };

  const guardar = async (insumo: any) => {
    await guardarInsumo(insumo);
    await cargar();
  };

  useEffect(() => { cargar(); }, []);

  return { insumos, guardar, cargar };
};