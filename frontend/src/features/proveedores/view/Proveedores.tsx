import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ProveedorFiltros } from '../components/ProveedorFiltros';
import { ProveedorTabla } from '../components/ProveedorTabla';
import { ProveedorModal } from '../components/ProveedorModal';
import { ProveedorUbicacionModal } from '../components/ProveedorUbicacionModal';
import { useProveedores } from '../hooks/useProveedores';
import type { Proveedor } from '../types/Proveedor';
import { exportarProveedoresExcel, exportarProveedoresPDF } from '../utils/exportProveedoresUtils';

import { SuccesModal } from '../../../components/layouts/SuccesModal';
import { useTheme } from '../../../Context/ThemeContext';
import { showLoading, hideLoading } from '../../../config/loadingStore';
import { useIsMobile } from '../../../hook/useIsMobile';

export const Proveedores: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const { proveedores, guardar, cargando } = useProveedores();
  
  const mainCardBg = isDark ? '#1d1d1d' : '#ffffff';
  const cardBorder = isDark ? '#27272a' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const titleColor = isDark ? '#ffffff' : '#0f172a';

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
    <div className="container-fluid px-0 h-100 d-flex flex-column font-monospace" style={{ color: textColor }}>
      
      <div className="d-flex justify-content-center align-items-center mb-4">
        <h2 className="fw-bold fs-2 m-0 text-center font-monospace" style={{ color: titleColor }}>
          Gestión de Proveedores
        </h2>
      </div>

      <ProveedorFiltros 
        filtroNombre={filtroNombre} setFiltroNombre={setFiltroNombre}
        filtroEstado={filtroEstado} setFiltroEstado={setFiltroEstado}
        filtroTipo={filtroTipo} setFiltroTipo={setFiltroTipo}
        tiposUnicos={tiposUnicos}
      />

      <div 
        className="rounded-3 border mb-3 font-monospace" 
        style={{ 
          backgroundColor: mainCardBg, 
          borderColor: cardBorder,
          height: '65.3vh',
          overflowY: 'auto',
          display: 'block'
        }}
      >
        {cargando ? (
          <div className="text-center py-5" style={{ color: textColor }}>
            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            Cargando proveedores...
          </div>
        ) : (
          <ProveedorTabla
            proveedores={proveedoresFiltrados}
            onEditar={(prov) => { setIsEditing(true); setProveedorSeleccionado(prov); setShowModal(true); }}
            onVerUbicacion={(prov) => {
              setProveedorSeleccionado(prov);
              setShowUbicacionModal(true);
            }}
          />
        )}
      </div>

      <div className={`d-flex align-items-center mt-3 mb-4 font-monospace ${isMobile ? 'justify-content-stretch' : 'justify-content-between'}`}>
        
        {!isMobile && (
          <button 
            onClick={() => navigate('/dashboard')} 
            className="btn btn-secondary fw-bold shadow-sm font-monospace d-inline-flex align-items-center justify-content-center"
            style={{ 
              color: '#ffffff',
              padding: '11px 24px',
              fontSize: '1rem',
              minWidth: '90px'
            }}
          >
            Volver
          </button>
        )}

        <div className={`d-flex gap-2 ${isMobile ? 'w-100' : ''}`}>
          <button 
            className="btn btn-outline-success fw-bold d-flex align-items-center justify-content-center px-3 py-2 shadow-sm"
            onClick={() => exportarProveedoresExcel(proveedoresFiltrados)}
            disabled={proveedoresFiltrados.length === 0}
            title="Exportar listado actual a Excel"
          >
            <i className="bi bi-file-earmark-excel-fill fs-5"></i>
          </button>

          <button 
            className="btn btn-outline-danger fw-bold d-flex align-items-center justify-content-center px-3 py-2 shadow-sm"
            onClick={() => exportarProveedoresPDF(proveedoresFiltrados)}
            disabled={proveedoresFiltrados.length === 0}
            title="Exportar listado actual a PDF"
          >
            <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
          </button>

          <button 
            onClick={() => { setIsEditing(false); setProveedorSeleccionado(null); setShowModal(true); }} 
            className={`btn btn-success fw-bold shadow-sm d-inline-flex align-items-center justify-content-center ${isMobile ? 'flex-fill text-nowrap' : ''}`}
            style={{ 
              color: '#ffffff',
              padding: '11px 24px',
              fontSize: '1rem',
              minWidth: '90px'
            }}
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
          showLoading('Guardando proveedor...');
          try {
            await guardar(aGuardar);
            setShowModal(false);
            setSuccessMessage(isEditing ? "Proveedor modificado correctamente" : "Proveedor registrado correctamente");
            setShowSuccess(true);
          } catch (e: any) {
            alert("Error: " + e.message);
          } finally {
            hideLoading();
          }
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
          showLoading('Guardando ubicación...');
          try {
            await guardar(prov);
            setProveedorSeleccionado(null);
            setShowUbicacionModal(false);
            setSuccessMessage("Ubicación actualizada correctamente");
            setShowSuccess(true);
          } catch (e: any) {
            alert("Error: " + e.message);
          } finally {
            hideLoading();
          }
        }}
      />
    </div>
  );
};