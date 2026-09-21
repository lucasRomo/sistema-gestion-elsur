import { useCallback, useRef, useState } from 'react';
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

const ETIQUETAS_FUENTES: Record<string, string> = {
  mermas: 'Mermas',
  deudores: 'Resumen de deudores',
  averias: 'Averías',
  categorias: 'Categorías de cliente',
};

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

  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const cargaIdRef = useRef(0);

  const cargarDatos = useCallback(async (
    incluirProductos = false,
    mensajeError = 'Error al cargar los informes'
  ): Promise<DatosInformesCargados | null> => {
    const miId = ++cargaIdRef.current;
    setCargando(true);
    const fuentesConFallo: string[] = [];
    const marcarFallo = (clave: string) => () => {
      if (!fuentesConFallo.includes(clave)) fuentesConFallo.push(clave);
    };

    try {
      const [pedidos, caja, productos, mermas, deudores, turnos, averias, categorias] = await Promise.all([
        pedidoService.obtenerTodos(),
        cajaService.obtenerTodos(),
        incluirProductos ? getProductos() : Promise.resolve(null),
        informesService.obtenerMermas(marcarFallo('mermas')),
        informesService.obtenerResumenDeudores(marcarFallo('deudores')),
        cajaService.obtenerTodosLosTurnos(),
        informesService.obtenerAverias(marcarFallo('averias')),
        informesService.obtenerCategoriasCliente(marcarFallo('categorias')),
      ]);

      if (cargaIdRef.current !== miId) return null;

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

      if (fuentesConFallo.length > 0) {
        const nombres = fuentesConFallo.map((clave) => ETIQUETAS_FUENTES[clave] || clave).join(', ');
        setErrorCarga(`No se pudieron cargar algunos datos (${nombres}). Las métricas mostradas pueden estar incompletas.`);
      } else {
        setErrorCarga(null);
      }

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
      if (cargaIdRef.current !== miId) return null;
      console.error(mensajeError, error);
      setErrorCarga(`${mensajeError}. Verificá la conexión con el servidor e intentá de nuevo.`);
      return null;
    } finally {
      if (cargaIdRef.current === miId) setCargando(false);
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
    errorCarga,
    cargarDatos,
  };
}
