// src/services/clienteService.ts
const API_URL = 'http://localhost:8080/api/clientes';

export const getClientes = async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener clientes");
  return res.json();
};

export const crearCliente = async (cliente: any) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cliente)
  });
  if (!res.ok) throw new Error(await res.text());
  return res;
};