import React, { createContext, useState, useEffect, useContext } from 'react';

const TurnoContext = createContext<any>(null);

export const TurnoProvider = ({ children }: { children: React.ReactNode }) => {
  const [cajaAbierta, setCajaAbierta] = useState(() => {
    const saved = localStorage.getItem('cajaAbierta');
    return saved === 'true';
  });
  const [turnoActivoId, setTurnoActivoId] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('cajaAbierta', String(cajaAbierta));
  }, [cajaAbierta]);

  useEffect(() => {
    const verificarEstadoCaja = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/turnos/estado-caja');
        if (res.ok) {
          const data = await res.json();
          const estadoReal = data.estado === "ABIERTO";
          setCajaAbierta(estadoReal);
          setTurnoActivoId(data.turnoId || null);
          localStorage.setItem('cajaAbierta', String(estadoReal));
        }
      } catch (error) {
        console.error("Error al verificar el estado de la caja en DB:", error);
      }
    };

    verificarEstadoCaja();
  }, []);

  return (
    <TurnoContext.Provider value={{ cajaAbierta, setCajaAbierta, turnoActivoId, setTurnoActivoId }}>
      {children}
    </TurnoContext.Provider>
  );
};

export const useTurno = () => useContext(TurnoContext);