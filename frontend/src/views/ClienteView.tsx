import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { PersonaForm } from '../components/auth/PersonaForm';
import { ClienteExtraForm } from '../components/auth/ClienteExtraForm';
import { ClienteEditModal } from '../components/modals/ClienteEditModal';
import { UbicacionViewModal } from '../components/modals/UbicacionViewModal';

export const ClienteView = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [paso, setPaso] = useState(0); 
  const [clienteConUbicacionSeleccionada, setClienteConUbicacionSeleccionada] = useState<any | null>(null);
  const [clienteAEditar, setClienteAEditar] = useState<any | null>(null);
  
  // ESTADOS PARA LOS FILTROS
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('Sin Filtro');

  const [formData, setFormData] = useState<any>({
    nombre: '', apellido: '', email: '', numeroDocumento: '', telefono: '', 
    tipoDocumento: '1', calle: '', numero: '', piso: '', depto: '', 
    codPostal: '', ciudad: '', provincia: '', pais: 'Argentina',
    razonSocial: '', condicionDePago: 'Efectivo', limiteCredito: 0, personaDeContacto: ''
  });

  // 1. Cargar datos para la tabla
  const cargarClientes = () => {
    fetch('http://localhost:8080/api/clientes')
      .then(res => res.json())
      .then(data => setClientes(data))
      .catch(err => console.error("Error cargando tabla:", err));
  };

  useEffect(() => { cargarClientes(); }, []);

  // 2. Lógica de registro final (Alta)
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
        nombre: formData.nombre,
        apellido: formData.apellido,
        numeroDocumento: formData.numeroDocumento,
        telefono: formData.telefono,
        email: formData.email,
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
      const res = await fetch('http://localhost:8080/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert("Cliente registrado correctamente");
        setPaso(0);
        cargarClientes(); 
      } else {
        const err = await res.text();
        alert("Error al guardar: " + err);
      }
    } catch (e) { alert("Error de conexión"); }
  };

  // 3. Lógica para procesar la Actualización
  const handleConfirmarEdicion = async (clienteActualizado: any) => {
    try {
      const res = await fetch('http://localhost:8080/api/clientes', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteActualizado)
      });

      if (res.ok) {
        alert("Cliente actualizado correctamente");
        setClienteAEditar(null);
        setClienteConUbicacionSeleccionada(null);
        cargarClientes(); 
      } else {
        const err = await res.text();
        alert("Error al actualizar el cliente: " + err);
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor.");
    }
  };

  // LÓGICA DE FILTRADO COMBINADO
  const clientesFiltrados = clientes.filter((c: any) => {
    // 1. Filtro por Estado (Corregido a Desactivado)
    if (filtroEstado !== 'Sin Filtro' && c.estado !== filtroEstado) {
      return false;
    }

    // 2. Filtro por Texto (Busca en Nombre, Apellido, Documento o Razón Social)
    const busqueda = filtroTexto.toLowerCase().trim();
    if (busqueda !== '') {
      const nombre = (c.persona?.nombre || '').toLowerCase();
      const apellido = (c.persona?.apellido || '').toLowerCase();
      const documento = (c.persona?.numeroDocumento || '').toLowerCase();
      const razonSocial = (c.razonSocial || '').toLowerCase();

      return (
        nombre.includes(busqueda) || 
        apellido.includes(busqueda) || 
        documento.includes(busqueda) ||
        razonSocial.includes(busqueda)
      );
    }

    return true;
  });

  return (
    <SidebarLayout activeItem="Clientes">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white fw-bold m-0">Clientes</h2>
        <div className="text-secondary fs-4" style={{ cursor: 'pointer' }}>
          <i className="bi bi-question-circle"></i>
        </div>
      </div>

      {/* FILTROS SUPERIORES VINCULADOS A LOS ESTADOS */}
      <div className="row g-3 mb-4 align-items-center text-white">
        <div className="col-md-6 d-flex align-items-center gap-2">
          <label className="text-nowrap m-0 small text-secondary">Filtrar por Nombre:</label>
          <div className="input-group">
            <input 
              type="text" 
              className="form-control bg-dark border-secondary text-white" 
              placeholder="Filtrar por Nombre, Apellido, Documento o Razón Social..." 
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
            <span className="input-group-text bg-dark border-secondary text-secondary">
              {filtroTexto ? (
                <i className="bi bi-x-circle-fill text-muted" style={{ cursor: 'pointer' }} onClick={() => setFiltroTexto('')}></i>
              ) : (
                <i className="bi bi-search"></i>
              )}
            </span>
          </div>
        </div>
        <div className="col-md-6 d-flex align-items-center gap-2 justify-content-md-end">
          <label className="text-nowrap m-0 small text-secondary">Filtrar por Estado:</label>
          <select 
            className="form-select bg-dark border-secondary text-white style-select" 
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

      {/* CONTENEDOR DE TABLA */}
      <div className="table-responsive rounded-3 border border-secondary mb-4" style={{ maxHeight: '65vh', overflowY: 'auto', backgroundColor: '#18181b' }}>
        <table className="table table-dark table-hover m-0 align-middle text-center" style={{ fontSize: '0.85rem' }}>
          <thead className="table-active sticky-top bg-dark text-secondary" style={{ zIndex: 1 }}>
            <tr>
              <th>ID</th>
              <th>Nombre/Empr.</th>
              <th>Apellido</th>
              <th>Tipo Doc.</th>
              <th>N° Doc.</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Razón Social</th>
              <th>Persona Contacto</th>
              <th>Condicion de pago</th>
              <th>Estado</th>
              <th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((c: any) => (
              <tr key={c.idCliente}>
                <td>{c.idCliente}</td>
                <td>{c.persona?.nombre || '-'}</td>
                <td>{c.persona?.apellido || '-'}</td>
                <td>{c.persona?.tipoDocumento?.nombre || 'DNI'}</td>
                <td>{c.persona?.numeroDocumento || '-'}</td>
                <td>{c.persona?.telefono || '-'}</td>
                <td className="text-truncate" style={{ maxWidth: '120px' }}>{c.persona?.email || '-'}</td>
                <td>{c.razonSocial || '-'}</td>
                <td>{c.personaDeContacto || '-'}</td>
                <td>{c.condicionDePago || '-'}</td>
                <td>
                  <span className={`badge ${c.estado === 'Activo' ? 'text-success' : 'text-danger'}`}>
                    {c.estado}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2 justify-content-center">
                    <button className="btn btn-sm p-0 text-info fs-5" onClick={() => setClienteAEditar(c)} title="Editar Cliente">
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button className="btn btn-sm p-0 text-warning fs-5" onClick={() => setClienteConUbicacionSeleccionada(c)} title="Ver Ubicación">
                      <i className="bi bi-house-door"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={12} className="text-muted py-4">
                  {clientes.length === 0 
                    ? "No hay clientes registrados en el sistema." 
                    : "No se encontraron clientes que coincidan con los filtros."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* BARRA DE ACCIONES INFERIOR FIJA */}
      <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center pt-3 border-top border-secondary">
        <div>
          <button className="btn btn-danger px-4 py-2 fw-semibold" style={{ backgroundColor: '#b91c1c', border: 'none' }}>Volver</button>
        </div>
        <div className="d-flex flex-wrap gap-3">
          <button className="btn btn-warning text-dark px-3 py-2 fw-semibold" style={{ backgroundColor: '#ca8a04', border: 'none' }}>Ver Grupo de Descuentos</button>
          <button className="btn btn-primary px-3 py-2 fw-semibold" style={{ backgroundColor: '#1e3a8a', border: 'none' }}>Cuentas Corrientes</button>
          <button className="btn btn-success px-3 py-2 fw-semibold" style={{ backgroundColor: '#16a34a', border: 'none' }} onClick={() => setPaso(1)}>
            Registrar Nuevo Cliente
          </button>
          <button className="btn btn-outline-secondary px-3 py-2 text-white">
            <i className="bi bi-download"></i>
          </button>
        </div>
      </div>

      {/* MODALES DE REGISTRO */}
      {paso === 1 && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
           <div className="modal-dialog modal-lg modal-dialog-centered">
             <div className="modal-content bg-dark border-secondary p-4 text-white">
                <PersonaForm formData={formData} setFormData={setFormData} onSiguiente={() => setPaso(2)} onVolver={() => setPaso(0)} />
             </div>
           </div>
        </div>
      )}
      {paso === 2 && (
        <ClienteExtraForm formData={formData} setFormData={setFormData} onRegistrar={handleRegistrarFinal} onCerrar={() => setPaso(1)} />
      )}

      {/* MODAL MODULARIZADO DE UBICACIÓN */}
      {clienteConUbicacionSeleccionada && (
        <UbicacionViewModal 
          cliente={clienteConUbicacionSeleccionada} 
          onCerrar={() => setClienteConUbicacionSeleccionada(null)} 
          onConfirmar={handleConfirmarEdicion} 
        />
      )}

      {/* MODAL MODULARIZADO DE EDICIÓN DATOS */}
      {clienteAEditar && (
        <ClienteEditModal cliente={clienteAEditar} onCerrar={() => setClienteAEditar(null)} onConfirmar={handleConfirmarEdicion} />
      )}
    </SidebarLayout>
  );
};