import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import type { Insumo } from '../types/Insumo';
import { InsumoTabla } from '../components/insumos/InsumoTabla';
import { InsumoProveedoresModal } from '../components/insumos/InsumoProveedoresModal';
import { InsumoModal } from '../components/insumos/InsumoModal'; // ◄ AGREGADO

export const Insumos: React.FC = () => {
  const navigate = useNavigate();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  
  // Filtros
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');

  // Modales
  const [insumoProveedoresSeleccionado, setInsumoProveedoresSeleccionado] = useState<Insumo | null>(null);
  
  // ◄ AGREGADOS: Estados para el Formulario de Registro/Edición
  const [showModalForm, setShowModalForm] = useState(false);
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null);

  const API_URL = 'http://localhost:8080/api/insumos';

  const cargarInsumos = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setInsumos(data);
      }
    } catch (error) {
      console.error("Error al conectar con la API de Insumos:", error);
    }
  };

  useEffect(() => {
    cargarInsumos();
  }, []);

  // ◄ AGREGADO: Función para enviar los datos al Backend
  const handleGuardarInsumo = async (insumoData: any) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST', // Tu controlador @PostMapping maneja tanto crear como actualizar con .save()
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(insumoData),
      });

      if (response.ok) {
        cargarInsumos(); // Recargamos la tabla
        setShowModalForm(false); // Cerramos el modal
      } else {
        console.error("Error al guardar el insumo");
      }
    } catch (error) {
      console.error("Error en la petición POST:", error);
    }
  };

  const insumosFiltrados = insumos.filter((i) => {
    const cumpleNombre = i.nombreInsumo.toLowerCase().includes(filtroNombre.toLowerCase());
    const cumpleEstado = filtroEstado === 'Sin Filtro' || i.estado === filtroEstado;
    return cumpleNombre && cumpleEstado;
  });

  return (
    <SidebarLayout activeItem="Insumos">
      <div className="container-fluid px-0">
        
        {/* Cabecera */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="w-100 text-center position-relative">
            <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.5rem', color: '#ffffff' }}>
              Stock de Insumos
            </h1>
            <div className="position-absolute end-0 top-50 translate-middle-y text-info fs-3" style={{ cursor: 'pointer' }}>
              <i className="bi bi-question-circle"></i>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="row g-3 mb-4 align-items-center text-white font-monospace">
          <div className="col-md-6 d-flex align-items-center gap-2">
            <label className="text-nowrap m-0 small text-white-50">Filtrar por Nombre:</label>
            <div className="input-group">
              <input 
                type="text" 
                className="form-control bg-dark border-secondary text-white" 
                placeholder="Filtrar por Nombre..." 
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
              <span className="input-group-text bg-dark border-secondary">
                <i className="bi bi-search text-secondary"></i>
              </span>
            </div>
          </div>
          <div className="col-md-6 d-flex align-items-center gap-2 justify-content-md-end">
            <label className="text-nowrap m-0 small text-white-50">Filtrar por Estado:</label>
            <select 
              className="form-select bg-dark border-secondary text-white" 
              style={{ maxWidth: '200px' }}
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="Sin Filtro">Sin Filtro</option>
              <option value="Activo">Activo</option>
              <option value="Desactivado">Desactivado</option>
            </select>
          </div>
        </div>

        {/* Tabla Modularizada */}
        <InsumoTabla 
          insumos={insumosFiltrados}
          onEditar={(insumo) => {
            // ◄ AGREGADO: Al presionar editar, cargamos el insumo y mostramos el modal
            setInsumoEditando(insumo); 
            setShowModalForm(true);
          }}
          onVerProveedores={(insumo) => setInsumoProveedoresSeleccionado(insumo)}
        />

        {/* Botonera Inferior copiando tu diseño */}
        <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center pt-3 border-top border-secondary font-monospace">
          <div>
            <button onClick={() => navigate('/dashboard')} className="btn px-4 py-2 fw-semibold" style={{ backgroundColor: '#b91c1c', color: 'white', border: 'none' }}>
              Volver
            </button>
          </div>
          <div className="d-flex flex-wrap gap-3">
            <button className="btn px-3 py-2 fw-semibold text-dark" style={{ backgroundColor: '#ca8a04', border: 'none' }}>
              Ver Alertas de Stock
            </button>
            <button className="btn px-3 py-2 fw-semibold text-white" style={{ backgroundColor: '#1e3a8a', border: 'none' }}>
              Conversión de Unidades
            </button>
            
            {/* ◄ AGREGADO: Botón conectado al Modal vacío (Crear) */}
            <button 
              className="btn px-3 py-2 fw-semibold text-white" 
              style={{ backgroundColor: '#16a34a', border: 'none' }}
              onClick={() => {
                setInsumoEditando(null); // Nos aseguramos que esté vacío
                setShowModalForm(true);
              }}
            >
              Registrar Nuevo Insumo
            </button>
            
            <button className="btn btn-dark border-secondary px-3 py-2 text-white">
              <i className="bi bi-download"></i>
            </button>
          </div>
        </div>

        {/* Modal de Proveedores por Categoría */}
        <InsumoProveedoresModal 
          show={insumoProveedoresSeleccionado !== null}
          insumo={insumoProveedoresSeleccionado}
          onClose={() => setInsumoProveedoresSeleccionado(null)}
        />

        {/* ◄ AGREGADO: Modal de Registro / Edición */}
        <InsumoModal
          show={showModalForm}
          insumoEditando={insumoEditando}
          onClose={() => setShowModalForm(false)}
          onGuardar={handleGuardarInsumo}
        />

      </div>
    </SidebarLayout>
  );
};