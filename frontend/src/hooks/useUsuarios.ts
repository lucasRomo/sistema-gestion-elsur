// src/hooks/useUsuarios.ts
import { useState, useEffect } from 'react';
import { getUsuarios, guardarUsuario } from '../services/usuarioService';

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);

  const cargar = async () => {
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) { console.error("Error cargando usuarios:", err); }
  };

  const guardar = async (usuario: any) => {
    await guardarUsuario(usuario);
    await cargar(); // Refresca la tabla automáticamente
  };

  useEffect(() => { cargar(); }, []);

  return { usuarios, guardar, cargar };
};