import React, { useEffect, useState } from 'react';
import type { Pedido } from '../../types/Pedido';
import { pedidoService } from '../../services/pedidoService';

export const PedidosPendientesCard: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    const cargarPedidosPendientes = async () => {
      try {
        // 1. Obtener datos del usuario logueado desde LocalStorage
        const usuarioJson = localStorage.getItem('usuario_logueado');
        let esAdmin = false;
        let idUsuarioLogueado: number | null = null;
        let nombreUsuarioLogueado: string = '';

        if (usuarioJson) {
          const uObj = JSON.parse(usuarioJson);
          
          // Detectar Admin
          const rolString = JSON.stringify(uObj).toUpperCase();
          esAdmin = rolString.includes('"ADMIN"') || rolString.includes('ROLE_ADMIN') || uObj?.rol === 'ADMIN';

          idUsuarioLogueado = uObj.idUsuario || uObj.id_usuario || uObj.id || null;
          nombreUsuarioLogueado = (uObj.nombreUsuario || uObj.nombre || '').toLowerCase().trim();
        }

        // 2. Traer todos los pedidos desde el backend
        const lista: any[] = await pedidoService.obtenerTodos();

        // 3. Filtrar estados activos (igual que la vista del Taller)
        const estadosInactivos = ['FINALIZADO', 'ENTREGADO', 'COMPLETADO', 'CANCELADO', 'PRESUPUESTO'];
        
        let activos = lista.filter(p => {
          const obs = (p.observaciones || p.observacion || '').toLowerCase();
          const estante = (p.ubicacion_estante || p.estante || '').toLowerCase();
          if (obs.includes('venta rápida') || estante.includes('venta rápida')) {
            return false;
          }

          const estadoActual = (p.estado || '').toString().toUpperCase();
          return !estadosInactivos.includes(estadoActual);
        });

        // 4. Aplicar restricción si NO es Admin
        if (!esAdmin) {
          activos = activos.filter(p => {
            // Extraer la última asignación del pedido (tal cual FilaPedido.tsx)
            const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0
              ? p.asignaciones[p.asignaciones.length - 1]
              : null;

            const empleado = ultimaAsignacion?.empleado || p.empleado;
            if (!empleado) return false;

            // Extraer IDs y nombres del empleado
            const idEmp = empleado.idEmpleado || empleado.id_empleado || empleado.idUsuario || empleado.id;
            const personaEmp = empleado.persona;
            
            const nombreCompletoEmp = personaEmp 
              ? `${personaEmp.nombre} ${personaEmp.apellido}`.toLowerCase()
              : (empleado.nombre || '').toLowerCase();

            // Match por ID de Usuario o por Coincidencia de Nombre ("Pepe")
            const coincideId = idUsuarioLogueado && Number(idEmp) === Number(idUsuarioLogueado);
            const coincideNombre = nombreUsuarioLogueado && nombreCompletoEmp.includes(nombreUsuarioLogueado);

            return coincideId || coincideNombre;
          });
        }

        setPedidos(activos);
      } catch (error) {
        console.error("Error al cargar pedidos pendientes:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarPedidosPendientes();
  }, []);

  return (
    <div 
      className="card p-3 shadow-sm h-100 d-flex flex-column" 
      style={{ 
        backgroundColor: '#1E1E1F', 
        border: '1px solid #3f3f46', 
        borderRadius: '12px'
      }}
    >
      <h6 className="fw-bold mb-3 font-monospace text-light d-flex align-items-center gap-2">
        <i className="bi bi-clock-history text-info"></i>
        Pedidos Pendientes:
      </h6>

      {cargando ? (
        <div className="text-center py-3 text-secondary small font-monospace my-auto">
          Cargando pedidos...
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-3 text-success small font-monospace my-auto">
          <i className="bi bi-check-all me-1"></i> No hay pedidos pendientes
        </div>
      ) : (
        <div 
  className="d-flex flex-column gap-2 pe-1" 
  style={{ 
    maxHeight: '140px', 
    overflowY: 'auto',
    overflowX: 'hidden'
  }}
>
          {pedidos.map((pedido: any) => {
            const id = pedido.id_pedido || pedido.idPedido;
            const clienteNombre = pedido.cliente?.persona 
              ? `${pedido.cliente.persona.nombre} ${pedido.cliente.persona.apellido}`
              : (pedido.cliente?.razon_social || pedido.cliente?.nombre || 'Consumidor Final');

            return (
              <div 
                key={id} 
                className="d-flex justify-content-between align-items-center px-3 py-2 rounded flex-shrink-0"
                style={{ backgroundColor: '#27272a', fontSize: '0.85rem' }}
              >
                <div className="d-flex flex-column">
                  <span className="text-white font-monospace fw-semibold">
                    #{id} - {clienteNombre}
                  </span>
                  <span className="text-secondary small font-monospace">
                    Entrega: {pedido.fecha_entrega_estimada ? new Date(pedido.fecha_entrega_estimada).toLocaleDateString() : 'Sin fecha'}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="badge bg-warning text-dark font-monospace">
                    {pedido.estado || 'PENDIENTE'}
                  </span>
                  <span className="font-monospace fw-bold text-info">
                    ${pedido.monto_total || pedido.montoTotal || 0}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};