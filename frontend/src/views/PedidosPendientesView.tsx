import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { usePedidosPendientes } from '../hooks/usePedidosPendientes';
import { pedidoService } from '../services/pedidoService';
import { empleadoService } from '../services/empleadoService';
import { SuccesModal } from '../components/layouts/SuccesModal';
import { useTurno } from '../Context/TurnoContext';
import { ModalGestionarComprobantes } from '../features/pedidos/ModalGestionarComprobantes';


// Importación de Componentes Extraídos e Internos
import { FiltrosPedidos } from '../features/pedidos/components/FiltrosPedidos';
import { FilaPedido } from '../features/pedidos/components/FilaPedido'; 
import { ModalCambioEstado } from '../features/pedidos/ModalCambioEstado';
import { ModalRegistrarPago } from '../features/pedidos/ModalRegistrarPago';
import { VistaTicketModal } from '../features/pedidos/VistaTicketModal';

export const PedidosPendientesPage: React.FC = () => {
  const { pedidos, cargando, actualizarEstado, registrarPago } = usePedidosPendientes();
  const navigate = useNavigate();
  const { cajaAbierta } = useTurno();
  const [suceso, setSuceso] = useState({ show: false, titulo: "", mensaje: "", tipo: "exito" });
  const [pedidoGestionComprobanteSel, setPedidoGestionComprobanteSel] = useState<any | null>(null);
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  // Controles de Modales
  const [pedidoEstadoSel, setPedidoEstadoSel] = useState<any>(null);
  const [nuevoEstadoPendiente, setNuevoEstadoPendiente] = useState<string>('');
  const [pedidoPagoSel, setPedidoPagoSel] = useState<any>(null);
  const [verTicketPedido, setVerTicketPedido] = useState<any>(null);
  const [sucesoError, setSucesoError] = useState<{ show: boolean; mensaje: string }>({ show: false, mensaje: '' });
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [modalNotif, setModalNotif] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });
  const [confirmarDesvincular, setConfirmarDesvincular] = useState<{ show: boolean; idComprobante: number | null }>({
  show: false,
  idComprobante: null
});

  // Filtros de búsqueda estatales
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Handlers de Controladores
  const handleCambioEstadoCombo = (pedido: any, estadoDestino: string) => {
    setPedidoEstadoSel(pedido);
    setNuevoEstadoPendiente(estadoDestino);
  };

  useEffect(() => {
    const cargarEmpleados = async () => {
      try {
        const data = await empleadoService.obtenerTodos();
        setEmpleados(data);
      } catch (error) {
        console.error("Error al cargar empleados:", error);
      }
    };
    cargarEmpleados();
  }, []);

  // Handler para asignar empleado
  const handleCambioEmpleado = async (idPedido: number, idEmpleado: string) => {
  try {
    const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
    const idUsuarioActivo = userLogueado.idUsuario ?? userLogueado.id_usuario ?? userLogueado.id ?? 1;
    
    await (pedidoService as any).asignarEmpleado(idPedido, idEmpleado, idUsuarioActivo);
    
    setModalNotif({ show: true, msg: "El empleado ha sido asignado correctamente." });
  } catch (error) {
    console.error("Error al asignar:", error);
    alert("Error al asignar el empleado.");
  }
  };

  const confirmarCambioEstado = async (observaciones: string) => {
    if (!pedidoEstadoSel) return;
    const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
    const idUsuarioActivo = userLogueado.idUsuario ?? userLogueado.id_usuario ?? userLogueado.id;

    try {
      await actualizarEstado(
        pedidoEstadoSel.id_pedido,
        nuevoEstadoPendiente,
        pedidoEstadoSel.estado,
        observaciones,
        idUsuarioActivo
      );
    } catch (error: any) {
      console.error("Error al cambiar estado:", error);
      const mensajeOriginal = error.message || "";
      let mensajeAmigable = "Hubo un error al procesar el cambio de estado.";
      if (mensajeOriginal.toLowerCase().includes("stock") || mensajeOriginal.toLowerCase().includes("insuficiente")) {
        mensajeAmigable = "No hay Suficiente Stock para Completar o Entregar el Pedido, Por Favor Modifique el stock en la Ventana Productos para Continuar";
      } else {
        mensajeAmigable = mensajeOriginal;
      }

      setSucesoError({
        show: true,
        mensaje: mensajeAmigable
      });
    } finally {
      setPedidoEstadoSel(null);
      setNuevoEstadoPendiente('');
    }
  };

  const confirmarPago = async (tipoPago: string, monto: number, archivo: File | null) => {
    try {
      const formData = new FormData();
      
      // Creamos el JSON payload con la información
      const payload = {
        monto: monto,
        tipoPago: tipoPago,
        idUsuario: 1 // Cambia por tu usuario logueado dinámico si corresponde
      };

      // Adjuntamos el JSON como un blob de tipo application/json
      formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));

      // Si seleccionaron un archivo, lo adjuntamos al FormData
      if (archivo) {
        formData.append("comprobante", archivo);
      }

      const response = await fetch(`http://localhost:8080/api/pedidos/${pedidoPagoSel.id_pedido}/pagos`, {
        method: 'POST',
        // ¡IMPORTANTE!: No ponemos 'Content-Type' manual. El navegador se encarga.
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al procesar el pago");
      }

      setSuceso({ 
        show: true, 
        titulo: "Éxito", 
        mensaje: "Pago registrado correctamente", 
        tipo: "exito" 
      });
      
      setPedidoPagoSel(null);
      // Opcional: Ejecuta la función que recargue la lista de pedidos en vez de recargar la pestaña entera
      

    } catch (error: any) {
      console.error(error);
      setSuceso({
        show: true,
        titulo: "Error",
        mensaje: error.message || "Error al registrar el pago",
        tipo: "error"
      });
    }
  };

const handleVincularComprobante = async (idComprobante: number, archivo: File) => {
  try {
    const formData = new FormData();
    formData.append("comprobante", archivo);

    const response = await fetch(`http://localhost:8080/api/pedidos/comprobantes/${idComprobante}/archivo`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error("No se pudo subir el archivo.");

    const pedidoActualizado = await response.json();

    
    setPedidoGestionComprobanteSel(pedidoActualizado);

    

    setSuceso({ show: true, titulo: "Éxito", mensaje: "Comprobante vinculado", tipo: "exito" });
  } catch (error: any) {
    setSuceso({ show: true, titulo: "Error", mensaje: error.message, tipo: "error" });
  }
};

// Función para eliminar el comprobante (poner en null la url del archivo)
const handleEliminarComprobante = async (idComprobante: number) => {
  setConfirmarDesvincular({
    show: true,
    idComprobante
  });
};

// 2. Esta función se ejecuta cuando el usuario presiona "Desvincular" en tu nuevo modal
const ejecutarEliminarComprobante = async () => {
  const idComprobante = confirmarDesvincular.idComprobante;
  if (!idComprobante) return;

  // Cerramos el modal de confirmación inmediatamente
  setConfirmarDesvincular({ show: false, idComprobante: null });

  try {
    const response = await fetch(`http://localhost:8080/api/pedidos/comprobantes/${idComprobante}/archivo`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error("No se pudo eliminar el archivo.");

    const pedidoActualizado = await response.json();
    
    // Actualizamos el estado del modal de atrás
    setPedidoGestionComprobanteSel(pedidoActualizado);

    // Mostramos el modal de éxito final
    setSuceso({ 
      show: true, 
      titulo: "Éxito", 
      mensaje: "Comprobante desvinculado correctamente", 
      tipo: "exito" 
    });
  } catch (error: any) {
    setSuceso({ 
      show: true, 
      titulo: "Error", 
      mensaje: error.message, 
      tipo: "error" 
    });
  }
};


  const handleSubirArchivoFisico = async (idPedido: number, file: File) => {
    try {
      const ok = await pedidoService.subirComprobanteFisico(idPedido, file);
      if (ok) {
        alert('¡Comprobante guardado en el servidor con éxito!');
        window.location.reload();
      } else {
        alert('Error al intentar subir el archivo al servidor.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión con la API de Spring Boot.');
    }
  };

  const handleEliminarComprobanteFisico = async (idPedido: number) => {
    if (!window.confirm('¿Estás seguro de que querés eliminar el comprobante físico de este pedido?')) return;
    try {
      const ok = await pedidoService.eliminarComprobanteFisico(idPedido);
      if (ok) {
        alert('Comprobante eliminado con éxito.');
        window.location.reload();
      } else {
        alert('No se pudo eliminar el archivo.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de comunicación con el backend.');
    }
  };

  
  const pedidosFiltrados = pedidos.filter(p => {
    // 1. Excluir Venta Rápida
    const esVentaRapida = 
      p.observaciones?.toLowerCase().includes('venta rápida') || 
      p.observacion?.toLowerCase().includes('venta rápida') ||
      p.estante === 'Venta Rápida';

    if (esVentaRapida) return false;

    // 2. Filtro por Cliente
    const nombreCliente = p.cliente?.persona 
      ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido}`
      : (p.cliente?.razon_social || p.cliente?.nombre || 'Consumidor Final');
    const cumpleCliente = nombreCliente.toLowerCase().includes(filtroCliente.toLowerCase());
    if (!cumpleCliente) return false;

    // 3. Filtro por Estado
    if (filtroEstado === 'PRESUPUESTO') {
      if (p.estado !== 'PRESUPUESTO') return false;
    } else {
      if (p.estado === 'PRESUPUESTO') return false;
      if (filtroEstado !== '' && p.estado !== filtroEstado) return false;
    }

    // 4. Filtro por Empleado Asignado (Mapeado usando ultimaAsignacion)
    if (filtroEmpleado !== '') {
      const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0
        ? p.asignaciones[p.asignaciones.length - 1]
        : null;

      const idEmpleadoAsignado = ultimaAsignacion?.empleado?.idEmpleado || 
                                 ultimaAsignacion?.empleado?.id_empleado;

      if (filtroEmpleado === 'SIN_ASIGNAR') {
        if (idEmpleadoAsignado) return false;
      } else {
        if (String(idEmpleadoAsignado) !== String(filtroEmpleado)) return false;
      }
    }

    return true;
  });

  return (
    <SidebarLayout activeItem="Pedidos Pendientes">
      {/* Contenedor adaptado para ocupar el 100% real sin desbordar el viewport del navegador */}
      <div 
        className="container-fluid px-2 d-flex flex-column pt-3" 
        style={{ height: 'calc(100vh - 45px)', overflow: 'hidden' }}
      >
        
        {/* Título Principal - Con margen controlado y limpio */}
        <div className="d-flex justify-content-between align-items-center mb-2 d-print-none">
          <h1 className="fw-bold tracking-tight text-white m-0" style={{ fontSize: '1.85rem' }}>
            {filtroEstado === 'PRESUPUESTO' ? 'Presupuestos / Cotizaciones' : 'Cola de Producción Taller'}
          </h1>
          <span className="badge bg-dark border border-info text-info font-monospace">Datos en Tiempo Real</span>
        </div>

        {/* Panel de Filtros: Añadimos separación superior para que el título respire */}
        <div className="mt-3 mb-3">
          <FiltrosPedidos 
            filtroCliente={filtroCliente}
            setFiltroCliente={setFiltroCliente}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            filtroEmpleado={filtroEmpleado}
            setFiltroEmpleado={setFiltroEmpleado}
            empleados={empleados}
          />
        </div>

        {/* Tabla Principal: Maximiza su tamaño de forma controlada */}
        <div 
          className="d-flex flex-column flex-grow-1 overflow-hidden mb-2" 
          style={{ backgroundColor: '#1d1d1d', height: 'calc(100vh - 210px)' }}
        >
          <div 
            className="table-responsive flex-grow-1" 
            style={{ backgroundColor: '#1d1d1d', height: '100%', overflowY: 'auto' }}
          >
            <table 
              className="table-dark table-hover m-0 align-middle"
              style={{ width: '100%', borderCollapse: 'collapse', color: '#e4e4e7', backgroundColor: '#121214' }}
            >
              {/* thead con sticky top */}
              <thead 
                style={{ position: 'sticky', top: 0, backgroundColor: '#1d1d1d', zIndex: 1 }}
              >
                <tr style={{ backgroundColor: '#1d1d1d', borderBottom: '2px solid #27272a', color: '#a1a1aa', fontFamily: 'monospace', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 12px 12px 24px' }}>ID</th>
                  <th>Cliente</th>
                  <th style={{ padding: '3px' }}>Estante</th>
                  <th style={{ textAlign: 'left' }}>Contacto</th>
                  <th>Empleado Asignado</th> 
                  <th>Fecha Asignación</th>  
                  <th>Estado</th>
                  <th>Monto Total</th>
                  <th>Monto Abonado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={10} className="text-center py-5 text-muted font-monospace">
                      Consultando la base de datos PostgreSQL...
                    </td>
                  </tr>
                ) : pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-5 text-muted">
                      No se encontraron registros bajo este filtro.
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map((pedido) => (
                    <FilaPedido 
                      key={`pedido-row-${pedido.id_pedido}`}
                      pedido={pedido}
                      onCambioEstado={handleCambioEstadoCombo}
                      onSelectPago={setPedidoPagoSel}
                      onSelectTicket={setVerTicketPedido}
                      onSubirArchivo={handleSubirArchivoFisico}
                      onEliminarComprobante={handleEliminarComprobanteFisico}
                      empleados={empleados}
                      onCambioEmpleado={handleCambioEmpleado}
                      onSelectComprobantes={(p) => setPedidoGestionComprobanteSel(p)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botón Volver - Ajustado abajo al límite de la pantalla */}
        <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center pt-2 border-top border-secondary pb-1 mt-auto">
          <button onClick={() => navigate('/dashboard')} className="btn btn-danger px-4 py-2">Volver</button>
        </div>
      </div>

      {/* Renderizado Condicional de Modales */}
      {pedidoEstadoSel && (
        <ModalCambioEstado 
          pedido={pedidoEstadoSel}
          nuevoEstado={nuevoEstadoPendiente}
          onClose={() => { 
            setPedidoEstadoSel(null);
            setNuevoEstadoPendiente(''); 
          }}
          onConfirm={confirmarCambioEstado}
        />
      )}

      {pedidoPagoSel && (
        <ModalRegistrarPago 
          show={true}
          pedido={pedidoPagoSel}
          onClose={() => setPedidoPagoSel(null)}
          onConfirm={confirmarPago}
        />
      )}

      {verTicketPedido && (
        <VistaTicketModal 
          pedido={verTicketPedido}
          onClose={() => setVerTicketPedido(null)}
        />
      )}

      {pedidoGestionComprobanteSel && (
  <ModalGestionarComprobantes
    pedido={pedidoGestionComprobanteSel}
    onClose={() => setPedidoGestionComprobanteSel(null)}
    onVincularComprobante={handleVincularComprobante}
    onEliminarComprobante={handleEliminarComprobante} 
  />
)}

      {sucesoError.show && (
  <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
    <div className="modal-dialog modal-sm modal-dialog-centered">
      <div 
        className="modal-content p-4 text-white text-center" 
        style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px', fontFamily: 'monospace' }}
      >
        <i className="bi bi-x-circle fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
        <h5 className="fw-bold">Error por Falta de Stock</h5>
        <p className="small" style={{ color: '#a1a1aa' }}>{sucesoError.mensaje}</p>
        <button 
          className="btn btn-danger btn-sm px-4 mt-3 fw-bold"
          style={{ borderRadius: '6px' }}
          onClick={() => {
            setSucesoError({ show: false, mensaje: '' });
            window.location.reload();
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}

{confirmarDesvincular.show && (
  <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1100 }}>
    <div className="modal-dialog modal-sm modal-dialog-centered">
      <div 
        className="modal-content p-4 text-white text-center" 
        style={{ 
          border: '2px solid #dc3545', // Borde rojo de advertencia/peligro
          backgroundColor: '#1a1a1c', 
          borderRadius: '12px',
          fontFamily: 'monospace'
        }}
      >
        {/* Cruz de advertencia grande en lugar de tilde */}
        <i className="bi bi-x-circle fs-1 mb-2" style={{ color: '#dc3545' }}></i>
        
        <h5 className="fw-bold">¿Desvincular Comprobante?</h5>
        <p className="small" style={{ fontSize: '0.85rem' }}>
          ¿Estás seguro que querés desvincular este comprobante a este pedido?
        </p>

        <div className="d-flex gap-2 justify-content-center mt-3">
          <button 
            className="btn btn-sm btn-secondary fw-bold px-3"
            style={{ borderRadius: '6px' }}
            onClick={() => setConfirmarDesvincular({ show: false, idComprobante: null })}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-sm btn-danger fw-bold px-3"
            style={{ borderRadius: '6px' }}
            onClick={ejecutarEliminarComprobante}
          >
            Desvincular
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {suceso.show && (
  <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
    <div className="modal-dialog modal-sm modal-dialog-centered">
      <div 
        className="modal-content p-4 text-white text-center" 
        style={{ 
          border: `2px solid ${suceso.tipo === 'exito' ? '#8e45e0' : '#8e45e0'}`, 
          backgroundColor: '#1a1a1c', 
          borderRadius: '12px' 
        }}
      >
        <i className={`bi ${suceso.tipo === 'exito' ? 'bi-check-circle' : 'bi-x-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
        <h5 className="fw-bold">{suceso.titulo}</h5>
        <p className="small" style={{ color: '#a1a1aa' }}>{suceso.mensaje}</p>
        <button 
          className={`btn ${suceso.tipo === 'exito' ? 'btn-success' : 'btn-danger'} btn-sm px-4 mt-3 fw-bold`}
          onClick={() => {
            // 1. Cerramos el modal en el estado
            setSuceso({ ...suceso, show: false });
            
            // 2. Si la operación fue un éxito, recargamos la ventana para sincronizar todo
            if (suceso.tipo === 'exito') {
              window.location.reload();
            }
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}

      {modalNotif.show && (
        <SuccesModal 
          show={modalNotif.show} 
          message={modalNotif.msg} 
          onClose={() => {
            setModalNotif({ show: false, msg: '' });
            window.location.reload(); 
          }} 
        />
      )}
    </SidebarLayout>
  );
};