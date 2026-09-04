import React, { useState, useEffect } from 'react';

interface Props {
  fechaEstimadaIso: string | null | undefined;
}

export const ContadorTiempo: React.FC<Props> = ({ fechaEstimadaIso }) => {
  const [textoContador, setTextoContador] = useState<string>('-');
  const [esVencido, setEsVencido] = useState<boolean>(false);

  useEffect(() => {
    if (!fechaEstimadaIso) {
      setTextoContador('-');
      return;
    }

    const calcularDiferencia = () => {
      const ahora = new Date().getTime();
      const entrega = new Date(fechaEstimadaIso).getTime();

      if (isNaN(entrega)) {
        setTextoContador('-');
        return;
      }

      const difMs = entrega - ahora;
      const absolutoMs = Math.abs(difMs);

      const dias = Math.floor(absolutoMs / (1000 * 60 * 60 * 24));
      const horas = Math.floor((absolutoMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((absolutoMs % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((absolutoMs % (1000 * 60)) / 1000);

      let stringTiempo = '';
      if (dias > 0) stringTiempo += `${dias}d `;
      stringTiempo += `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

      if (difMs < 0) {
        setEsVencido(true);
        setTextoContador(`+${stringTiempo}`);
      } else {
        setEsVencido(false);
        setTextoContador(`-${stringTiempo}`);
      }
    };

    calcularDiferencia();
    const interval = setInterval(calcularDiferencia, 1000);

    return () => clearInterval(interval);
  }, [fechaEstimadaIso]);

  if (!fechaEstimadaIso) return <span>-</span>;

  return (
    <span
      className={`font-monospace fw-bold d-inline-flex align-items-center gap-1 ${
        esVencido ? 'text-danger' : 'text-success'
      }`}
      style={{ fontSize: '0.78rem' }}
      title={esVencido ? 'Tiempo de entrega excedido' : 'Tiempo restante para la entrega'}
    >
      <i className={`bi ${esVencido ? 'bi-exclamation-triangle-fill' : 'bi-clock-history'}`}></i>
      {textoContador}
    </span>
  );
};