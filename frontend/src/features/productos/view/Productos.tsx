import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Importaciones internas del módulo productos
import { ProductoTabla } from '../components/ProductoTabla';
import { ProductoRegistroModal } from '../components/ProductoRegistroModal';
import { ProductosFiltros } from '../components/ProductosFiltros';
import { AumentoMasivoModal } from '../components/AumentoMasivoModal';
import { RecetaModal } from '../components/RecetaModal';
import { RecetasGlobalModal } from '../components/RecetasGlobalModal';
import { ModalMermasProductos } from '../modals/ModalMermasProductos';
import { useProductos } from '../hooks/useProductos';
import { actualizarPreciosMasivo, toggleStockVinculado, type ActualizarPreciosPayload } from '../services/productoService';
import type { Producto } from '../types/Producto';
import { exportarProductosExcel, exportarProductosPDF } from '../utils/exportProductosUtils';

// Componentes y contextos compartidos globales
import { SuccesModal } from '../../../components/layouts/SuccesModal';
import { useTheme } from '../../../Context/ThemeContext';

export const Productos: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : '#64748b';

  const { productos, guardar, cargar } = useProductos();
  
  const [showModal, setShowModal] = useState(false);
  const [showAumentoModal, setShowAumentoModal] = useState(false);
  const [showRecetaModal, setShowRecetaModal] = useState(false);
  const [showRecetasGlobalModal, setShowRecetasGlobalModal] = useState(false);
  const [showMermasModal, setShowMermasModal] = useState(false);
  
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [productoSeleccionadoReceta, setProductoSeleccionadoReceta] = useState<Producto | null>(null);
  
  const navigate = useNavigate();
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');
  const [showSinRecetaModal, setShowSinRecetaModal] = useState(false);
  const [productoSinReceta, setProductoSinReceta] = useState<Producto | null>(null);

  const productosFiltrados = productos.filter((p: Producto) => {
    const cumpleNombre = p.nombreProducto?.toLowerCase().includes(filtroNombre.toLowerCase());
    const cumpleEstado = filtroEstado === 'Sin Filtro' || p.estado === filtroEstado;
    return cumpleNombre && cumpleEstado;
  });

  const handleAplicarAumentoMasivo = async (data: ActualizarPreciosPayload) => {
    await actualizarPreciosMasivo(data);
    await cargar();
    const accion = data.porcentaje >= 0 ? 'Aumento' : 'Descuento';
    setMensajeExito(`${accion} de ${Math.abs(data.porcentaje)}% aplicado a los productos seleccionados`);
    setMostrarExito(true);
  };

  const handleToggleVinculo = async (producto: Producto) => {
  if (!producto.idProducto) return;
  if (!producto.stockVinculado) {
    try {
      const res = await fetch(`http://localhost:8080/api/producto-insumo/producto/${producto.idProducto}`);
      if (res.ok) {
        const recetaData = await res.json();
        
        if (!recetaData || recetaData.length === 0) {
          setProductoSinReceta(producto);
          setShowSinRecetaModal(true);
          return; 
        }
      }
    } catch (err) {
      console.error("Error al verificar la receta del producto:", err);
    }
  }
  try {
    await toggleStockVinculado(producto.idProducto);
    await cargar();
  } catch (err) {
    console.error("Error al cambiar estado de vínculo de stock:", err);
  }
  };



  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="w-100 text-center position-relative">
          <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.25rem', color: titleColor }}>
            Gestión de Productos
          </h1>
        </div>
      </div>
      
      <ProductosFiltros 
        filtroNombre={filtroNombre} 
        setFiltroNombre={setFiltroNombre}
        filtroEstado={filtroEstado} 
        setFiltroEstado={setFiltroEstado}
      />

      <ProductoTabla 
        productos={productosFiltrados} 
        onEditar={(p) => {
          setProductoEditando(p);
          setShowModal(true);
        }} 
        onConfigurarReceta={(p) => {
          setProductoSeleccionadoReceta(p);
          setShowRecetaModal(true);
        }}
        onToggleStockVinculado={handleToggleVinculo}
      />

      {/* Botonera Inferior: Volver + Exportaciones + Acciones de Productos */}
      <div className={`d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4 pt-3 ${isDark ? 'border-secondary border-opacity-50' : 'border-light-subtle'} font-monospace`}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary px-4 py-2 fw-semibold" style={{ color: '#ffffff' }}>
          Volver
        </button>

        <div className="d-flex flex-wrap gap-2">
          <button 
            className="btn btn-outline-success fw-bold d-flex align-items-center gap-2"
            onClick={() => exportarProductosExcel(productosFiltrados)}
            disabled={productosFiltrados.length === 0}
            title="Exportar listado actual a Excel"
          >
            <i className="bi bi-file-earmark-excel-fill fs-5"></i>
            Exportar Excel
          </button>

          <button 
            className="btn btn-outline-danger fw-bold d-flex align-items-center gap-2"
            onClick={() => exportarProductosPDF(productosFiltrados)}
            disabled={productosFiltrados.length === 0}
            title="Exportar listado actual a PDF"
          >
            <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
            Exportar PDF
          </button>

          <button className="btn px-4 py-2 fw-medium shadow-sm" style={{ backgroundColor: '#eab308', color: '#000000' }} onClick={() => setShowMermasModal(true)}>
            <i className="bi bi-box-seam-fill me-2"></i>Mermas de Productos
          </button>

          <button className="btn px-4 py-2 fw-medium shadow-sm" style={{ backgroundColor: '#17a2b8', color: '#ffffff' }} onClick={() => setShowAumentoModal(true)}>
            Modificar Varios Precios
          </button>

          <button className="btn px-4 py-2 fw-medium shadow-sm" style={{ backgroundColor: '#6f42c1', color: '#ffffff' }} onClick={() => setShowRecetasGlobalModal(true)}>
            Ver Productos con Receta
          </button>

          <button className="btn px-4 py-2 fw-semibold shadow-sm" style={{ backgroundColor: '#156e45', color: '#ffffff' }} onClick={() => { setProductoEditando(null); setShowModal(true); }}>
            Registrar Nuevo Producto
          </button>
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
        }}
      />

      <AumentoMasivoModal
        show={showAumentoModal}
        productos={productos}
        onClose={() => setShowAumentoModal(false)}
        onConfirmar={handleAplicarAumentoMasivo}
      />

      {showRecetaModal && productoSeleccionadoReceta && (
        <RecetaModal
          show={showRecetaModal}
          producto={productoSeleccionadoReceta}
          onClose={() => {
            setShowRecetaModal(false);
            setProductoSeleccionadoReceta(null);
            cargar();
          }}
        />
      )}

      {showRecetasGlobalModal && (
        <RecetasGlobalModal
          show={showRecetasGlobalModal}
          productos={productos}
          onClose={() => setShowRecetasGlobalModal(false)}
          onEditarReceta={(p) => {
            setShowRecetasGlobalModal(false);
            setProductoSeleccionadoReceta(p);
            setShowRecetaModal(true);
          }}
        />
      )}

    {showSinRecetaModal && (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
    <div className="modal-dialog modal-dialog-centered">
      <div 
        className="modal-content p-4 text-center shadow-lg font-monospace" 
        style={{ 
          border: '2px solid #ef4444', 
          backgroundColor: isDark ? '#1a1a1c' : '#ffffff', 
          color: isDark ? '#ffffff' : '#0f172a', 
          borderRadius: '12px' 
        }}
      >
        <i className="bi bi-exclamation-triangle-fill fs-1 text-danger mb-2"></i>
        <h5 className="fw-bold text-danger">No se puede vincular el stock</h5>
        <p className="small my-3" style={{ color: mutedText }}>
          El producto <strong className="text-warning">"{productoSinReceta?.nombreProducto}"</strong> no tiene asignada ninguna receta ni insumos registrados. Configura su receta antes de vincular el stock.
        </p>
        
        <div className="d-flex justify-content-center gap-2 mt-2">
          <button 
            className="btn btn-secondary btn-sm px-4 fw-semibold" 
            onClick={() => {
              setShowSinRecetaModal(false);
              setProductoSinReceta(null);
            }}
          >
            Cerrar
          </button>
          
          <button 
            className="btn btn-warning btn-sm px-4 fw-bold" 
            onClick={() => {
              const prod = productoSinReceta;
              setShowSinRecetaModal(false);
              setProductoSinReceta(null);
              if (prod) {
                setProductoSeleccionadoReceta(prod);
                setShowRecetaModal(true);
              }
            }}
          >
            Configurar Receta
          </button>
        </div>
      </div>
    </div>
    </div>
    )}

      <ModalMermasProductos
        show={showMermasModal}
        productos={productos}
        onClose={() => setShowMermasModal(false)}
        onExito={() => {
          cargar();
          setMensajeExito('Merma registrada con éxito');
          setMostrarExito(true);
        }}
      />

      {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content p-4 text-center shadow-lg" style={{ border: `2px solid ${isDark ? '#8e45e0' : '#a855f7'}`, backgroundColor: isDark ? '#1a1a1c' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a', borderRadius: '12px' }}>
              <i className="bi bi-shield-lock-fill fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Confirmar Modificaciones?</h5>
              <p className="small m-0" style={{ color: mutedText }}>Se sobreescribirán los datos del producto.</p>
              
              <div className="d-flex justify-content-center gap-2 mt-4">
                <button className="btn btn-danger btn-sm px-3 fw-semibold" onClick={() => setMostrarConfirmacion(false)}>Volver</button>
                <button 
                  className="btn btn-success btn-sm px-3 fw-semibold text-white" 
                  onClick={async () => {
                    if (productoEditando) {
                      await guardar(productoEditando);
                    }
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
  );
};