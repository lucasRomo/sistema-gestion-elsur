// src/services/proveedorService.ts
// src/services/proveedorService.ts
import type { Proveedor } from '../types/Proveedor';

const API_URL = 'http://localhost:8080/api/proveedores';

export const getProveedores = async (): Promise<Proveedor[]> => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener proveedores");
  return res.json();
};

export const guardarProveedor = async (proveedor: Proveedor) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proveedor)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};