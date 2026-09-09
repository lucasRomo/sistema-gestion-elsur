import { useState, useEffect } from 'react';
import { API_BASE_URL, apiFetch } from '../../../../config/api';

export const useHistorialPedidos = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/pedidos`);
      if (response.ok) {
        const data = await response.json();
        const ordenados = data.sort((a: any, b: any) => 
          new Date(b.fecha_creacion || b.id_pedido).getTime() - new Date(a.fecha_creacion || a.id_pedido).getTime()
        );
        setPedidos(ordenados);
      } else {
        console.error('Error al traer el historial de la API.');
      }
    } catch (error) {
      console.error('Error de conexión con la API:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  return { pedidos, cargando, recargarHistorial: cargarHistorial };
};