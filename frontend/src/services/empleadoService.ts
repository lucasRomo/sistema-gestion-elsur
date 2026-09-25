import { apiFetch } from '../config/api';
export const empleadoService = {
  obtenerTodos: async () => {
    const response = await apiFetch('/empleados');
    if (!response.ok) throw new Error('Error al listar empleados');
    return await response.json();
  }
};