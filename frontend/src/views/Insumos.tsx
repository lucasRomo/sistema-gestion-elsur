import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { InsumoTabla } from '../features/insumos/InsumoTabla';
import { InsumoProveedoresModal } from '../features/insumos/InsumoProveedoresModal';
import { InsumoModal } from '../features/insumos/InsumoModal';
import { useInsumos } from '../hooks/useInsumos'; // Hook modularizado
import { SuccesModal } from '../components/layouts/SuccesModal';
import { InsumosFiltros } from '../features/insumos/InsumosFiltros';

export const Insumos: React.FC = () => {
  const navigate = useNavigate();
  const { insumos, guardar, cargar } = useInsumos(); // Lógica aquí
  
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');
  const [insumoProveedoresSeleccionado, setInsumoProveedoresSeleccionado] = useState<any | null>(null);
  const [showModalForm, setShowModalForm] = useState(false);
  const [insumoEditando, setInsumoEditando] = useState<any | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const insumosFiltrados = insumos.filter((i) => {
    const cumpleNombre = i.nombreInsumo.toLowerCase().includes(filtroNombre.toLowerCase());
    const cumpleEstado = filtroEstado === 'Sin Filtro' || i.estado === filtroEstado;
    return cumpleNombre && cumpleEstado;
  });

  return (
    <SidebarLayout activeItem="Insumos">
      {/* Mantenemos tu estructura intacta */}
      <div className="container-fluid px-0">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="w-100 text-center position-relative">
            <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.5rem', color: '#ffffff' }}>Stock de Insumos</h1>
          </div>
        </div>

        {/* Filtros */}
        <div className="row g-3 mb-4 align-items-center text-white font-monospace">
           {/* ... Tus inputs de filtro originales ... */}
        </div>

        {/* Filtros */}
        <InsumosFiltros 
        filtroNombre={filtroNombre}
        setFiltroNombre={setFiltroNombre}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        />

        {/* Tabla */}
        <InsumoTabla 
          insumos={insumosFiltrados}
          onEditar={(insumo) => { setInsumoEditando(insumo); setShowModalForm(true); }}
          onVerProveedores={(insumo) => setInsumoProveedoresSeleccionado(insumo)}
        />

        {/* Botonera */}
        <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center pt-3 border-top border-secondary">
          <button onClick={() => navigate('/dashboard')} className="btn btn-danger px-4 py-2">Volver</button>
          <button className="btn btn-success px-3 py-2" onClick={() => { setInsumoEditando(null); setShowModalForm(true); }}>
            Registrar Nuevo Insumo
          </button>
        </div>

        {/* Modales */}
        <InsumoProveedoresModal show={!!insumoProveedoresSeleccionado} insumo={insumoProveedoresSeleccionado} onClose={() => setInsumoProveedoresSeleccionado(null)} />

        <InsumoModal
        show={showModalForm}
        insumoEditando={insumoEditando}
        onClose={() => setShowModalForm(false)}
        onGuardar={async (data) => {
        if (insumoEditando) {
        setInsumoEditando(data); 
        setMostrarConfirmacion(true); 
        } else {
        await guardar(data);
        setShowModalForm(false);
        setMensajeExito('Insumo Creado Correctamente');
        setMostrarExito(true);
        }}}/>



        {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
        <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content p-4 text-white text-center" style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px' }}>
        <i className="bi bi-shield-lock-fill fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
        <h5 className="fw-bold">¿Confirmar Modificaciones?</h5>
        <p className="small text-white-50">Se sobreescribirán los datos del insumo.</p>
        
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button className="btn btn-outline-light btn-sm px-3" style={{ borderRadius: '6px', backgroundColor: '#e22e2e', borderColor: '#e62020'}}  onClick={() => setMostrarConfirmacion(false)}>
            Volver
          </button>
          <button 
            className="btn btn-sm px-3 fw-bold text-white" 
            style={{ borderRadius: '6px', backgroundColor: '#2e9225', borderColor: '#25741e' }} 
            onClick={async () => {
               await guardar(insumoEditando);
               setMostrarConfirmacion(false);
               setShowModalForm(false);
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
    </SidebarLayout>
  );
};