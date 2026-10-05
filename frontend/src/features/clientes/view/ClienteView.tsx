import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegistroClienteModal } from '../components/RegistroClienteModal';
import { ClienteEditModal } from '../components/ClienteEditModal';
import { CategoriaClienteModal } from '../components/CategoriaClienteModal';
import { CuentaCorrienteModal } from '../components/CuentaCorrienteModal';
import { CuentasCorrientesResumenModal } from '../components/CuentasCorrientesResumenModal';
import { ClienteFiltros } from '../components/ClientesFiltros';
import { useClientes } from '../hooks/useClientes';
import { UbicacionViewModal } from '../../../components/modals/UbicacionViewModal';
import { SuccesModal } from '../../../components/layouts/SuccesModal';
import { useTheme } from '../../../Context/ThemeContext';
import { showLoading, hideLoading } from '../../../config/loadingStore';
import { useIsMobile } from '../../../hook/useIsMobile';
import { exportarClientesExcel, exportarClientesPDF } from '../utils/exportClientesUtils';
import { colorPorSaldo, formatearMonto, normalizarTexto } from '../../../utils/formato';
import type { Cliente } from '../types/Cliente';
import { mostrarError } from '../../../config/dialogStore';
import { SkeletonFilasTabla } from '../../../components/common/SkeletonCarga';
import { ThOrdenable } from '../../../components/common/ThOrdenable';
import { useOrdenTabla } from '../../../hook/useOrdenTabla';

const nombreCliente = (c: Cliente) =>
  (c.persona ? `${c.persona.nombre ?? ''} ${c.persona.apellido ?? ''}`.trim() : '') || c.razonSocial || '';

export const ClienteView = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const mainCardBg = isDark ? '#1d1d1d' : '#ffffff';
  const cardBorder = isDark ? '#27272a' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const tableBg = isDark ? '#1d1d1d' : '#ffffff';
  const tableText = isDark ? '#e4e4e7' : '#18181b';
  const theadBg = isDark ? '#1d1d1d' : '#f6f9fc';
  const theadBorder = isDark ? '#27272a' : '#e2e8f0';
  const theadText = isDark ? '#fcfcfc' : '#334155';
  const rowBorder = isDark ? '#27272a' : '#f1f5f9';
  const rowHoverBg = isDark ? '#27272a' : '#f8fafc';

  const { clientes, loading, registrarCliente, cargarClientes } = useClientes();
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [clienteConUbicacionSeleccionada, setClienteConUbicacionSeleccionada] = useState<Cliente | null>(null);
  const [clienteAEditar, setClienteAEditar] = useState<Cliente | null>(null);
  const [clienteCuentaCorriente, setClienteCuentaCorriente] = useState<Cliente | null>(null);
  const [verCategoriasModal, setVerCategoriasModal] = useState<boolean>(false);
  const [verResumenCuentasModal, setVerResumenCuentasModal] = useState<boolean>(false);

  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('Sin Filtro');
  const [showSuccess, setShowSuccess] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleConfirmarEdicion = async (data: any) => {
    if (guardando) return;
    setGuardando(true);
    showLoading('Guardando cambios...');
    try {
      await registrarCliente(data);
      setMsgSuccess("Cambios guardados correctamente");
      setShowSuccess(true);
      setClienteAEditar(null);
      setClienteConUbicacionSeleccionada(null);
      await cargarClientes();
    }
    catch (e: any) {
      mostrarError("Error: " + e.message);
    }
    finally {
      setGuardando(false);
      hideLoading();
    }
  };

  const clientesFiltrados = clientes.filter((c: Cliente) => {
    if (c.id_cliente === 1) return false;
    if (filtroEstado !== 'Sin Filtro' && c.estado !== filtroEstado) return false;
    
    const busqueda = normalizarTexto(filtroTexto).trim();
    if (!busqueda) return true;
    
    return (
      normalizarTexto(c.persona?.nombre).includes(busqueda) || 
      normalizarTexto(c.persona?.apellido).includes(busqueda) || 
      c.persona?.numeroDocumento?.includes(busqueda) || 
      normalizarTexto(c.razonSocial).includes(busqueda)
    );
  });

  const { ordenados: clientesOrdenados, orden, alternar } = useOrdenTabla(clientesFiltrados, {
    id: (c) => Number(c.id_cliente || c.idCliente || 0),
    cliente: (c) => nombreCliente(c),
    documento: (c) => c.persona?.numeroDocumento,
    ctacte: (c) => Number(c.limiteCredito || 0),
    saldo: (c) => Number(c.saldoDeudor || 0),
    estado: (c) => c.estado,
  }, { clave: 'id', direccion: 'asc' });

  return (
    <div className="container-fluid px-0 h-100 d-flex flex-column font-monospace" style={{ color: textColor }}>
      
      <div className="d-flex justify-content-center align-items-center mb-4">
        <h2 className="fw-bold fs-2 m-0 text-center font-monospace" style={{ color: titleColor }}>
          Gestión de Clientes
        </h2>
      </div>

      <SuccesModal 
        show={showSuccess} 
        message={msgSuccess} 
        onClose={() => setShowSuccess(false)} 
      />

      <ClienteFiltros 
        filtroNombre={filtroTexto}
        setFiltroNombre={setFiltroTexto}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
      />

      <div 
        className="rounded-3 border mb-3 font-monospace" 
        style={{ 
          backgroundColor: mainCardBg, 
          borderColor: cardBorder,
          height: '65.3vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'block'
        }}
      >
        <table 
          className="table-hover m-0 align-middle w-100" 
          style={{ 
            borderCollapse: 'collapse', 
            color: tableText,
            backgroundColor: tableBg 
          }}
        >
          <thead style={{ position: 'sticky', top: 0, backgroundColor: theadBg, zIndex: 1 }}>
            <tr style={{ backgroundColor: theadBg, borderBottom: `2px solid ${theadBorder}`, color: theadText, fontSize: '0.85rem', textTransform: 'uppercase' }}>
              <ThOrdenable clave="id" orden={orden} onOrdenar={alternar} className="py-3 px-3 text-center" style={{ width: '7%' }}>ID</ThOrdenable>
              <ThOrdenable clave="cliente" orden={orden} onOrdenar={alternar} className="py-3 px-3 text-start" style={{ width: '33%' }}>Cliente</ThOrdenable>
              <ThOrdenable clave="documento" orden={orden} onOrdenar={alternar} className="py-3 px-3 text-center" style={{ width: '12%' }}>Documento</ThOrdenable>
              <ThOrdenable clave="ctacte" orden={orden} onOrdenar={alternar} className="py-3 px-3 text-center" style={{ width: '14%' }}>Cta. Cte.</ThOrdenable>
              <ThOrdenable clave="saldo" orden={orden} onOrdenar={alternar} className="py-3 px-3 text-end" style={{ width: '12%' }}>Saldo Deudor</ThOrdenable>
              <ThOrdenable clave="estado" orden={orden} onOrdenar={alternar} className="py-3 px-3 text-center" style={{ width: '8%' }}>Estado</ThOrdenable>
              <th className="py-3 px-3 text-center" style={{ width: '6%' }}>Opciones</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.9rem' }}>
            {loading ? (
              <SkeletonFilasTabla columnas={7} />
            ) : clientesOrdenados && clientesOrdenados.length > 0 ? (
              clientesOrdenados.map((c: Cliente) => {
                const tieneCtaCte = Number(c.limiteCredito || 0) > 0;
                const idClienteVal = c.id_cliente || c.idCliente;

                return (
                  <tr 
                    key={idClienteVal} 
                    style={{ borderBottom: `1px solid ${rowBorder}`, transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = rowHoverBg} 
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="py-3 px-3 text-center text-info-custom fw-bold">#{idClienteVal}</td>
                    
                    <td className="px-3 py-3" style={{ color: tableText }}>
                      <div className="fw-bold">{nombreCliente(c)}</div>
                      {c.razonSocial && c.razonSocial.trim() !== nombreCliente(c) && (
                        <div className="small" style={{ opacity: 0.65 }}>{c.razonSocial}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center" style={{ color: tableText }}>{c.persona?.numeroDocumento}</td>
                    
                    <td className="px-3 py-3 text-center">
                      {tieneCtaCte ? (
                        <span className="badge rounded-pill bg-success bg-opacity-75 font-monospace px-3 py-2" style={{ color: '#ffffff' }}>
                          Habilitada (${Number(c.limiteCredito).toLocaleString('es-AR', { maximumFractionDigits: 0 })})
                        </span>
                      ) : (
                        <span className="badge rounded-pill bg-secondary font-monospace opacity-75 px-3 py-2" style={{ color: '#ffffff' }}>
                          Sin Cta Cte
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-end">
                      <span className={`fw-bold ${colorPorSaldo(c.saldoDeudor, c.limiteCredito)}`}>
                        ${formatearMonto(Number(c.saldoDeudor || 0))}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span className={`badge rounded-pill px-3 py-2 ${c.estado === 'Activo' ? 'bg-success bg-opacity-75' : 'bg-danger bg-opacity-75'}`} style={{ color: '#ffffff' }}>
                        {c.estado}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button 
                          className={`btn btn-sm d-flex align-items-center justify-content-center rounded-2 ${
                            tieneCtaCte ? 'btn-outline-success' : 'btn-outline-secondary opacity-50'
                          }`} 
                          style={{ width: '34px', height: '34px' }} 
                          title={tieneCtaCte ? "Gestionar Cuenta Corriente" : "Sin Cta. Cte. (Haz clic para asignar límite)"} 
                          onClick={() => setClienteCuentaCorriente(c)}
                        >
                          <i className="bi bi-wallet2 fs-6"></i>
                        </button>

                        <button 
                          className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center rounded-2" 
                          style={{ width: '34px', height: '34px' }} 
                          title="Modificar Cliente" 
                          onClick={() => setClienteAEditar(c)}
                        >
                          <i className="bi bi-pencil-square fs-6"></i>
                        </button>
                        
                        <button 
                          className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center rounded-2" 
                          style={{ width: '34px', height: '34px' }} 
                          title="Ver Ubicación" 
                          onClick={() => setClienteConUbicacionSeleccionada(c)}
                        >
                          <i className="bi bi-house-door fs-6"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-5 border-0" style={{ color: tableText }}>
                  <i className="bi display-5 d-block mb-2 opacity-50"></i>
                  <span className="font-monospace">No se han registrado o encontrado clientes en el sistema.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

        <div className={`d-flex flex-wrap gap-2 ${isMobile ? 'w-100' : ''}`}>
          <button 
            className="btn btn-outline-success fw-bold d-flex align-items-center justify-content-center px-3 py-2 shadow-sm"
            onClick={() => exportarClientesExcel(clientesFiltrados)}
            disabled={clientesFiltrados.length === 0}
            title="Exportar listado actual a Excel"
          >
            <i className="bi bi-file-earmark-excel-fill fs-5"></i>
          </button>

          <button 
            className="btn btn-outline-danger fw-bold d-flex align-items-center justify-content-center px-3 py-2 shadow-sm"
            onClick={() => exportarClientesPDF(clientesFiltrados)}
            disabled={clientesFiltrados.length === 0}
            title="Exportar listado actual a PDF"
          >
            <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
          </button>

          <button 
            type="button" 
            className={`btn btn-info fw-bold shadow-sm font-monospace d-inline-flex align-items-center justify-content-center ${isMobile ? 'flex-fill text-nowrap' : ''}`}
            style={{ 
              backgroundColor: '#0caccc', 
              borderColor: '#0caccc', 
              color: '#ffffff',
              padding: '11px 24px',
              fontSize: '1rem',
              minWidth: '90px'
            }}
            onClick={() => setVerCategoriasModal(true)}
          >
            Categorías
          </button>

          <button 
            className={`btn fw-bold shadow-sm font-monospace d-inline-flex align-items-center justify-content-center gap-2 ${isMobile ? 'flex-fill text-nowrap' : ''}`}
            style={{ 
              backgroundColor: '#ca9e1b', 
              borderColor: '#ca9e1b', 
              color: '#ffffff',
              padding: '11px 24px',
              fontSize: '1rem',
              minWidth: '90px'
            }}
            onClick={() => setVerResumenCuentasModal(true)}
          >
            <i className="bi bi-wallet2"></i> Cuentas Corrientes
          </button>

          <button 
            className={`btn btn-success fw-bold shadow-sm d-inline-flex align-items-center justify-content-center ${isMobile ? 'flex-fill text-nowrap' : ''}`}
            style={{ 
              color: '#ffffff',
              padding: '11px 24px',
              fontSize: '1rem',
              minWidth: '90px'
            }}
            onClick={() => setMostrarRegistro(true)}
          >
            Registrar Nuevo Cliente
          </button>
        </div>
      </div>  

      {mostrarRegistro && (
        <RegistroClienteModal
          clientes={clientes}
          onCerrar={() => setMostrarRegistro(false)}
          onRegistrado={async () => {
            setMostrarRegistro(false);
            await cargarClientes();
            setMsgSuccess('El Cliente ha sido registrado con éxito');
            setShowSuccess(true);
          }}
        />
      )}
      {clienteAEditar && <ClienteEditModal cliente={clienteAEditar} onCerrar={() => setClienteAEditar(null)} onConfirmar={handleConfirmarEdicion} />}
      {clienteConUbicacionSeleccionada && <UbicacionViewModal cliente={clienteConUbicacionSeleccionada} onCerrar={() => setClienteConUbicacionSeleccionada(null)} onConfirmar={handleConfirmarEdicion} />}
      
      {verCategoriasModal && <CategoriaClienteModal onCerrar={() => setVerCategoriasModal(false)} />}
      
      {verResumenCuentasModal && (
        <CuentasCorrientesResumenModal 
          clientes={clientes} 
          onCerrar={() => setVerResumenCuentasModal(false)} 
          onSeleccionarCliente={(cliente) => setClienteCuentaCorriente(cliente)}
        />
      )}

      {clienteCuentaCorriente && (
        <CuentaCorrienteModal 
          cliente={clienteCuentaCorriente} 
          onCerrar={() => setClienteCuentaCorriente(null)} 
          onActualizar={() => {
            cargarClientes();
          }} 
        />
      )}
    </div>
  );
};