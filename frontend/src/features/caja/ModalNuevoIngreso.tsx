import React, { useState, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (data: { 
    monto: string; 
    concepto: string; 
    tipoMovimiento: string; 
    idPedido: string | null 
  }) => void;
}

export const ModalNuevoIngreso: React.FC<ModalProps> = ({ isOpen, onClose, onGuardar }) => {
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState('INGRESO');
  const [idPedido, setIdPedido] = useState<string | null>(null);
  const [pedidosPendientes, setPedidosPendientes] = useState<any[]>([]);
  const [fechaPlaceholder, setFechaPlaceholder] = useState('');

  // Seteamos un formato de fecha dinámico para simular el comportamiento automático en el placeholder
  useEffect(() => {
    if (isOpen) {
      const hoy = new Date();
      const fechaFormato = `${hoy.getDate().toString().padStart(2, '0')}/${(hoy.getMonth() + 1).toString().padStart(2, '0')}/${hoy.getFullYear().toString().substring(2)} - ${hoy.toLocaleTimeString()}`;
      setFechaPlaceholder(`${fechaFormato}`);
      
      const cargarPedidosSelector = async () => {
        try {
          const res = await fetch('http://localhost:8080/api/pedidos/pendientes');
          if (res.ok) {
            const data = await res.json();
            // Nos aseguramos de que data sea una lista válida
            setPedidosPendientes(Array.isArray(data) ? data : []);
          } else {
            // Si el backend devuelve 400, 404, etc., lo manejamos con gracia sin romper nada
            console.warn(`El endpoint de pedidos devolvió un estado ${res.status}. Se desactiva temporalmente el selector.`);
            setPedidosPendientes([]); 
          }
        } catch (e) {
          console.error("Error cargando pedidos para el selector:", e);
          setPedidosPendientes([]);
        }
      };
      cargarPedidosSelector();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!monto || !concepto) {
      alert("Por favor complete el Monto y la Descripción.");
      return;
    }
    onGuardar({
      monto,
      concepto,
      tipoMovimiento,
      idPedido: idPedido === "no-pedido" ? null : idPedido
    });
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border border-secondary text-white p-4" style={{ backgroundColor: '#1e1e1f', borderRadius: '14px' }}>
          
          {/* Título */}
          <div className="modal-header border-0 justify-content-center pt-2">
            <h3 className="fw-bold font-monospace m-0" style={{ letterSpacing: '0.5px' }}>Nuevo Movimiento de Caja</h3>
          </div>

          <div className="modal-body border-0 position-relative py-3">
            {/* Opcional: El fondo con la marca de agua o logotipo "GestaPro" */}
            <div className="position-absolute start-50 top-50 translate-middle w-100 h-100 d-flex align-items-center justify-content-center opacity-25 pointer-events-none" style={{ zIndex: 0, userSelect: 'none' }}>
              <span className="fw-bold font-monospace text-purple" style={{ fontSize: '4.5rem', color: '#563d7c' }}>{"{GestaPro}"}</span>
            </div>

            <div className="position-relative" style={{ zIndex: 1 }}>
              
              {/* Fecha de Nuevo Movimiento de Caja */}
              <div className="mb-3">
                <label className="form-label text-light opacity-75 small fw-medium mb-2">Fecha de Nuevo Movimiento de Caja</label>
                <input 
                  type="text" 
                  className="form-control border-0 bg-white text-muted py-2 px-3" 
                  disabled 
                  placeholder={fechaPlaceholder}
                  style={{ borderRadius: '8px' }}
                />
              </div>

              {/* Seleccione el Tipo de Movimiento */}
              <div className="mb-3">
                <label className="form-label text-light opacity-75 small fw-medium mb-2">Seleccione el Tipo de Movimiento</label>
                <select 
                  className="form-select border-0 py-2 px-3 text-dark fw-normal" 
                  style={{ borderRadius: '8px', cursor: 'pointer' }}
                  value={tipoMovimiento}
                  onChange={(e) => setTipoMovimiento(e.target.value)}
                >
                  <option value="INGRESO">Ingreso</option>
                  <option value="EGRESO">Egreso</option>
                </select>
              </div>

              {/* En el caso de Ser un Pedido Pendiente */}
              <div className="mb-3">
                <label className="form-label text-light opacity-75 small fw-medium mb-2">En el caso de Ser un Pedido Pendiente, Seleccione el ID/Nombre del Cliente del Pedido:</label>
                <select 
                  className="form-select border-0 py-2 px-3 text-dark fw-normal" 
                  style={{ borderRadius: '8px', cursor: 'pointer' }}
                  onChange={(e) => setIdPedido(e.target.value)}
                  defaultValue="no-pedido"
                >
                  <option value="no-pedido">No es un Pedido</option>
                  {pedidosPendientes.map((p: any) => (
                    <option key={p.id_pedido} value={p.id_pedido}>
                      ID: {p.id_pedido} - {p.cliente?.persona?.nombre || 'Cliente'} {p.cliente?.persona?.apellido || ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div className="mb-3">
                <label className="form-label text-light opacity-75 small fw-medium mb-2">Monto</label>
                <input 
                  type="number" 
                  placeholder="Ej: $2500.00" 
                  className="form-control border-0 py-2 px-3 text-dark fw-normal" 
                  style={{ borderRadius: '8px' }}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>

              {/* Descripción del Movimiento de Caja */}
              <div className="mb-2">
                <label className="form-label text-light opacity-75 small fw-medium mb-2">Descripción Del Movimiento de Caja</label>
                <input 
                  type="text" 
                  placeholder="Ej: Venta de Caja de Lapices" 
                  className="form-control border-0 py-2 px-3 text-dark fw-normal" 
                  style={{ borderRadius: '8px' }}
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                />
              </div>

            </div>
          </div>

          {/* Footer - Botones */}
          <div className="modal-footer border-0 d-flex justify-content-between pt-3 px-3">
            <button 
              className="btn px-4 py-2 text-white fw-bold border-0" 
              style={{ backgroundColor: '#a63a3a', borderRadius: '8px', width: '35%' }}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              className="btn px-4 py-2 text-white fw-medium border-0" 
              style={{ backgroundColor: '#1e7e34', borderRadius: '8px', width: '45%' }}
              onClick={handleSubmit}
            >
              Guardar Movimiento de Caja
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};