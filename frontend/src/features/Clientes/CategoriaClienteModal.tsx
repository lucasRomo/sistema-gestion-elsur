import React, { useState, useEffect } from 'react';

interface Categoria {
  idCategoria?: number;
  nombre: string;
  descuentoAutomatico: number;
}

export const CategoriaClienteModal = ({ onCerrar }: { onCerrar: () => void }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState('');
  const [descuento, setDescuento] = useState<number>(0);

  const cargarCategorias = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/categorias-cliente');
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/api/categorias-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descuentoAutomatico: descuento })
      });
      if (res.ok) {
        setNombre('');
        setDescuento(0);
        cargarCategorias();
      }
    } catch (err) {
      alert("Error guardando categoría");
    }
  };

  const handleEliminar = async (id?: number) => {
    if (!id || !confirm("¿Seguro de eliminar esta categoría?")) return;
    try {
      await fetch(`http://localhost:8080/api/categorias-cliente/${id}`, { method: 'DELETE' });
      cargarCategorias();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content bg-dark text-white border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title font-monospace">Categorías de Clientes y Descuentos</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onCerrar}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleCrear} className="row g-2 mb-4 p-3 bg-secondary bg-opacity-10 rounded">
              <div className="col-md-6">
                <label className="form-label small">Nombre (ej. Estudiantes, Juzgados)</label>
                <input className="form-control bg-dark text-white border-secondary" value={nombre} onChange={e => setNombre(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Descuento (%)</label>
                <input type="number" step="0.01" className="form-control bg-dark text-white border-secondary" value={descuento} onChange={e => setDescuento(Number(e.target.value))} required />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button type="submit" className="btn btn-success w-100">Guardar</button>
              </div>
            </form>

            <div className="table-responsive">
              <table className="table table-dark table-hover border-secondary">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Categoría</th>
                    <th>Descuento Predefinido</th>
                    <th className="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map(c => (
                    <tr key={c.idCategoria}>
                      <td>{c.idCategoria}</td>
                      <td>{c.nombre}</td>
                      <td>{c.descuentoAutomatico}%</td>
                      <td className="text-center">
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleEliminar(c.idCategoria)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categorias.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted">No hay categorías cargadas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer border-secondary">
            <button className="btn btn-secondary" onClick={onCerrar}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};