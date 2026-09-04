import { useState, useEffect } from 'react';
import { apiFetch } from '../../../../config/api';

export const useHistorialPedidos = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      // Ajustá este endpoint según mapee tu backend para traer el histórico global
      const response = await apiFetch('http://localhost:8080/api/pedidos');
      if (response.ok) {
        const data = await response.json();
        // Ordenamos por fecha de creación descendentemente (más recientes primero)
        const ordenados = data.sort((a: any, b: any) => 
          new Date(b.fecha_creacion || b.id_pedido).getTime() - new Date(a.fecha_creacion || a.id_pedido).getTime()
        );
        setPedidos(ordenados);
      } else {
        console.error('Error al traer el historial de la API.');
      }
    } catch (error) {
      console.error('Error de conexión con Spring Boot:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  return { pedidos, cargando, recargarHistorial: cargarHistorial };
};