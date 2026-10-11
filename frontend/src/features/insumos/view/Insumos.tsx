import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { InsumoTabla } from '../components/InsumoTabla';
import { InsumoProveedoresModal } from '../components/InsumoProveedoresModal';
import { InsumoModal } from '../components/InsumoModal';
import { ConvertirInsumoModal } from '../components/ConvertirInsumoModal';
import { ModalMermasInsumos } from '../modals/ModalMermasInsumos';
import { RelacionesModal } from '../components/RelacionesModal';
import { useInsumos } from '../hooks/useInsumos';
import { InsumosFiltros } from '../components/InsumosFiltros';
import { AumentoMasivoInsumosModal } from '../components/AumentoMasivoInsumosModal';
import { actualizarInsumosMasivo } from '../services/insumoService';
import type { Insumo } from '../types/Insumo';
import { exportarInsumosExcel, exportarInsumosPDF } from '../utils/exportInsumosUtils';
import { ModalStockCriticoList, type ItemStockCritico } from '../modals/ModalStockCriticoList';

import { SuccesModal } from '../../../components/layouts/SuccesModal';
import { useTheme } from '../../../Context/ThemeContext';
import { showLoading, hideLoading } from '../../../config/loadingStore';
import { useIsMobile } from '../../../hook/useIsMobile';
import { confirmarAccion, mostrarError } from '../../../config/dialogStore';
import { SkeletonTabla } from '../../../components/common/SkeletonCarga';

import { normalizarTexto } from '../../../utils/formato';
export const Insumos: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const mainCardBg = isDark ? '#1d1d1d' : '#ffffff';
  const cardBorder = isDark ? '#27272a' : '#cbd5e1';
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : '#64748b';

  const navigate = useNavigate();
  const { insumos, guardar, cargar, cargando } = useInsumos();
  
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');
  const [insumoProveedoresSeleccionado, setInsumoProveedoresSeleccionado] = useState<Insumo | null>(null);
  const [insumoConvertirSeleccionado, setInsumoConvertirSeleccionado] = useState<Insumo | null>(null);
  
  const [showModalForm, setShowModalForm] = useState(false);
  const [showAumentoModal, setShowAumentoModal] = useState(false);
  const [showConvertirModal, setShowConvertirModal] = useState(false);
  const [showMermasModal, setShowMermasModal] = useState(false);
  const [showRelacionesModal, setShowRelacionesModal] = useState(false);
  const [showStockCriticoModal, setShowStockCriticoModal] = useState(false);
  
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const insumosFiltrados = insumos.filter((i) => {
    const cumpleNombre = normalizarTexto(i.nombreInsumo).includes(normalizarTexto(filtroNombre));
    const cumpleEstado = filtroEstado === 'Sin Filtro' || i.estado === filtroEstado;
    return cumpleNombre && cumpleEstado;
  });

  const itemsStockCritico: ItemStockCritico[] = insumos.map((i: any) => ({
    id: i.idInsumo || i.id || i.nombreInsumo,
    nombre: i.nombreInsumo || i.nombre || 'Insumo',
    stockActual: i.stockActual ?? i.cantidad ?? i.stock ?? 0,
    stockMinimoOTolerancia: i.stockMinimo ?? i.toleranciaInsumo ?? i.tolerancia ?? 5,
    unidadMedida: i.unidadMedida
  }));

  const cantidadCriticos = itemsStockCritico.filter(
    (item) => item.stockActual <= item.stockMinimoOTolerancia
  ).length;

  const handleAplicarAumentoMasivo = async (data: {
    porcentaje: number;
    idProveedor?: number | null;
    idsInsumos?: number[];
  }) => {
    showLoading('Aplicando cambios de precio...');
    try {
      await actualizarInsumosMasivo(data);
      await cargar();
      const accion = data.porcentaje >= 0 ? 'Aumento' : 'Descuento';
      setMensajeExito(`${accion} de ${Math.abs(data.porcentaje)}% aplicado correctamente`);
      setMostrarExito(true);
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="container-fluid px-0 h-100 d-flex flex-column font-monospace" style={{ color: textColor }}>
      
      <div className="d-flex justify-content-center align-items-center mb-4">
        <h2 className="fw-bold fs-2 m-0 text-center font-monospace" style={{ color: titleColor }}>
          Stock de Insumos
        </h2>
      </div>

      <InsumosFiltros 
        filtroNombre={filtroNombre}
        setFiltroNombre={setFiltroNombre}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
      />

      <div 
        className="rounded-3 border mb-3 font-monospace" 
        style={{ 
          backgroundColor: mainCardBg, 
          borderColor: cardBorder,
          height: 'clamp(260px, calc(100vh - 290px), 65.3vh)', // en monitores grandes sigue siendo 65.3vh; en notebooks deja lugar a los botones de abajo
          overflowY: 'auto',
          overflowX: 'auto', // si la tabla no entra (pantallas angostas), se desplaza en vez de cortar columnas
          display: 'block'
        }}
      >
        {cargando ? (
          <SkeletonTabla />
        ) : (
          <InsumoTabla
            insumos={insumosFiltrados}
            onEditar={(insumo) => { setInsumoEditando(insumo); setShowModalForm(true); }}
            onVerProveedores={(insumo) => setInsumoProveedoresSeleccionado(insumo)}
            onConvertir={(insumo) => {
              setInsumoConvertirSeleccionado(insumo);
              setShowConvertirModal(true);
            }}
          />
        )}
      </div>

      <div className={`barra-acciones d-flex align-items-center mt-3 mb-4 font-monospace ${isMobile ? 'justify-content-stretch' : 'justify-content-between'}`}>
        {!isMobile && (
          <button 
            onClick={() => navigate('/dashboard')} 
            className="btn btn-secondary fw-bold shadow-sm font-monospace d-inline-flex align-items-center justify-content-center" 
            style={{ 
              color: '#ffffff',
              padding: '0.7rem clamp(0.75rem, 1.1vw, 1.4rem)',
              fontSize: '1rem',
              minWidth: '5.5rem'
            }}
          >
            Volver
          </button>
        )}
        
        <div className={`d-flex flex-wrap gap-2 ${isMobile ? 'w-100' : ''}`}>
          <button 
    type="button"
    className={`btn btn-outline-warning fw-bold d-flex align-items-center justify-content-center px-3 py-2 shadow-sm position-relative ${isMobile ? 'flex-fill text-nowrap' : ''}`}
    style={{ '--bs-btn-hover-color': '#ffffff', '--bs-btn-active-color': '#ffffff' } as React.CSSProperties}
    onClick={() => setShowStockCriticoModal(true)}
    title="Ver insumos con stock al límite o crítico"
  >
    <i className="bi bi-exclamation-triangle-fill fs-6 me-2"></i>
    Stock Crítico
    {cantidadCriticos > 0 && (
      <span className="badge bg-danger rounded-pill ms-2">
        {cantidadCriticos}
      </span>
    )}
  </button>

          <button 
            className="btn btn-outline-success fw-bold d-flex align-items-center justify-content-center px-3 py-2 shadow-sm"
            onClick={() => exportarInsumosExcel(insumosFiltrados)}
            disabled={insumosFiltrados.length === 0}
            title="Exportar listado actual a Excel"
          >
            <i className="bi bi-file-earmark-excel-fill fs-5"></i>
          </button>

          <button 
            className="btn btn-outline-danger fw-bold d-flex align-items-center justify-content-center px-3 py-2 shadow-sm"
            onClick={() => exportarInsumosPDF(insumosFiltrados)}
            disabled={insumosFiltrados.length === 0}
            title="Exportar listado actual a PDF"
          >
            <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
          </button>

          <button 
            type="button"
            className={`btn fw-bold shadow-sm font-monospace d-inline-flex align-items-center justify-content-center ${isMobile ? 'flex-fill text-nowrap' : ''}`}
            style={{ 
              backgroundColor: '#149bdf', 
              borderColor: '#149bdf', 
              color: '#ffffff',
              padding: '0.7rem clamp(0.75rem, 1.1vw, 1.4rem)',
              fontSize: '1rem',
              minWidth: '5.5rem'
            }}
            onClick={() => setShowRelacionesModal(true)}
          >
            Ver Relaciones
          </button>

          <button 
            className={`btn fw-bold shadow-sm font-monospace d-inline-flex align-items-center justify-content-center ${isMobile ? 'flex-fill text-nowrap' : ''}`}
            style={{ 
              backgroundColor: '#eab308', 
              borderColor: '#eab308', 
              color: '#ffffff',
              padding: '0.7rem clamp(0.75rem, 1.1vw, 1.4rem)',
              fontSize: '1rem',
              minWidth: '5.5rem'
            }}
            onClick={() => setShowMermasModal(true)}
          >
            Mermas
          </button>

          <button 
            className={`btn fw-bold shadow-sm font-monospace d-inline-flex align-items-center justify-content-center ${isMobile ? 'flex-fill text-nowrap' : ''}`} 
            style={{ 
              backgroundColor: '#c27a0d', 
              borderColor: '#c27a0d', 
              color: '#ffffff',
              padding: '0.7rem clamp(0.75rem, 1.1vw, 1.4rem)',
              fontSize: '1rem',
              minWidth: '5.5rem'
            }}
            onClick={() => setShowAumentoModal(true)}
          >
            Modificar Varios Precios
          </button>
          
          <button 
            className={`btn btn-success fw-bold shadow-sm d-inline-flex align-items-center justify-content-center ${isMobile ? 'flex-fill text-nowrap' : ''}`} 
            style={{ 
              color: '#ffffff',
              padding: '0.7rem clamp(0.75rem, 1.1vw, 1.4rem)',
              fontSize: '1rem',
              minWidth: '5.5rem'
            }}
            onClick={() => { setInsumoEditando(null); setShowModalForm(true); }}
          >
            Registrar Nuevo Insumo
          </button>
        </div>
      </div>

      <ModalStockCriticoList
        show={showStockCriticoModal}
        titulo="Stock Crítico de Insumos"
        items={itemsStockCritico}
        onClose={() => setShowStockCriticoModal(false)}
      />

      <RelacionesModal
        show={showRelacionesModal}
        onClose={() => setShowRelacionesModal(false)}
      />

      <ModalMermasInsumos
        show={showMermasModal}
        insumos={insumos}
        onClose={() => setShowMermasModal(false)}
        onExito={async () => {
          showLoading('Registrando merma...');
          try {
            await cargar();
            setShowMermasModal(false);
            setMensajeExito('Merma de insumo registrada exitosamente');
            setMostrarExito(true);
          } finally {
            hideLoading();
          }
        }}
      />

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
            if (!(await confirmarAccion(`¿Registrar el insumo "${(data as any).nombreInsumo ?? ''}"?`, { titulo: 'Nuevo insumo', textoConfirmar: 'Registrar' }))) return;
            showLoading('Guardando insumo...');
            try {
              await guardar(data);
              setShowModalForm(false);
              setMensajeExito('Insumo Creado Correctamente');
              setMostrarExito(true);
            } catch (err: any) {
              mostrarError(err?.message || 'No se pudo registrar el insumo.');
            } finally {
              hideLoading();
            }
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
          showLoading('Procesando...');
          try {
            await cargar();
            setMensajeExito(msg);
            setMostrarExito(true);
          } finally {
            hideLoading();
          }
        }}
      />

      <AumentoMasivoInsumosModal
        show={showAumentoModal}
        insumos={insumos}
        onClose={() => setShowAumentoModal(false)}
        onConfirmar={handleAplicarAumentoMasivo}
      />

      {mostrarConfirmacion && (
        <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content p-4 text-center shadow-lg" style={{ border: `2px solid ${isDark ? '#8e45e0' : '#a855f7'}`, backgroundColor: isDark ? '#1a1a1c' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a', borderRadius: '12px' }}>
              <i className="bi bi-shield-lock-fill fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Confirmar Modificaciones?</h5>
              <p className="small m-0" style={{ color: mutedText }}>Se sobreescribirán los datos del insumo.</p>
              
              <div className="d-flex justify-content-center gap-2 mt-4">
                <button className="btn btn-secondary btn-sm px-3 fw-semibold" disabled={guardandoEdicion} onClick={() => setMostrarConfirmacion(false)}>Volver</button>
                <button
                  className="btn btn-success btn-sm px-3 fw-semibold text-white"
                  disabled={guardandoEdicion}
                  onClick={async () => {
                    if (guardandoEdicion || !insumoEditando) return;
                    setGuardandoEdicion(true);
                    showLoading('Guardando cambios...');
                    try {
                      await guardar(insumoEditando);
                      setMostrarConfirmacion(false);
                      setShowModalForm(false);
                      setMensajeExito('Modificación hecha exitosamente');
                      setMostrarExito(true);
                    } catch (err: any) {
                      mostrarError(err?.message || 'Error al modificar el insumo.');
                    } finally {
                      setGuardandoEdicion(false);
                      hideLoading();
                    }
                  }}
                >
                  {guardandoEdicion ? 'Guardando...' : 'Confirmar'}
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