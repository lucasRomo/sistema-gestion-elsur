import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL, apiFetch } from '../../../../config/api';

const TAMANO_PAGINA = 50;

// Historial paginado en el servidor: antes se traían todos los pedidos cerrados de una vez
// (con todas sus relaciones), lo que con meses de uso se volvía cada vez más lento.
// La búsqueda (cliente, empleado, N° de pedido o fecha dd/mm/aaaa) también la resuelve el backend.
export const useHistorialPedidos = (busqueda: string, estado: string) => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [cargandoMas, setCargandoMas] = useState<boolean>(false);
  const [pagina, setPagina] = useState<number>(0);
  const [hayMas, setHayMas] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const peticionActual = useRef(0);

  const pedirPagina = useCallback(async (numeroPagina: number) => {
    const params = new URLSearchParams({
      pagina: String(numeroPagina),
      tamano: String(TAMANO_PAGINA),
      estado,
      q: busqueda.trim(),
    });
    const response = await apiFetch(`${API_BASE_URL}/pedidos/cerrados/paginado?${params.toString()}`);
    if (!response.ok) throw new Error('Error al traer el historial de la API.');
    return response.json();
  }, [busqueda, estado]);

  const cargarHistorial = useCallback(async () => {
    const id = ++peticionActual.current;
    setCargando(true);
    try {
      const data = await pedirPagina(0);
      if (id !== peticionActual.current) return; // llegó una búsqueda más nueva
      setPedidos(data.contenido ?? []);
      setPagina(0);
      setHayMas(!data.ultima);
      setTotal(data.totalElementos ?? 0);
    } catch (error) {
      console.error('Error de conexión con la API:', error);
    } finally {
      if (id === peticionActual.current) setCargando(false);
    }
  }, [pedirPagina]);

  const cargarMas = async () => {
    if (cargandoMas || !hayMas) return;
    setCargandoMas(true);
    try {
      const data = await pedirPagina(pagina + 1);
      setPedidos(prev => [...prev, ...(data.contenido ?? [])]);
      setPagina(pagina + 1);
      setHayMas(!data.ultima);
      setTotal(data.totalElementos ?? 0);
    } catch (error) {
      console.error('Error al cargar más pedidos:', error);
    } finally {
      setCargandoMas(false);
    }
  };

  // Espera a que el usuario deje de escribir antes de buscar.
  useEffect(() => {
    const t = setTimeout(cargarHistorial, busqueda ? 400 : 0);
    return () => clearTimeout(t);
  }, [cargarHistorial, busqueda]);

  return { pedidos, cargando, cargandoMas, hayMas, total, cargarMas, recargarHistorial: cargarHistorial };
};
