import { useState, useEffect } from 'react';
import { getUsuarios, guardarUsuario } from '../services/usuarioService';

// Tiempo mínimo que se mantiene visible el spinner de carga, para que no
// desaparezca en un parpadeo cuando la consulta responde muy rápido.
const DURACION_MINIMA_SPINNER_MS = 400;

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const inicio = Date.now();
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) { console.error("Error cargando usuarios:", err); }
    finally {
      const transcurrido = Date.now() - inicio;
      if (transcurrido < DURACION_MINIMA_SPINNER_MS) {
        await new Promise(resolve => setTimeout(resolve, DURACION_MINIMA_SPINNER_MS - transcurrido));
      }
      setCargando(false);
    }
  };

  const guardar = async (usuario: any) => {
    await guardarUsuario(usuario);
    await cargar();
  };

  useEffect(() => { cargar(); }, []);

  return { usuarios, guardar, cargar, cargando };
};