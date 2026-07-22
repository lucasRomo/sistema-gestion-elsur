import React, { createContext, useState, useEffect, useContext } from 'react';

const TurnoContext = createContext<any>(null);

export const TurnoProvider = ({ children }: { children: React.ReactNode }) => {
  const [cajaAbierta, setCajaAbierta] = useState<boolean>(() => {
    const saved = localStorage.getItem('cajaAbierta');
    return saved === 'true';
  });
  const [turnoActivoId, setTurnoActivoId] = useState<number | null>(null);

  // Función reutilizable para sincronizar el estado real con Spring Boot
  const verificarEstadoCaja = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/turnos/estado-caja');
      if (res.ok) {
        const text = await res.text();
        // Si el backend devuelve null o un string vacío, la caja está CERRADA
        if (!text || text === 'null') {
          setCajaAbierta(false);
          setTurnoActivoId(null);
          localStorage.setItem('cajaAbierta', 'false');
          return;
        }

        const data = JSON.parse(text);
        
        // Mapeo correcto de las propiedades que manda TurnoController.java
        const estaAbierta = data && data.estado === "ABIERTO";
        const idCorrecto = data ? (data.idTurno || data.id_turno) : null;

        setCajaAbierta(estaAbierta);
        setTurnoActivoId(idCorrecto);
        localStorage.setItem('cajaAbierta', String(estaAbierta));
      }
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