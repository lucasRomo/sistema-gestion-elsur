import { useEffect, useState } from "react";
import { InformesView } from "../../features/informes/views/InformesView";
import { MaquinasView } from "../../features/maquinas/view/MaquinasView";
import { NotificacionesView } from "../../features/notificaciones/view/NotificacionesView";
import { ConfiguracionView } from "../../features/configuracion/views/ConfiguracionView";
import { forzarVistaCompleta } from "../../hook/useIsMobile";

const TABS = [
  { key: "notificaciones", label: "Notificaciones", icon: "bi-bell-fill", component: NotificacionesView },
  { key: "informes", label: "Informes", icon: "bi-file-earmark-bar-graph-fill", component: InformesView },
  { key: "maquinas", label: "Máquinas", icon: "bi-cpu", component: MaquinasView },
  { key: "configuracion", label: "Ajustes", icon: "bi-gear-fill", component: ConfiguracionView },
];

export function MobileLayout() {
  const [active, setActive] = useState("informes");
  const ActiveComponent = TABS.find(t => t.key === active)?.component;

  useEffect(() => {
    const tab = TABS.find(t => t.key === active);
    document.title = tab ? `${tab.label} · El Sur` : 'El Sur · Sistema de Gestión';
  }, [active]);

  return (
    <div className="mobile-layout">
      {/* La vista móvil tiene solo algunos módulos: desde acá se puede pasar a la completa
          (ej. una tablet chica en el mostrador). */}
      <button
        type="button"
        className="btn btn-sm font-monospace"
        style={{ position: 'fixed', top: '8px', right: '8px', zIndex: 1040, backgroundColor: '#8e45e0', color: '#ffffff', fontSize: '0.72rem', borderRadius: '999px', padding: '3px 10px' }}
        onClick={() => forzarVistaCompleta(true)}
        title="Ver el sistema completo, con todos los módulos"
      >
        <i className="bi bi-display me-1" aria-hidden="true"></i>Versión completa
      </button>
      <div className="mobile-content">
        {active === 'notificaciones'
          ? <NotificacionesView onIrA={setActive} />
          : ActiveComponent && <ActiveComponent />}
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