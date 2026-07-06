// src/hooks/useClientes.ts
import { useState, useEffect } from 'react';
import { getClientes, crearCliente } from '../services/clienteService';

export const useClientes = () => {
  const [clientes, setClientes] = useState<any[]>([]);

  const cargar = async () => {
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (err) { console.error(err); }
  };

  const registrar = async (cliente: any) => {
    await crearCliente(cliente);
    await cargar(); // Recargamos la tabla automáticamente
  };

  useEffect(() => { cargar(); }, []);

  return { clientes, registrar, cargar };
};