import React from 'react';
import type { Producto } from '../../types/Producto';

interface Props {
  productos: Producto[];
  onEditar: (p: Producto) => void;
}

export const ProductoTabla: React.FC<Props> = ({ productos, onEditar }) => (
  <div className="table-responsive rounded-3 border border-secondary mb-4" style={{ backgroundColor: '#18181b' }}>
    <table className="table table-dark table-hover align-middle text-center font-monospace" style={{ fontSize: '0.85rem' }}>
      <thead className="table-active text-secondary">
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Stock</th> {/* NUEVA COLUMNA */}
          <th>Máquina</th>
          <th>Estado</th>
          <th>Opciones</th>
        </tr>
      </thead>
      <tbody>
        {productos.map(p => (
          <tr key={p.idProducto}>
            <td>{p.idProducto}</td>
            <td className="fw-bold">{p.nombreProducto}</td>
            <td>{p.categoria?.nombre || '-'}</td>
            <td className="text-info">${Number(p.precioBase).toFixed(2)}</td>
            {/* NUEVO DATO: Color rojo si no hay stock, verde si hay */}
            <td className={p.stock > 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
              {p.stock}
            </td>
            <td className="text-warning">No disponible</td>
            <td>
              <span className={`badge ${p.estado === 'Activo' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                {p.estado}
              </span>
            </td>
            <td>
              <button className="btn btn-sm text-info" onClick={() => onEditar(p)}>
                <i className="bi bi-pencil-square"></i>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);