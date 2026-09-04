import { useState } from "react";
import { InformesView } from "../../features/informes/views/InformesView";
import { MaquinasView } from "../../features/maquinas/view/MaquinasView";
import { NotificacionesView } from "../../features/notificaciones/view/NotificacionesView";
import { ConfiguracionView } from "../../features/configuracion/views/ConfiguracionView";

const TABS = [
  { key: "notificaciones", label: "Notificaciones", icon: "bi-bell-fill", component: NotificacionesView },
  { key: "informes", label: "Informes", icon: "bi-file-earmark-bar-graph-fill", component: InformesView },
  { key: "maquinas", label: "Máquinas", icon: "bi-cpu", component: MaquinasView },
  { key: "configuracion", label: "Ajustes", icon: "bi-gear-fill", component: ConfiguracionView },
];

export function MobileLayout() {
  const [active, setActive] = useState("informes");
  const ActiveComponent = TABS.find(t => t.key === active)?.component;

  return (
    <div className="mobile-layout">
      <div className="mobile-content">
        {ActiveComponent && <ActiveComponent />}
      </div>

      <nav className="mobile-bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={active === tab.key ? "active" : ""}
            onClick={() => setActive(tab.key)}
          >
            <i className={`bi ${tab.icon}`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}