import React, { useEffect, useState } from 'react';
import type { Insumo } from '../../types/Insumo';
import { getInsumosBajoStock } from '../../services/insumoService';

export const FaltaStockCard: React.FC = () => {
  const [insumosCriticos, setInsumosCriticos] = useState<Insumo[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    const cargarStockCritico = async () => {
      try {
        const datos = await getInsumosBajoStock();
        setInsumosCriticos(datos);
      } catch (error) {
        console.error("Error al cargar insumos con bajo stock:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarStockCritico();
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
        <i className="bi bi-exclamation-triangle-fill text-warning"></i>
        Falta de Stock:
      </h6>

      {cargando ? (
        <div className="text-center py-3 text-secondary small font-monospace my-auto">
          Cargando insumos...
        </div>
      ) : insumosCriticos.length === 0 ? (
        <div className="text-center py-3 text-success small font-monospace my-auto">
          <i className="bi bi-check-circle me-1"></i> Todo el stock está en niveles óptimos
        </div>
      ) : (
        /* 🚀 Ajustado a 140px para igualar la tarjeta de Pedidos Pendientes */
        <div 
          className="d-flex flex-column gap-2 pe-1" 
          style={{ 
            maxHeight: '140px', 
            overflowY: 'auto', 
            overflowX: 'hidden' 
          }}
        >
          {insumosCriticos.map((insumo) => (
            <div 
              key={insumo.idInsumo} 
              className="d-flex justify-content-between align-items-center px-3 py-2 rounded flex-shrink-0"
              style={{ backgroundColor: '#27272a', fontSize: '0.85rem' }}
            >
              <span className="text-white font-monospace fw-semibold text-truncate me-2">
                {insumo.nombreInsumo}
              </span>
              <div className="d-flex gap-3 flex-shrink-0">
                <span className="text-secondary font-monospace">
                  Límite: <strong className="text-light">{insumo.stockMinimo}</strong>
                </span>
                <span className="font-monospace fw-bold" style={{ color: '#ff4d4d' }}>
                  Cantidad: {insumo.stockActual}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};