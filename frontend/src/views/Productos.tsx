import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductoTabla } from '../features/productos/ProductoTabla';
import { ProductoRegistroModal } from '../features/productos/ProductoRegistroModal';
import { useProductos } from '../hooks/useProductos';
import { SuccesModal } from '../components/layouts/SuccesModal';
import { ProductosFiltros } from '../features/productos/ProductosFiltros';
import { useTheme } from '../Context/ThemeContext';

export const Productos: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : '#64748b';

  const { productos, guardar } = useProductos();
  
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
    <div className="container-fluid px-0">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="w-100 text-center position-relative">
          <h1 
            className="fw-bold tracking-wider font-monospace m-0" 
            style={{ fontSize: '2.25rem', color: titleColor }}
          >
            Gestión de Productos
          </h1>
          <div className="position-absolute end-0 top-50 translate-middle-y text-info fs-4" style={{ cursor: 'pointer' }}>
            <i className="bi bi-question-circle"></i>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <ProductosFiltros 
        filtroNombre={filtroNombre} 
        setFiltroNombre={setFiltroNombre}
        filtroEstado={filtroEstado} 
        setFiltroEstado={setFiltroEstado}
      />

      {/* Tabla Adaptativa */}
      <ProductoTabla 
        productos={productosFiltrados} 
        onEditar={(p) => {
          setProductoEditando(p);
          setShowModal(true);
        }} 
      />

      {/* Botonera inferior */}
      <div className={`d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4 pt-3 border-top ${isDark ? 'border-secondary border-opacity-50' : 'border-light-subtle'} font-monospace`}>
  <button onClick={() => navigate('/dashboard')} className="btn btn-danger px-4 py-2 fw-semibold" style={{ color: '#ffffff' }}>
    <i className="bi bi-arrow-left me-2"></i>Volver
  </button>
  <div className="d-flex flex-wrap gap-2">
    <button 
      className="btn px-4 py-2 fw-medium shadow-sm" 
      style={{ backgroundColor: '#17a2b8', color: '#ffffff' }}
    >
      <i className="bi me-2"></i>Modificar Varios Precios
    </button>
    <button 
      className="btn px-4 py-2 fw-medium shadow-sm" 
      style={{ backgroundColor: '#ca9e1b', color: '#ffffff' }}
    >
      <i className="bi me-2"></i>Cálculo de Gastos
    </button>
    <button 
      className="btn px-4 py-2 fw-semibold shadow-sm" 
      style={{ backgroundColor: '#156e45', color: '#ffffff' }} 
      onClick={() => {
        setProductoEditando(null);
        setShowModal(true);
      }}
    >
      <i className="bi me-2"></i>Registrar Nuevo Producto
    </button>
  </div>
</div>

      {/* Modal del formulario */}
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
        }}
      />

      {/* Modal de Confirmación Modificación */}
      {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-center shadow-lg" 
              style={{ 
                border: `2px solid ${isDark ? '#8e45e0' : '#a855f7'}`, 
                backgroundColor: isDark ? '#1a1a1c' : '#ffffff', 
                color: isDark ? '#ffffff' : '#0f172a',
                borderRadius: '12px' 
              }}
            >
              <i className="bi bi-shield-lock-fill fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Confirmar Modificaciones?</h5>
              <p className="small m-0" style={{ color: mutedText }}>Se sobreescribirán los datos del producto.</p>
              
              <div className="d-flex justify-content-center gap-2 mt-4">
                <button 
                  className="btn btn-danger btn-sm px-3 fw-semibold" 
                  onClick={() => setMostrarConfirmacion(false)}
                >
                  Volver
                </button>
                <button 
                  className="btn btn-success btn-sm px-3 fw-semibold text-white" 
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

      {/* Modal de éxito */}
      {mostrarExito && (
        <SuccesModal 
          show={mostrarExito} 
          onClose={() => setMostrarExito(false)} 
          message={mensajeExito} 
        />
      )}
    </div>
  );
};