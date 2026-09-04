import { useCallback, useState } from 'react';
import { pedidoService } from '../../pedidos/general/service/pedidoService';
import { cajaService, type MovimientoCaja, type Turno } from '../../caja/services/cajaService';
import { getProductos } from '../../productos/services/productoService';
import { informesService } from '../services/informesService';

export interface DatosInformesCargados {
  pedidosRaw: any[];
  movimientosCaja: MovimientoCaja[];
  mermasRaw: any[];
  deudoresRaw: any[];
  turnosRaw: Turno[];
  averiasRaw: any[];
  categoriasClienteRaw: any[];
}

export function useInformesData() {
  const [cargando, setCargando] = useState(false);
  const [pedidosRaw, setPedidosRaw] = useState<any[]>([]);
  const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCaja[]>([]);
  const [listaProductos, setListaProductos] = useState<any[]>([]);
  const [mermasRaw, setMermasRaw] = useState<any[]>([]);
  const [deudoresRaw, setDeudoresRaw] = useState<any[]>([]);
  const [turnosRaw, setTurnosRaw] = useState<Turno[]>([]);
  const [averiasRaw, setAveriasRaw] = useState<any[]>([]);
  const [categoriasClienteRaw, setCategoriasClienteRaw] = useState<any[]>([]);

  const cargarDatos = useCallback(async (
    incluirProductos = false,
    mensajeError = 'Error al cargar los informes'
  ): Promise<DatosInformesCargados | null> => {
    setCargando(true);
    try {
      const [pedidos, caja, productos, mermas, deudores, turnos, averias, categorias] = await Promise.all([
        pedidoService.obtenerTodos(),
        cajaService.obtenerTodos(),
        incluirProductos ? getProductos() : Promise.resolve(null),
        informesService.obtenerMermas(),
        informesService.obtenerResumenDeudores(),
        cajaService.obtenerTodosLosTurnos(),
        informesService.obtenerAverias(),
        informesService.obtenerCategoriasCliente(),
      ]);

      const pedidosValidos = pedidos || [];
      const cajaValida = caja || [];
      const turnosValidos = turnos || [];

      setPedidosRaw(pedidosValidos);
      setMovimientosCaja(cajaValida);
      if (incluirProductos) setListaProductos(productos || []);
      setMermasRaw(mermas);
      setDeudoresRaw(deudores);
      setTurnosRaw(turnosValidos);
      setAveriasRaw(averias);
      setCategoriasClienteRaw(categorias);

      return {
        pedidosRaw: pedidosValidos,
        movimientosCaja: cajaValida,
        mermasRaw: mermas,
        deudoresRaw: deudores,
        turnosRaw: turnosValidos,
        averiasRaw: averias,
        categoriasClienteRaw: categorias,
      };
    } catch (error) {
      console.error(mensajeError, error);
      return null;
    } finally {
      setCargando(false);
    }
  }, []);

  return {
    cargando,
    pedidosRaw,
    movimientosCaja,
    listaProductos,
    mermasRaw,
    deudoresRaw,
    turnosRaw,
    averiasRaw,
    categoriasClienteRaw,
    cargarDatos,
  };
}
