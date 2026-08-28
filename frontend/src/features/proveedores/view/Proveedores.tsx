import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Componentes y hooks propios de la feature
import { ProveedorFiltros } from '../components/ProveedorFiltros';
import { ProveedorTabla } from '../components/ProveedorTabla';
import { ProveedorModal } from '../components/ProveedorModal';
import { ProveedorUbicacionModal } from '../components/ProveedorUbicacionModal';
import { useProveedores } from '../hooks/useProveedores';
import type { Proveedor } from '../types/Proveedor';
import { exportarProveedoresExcel, exportarProveedoresPDF } from '../utils/exportProveedoresUtils';

// Componentes globales compartidos
import { SuccesModal } from '../../../components/layouts/SuccesModal';
import { useTheme } from '../../../Context/ThemeContext';

export const Proveedores: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { proveedores, guardar } = useProveedores();
  
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');
  const [filtroTipo, setFiltroTipo] = useState('Sin Filtro');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
  const [showUbicacionModal, setShowUbicacionModal] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    <div className="container-fluid px-0 font-monospace">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="w-100 text-center position-relative">
          <h1 
            className="fw-bold tracking-wider m-0" 
            style={{ fontSize: '2.5rem', color: isDark ? '#ffffff' : '#0f172a' }}
          >
            Gestión de Proveedores
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

      {/* Barra Inferior: Volver + Exportar + Nuevo Proveedor */}
      <div className="d-flex justify-content-between align-items-center mt-4">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="btn btn-secondary px-4 py-2 fw-semibold"
          style={{ color: '#ffffff' }}
        >
          Volver
        </button>

        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-success fw-bold d-flex align-items-center gap-2"
            onClick={() => exportarProveedoresExcel(proveedoresFiltrados)}
            disabled={proveedoresFiltrados.length === 0}
            title="Exportar listado actual a Excel"
          >
            <i className="bi bi-file-earmark-excel-fill fs-5"></i>
            Exportar Excel
          </button>

          <button 
            className="btn btn-outline-danger fw-bold d-flex align-items-center gap-2"
            onClick={() => exportarProveedoresPDF(proveedoresFiltrados)}
            disabled={proveedoresFiltrados.length === 0}
            title="Exportar listado actual a PDF"
          >
            <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
            Exportar PDF
          </button>

          <button 
            onClick={() => { setIsEditing(false); setProveedorSeleccionado(null); setShowModal(true); }} 
            className="btn btn-success fw-semibold px-4 py-2 ms-2"
            style={{ color: '#ffffff' }}
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
        proveedores={proveedores}
        onClose={() => setShowModal(false)}
        onSave={async (proveedorNormalizado) => {
          const aGuardar = proveedorNormalizado || proveedorSeleccionado!;
          await guardar(aGuardar);
          setShowModal(false);
          setSuccessMessage(isEditing ? "Proveedor modificado correctamente" : "Proveedor registrado correctamente");
          setShowSuccess(true);
        }}
      />

      <ProveedorUbicacionModal 
        show={showUbicacionModal}
        proveedor={proveedorSeleccionado}
        onClose={() => {
          setProveedorSeleccionado(null);
          setShowUbicacionModal(false);
        }}
        onSaveUbicacion={async (prov) => {
          await guardar(prov);
          setProveedorSeleccionado(null);
          setShowUbicacionModal(false);
          setSuccessMessage("Ubicación actualizada correctamente");
          setShowSuccess(true);
        }}
      />
    </div>
  );
};