// src/services/insumoService.ts
const API_URL = 'http://localhost:8080/api/insumos';

export const getInsumos = async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener insumos");
  return res.json();
};

export const guardarInsumo = async (insumo: any) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(insumo)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};