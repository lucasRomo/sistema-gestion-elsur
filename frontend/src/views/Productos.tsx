import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { ProductoTabla } from '../features/productos/ProductoTabla';
import { ProductoRegistroModal } from '../features/productos/ProductoRegistroModal';
import { useProductos } from '../hooks/useProductos'; // Tu hook

export const Productos: React.FC = () => {
  // Obtenemos todo lo que necesitamos del hook
  const { productos, guardar, cargar } = useProductos();
  
  const [showModal, setShowModal] = useState(false);
  const [productoEditando, setProductoEditando] = useState<any | null>(null);
  const navigate = useNavigate();

  return (
    <SidebarLayout activeItem="Productos">
      <div className="container-fluid px-0">

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="w-100 text-center position-relative">
            <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.5rem', color: '#ffffff' }}>
              Gestión de Productos
            </h1>
            <div className="position-absolute end-0 top-50 translate-middle-y text-info fs-3" style={{ cursor: 'pointer' }}>
              <i className="bi bi-question-circle"></i>
            </div>
          </div>
        </div>
        
        <ProductoTabla 
            productos={productos} 
            onEditar={(p) => {
              setProductoEditando(p);
              setShowModal(true);
            }} 
        />

        <div className="d-flex gap-3 pt-3 border-top border-secondary font-monospace">
          <button onClick={() => navigate('/dashboard')} className="btn btn-danger px-4">Volver</button>
          <button className="btn btn-info text-dark fw-bold">Modificar Varios Precios</button>
          <button className="btn btn-warning fw-bold">Calculo de Gastos</button>
          <button 
            className="btn btn-success fw-bold" 
            onClick={() => {
              setProductoEditando(null);
              setShowModal(true);
            }}
          >
            Registrar Nuevo Producto
          </button>
        </div>

        {/* Aquí está la clave: 
           Como el modal maneja internamente los datos del formulario, 
           simplemente le pasas al onGuardar la ejecución de tu hook.
        */}
        <ProductoRegistroModal 
          show={showModal}
          producto={productoEditando}
          onClose={() => setShowModal(false)}
          onGuardar={async (data) => {
            await guardar(data); // El hook guarda y recarga solo
            setShowModal(false);
          }}
        />
      </div>
    </SidebarLayout>
  );
};