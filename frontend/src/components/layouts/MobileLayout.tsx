import { useEffect, useState } from "react";
import { InformesView } from "../../features/informes/views/InformesView";
import { MaquinasView } from "../../features/maquinas/view/MaquinasView";
import { ConfiguracionView } from "../../features/configuracion/views/ConfiguracionView";
import { InicioMovil } from "./mobile/InicioMovil";
import { PedidosMovil, type FiltroPedidos } from "./mobile/PedidosMovil";

// En el celular el sistema es solo de consulta para el administrador: resumen del día,
// cola del taller, informes, máquinas y ajustes. Lo operativo se hace en la PC.
const TABS = [
  { key: "inicio", label: "Inicio", icon: "bi-house-door-fill" },
  { key: "pedidos", label: "Pedidos", icon: "bi-list-check" },
  { key: "informes", label: "Informes", icon: "bi-file-earmark-bar-graph-fill" },
  { key: "maquinas", label: "Máquinas", icon: "bi-cpu" },
  { key: "configuracion", label: "Ajustes", icon: "bi-gear-fill" },
];

// Las novedades ahora viven dentro de Inicio; si alguna lleva a una pestaña que ya no existe
// (ej. "notificaciones"), se queda en Inicio.
// Se puede pedir un filtro con "pestaña:FILTRO" (ej. "pedidos:ATRASADOS" desde Inicio).
const TAB_VALIDA = (tab: string) => (TABS.some(t => t.key === tab) ? tab : "inicio");

export function MobileLayout() {
  const [active, setActiveEstado] = useState("inicio");
  const [filtroPedidos, setFiltroPedidos] = useState<FiltroPedidos>("TALLER");
  const setActive = (destino: string) => {
    const [tab, filtro] = destino.split(":");
    if (tab === "pedidos") setFiltroPedidos((filtro as FiltroPedidos) || "TALLER");
    setActiveEstado(TAB_VALIDA(tab));
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const tab = TABS.find(t => t.key === active);
    document.title = tab ? `${tab.label} · El Sur` : 'El Sur · Sistema de Gestión';
  }, [active]);

  return (
    <div className="mobile-layout">
      <div className="mobile-content">
        {active === "inicio" && <InicioMovil onIrA={setActive} />}
        {active === "pedidos" && <PedidosMovil filtroInicial={filtroPedidos} />}
        {active === "informes" && <InformesView />}
        {active === "maquinas" && <MaquinasView />}
        {active === "configuracion" && <ConfiguracionView />}
      </div>

      <nav className="mobile-bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={active === tab.key ? "active" : ""}
            onClick={() => setActive(tab.key)}
            aria-current={active === tab.key ? "page" : undefined}
          >
            <i className={`bi ${tab.icon}`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
