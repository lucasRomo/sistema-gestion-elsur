import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { ProveedorFiltros } from '../features/proveedores/ProveedorFiltros';
import { ProveedorTabla } from '../features/proveedores/ProveedorTabla';
import { ProveedorModal } from '../features/proveedores/ProveedorModal';
import { ProveedorUbicacionModal } from '../features/proveedores/ProveedorUbicacionModal';
import { useProveedores } from '../hooks/useProveedores';
import type { Proveedor } from '../types/Proveedor';
import { SuccesModal } from '../components/layouts/SuccesModal';

export const Proveedores: React.FC = () => {
  const navigate = useNavigate();
  const { proveedores, guardar } = useProveedores();
  
  // Estados de UI y Filtros
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');
  const [filtroTipo, setFiltroTipo] = useState('Sin Filtro');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
  const [showUbicacionModal, setShowUbicacionModal] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Lógica de filtrado
  const proveedoresFiltrados = proveedores.filter((p) => {
    const cumpleNombre = p.nombreComercial.toLowerCase().includes(filtroNombre.toLowerCase()) || 
                         (p.contactoNombre?.toLowerCase().includes(filtroNombre.toLowerCase())) ||
                         (p.emailContacto?.toLowerCase().includes(filtroNombre.toLowerCase()));
    const cumpleEstado = filtroEstado === 'Sin Filtro' || p.estado === filtroEstado;
    const cumpleTipo = filtroTipo === 'Sin Filtro' || (p.tipoProveedor?.descripcion === filtroTipo);
    return cumpleNombre && cumpleEstado && cumpleTipo;
  });

  const tiposUnicos = Array.from(new Set(proveedores.map(p => p.tipoProveedor?.descripcion).filter(Boolean))) as string[];

  return (
    <>
      <div className="container-fluid px-0">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="w-100 text-center position-relative">
            <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.5rem', color: '#ffffff' }}>
              Proveedores
            </h1>
          </div>
        </div>

        <ProveedorFiltros 
          filtroNombre={filtroNombre} setFiltroNombre={setFiltroNombre}
          filtroEstado={filtroEstado} setFiltroEstado={setFiltroEstado}
          filtroTipo={filtroTipo} setFiltroTipo={setFiltroTipo}
          tiposUnicos={tiposUnicos}
        />

        <ProveedorTabla 
          proveedores={proveedoresFiltrados}
          onEditar={(prov) => { setIsEditing(true); setProveedorSeleccionado(prov); setShowModal(true); }}
          onVerUbicacion={(prov) => { 
            setProveedorSeleccionado(prov); 
            setShowUbicacionModal(true);
          }}
        />

        <div className="d-flex justify-content-between align-items-center mt-4">
          <button onClick={() => navigate('/dashboard')} className="btn btn-danger px-4 py-2 fw-semibold">Volver</button>
          <div className="d-flex gap-2">
            <button 
              onClick={() => { setIsEditing(false); setProveedorSeleccionado(null); setShowModal(true); }} 
              className="btn btn-success mt-4"
            >
              Registrar Nuevo Proveedor
            </button>
          </div>
        </div>

        <SuccesModal 
        show={showSuccess} 
        message={successMessage} 
        onClose={() => setShowSuccess(false)} 
        />

        <ProveedorModal 
          show={showModal}
          isEditing={isEditing}
          formState={proveedorSeleccionado || {} as Proveedor} 
          setFormState={setProveedorSeleccionado}
          onClose={() => setShowModal(false)}
          onSave={async () => {
            await guardar(proveedorSeleccionado!);
            setShowModal(false);
            setSuccessMessage("Proveedor guardado correctamente");
            setShowSuccess(true);
          }}
        />

        {/* Modal Localización */}
        <ProveedorUbicacionModal 
          show={showUbicacionModal} // ◄ Ahora depende de este estado manual
          proveedor={proveedorSeleccionado}
          onClose={() => {
            setProveedorSeleccionado(null);
            setShowUbicacionModal(false); // ◄ Cerramos explícitamente
          }}
          onSaveUbicacion={async (prov) => {
            await guardar(prov);
            setProveedorSeleccionado(null);
            setShowUbicacionModal(false); // ◄ Cerramos explícitamente
            setSuccessMessage("Ubicación actualizada correctamente");
            setShowSuccess(true);
          }}
        />
      </div>
    </>
  );
};