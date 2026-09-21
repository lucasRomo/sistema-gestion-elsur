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
  const [errorRangoFechas, setErrorRangoFechas] = useState<string | null>(null);

  const aplicarRango = (desde: string, hasta: string) => {
    setErrorRangoFechas(null);
    setFechaDesdeInput(desde);
    setFechaHastaInput(hasta);
    setFechaDesde(desde);
    setFechaHasta(hasta);
    onRangoSeleccionado?.(desde, hasta);
  };

  const confirmarRangoActual = (): boolean => {
    if (!fechaDesdeInput || !fechaHastaInput) {
      setErrorRangoFechas('Debe indicar ambas fechas del rango.');
      return false;
    }
    if (fechaDesdeInput > fechaHastaInput) {
      setErrorRangoFechas('La fecha "Desde" no puede ser posterior a la fecha "Hasta".');
      return false;
    }
    setErrorRangoFechas(null);
    setFechaDesde(fechaDesdeInput);
    setFechaHasta(fechaHastaInput);
    return true;
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
    errorRangoFechas,
    setFechaDesdeInput,
    setFechaHastaInput,
    confirmarRangoActual,
    handleSeleccionarHoy,
    handleSeleccionarEstaSemana,
    handleSeleccionarEsteMes,
  };
}
