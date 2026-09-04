import { useState } from 'react';

export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export function useFiltrosFecha(
  fechaInicial: string,
  onRangoSeleccionado?: (desde: string, hasta: string) => void
) {
  const [fechaDesdeInput, setFechaDesdeInput] = useState(fechaInicial);
  const [fechaHastaInput, setFechaHastaInput] = useState(fechaInicial);
  const [fechaDesde, setFechaDesde] = useState(fechaInicial);
  const [fechaHasta, setFechaHasta] = useState(fechaInicial);

  const aplicarRango = (desde: string, hasta: string) => {
    setFechaDesdeInput(desde);
    setFechaHastaInput(hasta);
    setFechaDesde(desde);
    setFechaHasta(hasta);
    onRangoSeleccionado?.(desde, hasta);
  };

  const confirmarRangoActual = () => {
    setFechaDesde(fechaDesdeInput);
    setFechaHasta(fechaHastaInput);
  };

  const handleSeleccionarHoy = () => {
    const hoyStr = formatDateForInput(new Date());
    aplicarRango(hoyStr, hoyStr);
  };

  const handleSeleccionarEstaSemana = () => {
    const hoyObj = new Date();
    const hace6Dias = new Date(hoyObj);
    hace6Dias.setDate(hace6Dias.getDate() - 6);
    aplicarRango(formatDateForInput(hace6Dias), formatDateForInput(hoyObj));
  };

  const handleSeleccionarEsteMes = () => {
    const hoyObj = new Date();
    const primerDiaMes = new Date(hoyObj.getFullYear(), hoyObj.getMonth(), 1);
    aplicarRango(formatDateForInput(primerDiaMes), formatDateForInput(hoyObj));
  };

  return {
    fechaDesdeInput,
    fechaHastaInput,
    fechaDesde,
    fechaHasta,
    setFechaDesdeInput,
    setFechaHastaInput,
    confirmarRangoActual,
    handleSeleccionarHoy,
    handleSeleccionarEstaSemana,
    handleSeleccionarEsteMes,
  };
}
