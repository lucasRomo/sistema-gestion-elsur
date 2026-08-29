import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InsumoTabla } from '../components/InsumoTabla';
import { InsumoProveedoresModal } from '../components/InsumoProveedoresModal';
import { InsumoModal } from '../components/InsumoModal';
import { ConvertirInsumoModal } from '../components/ConvertirInsumoModal';
import { ModalMermasInsumos } from '../modals/ModalMermasInsumos';
import { RelacionesModal } from '../components/RelacionesModal';
import { useInsumos } from '../hooks/useInsumos';
import { SuccesModal } from '../../../components/layouts/SuccesModal';
import { InsumosFiltros } from '../components/InsumosFiltros';
import { AumentoMasivoInsumosModal } from '../components/AumentoMasivoInsumosModal';
import { actualizarInsumosMasivo } from '../services/insumoService';
import { useTheme } from '../../../Context/ThemeContext';
import type { Insumo } from '../types/Insumo';
import { exportarInsumosExcel, exportarInsumosPDF } from '../utils/exportInsumosUtils';
import { ModalStockCriticoList, type ItemStockCritico } from '../modals/ModalStockCriticoList';

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
  const [showMermasModal, setShowMermasModal] = useState(false);
  const [showRelacionesModal, setShowRelacionesModal] = useState(false);
  const [showStockCriticoModal, setShowStockCriticoModal] = useState(false);
  
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const insumosFiltrados = insumos.filter((i) => {
    const cumpleNombre = i.nombreInsumo.toLowerCase().includes(filtroNombre.toLowerCase());
    const cumpleEstado = filtroEstado === 'Sin Filtro' || i.estado === filtroEstado;
    return cumpleNombre && cumpleEstado;
  });

  const insumosOrdenados = [...insumosFiltrados].sort((a, b) => {
    const idA = a.idInsumo || (a as any).id || 0;
    const idB = b.idInsumo || (b as any).id || 0;
    return idA - idB;
  });

  // Mapeo seguro utilizando casteo para evitar colisiones de tipos con las propiedades de Insumo
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
    await actualizarInsumosMasivo(data);
    await cargar();
    const accion = data.porcentaje >= 0 ? 'Aumento' : 'Descuento';
    setMensajeExito(`${accion} de ${Math.abs(data.porcentaje)}% aplicado correctamente`);
    setMostrarExito(true);
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="w-100 text-center position-relative">
          <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.5rem', color: titleColor }}>
            Stock de Insumos
          </h1>
        </div>
      </div>

      <InsumosFiltros 
        filtroNombre={filtroNombre}
        setFiltroNombre={setFiltroNombre}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
      />

      <InsumoTabla 
        insumos={insumosOrdenados}
        onEditar={(insumo) => { setInsumoEditando(insumo); setShowModalForm(true); }}
        onVerProveedores={(insumo) => setInsumoProveedoresSeleccionado(insumo)}
        onConvertir={(insumo) => {
          setInsumoConvertirSeleccionado(insumo);
          setShowConvertirModal(true);
        }}
      />

      {/* Botonera Inferior: Volver + Exportar + Stock Crítico + Acciones de Insumos */}
      <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center pt-3 font-monospace">
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary px-4 py-2" style={{ color: '#ffffff' }}>
          Volver
        </button>
        
        <div className="d-flex gap-2 flex-wrap">
          <button 
            type="button"
            className="btn btn-outline-warning fw-bold d-flex align-items-center gap-2 position-relative"
            onClick={() => setShowStockCriticoModal(true)}
            title="Ver insumos con stock al límite o crítico"
          >
            <i className="bi bi-exclamation-triangle-fill fs-5"></i>
            Stock Crítico
            {cantidadCriticos > 0 && (
              <span className="badge bg-danger rounded-pill ms-1">
                {cantidadCriticos}
              </span>
            )}
          </button>

          <button 
            className="btn btn-outline-success fw-bold d-flex align-items-center gap-2"
            onClick={() => exportarInsumosExcel(insumosFiltrados)}
            disabled={insumosFiltrados.length === 0}
            title="Exportar listado actual a Excel"
          >
            <i className="bi bi-file-earmark-excel-fill fs-5"></i>
          </button>

          <button 
            className="btn btn-outline-danger fw-bold d-flex align-items-center gap-2"
            onClick={() => exportarInsumosPDF(insumosFiltrados)}
            disabled={insumosFiltrados.length === 0}
            title="Exportar listado actual a PDF"
          >
            <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
          </button>

          <button 
            type="button"
            className="btn px-4 py-2 fw-bold d-flex align-items-center gap-2"
            style={{ backgroundColor: '#0bc9f8', color: '#ffffff' }}
            onClick={() => setShowRelacionesModal(true)}
          >
            <i className="bi"></i>
            Ver Relaciones
          </button>

          <button 
            className="btn btn-warning px-4 py-2 fw-bold"
            style={{ color: '#ffffff' }}
            onClick={() => setShowMermasModal(true)}
          >
            <i className="bi"></i>
            Mermas
          </button>

          <button 
            className="btn px-4 py-2 fw-bold" 
            style={{ backgroundColor: '#c27a0d', color: '#ffffff' }}
            onClick={() => setShowAumentoModal(true)}
          >
            Modificar Varios Precios
          </button>
          
          <button 
            className="btn btn-success px-4 py-2 fw-bold" 
            style={{ color: '#ffffff' }}
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
          await cargar();
          setShowMermasModal(false);
          setMensajeExito('Merma de insumo registrada exitosamente');
          setMostrarExito(true);
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
          try {
            if (insumoEditando) {
              setInsumoEditando(data); 
              setMostrarConfirmacion(true); 
            } else {
              await guardar(data);
              setShowModalForm(false);
              setMensajeExito('Insumo Creado Correctamente');
              setMostrarExito(true);
            }
          } catch (err: any) {
            console.error("Error al guardar insumo:", err);
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
            <div className="modal-content p-4 text-white text-center shadow-lg" style={{ border: '2px solid #8e45e0', backgroundColor: isDark ? '#1a1a1c' : '#ffffff', color: titleColor, borderRadius: '12px' }}>
              <i className="bi bi-shield-lock-fill fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold" style={{ color: titleColor }}>¿Confirmar Modificaciones?</h5>
              <p className="small" style={{ color: mutedText }}>Se sobreescribirán los datos del insumo.</p>
              
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-danger btn-sm px-3" style={{ borderRadius: '6px', color: '#ffffff' }} onClick={() => setMostrarConfirmacion(false)}>
                  Volver
                </button>
                <button 
                  className="btn btn-sm px-3 fw-bold text-white" 
                  style={{ borderRadius: '6px', backgroundColor: '#2e9225', borderColor: '#25741e', color: '#ffffff' }} 
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