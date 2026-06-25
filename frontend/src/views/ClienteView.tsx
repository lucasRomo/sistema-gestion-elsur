import React, { useState } from 'react';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { PersonaForm } from '../features/auth/PersonaForm';
import { ClienteExtraForm } from '../features/auth/ClienteExtraForm';
import { ClienteEditModal } from '../features/Clientes/ClienteEditModal';
import { UbicacionViewModal } from '../features/modals/UbicacionViewModal';
import { useClientes } from '../hooks/useClientes';

export const ClienteView = () => {
  const { clientes, registrar, cargar } = useClientes();
  const [paso, setPaso] = useState(0); 
  const [clienteConUbicacionSeleccionada, setClienteConUbicacionSeleccionada] = useState<any | null>(null);
  const [clienteAEditar, setClienteAEditar] = useState<any | null>(null);
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('Sin Filtro');

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
    try { await registrar(payload); alert("Registrado con éxito"); setPaso(0); } 
    catch (e: any) { alert("Error: " + e.message); }
  };

  const handleConfirmarEdicion = async (data: any) => {
    try { await registrar(data); alert("Actualizado"); setClienteAEditar(null); setClienteConUbicacionSeleccionada(null); cargar(); }
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold text-white font-monospace">Clientes</h1>
      </div>

      <div className="row g-3 mb-4 text-white">
        <div className="col-md-6">
          <input className="form-control bg-dark text-white" placeholder="Filtrar..." value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} />
        </div>
        <div className="col-md-6">
          <select className="form-select bg-dark text-white" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="Sin Filtro">Sin Filtro</option>
            <option value="Activo">Activo</option>
            <option value="Desactivado">Desactivado</option>
          </select>
        </div>
      </div>

      <div className="table-responsive" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
        <table className="table table-dark table-hover">
          <thead>
            <tr><th>ID</th><th>Nombre</th><th>Apellido</th><th>Doc</th><th>Tel</th><th>Razón Social</th><th>Estado</th><th>Opciones</th></tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((c: any) => (
              <tr key={c.idCliente}>
                <td>{c.idCliente}</td>
                <td>{c.persona?.nombre}</td>
                <td>{c.persona?.apellido}</td>
                <td>{c.persona?.numeroDocumento}</td>
                <td>{c.persona?.telefono}</td>
                <td>{c.razonSocial}</td>
                <td><span className={`badge ${c.estado === 'Activo' ? 'bg-success' : 'bg-danger'}`}>{c.estado}</span></td>
                <td>
                  <button className="btn btn-sm text-info" onClick={() => setClienteAEditar(c)}><i className="bi bi-pencil"></i></button>
                  <button className="btn btn-sm text-warning" onClick={() => setClienteConUbicacionSeleccionada(c)}><i className="bi bi-house"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn btn-success" onClick={() => setPaso(1)}>Registrar Nuevo</button>

      {paso === 1 && <div className="modal d-block" style={{background:'rgba(0,0,0,0.8)'}}><div className="modal-dialog"><div className="modal-content bg-dark text-white p-4"><PersonaForm formData={formData} setFormData={setFormData} onSiguiente={() => setPaso(2)} onVolver={() => setPaso(0)} /></div></div></div>}
      {paso === 2 && <ClienteExtraForm formData={formData} setFormData={setFormData} onRegistrar={handleRegistrarFinal} onCerrar={() => setPaso(1)} />}
      {clienteAEditar && <ClienteEditModal cliente={clienteAEditar} onCerrar={() => setClienteAEditar(null)} onConfirmar={handleConfirmarEdicion} />}
      {clienteConUbicacionSeleccionada && <UbicacionViewModal cliente={clienteConUbicacionSeleccionada} onCerrar={() => setClienteConUbicacionSeleccionada(null)} onConfirmar={handleConfirmarEdicion} />}
    </SidebarLayout>
  );
};