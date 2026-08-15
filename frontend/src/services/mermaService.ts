const BASE_URL = 'http://localhost:8080/api/mermas';

export interface MermaEntity {
  idMerma?: number;
  pedido: { idPedido: number };
  producto?: { idProducto: number; nombreProducto?: string };
  insumo?: { idInsumo: number; nombreInsumo?: string };
  cantidad: number;
  descripcion: string;
  fechaMerma?: string;
  idUsuario?: number;
}

export const mermaService = {
  obtenerPorPedido: async (idPedido: number): Promise<MermaEntity[]> => {
    const res = await fetch(`${BASE_URL}/pedido/${idPedido}`);
    if (!res.ok) throw new Error('Error al cargar el historial de mermas.');
    return await res.json();
  },

  registrarMermas: async (mermas: MermaEntity[]): Promise<MermaEntity[]> => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mermas)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Error al guardar la merma.');
    }
    return await res.json();
  }
};