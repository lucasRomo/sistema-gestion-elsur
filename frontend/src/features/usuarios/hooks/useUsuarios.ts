// src/hooks/useUsuarios.ts
import { useState, useEffect } from 'react';
import { getUsuarios, guardarUsuario } from '../services/usuarioService';

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  // NUEVO (bug reportado: falta indicador de carga en las tablas).
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) { console.error("Error cargando usuarios:", err); }
    finally { setCargando(false); }
  };

  const guardar = async (usuario: any) => {
    await guardarUsuario(usuario);
    await cargar(); // Refresca la tabla automáticamente
  };

  useEffect(() => { cargar(); }, []);

  return { usuarios, guardar, cargar, cargando };
};