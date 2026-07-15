import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { SelectorProductosForm } from '../features/pedidos/SelectorProductosForm';
import { DetallesPedidoForm } from '../features/pedidos/DetallesPedidoForm';
import { useRegistrarPedido } from '../hooks/useRegistrarPedido';
import type { CartItem } from '../types/Pedido';

export const CrearPedidoView: React.FC = () => {
  const navigate = useNavigate();
  
  const { productos, clientes, empleados, enviarPedido } = useRegistrarPedido();
  
  const [paso, setPaso] = useState<number>(1);
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [suceso, setSuceso] = useState({ show: false, titulo: "", mensaje: "", tipo: "exito" });
  const [confirmarGuardado, setConfirmarGuardado] = useState(false);
  
  // Estados para almacenar temporalmente el payload y el archivo seleccionado antes de confirmar
  const [payloadTemporal, setPayloadTemporal] = useState<{ pedido: any; idEmpleado: number; idUsuario: number | null } | null>(null);
  const [fileTemporal, setFileTemporal] = useState<File | null>(null);

  const totalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  const handlePreGuardar = async (payloadEstructurado: { 
  pedido: any; 
  idEmpleado: number; 
  tipoPago: string; 
  fileComprobante?: File | null; 
}) => {
  // 1. Obtenemos el ID de usuario desde localStorage
  const idUsuarioLogueado = (() => {
    const usuarioJson = localStorage.getItem('usuario_logueado');
    if (usuarioJson) {
      try {
        const usuarioObj = JSON.parse(usuarioJson);
        return usuarioObj.idUsuario ? parseInt(usuarioObj.idUsuario) : null;
      } catch (e) {
        console.error("Error al parsear el usuario_logueado desde localStorage:", e);
      }
    }
    return null;
  })();

  // 2. Acoplamos de forma segura el usuario y el TIPO DE PAGO al payload que va al service
  const payloadConUsuario = {
    pedido: payloadEstructurado.pedido,
    idEmpleado: payloadEstructurado.idEmpleado,
    idUsuario: idUsuarioLogueado,
    tipoPago: payloadEstructurado.tipoPago // ➔ AGREGAMOS ESTA LÍNEA CLAVE
  };

  // Guardamos el estado temporal para que se lo envíe a ejecutarGuardadoFinal
  setPayloadTemporal(payloadConUsuario); 
  
  // Guardamos el archivo físico temporalmente
  setFileTemporal(payloadEstructurado.fileComprobante || null);
  setConfirmarGuardado(true); 
};

  // 2. Segundo paso: Al confirmar en el modal, se ejecuta el envío real a la API
  const ejecutarGuardadoFinal = async () => {
    if (!payloadTemporal) return;
    setConfirmarGuardado(false); 

    try {
      // ➔ Modificamos enviarPedido para que acepte tanto el payload como el archivo opcional
      const exito = await enviarPedido(payloadTemporal, fileTemporal);
      if (exito) {
        setSuceso({
          show: true,
          titulo: "¡Pedido Guardado!",
          mensaje: "Se ha creado el pedido exitosamente.",
          tipo: "exito"
        });
      }
    } catch (err: any) { 
      setSuceso({
        show: true,
        titulo: "Algo ha ido mal",
        mensaje: err.message || "Hubo un error al procesar el guardado del pedido.",
        tipo: "error"
      });
    }
  };

  const handleCerrarModalSuceso = () => {
    const eraExito = suceso.tipo === "exito";
    setSuceso({ ...suceso, show: false });
    if (eraExito) {
      navigate('/dashboard');
    }
  };

  return (
    <SidebarLayout activeItem="Crear Pedido">
      <div className="container-fluid min-vh-100 d-flex flex-column py-2">
        {paso === 1 ? (
          <SelectorProductosForm 
            productos={productos}
            carrito={carrito}
            setCarrito={setCarrito}
            onSiguiente={() => setPaso(2)}
            onCancelar={() => navigate('/dashboard')}
          />
        ) : (
          <DetallesPedidoForm 
            clientes={clientes}
            empleados={empleados}
            total={totalCarrito}
            carrito={carrito}
            onVolver={() => setPaso(1)}
            onGuardar={handlePreGuardar}
          />
        )}
      </div>

      {confirmarGuardado && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-white text-center" 
              style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px', fontFamily: 'monospace' }}
            >
              <i className="bi bi-question-circle fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Confirmar registro?</h5>
              <p className="small" style={{ color: '#a1a1aa' }}>
                {fileTemporal 
                  ? `¿Está listo para finalizar el Pedido con el comprobante "${fileTemporal.name}" adjunto?` 
                  : '¿Está listo para finalizar el Pedido?'}
              </p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button 
                  className="btn btn-sm px-3 text-white" 
                  style={{ borderRadius: '6px', backgroundColor: '#e22e2e', border: '1px solid #e22e2e' }} 
                  onClick={() => {
                    setConfirmarGuardado(false);
                    // No limpiamos el fileTemporal por si decide apretar volver y después confirmar sin cambiar nada
                  }}
                >
                  Volver
                </button>
                <button 
                  className="btn btn-sm px-3 text-white" 
                  style={{ borderRadius: '6px', backgroundColor: '#288f47', border: '1px solid #2e9225' }} 
                  onClick={ejecutarGuardadoFinal}
                >
                  Finalizar
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
              style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px', fontFamily: 'monospace' }}
            >
              <i className={`bi ${suceso.tipo === 'exito' ? 'bi-check-circle' : 'bi-x-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">{suceso.titulo}</h5>
              <p className="small" style={{ color: '#a1a1aa' }}>{suceso.mensaje}</p>
              <button 
                className={`btn ${suceso.tipo === 'exito' ? 'btn-success' : 'btn-danger'} btn-sm px-4 mt-3 fw-bold`}
                style={{ borderRadius: '6px' }}
                onClick={handleCerrarModalSuceso}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};