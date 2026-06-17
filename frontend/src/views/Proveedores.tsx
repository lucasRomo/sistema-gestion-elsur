import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import type { Proveedor } from '../types/Proveedor';
import { ProveedorFiltros } from '../components/proveedores/ProveedorFiltros';
import { ProveedorTabla } from '../components/proveedores/ProveedorTabla';
import { ProveedorModal } from '../components/proveedores/ProveedorModal';
import { ProveedorUbicacionModal } from '../components/proveedores/ProveedorUbicacionModal'; // Importado

export const Proveedores: React.FC = () => {
  const navigate = useNavigate();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  
  // Estados de Filtros
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');
  const [filtroTipo, setFiltroTipo] = useState('Sin Filtro');

  // Controladores de modales independientes
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [proveedorUbicacionSeleccionado, setProveedorUbicacionSeleccionado] = useState<Proveedor | null>(null);

  const estadoInicialForm = (): Proveedor => ({
    nombreComercial: '',
    contactoNombre: '',
    emailContacto: '',
    estado: 'Activo',
    direccion: { calle: '', numero: '', ciudad: '', provincia: '', pais: 'Argentina', piso: '', departamento: '', codigoPostal: '' },
    tipoProveedor: { descripcion: '' }
  });

  const [formProveedor, setFormProveedor] = useState<Proveedor>(estadoInicialForm());
  const API_URL = 'http://localhost:8080/api/proveedores';

  const cargarProveedores = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setProveedores(data);
      }
    } catch (error) {
      console.error("Error al conectar con la API de Proveedores:", error);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  // Guardado general (Alta y Modificación completa)
  const handleGuardar = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formProveedor)
      });

      if (response.ok) {
        setShowModal(false);
        cargarProveedores();
        setFormProveedor(estadoInicialForm());
      }
    } catch (error) {
      console.error("Error al procesar la solicitud de guardado:", error);
    }
  };

  // NUEVO: Guardado exclusivo desde el modal de localización segmentado
  const handleGuardarUbicacion = async (proveedorConNuevaDireccion: Proveedor) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proveedorConNuevaDireccion)
      });

      if (response.ok) {
        alert("Localización actualizada correctamente");
        setProveedorUbicacionSeleccionado(null); // Cerramos modal de localización
        cargarProveedores(); // Refrescamos grilla
      } else {
        alert("Error al intentar actualizar la localización.");
      }
    } catch (error) {
      console.error("Error al guardar localización:", error);
    }
  };

  const proveedoresFiltrados = proveedores.filter((p) => {
    const cumpleNombre = p.nombreComercial.toLowerCase().includes(filtroNombre.toLowerCase()) || 
                         (p.contactoNombre && p.contactoNombre.toLowerCase().includes(filtroNombre.toLowerCase())) ||
                         (p.emailContacto && p.emailContacto.toLowerCase().includes(filtroNombre.toLowerCase()));
    
    const cumpleEstado = filtroEstado === 'Sin Filtro' || p.estado === filtroEstado;
    const cumpleTipo = filtroTipo === 'Sin Filtro' || (p.tipoProveedor && p.tipoProveedor.descripcion === filtroTipo);
    
    return cumpleNombre && cumpleEstado && cumpleTipo;
  });

  const tiposUnicos = Array.from(
    new Set(proveedores.map((p) => p.tipoProveedor?.descripcion).filter(Boolean))
  ) as string[];

  return (
    <SidebarLayout activeItem="Proveedores">
      <div className="container-fluid px-0">
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="w-100 text-center position-relative">
            <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.5rem', color: '#ffffff' }}>
              Proveedores
            </h1>
            <div className="position-absolute end-0 top-50 translate-middle-y text-info fs-3" style={{ cursor: 'pointer' }}>
              <i className="bi bi-question-circle"></i>
            </div>
          </div>
        </div>

        <ProveedorFiltros 
          filtroNombre={filtroNombre} 
          setFiltroNombre={setFiltroNombre}
          filtroEstado={filtroEstado} 
          setFiltroEstado={setFiltroEstado}
          filtroTipo={filtroTipo} 
          setFiltroTipo={setFiltroTipo}
          tiposUnicos={tiposUnicos}
        />

        <ProveedorTabla 
          proveedores={proveedoresFiltrados}
          onEditar={(prov) => {
            setIsEditing(true);
            setFormProveedor(prov);
            setShowModal(true);
          }}
          onVerUbicacion={(prov) => setProveedorUbicacionSeleccionado(prov)} // Levanta el modal dedicado
        />

        <div className="d-flex justify-content-between align-items-center mt-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="btn px-4 py-2 fw-semibold" 
            style={{  backgroundColor: '#b91c1c', color: 'white', borderRadius: '8px' }}
          >
            Volver
          </button>
          
          <div className="d-flex gap-2">
            <button 
              onClick={() => {
                setIsEditing(false);
                setFormProveedor(estadoInicialForm());
                setShowModal(true);
              }} 
              className="btn px-4 py-2 fw-semibold" 
              style={{ backgroundColor: '#2e7d32', color: 'white', borderRadius: '8px' }}
            >
              Registrar Nuevo Proveedor
            </button>
            <button className="btn btn-dark border-secondary px-3">
              <i className="bi bi-download"></i>
            </button>
          </div>
        </div>

        {/* Modal Tradicional Completo */}
        <ProveedorModal 
          show={showModal}
          onClose={() => setShowModal(false)}
          isEditing={isEditing}
          formState={formProveedor}
          setFormState={setFormProveedor}
          onSave={handleGuardar}
        />

        {/* NUEVO: Modal de Localización Segmentado */}
        <ProveedorUbicacionModal 
          show={proveedorUbicacionSeleccionado !== null}
          proveedor={proveedorUbicacionSeleccionado}
          onClose={() => setProveedorUbicacionSeleccionado(null)}
          onSaveUbicacion={handleGuardarUbicacion}
        />

      </div>
    </SidebarLayout>
  );
};