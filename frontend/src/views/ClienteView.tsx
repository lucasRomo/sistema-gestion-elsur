import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonaForm } from '../features/auth/PersonaForm';
import { ClienteExtraForm } from '../features/auth/ClienteExtraForm';
import { ClienteEditModal } from '../features/Clientes/ClienteEditModal';
import { UbicacionViewModal } from '../features/modals/UbicacionViewModal';
import { CategoriaClienteModal } from '../features/Clientes/CategoriaClienteModal';
import { CuentaCorrienteModal } from '../features/Clientes/CuentaCorrienteModal';
import { CuentasCorrientesResumenModal } from '../features/Clientes/CuentasCorrientesResumenModal';
import { useClientes } from '../hooks/useClientes';
import { SuccesModal } from '../components/layouts/SuccesModal';
import { ClienteFiltros } from '../features/Clientes/ClientesFiltros';

export const ClienteView = () => {
  const { clientes, registrar, cargar } = useClientes();
  const [paso, setPaso] = useState(0); 
  const [clienteConUbicacionSeleccionada, setClienteConUbicacionSeleccionada] = useState<any | null>(null);
  const [clienteAEditar, setClienteAEditar] = useState<any | null>(null);
  const [clienteCuentaCorriente, setClienteCuentaCorriente] = useState<any | null>(null);
  const [verCategoriasModal, setVerCategoriasModal] = useState<boolean>(false);
  const [verResumenCuentasModal, setVerResumenCuentasModal] = useState<boolean>(false);

  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('Sin Filtro');
  const [showSuccess, setShowSuccess] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<any>({
    nombre: '', apellido: '', email: '', numeroDocumento: '', telefono: '', 
    tipoDocumento: '1', calle: '', numero: '', piso: '', depto: '', 
    codPostal: '', ciudad: '', provincia: '', pais: 'Argentina',
    razonSocial: '', condicionDePago: 'Efectivo', limiteCredito: 0, personaDeContacto: ''
  });

  const handleRegistrarFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      razonSocial: formData.razonSocial, 
      saldoDeudor: 0, 
      limiteCredito: Number(formData.limiteCredito),
      estado: 'Activo', 
      personaDeContacto: formData.personaDeContacto, 
      condicionDePago: formData.condicionDePago,
      persona: {
        nombre: formData.nombre, apellido: formData.apellido, numeroDocumento: formData.numeroDocumento,
        telefono: formData.telefono, email: formData.email,
        tipoDocumento: { idTipoDocumento: parseInt(formData.tipoDocumento) || 1 },
        tipoPersona: { idTipoPersona: 1 }, 
        direccion: {
          calle: formData.calle, numero: formData.numero, piso: formData.piso || null,
          departamento: formData.depto || null, codigoPostal: formData.codPostal,
          ciudad: formData.ciudad, provincia: formData.provincia, pais: formData.pais
        }
      }
    };
    try { 
      await registrar(payload); 
      setMsgSuccess("El Cliente ha sido registrado con éxito");
      setShowSuccess(true); 
      setPaso(0); 
    } 
    catch (e: any) { alert("Error: " + e.message); }
  };

  const handleConfirmarEdicion = async (data: any) => {
    try { 
      await registrar(data); 
      setMsgSuccess("Cambios guardados correctamente");
      setShowSuccess(true); 
      setClienteAEditar(null); 
      setClienteConUbicacionSeleccionada(null); 
      cargar(); 
    }
    catch (e: any) { alert("Error: " + e.message); }
  };

  const clientesFiltrados = clientes.filter((c: any) => {
    if (c.id_cliente === 1) return false;
    if (filtroEstado !== 'Sin Filtro' && c.estado !== filtroEstado) return false;
    
    const busqueda = filtroTexto.toLowerCase().trim();
    if (!busqueda) return true;
    
    return (
      c.persona?.nombre?.toLowerCase().includes(busqueda) || 
      c.persona?.apellido?.toLowerCase().includes(busqueda) || 
      c.persona?.numeroDocumento?.includes(busqueda) || 
      c.razonSocial?.toLowerCase().includes(busqueda)
    );
  });

  const obtenerColorSaldo = (saldoDeudor: number, limiteCredito: number) => {
  const saldo = Math.abs(Number(saldoDeudor || 0));
  const limite = Number(limiteCredito || 0);
  if (saldo === 0) return 'text-success';
  if (limite <= 0) return 'text-danger';

  const porcentaje = (saldo / limite) * 100;

  if (porcentaje >= 100) {
    return 'text-danger'; 
  } else if (porcentaje >= 75) { 
    return 'text-warning'; 
  } else {
    return 'text-success'; 
  }
  };

  return (
    <>
      <div className="d-flex justify-content-center align-items-center mb-4 position-relative">
      <h1 className="fw-bold text-white mb-0 text-center" style={{ fontSize: '1.85rem' }}>Clientes</h1>
      <button type="button" className="btn btn-outline-info font-monospace position-absolute end-0" onClick={() => setVerCategoriasModal(true)}>
      <i className="bi bi-tag me-2"></i>Categorías de Clientes
      </button>
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

      <div className="table-responsive" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #3f3f46', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Nombre</th>
              <th style={{ padding: '12px' }}>Apellido</th>
              <th style={{ padding: '12px' }}>Documento</th>
              <th style={{ padding: '12px' }}>Razón Social</th>
              <th style={{ padding: '12px' }}>Cta. Cte.</th>
              <th style={{ padding: '12px' }}>Saldo Deudor</th>
              <th style={{ padding: '12px' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados && clientesFiltrados.length > 0 ? (
              clientesFiltrados.map((c: any) => {
                const tieneCtaCte = Number(c.limiteCredito || 0) > 0;

                return (
                  <tr 
                    key={c.id_cliente} 
                    style={{ borderBottom: '1px solid #2d2d30' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'} 
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '12px' }}>{c.id_cliente}</td>
                    <td style={{ padding: '12px' }}>{c.persona?.nombre}</td>
                    <td style={{ padding: '12px' }}>{c.persona?.apellido}</td>
                    <td style={{ padding: '12px' }}>{c.persona?.numeroDocumento}</td>
                    <td style={{ padding: '12px' }}>{c.razonSocial}</td>
                    
                    {/* Badge indicativo del estado de Cta Cte */}
                    <td style={{ padding: '12px' }}>
                      {tieneCtaCte ? (
                        <span className="badge bg-success font-monospace">Habilitada (${Number(c.limiteCredito).toFixed(0)})</span>
                      ) : (
                        <span className="badge bg-secondary font-monospace opacity-75">Sin Cta Cte</span>
                      )}
                    </td>

                    <td style={{ padding: '12px' }}>
                    <span className={`fw-bold ${obtenerColorSaldo(c.saldoDeudor, c.limiteCredito)}`}>
                    ${Number(c.saldoDeudor || 0).toFixed(2)}
                    </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${c.estado === 'Activo' ? 'bg-success' : 'bg-danger'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div className="d-flex justify-content-center gap-2">
                        {/* Botón de Cuenta Corriente */}
                        <button 
                          className={`btn btn-sm d-flex align-items-center justify-content-center ${
                            tieneCtaCte ? 'btn-outline-success' : 'btn-outline-secondary opacity-50'
                          }`} 
                          style={{ width: '32px', height: '32px' }} 
                          title={tieneCtaCte ? "Gestionar Cuenta Corriente" : "Sin Cta. Cte. (Haz clic para asignar límite)"} 
                          onClick={() => setClienteCuentaCorriente(c)}
                        >
                          <i className="bi bi-wallet2"></i>
                        </button>

                        <button 
                          className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center" 
                          style={{ width: '32px', height: '32px' }} 
                          title="Modificar Cliente" 
                          onClick={() => setClienteAEditar(c)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        
                        <button 
                         className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center" 
                         style={{ width: '32px', height: '32px' }} 
                         title="Ver Ubicación" 
                         onClick={() => setClienteConUbicacionSeleccionada(c)}
                        >
                        <i className="bi bi-house-door"></i>
                        </button>
                        
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="text-center text-white py-5">
                  <i className="bi display-6 d-block mb-2 text-secondary"></i>
                  No se han Registrado o Encontrado Clientes en el sistema
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Barra Inferior de Acciones */}
      <div className="d-flex justify-content-between align-items-center w-100 mt-4">
        <button onClick={() => navigate('/dashboard')} className="btn btn-danger" style={{ borderRadius: '6px' }}>
          Volver
        </button>

        <div className="d-flex gap-2">
          {/* Botón para ver el Resumen de todas las Cuentas Corrientes Activas */}
          <button 
            className="btn btn-outline-warning font-monospace fw-bold d-flex align-items-center gap-2"
            onClick={() => setVerResumenCuentasModal(true)}
          >
            <i className="bi bi-wallet2"></i> Ver Cuentas Corrientes Activas
          </button>

          <button className="btn btn-success" onClick={() => setPaso(1)}>
            Registrar Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Modales de Flujo de Registro y Edición */}
      {paso === 1 && (
        <div className="modal d-block" style={{background:'rgba(0,0,0,0.8)'}}>
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-white p-4">
              <PersonaForm formData={formData} setFormData={setFormData} onSiguiente={() => setPaso(2)} onVolver={() => setPaso(0)} />
            </div>
          </div>
        </div>
      )}
      {paso === 2 && <ClienteExtraForm formData={formData} setFormData={setFormData} onRegistrar={handleRegistrarFinal} onCerrar={() => setPaso(1)} />}
      {clienteAEditar && <ClienteEditModal cliente={clienteAEditar} onCerrar={() => setClienteAEditar(null)} onConfirmar={handleConfirmarEdicion} />}
      {clienteConUbicacionSeleccionada && <UbicacionViewModal cliente={clienteConUbicacionSeleccionada} onCerrar={() => setClienteConUbicacionSeleccionada(null)} onConfirmar={handleConfirmarEdicion} />}
      
      {/* Modal de Configurar Categorías */}
      {verCategoriasModal && <CategoriaClienteModal onCerrar={() => setVerCategoriasModal(false)} />}
      
      {/* Modal Resumen de Cuentas Corrientes Activas */}
      {verResumenCuentasModal && (
        <CuentasCorrientesResumenModal 
          clientes={clientes} 
          onCerrar={() => setVerResumenCuentasModal(false)} 
          onSeleccionarCliente={(cliente) => setClienteCuentaCorriente(cliente)}
        />
      )}

      {/* Modal Individual de Cuenta Corriente */}
      {clienteCuentaCorriente && (
        <CuentaCorrienteModal 
          cliente={clienteCuentaCorriente} 
          onCerrar={() => setClienteCuentaCorriente(null)} 
          onActualizar={() => {
            cargar();
            setClienteCuentaCorriente(null);
          }} 
        />
      )}
    </>
  );
};