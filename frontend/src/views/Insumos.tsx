import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InsumoTabla } from '../features/insumos/InsumoTabla';
import { InsumoProveedoresModal } from '../features/insumos/InsumoProveedoresModal';
import { InsumoModal } from '../features/insumos/InsumoModal';
import { ConvertirInsumoModal } from '../features/insumos/ConvertirInsumoModal';
import { useInsumos } from '../hooks/useInsumos';
import { SuccesModal } from '../components/layouts/SuccesModal';
import { InsumosFiltros } from '../features/insumos/InsumosFiltros';
import { AumentoMasivoInsumosModal } from '../features/insumos/AumentoMasivoInsumosModal';
import { actualizarInsumosMasivo } from '../services/insumoService';
import { useTheme } from '../Context/ThemeContext';
import type { Insumo } from '../types/Insumo';

export const Insumos: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';

  const navigate = useNavigate();
  const { insumos, guardar, cargar } = useInsumos();
  
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');
  const [insumoProveedoresSeleccionado, setInsumoProveedoresSeleccionado] = useState<Insumo | null>(null);
  const [insumoConvertirSeleccionado, setInsumoConvertirSeleccionado] = useState<Insumo | null>(null);
  
  const [showModalForm, setShowModalForm] = useState(false);
  const [showAumentoModal, setShowAumentoModal] = useState(false);
  const [showConvertirModal, setShowConvertirModal] = useState(false);
  
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const insumosFiltrados = insumos.filter((i) => {
    const cumpleNombre = i.nombreInsumo.toLowerCase().includes(filtroNombre.toLowerCase());
    const cumpleEstado = filtroEstado === 'Sin Filtro' || i.estado === filtroEstado;
    return cumpleNombre && cumpleEstado;
  });

  const handleAplicarAumentoMasivo = async (data: {
    porcentaje: number;
    idProveedor?: number | null;
    idsInsumos?: number[];
  }) => {
    await actualizarInsumosMasivo(data);
    await cargar();
    setMensajeExito(`Aumento de ${data.porcentaje}% aplicado a los insumos seleccionados`);
    setMostrarExito(true);
  };

  return (
    <div className="container-fluid px-0">
      {/* Título de vista adaptativo */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="w-100 text-center position-relative">
          <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.5rem', color: titleColor }}>
            Stock de Insumos
          </h1>
        </div>
      </div>

      {/* Componente de Filtros */}
      <InsumosFiltros 
        filtroNombre={filtroNombre}
        setFiltroNombre={setFiltroNombre}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
      />

      {/* Tabla con soporte de acciones integradas */}
      <InsumoTabla 
        insumos={insumosFiltrados}
        onEditar={(insumo) => { setInsumoEditando(insumo); setShowModalForm(true); }}
        onVerProveedores={(insumo) => setInsumoProveedoresSeleccionado(insumo)}
        onConvertir={(insumo) => {
          setInsumoConvertirSeleccionado(insumo);
          setShowConvertirModal(true);
        }}
      />

      {/* Botonera principal */}
      <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center pt-3 border-top border-secondary font-monospace">
        <button onClick={() => navigate('/dashboard')} className="btn btn-danger px-4 py-2">
          Volver
        </button>
        
        <div className="d-flex gap-3">
          <button 
            className="btn px-4 py-2 text-white fw-normal" 
            style={{ backgroundColor: '#17a2b8', borderColor: '#0e5a66' }}
            onClick={() => setShowAumentoModal(true)}
          >
            Modificar Varios Precios
          </button>
          <button 
            className="btn btn-success px-4 py-2 fw-bold" 
            onClick={() => { setInsumoEditando(null); setShowModalForm(true); }}
          >
            Registrar Nuevo Insumo
          </button>
        </div>
      </div>

      {/* Modales */}
      <InsumoProveedoresModal 
        show={!!insumoProveedoresSeleccionado} 
        insumo={insumoProveedoresSeleccionado} 
        onClose={() => setInsumoProveedoresSeleccionado(null)} 
      />

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
          }
        }}
      />

      <ConvertirInsumoModal
        show={showConvertirModal}
        insumo={insumoConvertirSeleccionado}
        onClose={() => {
          setShowConvertirModal(false);
          setInsumoConvertirSeleccionado(null);
        }}
        onExito={async (msg) => {
          await cargar();
          setMensajeExito(msg);
          setMostrarExito(true);
        }}
      />

      <AumentoMasivoInsumosModal
        show={showAumentoModal}
        insumos={insumos}
        onClose={() => setShowAumentoModal(false)}
        onConfirmar={handleAplicarAumentoMasivo}
      />

      {mostrarConfirmacion && (
        <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content p-4 text-white text-center shadow-lg" style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px' }}>
              <i className="bi bi-shield-lock-fill fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Confirmar Modificaciones?</h5>
              <p className="small" style={{ color: mutedText }}>Se sobreescribirán los datos del insumo.</p>
              
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-outline-light btn-sm px-3" style={{ borderRadius: '6px', backgroundColor: '#e22e2e', borderColor: '#e62020'}} onClick={() => setMostrarConfirmacion(false)}>
                  Volver
                </button>
                <button 
                  className="btn btn-sm px-3 fw-bold text-white" 
                  style={{ borderRadius: '6px', backgroundColor: '#2e9225', borderColor: '#25741e' }} 
                  onClick={async () => {
                    if (insumoEditando) {
                      await guardar(insumoEditando);
                    }
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
  );
};