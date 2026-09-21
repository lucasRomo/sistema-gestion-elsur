import React, { useState, useEffect } from 'react';
import { GateScreen } from '../../features/primermenu/view/GateScreen'; 

const TOKEN_KEY = 'token_sesion';

export const PortonGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autorizado, setAutorizado] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    setAutorizado(!!localStorage.getItem(TOKEN_KEY));
    setVerificando(false);
  }, []);

  if (verificando) return null;
  if (!autorizado) return <GateScreen onAutorizado={() => setAutorizado(true)} />;
  return <>{children}</>;
};