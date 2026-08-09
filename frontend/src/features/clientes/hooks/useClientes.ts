import { useState, useEffect, useCallback } from 'react';
import { clienteService } from '../services/clienteService';

export const useClientes = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cargarClientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clienteService.getClientes();
      setClientes(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarCliente = async (cliente: any) => {
    await clienteService.crearCliente(cliente);
    await cargarClientes();
  };

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  return { 
    clientes, 
    loading, 
    error, 
    registrarCliente, 
    cargarClientes 
  };
};