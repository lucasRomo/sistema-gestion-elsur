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

// Antes se traían todos los pedidos y movimientos de caja de la historia en cada apertura, y eso
// se iba a volver cada vez más lento. Ahora se piden solo desde una fecha: por defecto los
// últimos 2 meses (alcanza para hoy/semana/mes y compararlos con el período anterior), y si se
// analiza un período más viejo se vuelve a pedir desde esa fecha.
const DIAS_COBERTURA_BASE = 62;

const fechaBase = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - DIAS_COBERTURA_BASE);
  return d.toLocaleDateString('sv-SE');
};

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
  const coberturaDesdeRef = useRef<string | null>(null);
  const ultimosDatosRef = useRef<DatosInformesCargados | null>(null);

  const cargarDatos = useCallback(async (
    incluirProductos = false,
    mensajeError = 'Error al cargar los informes',
    desdeNecesario?: string
  ): Promise<DatosInformesCargados | null> => {
    const miId = ++cargaIdRef.current;
    const base = fechaBase();
    const desde = desdeNecesario && desdeNecesario < base ? desdeNecesario : base;
    setCargando(true);
    const fuentesConFallo: string[] = [];
    const marcarFallo = (clave: string) => () => {
      if (!fuentesConFallo.includes(clave)) fuentesConFallo.push(clave);
    };

    try {
      const [pedidos, caja, productos, mermas, deudores, turnos, averias, categorias] = await Promise.all([
        pedidoService.obtenerTodos(desde),
        cajaService.obtenerTodos(desde),
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

      const cargados: DatosInformesCargados = {
        pedidosRaw: pedidosValidos,
        movimientosCaja: cajaValida,
        mermasRaw: mermas,
        deudoresRaw: deudores,
        turnosRaw: turnosValidos,
        averiasRaw: averias,
        categoriasClienteRaw: categorias,
      };
      coberturaDesdeRef.current = desde;
      ultimosDatosRef.current = cargados;
      return cargados;
    } catch (error) {
      if (cargaIdRef.current !== miId) return null;
      console.error(mensajeError, error);
      setErrorCarga(`${mensajeError}. Verificá la conexión con el servidor e intentá de nuevo.`);
      return null;
    } finally {
      if (cargaIdRef.current === miId) setCargando(false);
    }
  }, []);

  // Devuelve datos que cubran desde esa fecha: los ya cargados si alcanzan, o los pide.
  const asegurarDesde = useCallback(async (desde: string): Promise<DatosInformesCargados | null> => {
    if (ultimosDatosRef.current && coberturaDesdeRef.current && coberturaDesdeRef.current <= desde) {
      return ultimosDatosRef.current;
    }
    return cargarDatos(false, 'Error al cargar los datos del período', desde);
  }, [cargarDatos]);

  return {
    cargando,
    asegurarDesde,
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
