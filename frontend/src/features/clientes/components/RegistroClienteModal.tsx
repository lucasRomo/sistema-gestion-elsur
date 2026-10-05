import React, { useState } from 'react';
import { PersonaForm } from '../../auth/persona/view/PersonaForm';
import { ClienteExtraForm } from './ClienteExtraForm';
import { clienteService } from '../services/clienteService';
import { useTheme } from '../../../Context/ThemeContext';
import { showLoading, hideLoading } from '../../../config/loadingStore';
import { confirmarAccion, mostrarError } from '../../../config/dialogStore';

// Alta de cliente en dos pasos (datos personales y datos comerciales). Se usa desde la pantalla
// de Clientes y desde Crear Pedido, para no tener que salir del pedido si el cliente es nuevo.

const FORMULARIO_VACIO = {
  nombre: '', apellido: '', email: '', numeroDocumento: '', telefono: '',
  tipoDocumento: '1', calle: '', numero: '', piso: '', depto: '',
  codPostal: '', ciudad: '', provincia: '', pais: 'Argentina',
  razonSocial: '', condicionDePago: 'Efectivo', limiteCredito: 0, personaDeContacto: ''
};

interface Props {
  clientes: any[];
  onRegistrado: (clienteCreado: any | null) => void;
  onCerrar: () => void;
}

export const RegistroClienteModal: React.FC<Props> = ({ clientes, onRegistrado, onCerrar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [paso, setPaso] = useState<1 | 2>(1);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState<any>(FORMULARIO_VACIO);

  const handleRegistrarFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    if (!(await confirmarAccion(`¿Registrar al cliente "${formData.razonSocial || `${formData.nombre} ${formData.apellido}`.trim()}"?`, { titulo: 'Nuevo cliente', textoConfirmar: 'Registrar' }))) return;
    setGuardando(true);

    const payload = {
      razonSocial: formData.razonSocial || formData.nombre + ' ' + formData.apellido,
      saldoDeudor: 0,
      limiteCredito: Number(formData.limiteCredito) || 0,
      estado: 'Activo',
      personaDeContacto: formData.personaDeContacto || '',
      condicionDePago: formData.condicionDePago || 'Contado',
      persona: {
        nombre: formData.nombre,
        apellido: formData.apellido,
        numeroDocumento: formData.numeroDocumento,
        telefono: formData.telefono,
        email: formData.email,
        tipoDocumento: { idTipoDocumento: parseInt(formData.tipoDocumento) || 1 },
        tipoPersona: { idTipoPersona: 1 },
        direccion: {
          calle: formData.calle,
          numero: formData.numero,
          piso: formData.piso || '',
          departamento: formData.depto || '',
          codigoPostal: formData.codPostal,
          ciudad: formData.ciudad || 'Sin Especificar',
          provincia: formData.provincia || 'Sin Especificar',
          pais: formData.pais || 'Argentina'
        }
      }
    };

    showLoading('Registrando cliente...');
    try {
      const res = await clienteService.crearCliente(payload);
      const creado = await res.json().catch(() => null);
      setFormData(FORMULARIO_VACIO);
      onRegistrado(creado);
    } catch (err: any) {
      mostrarError('Error: ' + err.message);
    } finally {
      setGuardando(false);
      hideLoading();
    }
  };

  if (paso === 2) {
    return (
      <ClienteExtraForm
        formData={formData}
        setFormData={setFormData}
        onRegistrar={handleRegistrarFinal}
        onCerrar={() => setPaso(1)}
        guardando={guardando}
      />
    );
  }

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div
          className="modal-content p-4 shadow-lg"
          style={{
            backgroundColor: isDark ? '#1e1e24' : '#ffffff',
            color: isDark ? '#e4e4e7' : '#18181b',
            border: '1.5px solid #0e9c09'
          }}
        >
          <PersonaForm formData={formData} setFormData={setFormData} clientes={clientes} onSiguiente={() => setPaso(2)} onVolver={onCerrar} />
        </div>
      </div>
    </div>
  );
};
