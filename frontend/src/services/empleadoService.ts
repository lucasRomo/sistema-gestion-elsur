export const empleadoService = {
  obtenerTodos: async () => {
    // Esta URL llama al @GetMapping("/api/empleados") del backend
    const response = await fetch('http://localhost:8080/api/empleados');
    if (!response.ok) throw new Error('Error al listar empleados');
    return await response.json();
  }
};