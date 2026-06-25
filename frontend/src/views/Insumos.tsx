import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { InsumoTabla } from '../features/insumos/InsumoTabla';
import { InsumoProveedoresModal } from '../features/insumos/InsumoProveedoresModal';
import { InsumoModal } from '../features/insumos/InsumoModal';
import { useInsumos } from '../hooks/useInsumos'; // Hook modularizado

export const Insumos: React.FC = () => {
  const navigate = useNavigate();
  const { insumos, guardar, cargar } = useInsumos(); // Lógica aquí
  
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');
  const [insumoProveedoresSeleccionado, setInsumoProveedoresSeleccionado] = useState<any | null>(null);
  const [showModalForm, setShowModalForm] = useState(false);
  const [insumoEditando, setInsumoEditando] = useState<any | null>(null);

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
          onGuardar={async (data) => { await guardar(data); setShowModalForm(false); }}
        />
      </div>
    </SidebarLayout>
  );
};