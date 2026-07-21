import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { ProductoTabla } from '../features/productos/ProductoTabla';
import { ProductoRegistroModal } from '../features/productos/ProductoRegistroModal';
import { useProductos } from '../hooks/useProductos'; // Tu hook
import { SuccesModal } from '../components/layouts/SuccesModal';
import { ProductosFiltros } from '../features/productos/ProductosFiltros';

export const Productos: React.FC = () => {
  // Obtenemos todo lo que necesitamos del hook
  const { productos, guardar, cargar } = useProductos();
  
  const [showModal, setShowModal] = useState(false);
  const [productoEditando, setProductoEditando] = useState<any | null>(null);
  const navigate = useNavigate();
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');

  const productosFiltrados = productos.filter((p: any) => {
  const cumpleNombre = p.nombreProducto?.toLowerCase().includes(filtroNombre.toLowerCase());
  const cumpleEstado = filtroEstado === 'Sin Filtro' || p.estado === filtroEstado;
  return cumpleNombre && cumpleEstado;
});

  return (
    <>
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
        
        <ProductosFiltros 
         filtroNombre={filtroNombre} setFiltroNombre={setFiltroNombre}
         filtroEstado={filtroEstado} setFiltroEstado={setFiltroEstado}
         />

        <ProductoTabla 
            productos={productosFiltrados} 
            onEditar={(p) => {
              setProductoEditando(p);
              setShowModal(true);
            }} 
        />

    <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-secondary font-monospace">
      <button onClick={() => navigate('/dashboard')} className="btn btn-danger px-5 py-2">Volver</button>
     <div className="d-flex gap-3">
     <button className="btn px-4 py-2 text-white fw-normal" style={{ backgroundColor: '#17a2b8', borderColor: '#0e5a66' }}>Modificar Varios Precios</button>
     <button className="btn px-4 py-2 text-white fw-normal" style={{ backgroundColor: '#ca9e1b', borderColor: '#94720c' }}>Calculo de Gastos</button>
     <button className="btn px-4 py-2 text-white fw-normal" style={{ backgroundColor: '#156e45', borderColor: '#0b3320' }} 
      onClick={() => {
        setProductoEditando(null);
        setShowModal(true);
      }}>Registrar Nuevo Producto</button>
     </div>
    </div>

        <ProductoRegistroModal 
        show={showModal}
        producto={productoEditando}
        onClose={() => setShowModal(false)}
        onGuardar={async (data) => {
        if (productoEditando) {
        setProductoEditando(data); 
        setMostrarConfirmacion(true);
        } else {
        await guardar(data);
        setShowModal(false);
        setMensajeExito('Producto Guardado Exitosamente');
        setMostrarExito(true);
        }
      }}/>

      
        {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
        <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content p-4 text-white text-center" style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px' }}>
        <i className="bi bi-shield-lock-fill fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
        <h5 className="fw-bold">¿Confirmar Modificaciones?</h5>
        <p className="small text-white-50">Se sobreescribirán los datos del producto.</p>
        
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button className="btn btn-outline-light btn-sm px-3" style={{ borderRadius: '6px', backgroundColor: '#e22e2e', borderColor: '#e62020'}} onClick={() => setMostrarConfirmacion(false)}>
            volver
          </button>
          {/* Cambiamos el color del botón a violeta */}
          <button 
            className="btn btn-sm px-3 fw-bold text-white" 
            style={{ borderRadius: '6px', backgroundColor: '#2e9225', borderColor: '#25741e' }} 
            onClick={async () => {
              await guardar(productoEditando);
              setMostrarConfirmacion(false);
              setShowModal(false);
              setMensajeExito('Modificación hecha exitosamente');
              setMostrarExito(true);
            }}
          >
            Confirmar
          </button>
        </div>
        </div>
        </div>
        </div>
        )}


{mostrarExito && (
  <SuccesModal 
    show={mostrarExito} 
    onClose={() => setMostrarExito(false)} 
    message={mensajeExito} 
  />
)}
      </div>
    </>
  );
};