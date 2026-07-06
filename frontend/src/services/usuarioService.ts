// src/services/usuarioService.ts
const API_URL = 'http://localhost:8080/api/usuarios';

export const getUsuarios = async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener usuarios");
  return res.json();
};

export const guardarUsuario = async (usuario: any) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};