import { useEffect, useState } from 'react';
import { API_BASE_URL, apiFetch } from '../config/api';

export interface ContadoresMenu {
  taller: number;
  atrasados: number;
  stockBajo: number;
}

const VACIO: ContadoresMenu = { taller: 0, atrasados: 0, stockBajo: 0 };
const VIGENCIA_MS = 30000;

// El menú lateral se vuelve a montar en cada pantalla: se guarda el último resultado un rato
// para no repetir las consultas en cada navegación.
let cache: { datos: ContadoresMenu; hora: number } | null = null;

const pedirJson = async (ruta: string) => {
  const res = await apiFetch(`${API_BASE_URL}${ruta}`, { skipLoading: true });
  return res.ok ? res.json() : null;
};

// Contadores del menú lateral ("Pedidos Pendientes 5", "Insumos 2 con stock bajo"), para
// enterarse sin entrar a cada pantalla. Solo pide lo que el usuario tiene permiso de ver.
export const useContadoresMenu = (verPedidos: boolean, verInsumos: boolean): ContadoresMenu => {
  const [contadores, setContadores] = useState<ContadoresMenu>(cache?.datos ?? VACIO);

  useEffect(() => {
    if (!verPedidos && !verInsumos) return;
    let cancelado = false;

    const actualizar = async () => {
      // Vigente: ya se usó como estado inicial al montar.
      if (cache && Date.now() - cache.hora < VIGENCIA_MS) return;
      try {
        const [cola, bajoStock] = await Promise.all([
          verPedidos ? pedirJson('/pedidos/resumen-cola').catch(() => null) : null,
          verInsumos ? pedirJson('/insumos/bajo-stock').catch(() => null) : null,
        ]);
        const datos: ContadoresMenu = {
          taller: Number(cola?.taller ?? 0),
          atrasados: Number(cola?.atrasados ?? 0),
          stockBajo: Array.isArray(bajoStock) ? bajoStock.length : 0,
        };
        cache = { datos, hora: Date.now() };
        if (!cancelado) setContadores(datos);
      } catch {
        // Sin conexión o sin permiso: el menú sigue funcionando sin contadores.
      }
    };

    actualizar();
    const intervalo = setInterval(actualizar, 60000);
    return () => { cancelado = true; clearInterval(intervalo); };
  }, [verPedidos, verInsumos]);

  return contadores;
};
