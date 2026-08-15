const BASE_URL = 'http://localhost:8080/api';

export const clienteService = {
  // Clientes
  getClientes: async () => {
    const res = await fetch(`${BASE_URL}/clientes`);
    if (!res.ok) throw new Error("Error al obtener clientes");
    return res.json();
  },

  crearCliente: async (cliente: any) => {
    const usuarioGuardado = localStorage.getItem('usuario_logueado');
    const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    const idUsuarioActual = usuarioObj?.idUsuario || usuarioObj?.id_usuario;

    const url = idUsuarioActual 
      ? `${BASE_URL}/clientes?idUsuario=${idUsuarioActual}` 
      : `${BASE_URL}/clientes`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cliente)
    });

    if (!res.ok) throw new Error(await res.text());
    return res;
  },

  // Categorías
  getCategorias: async () => {
    const res = await fetch(`${BASE_URL}/categorias-cliente`);
    if (!res.ok) throw new Error("Error al obtener categorías");
    return res.json();
  },

  crearCategoria: async (categoria: { nombre: string; descuentoAutomatico: number }) => {
    const res = await fetch(`${BASE_URL}/categorias-cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoria)
    });
    if (!res.ok) throw new Error("Error al crear categoría");
    return res.json();
  },

  actualizarCategoria: async (id: number, categoria: { nombre: string; descuentoAutomatico: number }) => {
    const res = await fetch(`${BASE_URL}/categorias-cliente/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoria)
    });
    if (!res.ok) throw new Error("Error al actualizar categoría");
    return res.json();
  },

  eliminarCategoria: async (id: number) => {
    const res = await fetch(`${BASE_URL}/categorias-cliente/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Error al eliminar categoría");
    return res;
  },

  // Cuentas Corrientes
  getMovimientos: async (idCliente: number) => {
    const res = await fetch(`${BASE_URL}/cuentas-corrientes/cliente/${idCliente}/movimientos`);
    if (!res.ok) throw new Error("Error al obtener movimientos");
    return res.json();
  },

  actualizarLimiteCredito: async (idCliente: number, limiteCredito: number) => {
    const res = await fetch(`${BASE_URL}/cuentas-corrientes/cliente/${idCliente}/limite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limiteCredito })
    });
    if (!res.ok) throw new Error("Error al actualizar límite");
    return res;
  },

  registrarPago: async (idCliente: number, monto: number, descripcion: string) => {
    const res = await fetch(`${BASE_URL}/cuentas-corrientes/cliente/${idCliente}/registrar-pago`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto, descripcion })
    });
    if (!res.ok) throw new Error("Error al registrar pago");
    return res;
  }
};