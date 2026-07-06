import React, { useState } from 'react';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { PersonaForm } from '../features/auth/PersonaForm';
import { ClienteExtraForm } from '../features/auth/ClienteExtraForm';
import { ClienteEditModal } from '../features/Clientes/ClienteEditModal';
import { UbicacionViewModal } from '../features/modals/UbicacionViewModal';
import { useClientes } from '../hooks/useClientes';
import { SuccesModal } from '../components/layouts/SuccesModal';
import { ClienteFiltros } from '../features/Clientes/ClientesFiltros';

export const ClienteView = () => {
  const { clientes, registrar, cargar } = useClientes();
  const [paso, setPaso] = useState(0); 
  const [clienteConUbicacionSeleccionada, setClienteConUbicacionSeleccionada] = useState<any | null>(null);
  const [clienteAEditar, setClienteAEditar] = useState<any | null>(null);
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('Sin Filtro');
  const [showSuccess, setShowSuccess] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState('');



  const [formData, setFormData] = useState<any>({
    nombre: '', apellido: '', email: '', numeroDocumento: '', telefono: '', 
    tipoDocumento: '1', calle: '', numero: '', piso: '', depto: '', 
    codPostal: '', ciudad: '', provincia: '', pais: 'Argentina',
    razonSocial: '', condicionDePago: 'Efectivo', limiteCredito: 0, personaDeContacto: ''
  });

  const handleRegistrarFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      razonSocial: formData.razonSocial, saldoDeudor: 0, limiteCredito: Number(formData.limiteCredito),
      estado: 'Activo', personaDeContacto: formData.personaDeContacto, condicionDePago: formData.condicionDePago,
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
      setShowSuccess(true); // <--- CAMBIO: Dispara el modal centralizado
      setPaso(0); 
    } 
    catch (e: any) { alert("Error: " + e.message); }
  };

  const handleConfirmarEdicion = async (data: any) => {
    try { 
      await registrar(data); 
      setMsgSuccess("Cambios guardados correctamente");
      setShowSuccess(true); // <--- CAMBIO: Dispara el modal centralizado
      setClienteAEditar(null); 
      setClienteConUbicacionSeleccionada(null); 
      cargar(); 
    }
    catch (e: any) { alert("Error: " + e.message); }
  };

  const clientesFiltrados = clientes.filter((c: any) => {

  if (c.idCliente === 1) return false;

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

  return (
    <SidebarLayout activeItem="Clientes">
      <div className="d-flex justify-content-center align-items-center mb-4 position-relative">
  <h1 className="fw-bold text-white font-monospace">Clientes</h1>
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

      <div className="table-responsive" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
  <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
    <thead>
      <tr style={{ borderBottom: '2px solid #3f3f46', textAlign: 'left' }}>
        <th style={{ padding: '12px' }}>ID</th>
        <th style={{ padding: '12px' }}>Nombre</th>
        <th style={{ padding: '12px' }}>Apellido</th>
        <th style={{ padding: '12px' }}>Documento</th>
        <th style={{ padding: '12px' }}>Teléfono</th>
        <th style={{ padding: '12px' }}>Razón Social</th>
        <th style={{ padding: '12px' }}>Estado</th>
        <th style={{ padding: '12px', textAlign: 'center' }}>Opciones</th>
      </tr>
    </thead>
    <tbody>
      {clientesFiltrados.map((c: any) => (
        <tr 
          key={c.idCliente} 
          style={{ borderBottom: '1px solid #2d2d30' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'} 
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <td style={{ padding: '12px' }}>{c.idCliente}</td>
          <td style={{ padding: '12px' }}>{c.persona?.nombre}</td>
          <td style={{ padding: '12px' }}>{c.persona?.apellido}</td>
          <td style={{ padding: '12px' }}>{c.persona?.numeroDocumento}</td>
          <td style={{ padding: '12px' }}>{c.persona?.telefono}</td>
          <td style={{ padding: '12px' }}>{c.razonSocial}</td>
          <td style={{ padding: '12px' }}>
            <span className={`badge ${c.estado === 'Activo' ? 'bg-success' : 'bg-danger'}`}>
              {c.estado}
            </span>
          </td>
          <td style={{ padding: '12px' }}>

            <div className="d-flex justify-content-center gap-2">
            <button className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="Modificar Cliente" onClick={() => setClienteAEditar(c)}><i className="bi bi-pencil-square"></i></button>
            <button className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', color: '#ffc107', borderColor: '#ffc107' }} title="Ver Ubicación" onClick={() => setClienteConUbicacionSeleccionada(c)}><i className="bi bi-house-door"></i></button>
            </div>
            
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      <button className="btn btn-success mt-4" onClick={() => setPaso(1)}>Registrar Nuevo Cliente</button>

      {paso === 1 && <div className="modal d-block" style={{background:'rgba(0,0,0,0.8)'}}><div className="modal-dialog"><div className="modal-content bg-dark text-white p-4"><PersonaForm formData={formData} setFormData={setFormData} onSiguiente={() => setPaso(2)} onVolver={() => setPaso(0)} /></div></div></div>}
      {paso === 2 && <ClienteExtraForm formData={formData} setFormData={setFormData} onRegistrar={handleRegistrarFinal} onCerrar={() => setPaso(1)} />}
      {clienteAEditar && <ClienteEditModal cliente={clienteAEditar} onCerrar={() => setClienteAEditar(null)} onConfirmar={handleConfirmarEdicion} />}
      {clienteConUbicacionSeleccionada && <UbicacionViewModal cliente={clienteConUbicacionSeleccionada} onCerrar={() => setClienteConUbicacionSeleccionada(null)} onConfirmar={handleConfirmarEdicion} />}
    </SidebarLayout>
  );
};