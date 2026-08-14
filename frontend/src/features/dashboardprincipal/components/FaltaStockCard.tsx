import React, { useEffect, useState } from 'react';
import type { Insumo } from '../../insumos/types/Insumo';
import { getInsumosBajoStock } from '../../insumos/services/insumoService';
import { useTheme } from '../../../Context/ThemeContext';

export const FaltaStockCard: React.FC = () => {
  const [insumosCriticos, setInsumosCriticos] = useState<Insumo[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
      className="card p-3 h-100 d-flex flex-column" 
      style={{ 
        backgroundColor: isDark ? '#1E1E1F' : '#ffffff', 
        border: isDark ? '1px solid #3f3f46' : '1px solid #e2e8f0', 
        borderRadius: '12px',
        boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)'
      }}
    >
      <h6 className={`fw-bold mb-3 font-monospace d-flex align-items-center gap-2 ${isDark ? 'text-light' : 'text-dark'}`}>
        <i className="bi bi-exclamation-triangle-fill text-warning"></i>
        Falta de Stock:
      </h6>

      {cargando ? (
        <div className={`text-center py-3 small font-monospace my-auto ${isDark ? 'text-secondary' : 'text-muted'}`}>
          Cargando insumos...
        </div>
      ) : insumosCriticos.length === 0 ? (
        <div className="text-center py-3 text-success small font-monospace my-auto">
          <i className="bi bi-check-circle me-1"></i> Todo el stock está en niveles óptimos
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
          {insumosCriticos.map((insumo) => (
            <div 
              key={insumo.idInsumo} 
              className="d-flex justify-content-between align-items-center px-3 py-2 rounded flex-shrink-0"
              style={{ 
                backgroundColor: isDark ? '#27272a' : '#f8fafc', 
                border: isDark ? 'none' : '1px solid #e2e8f0',
                fontSize: '0.85rem' 
              }}
            >
              <span className={`font-monospace fw-semibold text-truncate me-2 ${isDark ? 'text-white' : 'text-dark'}`}>
                {insumo.nombreInsumo}
              </span>
              <div className="d-flex gap-3 flex-shrink-0">
                <span className={`font-monospace ${isDark ? 'text-secondary' : 'text-muted'}`}>
                  Límite: <strong className={isDark ? 'text-light' : 'text-dark'}>{insumo.stockMinimo}</strong>
                </span>
                <span className="font-monospace fw-bold" style={{ color: isDark ? '#ff4d4d' : '#dc2626' }}>
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