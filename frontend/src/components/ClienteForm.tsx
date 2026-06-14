import React, { useState } from 'react';
import type { Cliente } from '../types/Cliente';

export const ClienteForm = ({ onGuardar, onVolver }: { onGuardar: () => void, onVolver: () => void }) => {
  const [paso, setPaso] = useState(1);
  
  // Estado inicial ajustado para coincidir con la entidad Java
  const [formData, setFormData] = useState<Cliente>({
    razonSocial: '', 
    saldoDeudor: 0, 
    limiteCredito: 0, 
    estado: 'Activo',
    personaDeContacto: '', 
    condicionDePago: 'Efectivo',
    persona: { 
      nombre: '', 
      apellido: '', 
      email: '', 
      numeroDocumento: '', 
      telefono: '',
      tipoDocumento: { idTipoDocumento: 1 },
      tipoPersona: { idTipoPersona: 1 },
      direccion: { calle: '', numero: '', ciudad: '', provincia: '', pais: 'Argentina', codigoPostal: '' }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construimos el objeto plano y limpio que el backend espera
    const payload = {
      ...formData,
      persona: {
        ...formData.persona,
        tipoDocumento: { idTipoDocumento: formData.persona.tipoDocumento.idTipoDocumento },
        tipoPersona: { idTipoPersona: formData.persona.tipoPersona.idTipoPersona }
      }
    };

    try {
      const res = await fetch('http://localhost:8080/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        onGuardar();
      } else {
        const errorText = await res.text();
        alert("Error al guardar: " + errorText);
      }
    } catch (err) {
      console.error("Error de red:", err);
      alert("Error al conectar con el servidor.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-white p-3">
      {paso === 1 && (
        <div className="row g-3">
          <h5>1. Datos Personales</h5>
          <div className="col-6"><label>Nombre</label><input className="form-control" value={formData.persona.nombre} onChange={e => setFormData({...formData, persona: {...formData.persona, nombre: e.target.value}})} required/></div>
          <div className="col-6"><label>Apellido</label><input className="form-control" value={formData.persona.apellido} onChange={e => setFormData({...formData, persona: {...formData.persona, apellido: e.target.value}})} required/></div>
          <div className="col-6"><label>Email</label><input type="email" className="form-control" value={formData.persona.email} onChange={e => setFormData({...formData, persona: {...formData.persona, email: e.target.value}})} /></div>
          <div className="col-6"><label>Teléfono</label><input className="form-control" value={formData.persona.telefono} onChange={e => setFormData({...formData, persona: {...formData.persona, telefono: e.target.value}})} /></div>
        </div>
      )}

      {paso === 2 && (
        <div className="row g-3">
          <h5>2. Ubicación</h5>
          <div className="col-6"><label>Calle</label><input className="form-control" value={formData.persona.direccion.calle} onChange={e => setFormData({...formData, persona: {...formData.persona, direccion: {...formData.persona.direccion, calle: e.target.value}}})} /></div>
          <div className="col-2"><label>Nro</label><input className="form-control" value={formData.persona.direccion.numero} onChange={e => setFormData({...formData, persona: {...formData.persona, direccion: {...formData.persona.direccion, numero: e.target.value}}})} /></div>
          <div className="col-4"><label>Ciudad</label><input className="form-control" value={formData.persona.direccion.ciudad} onChange={e => setFormData({...formData, persona: {...formData.persona, direccion: {...formData.persona.direccion, ciudad: e.target.value}}})} /></div>
        </div>
      )}

      {paso === 3 && (
        <div className="row g-3">
          <h5>3. Datos Comerciales</h5>
          <div className="col-6"><label>Razón Social</label><input className="form-control" value={formData.razonSocial} onChange={e => setFormData({...formData, razonSocial: e.target.value})} /></div>
          <div className="col-6"><label>Condición de Pago</label>
            <select className="form-select" value={formData.condicionDePago} onChange={e => setFormData({...formData, condicionDePago: e.target.value})}>
              <option value="Efectivo">Efectivo</option>
              <option value="Credito">Crédito</option>
            </select>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between mt-4">
        {paso > 1 ? <button type="button" className="btn btn-secondary" onClick={() => setPaso(paso - 1)}>Anterior</button> : <button type="button" className="btn btn-danger" onClick={onVolver}>Cancelar</button>}
        {paso < 3 ? <button type="button" className="btn btn-primary" onClick={() => setPaso(paso + 1)}>Siguiente</button> : <button type="submit" className="btn btn-success">Finalizar</button>}
      </div>
    </form>
  );
};