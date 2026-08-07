import React, { useState, useEffect } from 'react';
import { useTheme } from '../../Context/ThemeContext';

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
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // --- VARIABLES ADAPTATIVAS SEGÚN EL TEMA ---
  const modalBg = isDark ? '#18181b' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? '#e4e4e7' : '#334155';
  
  const inputBg = isDark ? '#27272a' : '#f8fafc';
  const inputBorder = isDark ? '#52525b' : '#cbd5e1';
  const inputTextColor = isDark ? '#ffffff' : '#0f172a';

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
            setPedidosPendientes(Array.isArray(data) ? data : []);
          } else {
            console.warn(`El endpoint devolvió un estado ${res.status}. Se desactiva el selector.`);
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
    <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div 
          className="modal-content shadow-lg p-4" 
          style={{ 
            backgroundColor: modalBg, 
            borderColor: modalBorder, 
            borderRadius: '14px',
            border: `1px solid ${modalBorder}` 
          }}
        >
          
          {/* Título */}
          <div className="modal-header border-0 justify-content-center pt-1 pb-2">
            <h3 className="fw-bold m-0" style={{ color: textColor, letterSpacing: '0.5px' }}>
              Nuevo Movimiento de Caja
            </h3>
          </div>

          <div className="modal-body border-0 position-relative py-3">
            {/* Marca de agua GestaPro optimizada */}
            <div 
              className="position-absolute start-50 top-50 translate-middle w-100 h-100 d-flex align-items-center justify-content-center pointer-events-none" 
              style={{ zIndex: 0, userSelect: 'none', opacity: isDark ? 0.08 : 0.04 }}
            >
              <span className="fw-bold" style={{ fontSize: '4.5rem', color: '#8e45e0' }}>{"{GestaPro}"}</span>
            </div>

            <div className="position-relative" style={{ zIndex: 1 }}>
              
              {/* Fecha */}
              <div className="mb-3">
                <label className="form-label small fw-bold mb-1" style={{ color: labelColor }}>
                  Fecha de Nuevo Movimiento de Caja
                </label>
                <input 
                  type="text" 
                  className="form-control fw-bold py-2 px-3" 
                  disabled 
                  value={fechaPlaceholder}
                  style={{ 
                    borderRadius: '8px', 
                    backgroundColor: isDark ? '#18181b' : '#e2e8f0', 
                    color: isDark ? '#a1a1aa' : '#64748b',
                    border: `1px solid ${inputBorder}`
                  }}
                />
              </div>

              {/* Tipo de Movimiento */}
              <div className="mb-3">
                <label className="form-label small fw-bold mb-1" style={{ color: labelColor }}>
                  Seleccione el Tipo de Movimiento
                </label>
                <select 
                  className="form-select py-2 px-3 fw-medium" 
                  style={{ 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    backgroundColor: inputBg,
                    color: inputTextColor,
                    border: `1px solid ${inputBorder}`
                  }}
                  value={tipoMovimiento}
                  onChange={(e) => setTipoMovimiento(e.target.value)}
                >
                  <option value="INGRESO">Ingreso</option>
                  <option value="EGRESO">Egreso</option>
                </select>
              </div>

              {/* Pedido Pendiente */}
              <div className="mb-3">
                <label className="form-label small fw-bold mb-1" style={{ color: labelColor }}>
                  En el caso de ser un Pedido Pendiente, seleccione el ID/Cliente:
                </label>
                <select 
                  className="form-select py-2 px-3 fw-medium" 
                  style={{ 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    backgroundColor: inputBg,
                    color: inputTextColor,
                    border: `1px solid ${inputBorder}`
                  }}
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
                <label className="form-label small fw-bold mb-1" style={{ color: labelColor }}>
                  Monto
                </label>
                <input 
                  type="number" 
                  placeholder="Ej: 2500.00" 
                  className="form-control py-2 px-3 fw-medium" 
                  style={{ 
                    borderRadius: '8px',
                    backgroundColor: inputBg,
                    color: inputTextColor,
                    border: `1px solid ${inputBorder}`
                  }}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>

              {/* Descripción */}
              <div className="mb-2">
                <label className="form-label small fw-bold mb-1" style={{ color: labelColor }}>
                  Descripción del Movimiento de Caja
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Venta de Caja de Lápices" 
                  className="form-control py-2 px-3 fw-medium" 
                  style={{ 
                    borderRadius: '8px',
                    backgroundColor: inputBg,
                    color: inputTextColor,
                    border: `1px solid ${inputBorder}`
                  }}
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                />
              </div>

            </div>
          </div>

          {/* Footer - Botones */}
<div className="modal-footer border-0 d-flex justify-content-between pt-3 px-0">
  <button 
    className="btn px-4 py-2 fw-bold border-0 shadow-sm" 
    style={{ backgroundColor: '#a52a2a', color: '#ffffff', borderRadius: '8px', width: '35%' }}
    onClick={onClose}
  >
    Cancelar
  </button>
  <button 
    className="btn px-4 py-2 fw-bold border-0 shadow-sm" 
    style={{ backgroundColor: '#2b7a3e', color: '#ffffff', borderRadius: '8px', width: '45%' }}
    onClick={handleSubmit}
  >
    Guardar Movimiento
  </button>
</div>

        </div>
      </div>
    </div>
  );
};