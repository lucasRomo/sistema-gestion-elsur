// src/services/productoService.ts
const API_URL = 'http://localhost:8080/api/productos';

export const getProductos = async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener productos");
  return res.json();
};

export const guardarProducto = async (producto: any) => {
  const res = await fetch('http://localhost:8080/api/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
};