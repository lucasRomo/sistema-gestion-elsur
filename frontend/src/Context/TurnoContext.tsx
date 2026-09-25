import React, { createContext, useState, useEffect, useContext } from 'react';
import { cajaService } from '../features/caja/services/cajaService';

const TurnoContext = createContext<any>(null);

export const TurnoProvider = ({ children }: { children: React.ReactNode }) => {
  const [cajaAbierta, setCajaAbierta] = useState<boolean>(() => {
    const saved = localStorage.getItem('cajaAbierta');
    return saved === 'true';
  });
  const [turnoActivoId, setTurnoActivoId] = useState<number | null>(null);

  const verificarEstadoCaja = async () => {
    try {
      const data = await cajaService.obtenerEstadoCaja();

      if (!data) {
        setCajaAbierta(false);
        setTurnoActivoId(null);
        localStorage.setItem('cajaAbierta', 'false');
        return;
      }

      const estaAbierta = data.estado === "ABIERTO";
      const idCorrecto = data.idTurno ?? (data as any).id_turno ?? null;

      setCajaAbierta(estaAbierta);
      setTurnoActivoId(idCorrecto);
      localStorage.setItem('cajaAbierta', String(estaAbierta));
    } catch (error) {
      console.error("Error al verificar el estado de la caja en DB:", error);
    }
  };

  useEffect(() => {
    verificarEstadoCaja();
  }, []);

  return (
    <TurnoContext.Provider 
      value={{ 
        cajaAbierta, 
        setCajaAbierta, 
        turnoActivoId, 
        setTurnoActivoId, 
        verificarEstadoCaja 
      }}
    >
      {children}
    </TurnoContext.Provider>
  );
};

export const useTurno = () => useContext(TurnoContext);