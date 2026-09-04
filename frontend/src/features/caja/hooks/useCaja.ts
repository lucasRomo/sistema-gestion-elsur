import { useState, useCallback } from 'react';
import { cajaService, cajaServiceExtended } from '../services/cajaService';
import type { MovimientoCaja, DatosArqueo, NuevoMovimientoDTO, Turno } from '../services/cajaService';

export const useCaja = (setCajaAbierta: (val: boolean) => void) => {
  const [saldoCaja, setSaldoCaja] = useState<number>(0);
  const [ingresosTurno, setIngresosTurno] = useState<number>(0);
  const [egresosTurno, setEgresosTurno] = useState<number>(0);
  const [turnoActual, setTurnoActual] = useState<Turno | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [datosArqueo, setDatosArqueo] = useState<DatosArqueo | null>(null);

  const fetchTotales = useCallback(async (idTurno: number, montoInicial: number = 0) => {
  const data = await cajaService.obtenerTotalesPorTurno(idTurno);
  if (data) {
    setIngresosTurno(data.totalIngresos);
    setEgresosTurno(data.totalEgresos);
    setSaldoCaja(montoInicial + data.saldoActual);
  }
  }, []);

  const fetchMovimientos = useCallback(async (idTurno: number) => {
    const data = await cajaService.obtenerMovimientosPorTurno(idTurno);
    setMovimientos(data);
  }, []);

  const inicializarCaja = useCallback(async () => {
    const data = await cajaService.obtenerEstadoCaja();
    if (data && data.estado === 'ABIERTO') {
      setCajaAbierta(true);
      setTurnoActual(data);
      await fetchMovimientos(data.idTurno);
      await fetchTotales(data.idTurno, data.montoInicial || 0);
    } else {
      setCajaAbierta(false);
      setTurnoActual(null);
      setMovimientos([]);
    }
  }, [setCajaAbierta, fetchMovimientos, fetchTotales]);

  const abrirCaja = async (montoInicial: number) => {
    const nuevoTurno = await cajaService.abrirTurno(montoInicial);
    setTurnoActual(nuevoTurno);
    setCajaAbierta(true);
    setSaldoCaja(montoInicial);
    setIngresosTurno(0);
    setEgresosTurno(0);
    setMovimientos([]);
    await fetchMovimientos(nuevoTurno.idTurno);
    await fetchTotales(nuevoTurno.idTurno, nuevoTurno.montoInicial || montoInicial);
  };

  const consultarArqueo = async () => {
  if (!turnoActual) return null;
  const data = await cajaService.obtenerDesgloseArqueoPorTurno(turnoActual.idTurno);
  setDatosArqueo(data);
  return data;
  };

  const guardarMovimiento = async (data: NuevoMovimientoDTO) => {
    const usuarioGuardado = localStorage.getItem('usuario_logueado');
    const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    const idUsuario = usuarioObj?.idUsuario || usuarioObj?.id_usuario;

    if (!idUsuario) {
      throw new Error('No se detectó un usuario logueado activo.');
    }

    const pad = (num: number) => String(num).padStart(2, '0');
    const ahora = new Date();
    const fechaMomento = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;

    const nuevoMovimiento = {
    monto: Number(data.monto),
    tipoMovimiento: data.tipoMovimiento,
    categoria: data.categoria || (data.tipoMovimiento === 'EGRESO' ? 'VARIOS' : 'VENTA'), 
    descripcion: data.concepto,
    metodoPago: data.metodoPago, 
    comprobanteImagen: data.comprobanteImagen || null,
    usuario: { idUsuario },
    pedido: data.idPedido ? { idPedido: Number(data.idPedido) } : null,
    fecha: fechaMomento
    };

    await cajaService.guardarMovimiento(nuevoMovimiento);

    const montoNum = Number(data.monto);
    if (data.tipoMovimiento === 'INGRESO') {
      setSaldoCaja((prev) => prev + montoNum);
      setIngresosTurno((prev) => prev + montoNum);
    } else {
      setSaldoCaja((prev) => prev - montoNum);
      setEgresosTurno((prev) => prev + montoNum);
    }
    if (turnoActual) await fetchMovimientos(turnoActual.idTurno);
  };

  

  const ajustarMovimiento = async (
    movimientoOriginal: MovimientoCaja,
    montoAjuste: number,
    tipoAjuste: 'INGRESO' | 'EGRESO',
    motivo: string,
    metodoPago: string = 'EFECTIVO',
    comprobanteImagen?: string | null
  ) => {
    const usuarioGuardado = localStorage.getItem('usuario_logueado');
    const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    const idUsuario = usuarioObj?.idUsuario || usuarioObj?.id_usuario || 1;

    const idMovOriginal = movimientoOriginal.id_movimiento || movimientoOriginal.idMovimiento;

    const pad = (num: number) => String(num).padStart(2, '0');
    const ahora = new Date();
    const fechaMomento = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;

    const idPedidoRelacionado = movimientoOriginal.pedido?.idPedido || movimientoOriginal.pedido?.id_pedido;

    const contraMovimiento = {
      monto: Number(montoAjuste),
      tipoMovimiento: tipoAjuste,
      categoria: 'AJUSTE',
      descripcion: `[CORRECCIÓN Mov #${idMovOriginal || '-'}] ${motivo}`,
      metodoPago: metodoPago,
      comprobanteImagen: comprobanteImagen || null,
      usuario: { idUsuario },
      pedido: idPedidoRelacionado ? { idPedido: Number(idPedidoRelacionado) } : null,
      fecha: fechaMomento
    };

    await cajaService.guardarMovimiento(contraMovimiento);

    const montoNum = Number(montoAjuste);
    if (tipoAjuste === 'INGRESO') {
      setSaldoCaja((prev) => prev + montoNum);
      setIngresosTurno((prev) => prev + montoNum);
    } else {
      setSaldoCaja((prev) => prev - montoNum);
      setEgresosTurno((prev) => prev + montoNum);
    }

    if (turnoActual) await fetchMovimientos(turnoActual.idTurno);
  };

  const cerrarCaja = async (montoReal: number, observaciones?: string) => {
  if (!turnoActual) return false;

  const usuarioGuardado = localStorage.getItem('usuario_logueado');
  const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const idUsuario = usuarioObj?.idUsuario || usuarioObj?.id_usuario;

  await cajaService.cerrarTurno(turnoActual.idTurno, montoReal, observaciones, idUsuario);
  setCajaAbierta(false);
  setTurnoActual(null);
  setMovimientos([]);
  setSaldoCaja(0);
  setIngresosTurno(0);
  setEgresosTurno(0);
  return true;
  };

  return {
    saldoCaja,
    ingresosTurno,
    egresosTurno,
    turnoActual,
    movimientos,
    datosArqueo,
    inicializarCaja,
    abrirCaja,
    consultarArqueo,
    guardarMovimiento,
    ajustarMovimiento,
    cerrarCaja
  };
};