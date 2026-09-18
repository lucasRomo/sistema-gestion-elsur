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
  // CORREGIDO (GAP): antes un fallo en cualquiera de las fuentes de datos, o
  // en la carga completa, quedaba solo en la consola (console.error) y el
  // usuario veía el dashboard en cero sin ningún aviso -- indistinguible de
  // "no hay datos en el rango". Ahora se expone este mensaje para mostrarlo
  // en la UI.
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // CORREGIDO (GAP detectado al agregar más casos de prueba): cargarDatos no
  // tenía ninguna protección contra llamadas superpuestas (doble click en
  // "Analizar", o cambiar de rango y volver a analizar antes de que termine
  // la carga anterior). Si la respuesta de una carga vieja llegaba DESPUÉS
  // que la de una carga más nueva, sus datos pisaban silenciosamente los del
  // rango recién pedido. Este ref numera cada carga; solo la carga más
  // reciente puede aplicar sus resultados al estado.
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

      // Si mientras esperábamos esta respuesta se disparó una carga más
      // nueva (otro click en "Analizar", u otro rango), esta respuesta ya
      // está obsoleta: se descarta sin tocar el estado.
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
