import { useState, useCallback } from 'react';
import { cajaService, cajaServiceExtended } from '../services/cajaService';
import type { DatosCompraInsumo } from '../components/ModalCompraInsumos';
import type { MovimientoCaja, DatosArqueo, NuevoMovimientoDTO, Turno } from '../services/cajaService';

export const useCaja = (setCajaAbierta: (val: boolean) => void) => {
  const [saldoCaja, setSaldoCaja] = useState<number>(0);
  const [ingresosTurno, setIngresosTurno] = useState<number>(0);
  const [egresosTurno, setEgresosTurno] = useState<number>(0);
  const [turnoActual, setTurnoActual] = useState<Turno | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [datosArqueo, setDatosArqueo] = useState<DatosArqueo | null>(null);

  const fetchTotales = useCallback(async (montoInicial: number = 0) => {
    const data = await cajaService.obtenerTotales();
    if (data) {
      setIngresosTurno(data.totalIngresos);
      setEgresosTurno(data.totalEgresos);
      setSaldoCaja(montoInicial + data.saldoActual);
    }
  }, []);

  const fetchMovimientos = useCallback(async () => {
    const data = await cajaService.obtenerMovimientosDia();
    setMovimientos(data);
  }, []);

  const inicializarCaja = useCallback(async () => {
    const data = await cajaService.obtenerEstadoCaja();
    if (data && data.estado === 'ABIERTO') {
      setCajaAbierta(true);
      setTurnoActual(data);
      await fetchMovimientos();
      await fetchTotales(data.montoInicial || 0);
    } else {
      setCajaAbierta(false);
      setTurnoActual(null);
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
    await fetchMovimientos();
    await fetchTotales(nuevoTurno.montoInicial || montoInicial);
  };

  const consultarArqueo = async () => {
    const data = await cajaService.obtenerDesgloseArqueo();
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
      categoria: data.tipoMovimiento === 'EGRESO' ? 'VARIOS' : 'VENTA',
      descripcion: data.concepto,
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
    await fetchMovimientos();
  };

  const comprarInsumo = async (datos: DatosCompraInsumo) => {
    await cajaServiceExtended.registrarCompraInsumo(datos);

    setSaldoCaja((prev) => prev - datos.montoTotal);
    setEgresosTurno((prev) => prev + datos.montoTotal);

    await fetchMovimientos();
  };

  const cerrarCaja = async (montoReal: number, observaciones?: string) => {
    if (!turnoActual) return false;
    await cajaService.cerrarTurno(turnoActual.idTurno, montoReal, observaciones);
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
    comprarInsumo,
    cerrarCaja
  };
};