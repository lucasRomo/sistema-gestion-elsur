import { useState, useEffect } from 'react';
import { getUsuarios, guardarUsuario } from '../services/usuarioService';

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
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
    await cargar();
  };

  useEffect(() => { cargar(); }, []);

  return { usuarios, guardar, cargar, cargando };
};