import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSur from '../../assets/logo-elsur.png';
import { useTheme } from '../../Context/ThemeContext';

interface SidebarLayoutProps {
  activeItem: string;
  children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ activeItem, children }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const esOscuro = theme === 'dark';

  const [usuario, setUsuario] = useState<any>(null);
  const [fechaActual, setFechaActual] = useState<string>('');
  const [colapsado, setColapsado] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Colores dinámicos según el tema de Lisandro
  const mainBg = esOscuro ? '#1b1b1b' : '#e5e7eb'; 
  const sidebarBg = esOscuro ? '#222122' : '#ffffff';
  const sidebarBorder = esOscuro ? '#2d2d30' : '#cbd5e1';
  const userInfoBg = esOscuro ? '#292829' : '#f1f5f9';
  const textColor = esOscuro ? '#ffffff' : '#0f172a';
  const mutedText = esOscuro ? '#a1a1aa' : '#64748b';

  const cargarUsuarioDeSesion = () => {
    const usuarioGuardado = localStorage.getItem('usuario_logueado') || localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch (error) {
        console.error("Error al parsear el usuario del localStorage", error);
      }
    }
  };

  useEffect(() => {
    cargarUsuarioDeSesion();

    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    setFechaActual(`${dia}/${mes}/${anio}`);

    // Listeners en vivo de cambios de permisos / sesión (Funcionalidad de Lucas)
    const handleActualizacion = () => {
      cargarUsuarioDeSesion();
    };

    window.addEventListener('permisos-actualizados', handleActualizacion);
    window.addEventListener('storage', handleActualizacion);

    return () => {
      window.removeEventListener('permisos-actualizados', handleActualizacion);
      window.removeEventListener('storage', handleActualizacion);
    };
  }, []);

  useLayoutEffect(() => {
    const savedScrollTop = localStorage.getItem('sidebar_scroll_position');
    if (savedScrollTop && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = parseInt(savedScrollTop, 10);
    }
  }, [activeItem]);

  const nombrePersona = usuario?.persona?.nombre || usuario?.nombreUsuario || 'Usuario';
  const rolUsuario = usuario?.rol?.nombreRol || usuario?.rol?.nombre || 'Empleado';

  const esAdmin = rolUsuario.toUpperCase().includes('ADMIN') || rolUsuario.toUpperCase().includes('GERENTE');

  const tienePermiso = (nombreModulo: string) => {
    if (nombreModulo.toLowerCase() === 'panel principal') return true;

    const permisos: any[] = usuario?.permisos || usuario?.rol?.permisos || [];

    // Evaluación estricta cuando existen permisos cargados en la sesión (Lógica de Lucas)
    if (Array.isArray(permisos) && permisos.length > 0) {
      return permisos.some((p: any) => {
        if (typeof p === 'string') {
          return p.toLowerCase() === nombreModulo.toLowerCase();
        }
        if (p && typeof p === 'object') {
          const nombre = p.nombrePermiso || p.nombre || p.nombreModulo;
          return nombre && nombre.toLowerCase() === nombreModulo.toLowerCase();
        }
        return false;
      });
    }

    // Si no hay lista explícita aún en sesión, el admin ve todo por defecto
    return esAdmin;
  };

  const menuPrincipales = [
    { name: 'Panel Principal', icon: 'bi-grid-fill', path: '/dashboard' },
  ].filter(item => tienePermiso(item.name));

  const menuProduccion = [
    { name: 'Crear Pedido', icon: 'bi-pencil-square', path: '/crear-pedido' },
    { name: 'Pedidos Pendientes', icon: 'bi-clipboard-check', path: '/pedidos-pendientes' },
    { name: 'Historial de Pedidos', icon: 'bi-calendar-event', path: '/historial-pedidos' },
    { name: 'Caja', icon: 'bi-wallet2', path: '/caja' },
    { name: 'Repositorio Digital', icon: 'bi-download', path: '/repositorio' },
  ].filter(item => tienePermiso(item.name));

  const menuStock = [
    { name: 'Insumos', icon: 'bi-boxes', path: '/insumos' },
    { name: 'Productos', icon: 'bi-archive', path: '/productos' },
    { name: 'Compra de Insumos', icon: 'bi-truck', path: '/compra-insumos' }
  ].filter(item => tienePermiso(item.name));

  const menuEntidades = [
    { name: 'Clientes', icon: 'bi-person-fill', path: '/clientes' },
    { name: 'Proveedores', icon: 'bi-truck', path: '/proveedores' },
    { name: 'Equipos / Máquinas', icon: 'bi-cpu', path: '/maquinas' },
  ].filter(item => tienePermiso(item.name));

  const menuGerente = [
    { name: 'Informes', icon: 'bi-file-earmark-bar-graph-fill', path: '/informes' },
    { name: 'Matriz de Permisos', icon: 'bi-shield-lock-fill', path: '/matriz-permisos' },
    { name: 'Gestión de Usuarios', icon: 'bi-people', path: '/gestion-usuarios' },
    { name: 'Historial de Actividad', icon: 'bi-clock-history', path: '/historial' },
  ].filter(item => tienePermiso(item.name));

  const menuConfiguracion = [
    { name: 'Configuración', icon: 'bi-gear-fill', path: '/configuracion' },
  ].filter(item => tienePermiso(item.name));

  const handleCerrarSesion = () => {
    localStorage.removeItem('usuario_logueado');
    localStorage.removeItem('usuario');
    localStorage.removeItem('token_sesion');
    navigate('/login');
  };

  const handleNavegacion = (path: string) => {
    if (colapsado) {
      setColapsado(false);
      return;
    }
    if (scrollContainerRef.current) {
      localStorage.setItem('sidebar_scroll_position', scrollContainerRef.current.scrollTop.toString());
    }
    navigate(path);
  };

  const renderizarBotonMenu = (item: { name: string; icon: string; path: string }) => {
    const isActive = activeItem === item.name;
    const activeBg = esOscuro ? '#2d2d30' : '#f1f5f9';
    const inactiveTextColor = esOscuro ? '#d4d4d8' : '#334155';

    return (
      <button
        key={item.name}
        onClick={() => handleNavegacion(item.path)}
        className="btn d-flex align-items-center w-100 transition-all"
        style={{
          backgroundColor: isActive ? activeBg : 'transparent', 
          color: isActive ? '#8e45e0' : inactiveTextColor, 
          borderRadius: '6px',
          border: isActive ? '1px solid #8e45e0' : '1px solid transparent',
          textAlign: 'left',
          fontSize: '0.78rem',
          fontWeight: isActive ? '600' : '400',
          justifyContent: colapsado ? 'center' : 'flex-start',
          padding: colapsado ? '0.4rem 0px' : '0.25rem 0.55rem',
          marginBottom: colapsado ? '0px' : '0.25rem'
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = esOscuro ? '#3b1d61' : '#f3e8ff';
            e.currentTarget.style.color = esOscuro ? '#e9d5ff' : '#6b21a8';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = inactiveTextColor;
          }
        }}
      >
        <i 
          className={`bi ${item.icon}`} 
          style={{ 
            fontSize: '0.9rem',
            color: isActive ? '#8e45e0' : (esOscuro ? 'gray' : '#64748b'),
            marginRight: colapsado ? '0px' : '0.55rem',
            transition: 'margin 0.2s'
          }}
        ></i>
        
        {!colapsado && (
          <span style={{ transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
            {item.name}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="d-flex vh-100" style={{ backgroundColor: mainBg, color: textColor, overflow: 'hidden' }}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        ${!esOscuro ? `
          select.form-select, 
          input.form-control {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }
          
          select.form-select option {
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
        ` : ''}
      `}</style>

      {/* Sidebar */}
      <div 
        className="d-flex flex-column flex-shrink-0 justify-content-between d-print-none"
        style={{ 
          width: colapsado ? '60px' : '240px',
          minWidth: colapsado ? '60px' : '240px',
          maxWidth: colapsado ? '60px' : '240px',
          borderRight: `1px solid ${sidebarBorder}`, 
          backgroundColor: sidebarBg, 
          padding: colapsado ? '0.75rem 0.25rem' : '0.75rem 0.55rem', 
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          height: '100vh',
          boxShadow: esOscuro ? 'none' : '2px 0 10px rgba(0,0,0,0.03)'
        }}
      >
        {/* BLOQUE SUPERIOR */}
        <div>
          <div className="d-flex align-items-center mb-2 ps-1" style={{ minHeight: '34px' }}>
            <div 
              className="d-flex align-items-center gap-2" 
              style={{ cursor: 'pointer' }} 
              onClick={() => navigate('/dashboard')}
            >
              <img 
  src={logoSur} 
  alt="El SUR" 
  style={{ 
    width: '32px',    
    height: 'auto',    
    objectFit: 'contain',
    filter: esOscuro ? 'none' : 'drop-shadow(0px 0px 1px #000000) drop-shadow(0px 0px 1px #000000)'
  }} 
/>
              {!colapsado && (
                <span className="fw-bold font-monospace" style={{ fontSize: '1rem', letterSpacing: '1px', color: textColor }}>
                  El SUR
                </span>
              )}
            </div>

            {!colapsado && (
              <button 
                className="btn p-1 border-0 ms-auto d-flex align-items-center justify-content-center" 
                onClick={() => setColapsado(true)}
                style={{ backgroundColor: 'transparent' }}
                title="Colapsar menú"
              >
                <i className="bi bi-chevron-left fs-6" style={{ color: '#8e45e0' }}></i>
              </button>
            )}
          </div>

          {!colapsado ? (
            <div 
              className="mb-2 py-2 rounded" 
              style={{ 
                backgroundColor: userInfoBg, 
                borderLeft: '3px solid #8e45e0',
                paddingLeft: '0.95rem',
                paddingRight: '0.5rem',
                minHeight: '82px'
              }}
            >
              <div className="small font-monospace" style={{ fontSize: '0.8rem', color: textColor }}>
                Buenos Días: <span style={{ color: '#8e45e0' }} className="fw-bold">{nombrePersona.toUpperCase()}</span>
              </div>
              <div className="small font-monospace mt-1" style={{ fontSize: '0.8rem', color: textColor }}>
                Fecha: <span style={{ color: mutedText }}>{fechaActual}</span>
              </div>
              <div className="small font-monospace mt-1" style={{ fontSize: '0.8rem', color: textColor }}>
  Rol: <span 
    className="d-inline-block ms-2 px-2 py-1 rounded fw-semibold" 
    style={{ 
      backgroundColor: esOscuro ? '#222122' : '#f3e8ff', 
      color: esOscuro ? '#a855f7' : '#7e22ce', 
      border: `1px solid ${esOscuro ? '#8e45e0' : '#c084fc'}`, 
      fontSize: '0.68rem',
      lineHeight: '1'
    }}
  >
    {rolUsuario}
  </span>
</div>
            </div>
          ) : (
            <div 
              className="mb-2 rounded d-flex align-items-center justify-content-center" 
              style={{ 
                backgroundColor: userInfoBg, 
                minHeight: '40px',
                height: '40px',
                borderLeft: '3px solid #8e45e0'
              }}
            >
              <button 
                className="btn p-1 border-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                onClick={() => setColapsado(false)}
                style={{ backgroundColor: 'transparent' }}
                title="Desplegar menú"
              >
                <i className="bi bi-chevron-right fs-6" style={{ color: '#8e45e0' }}></i>
              </button>
            </div>
          )}

          <hr className="mb-2 mt-2" style={{ borderColor: sidebarBorder, opacity: 0.5 }} />
        </div>

        {/* LISTA NAVEGACIÓN */}
        <div 
          ref={scrollContainerRef} 
          className="flex-grow-1 d-flex flex-column py-1 no-scrollbar" 
          style={{ 
            overflowY: 'auto', 
            overflowX: 'hidden',
            justifyContent: colapsado ? 'space-evenly' : 'flex-start',
            gap: colapsado ? '0px' : '0.25rem'
          }}
        >
          {menuPrincipales.length > 0 && (
            <div className={colapsado ? 'd-flex flex-column gap-1 w-100' : ''}>
              {menuPrincipales.map(renderizarBotonMenu)}
            </div>
          )}

          {menuProduccion.length > 0 && (
            <>
              {colapsado && <hr className="w-100 my-0" style={{ borderColor: sidebarBorder, opacity: 0.3 }} />}
              <div className={colapsado ? 'd-flex flex-column gap-1 w-100' : ''}>
                {!colapsado && (
                  <div className="small fw-bold mt-1.5 mb-1 ps-1 font-monospace" style={{ fontSize: '0.63rem', letterSpacing: '0.8px', color: mutedText }}>
                    — PRODUCCIÓN
                  </div>
                )}
                {menuProduccion.map(renderizarBotonMenu)}
              </div>
            </>
          )}

          {menuStock.length > 0 && (
            <>
              {colapsado && <hr className="w-100 my-0" style={{ borderColor: sidebarBorder, opacity: 0.3 }} />}
              <div className={colapsado ? 'd-flex flex-column gap-1 w-100' : ''}>
                {!colapsado && (
                  <div className="small fw-bold mt-1.5 mb-1 ps-1 font-monospace" style={{ fontSize: '0.63rem', letterSpacing: '0.8px', color: mutedText }}>
                    — STOCK
                  </div>
                )}
                {menuStock.map(renderizarBotonMenu)}
              </div>
            </>
          )}

          {menuEntidades.length > 0 && (
            <>
              {colapsado && <hr className="w-100 my-0" style={{ borderColor: sidebarBorder, opacity: 0.3 }} />}
              <div className={colapsado ? 'd-flex flex-column gap-1 w-100' : ''}>
                {!colapsado && (
                  <div className="small fw-bold mt-1.5 mb-1 ps-1 font-monospace" style={{ fontSize: '0.63rem', letterSpacing: '0.8px', color: mutedText }}>
                    — ADMINISTRACIÓN / ENTIDADES
                  </div>
                )}
                {menuEntidades.map(renderizarBotonMenu)}
              </div>
            </>
          )}

          {menuGerente.length > 0 && (
            <>
              {colapsado && <hr className="w-100 my-0" style={{ borderColor: sidebarBorder, opacity: 0.3 }} />}
              <div className={colapsado ? 'd-flex flex-column gap-1 w-100' : ''}>
                {!colapsado && (
                  <div className="small fw-bold mt-1.5 mb-1 ps-1 font-monospace" style={{ fontSize: '0.63rem', letterSpacing: '0.8px', color: mutedText }}>
                    — OPCIONES DE GERENTE
                  </div>
                )}
                {menuGerente.map(renderizarBotonMenu)}
              </div>
            </>
          )}

          {menuConfiguracion.length > 0 && (
            <>
              {colapsado && <hr className="w-100 my-0" style={{ borderColor: sidebarBorder, opacity: 0.3 }} />}
              <div className={colapsado ? 'd-flex flex-column gap-1 w-100' : ''}>
                {!colapsado && (
                  <div className="small fw-bold mt-1.5 mb-1 ps-1 font-monospace" style={{ fontSize: '0.63rem', letterSpacing: '0.8px', color: mutedText }}>
                    — MI CUENTA
                  </div>
                )}
                {menuConfiguracion.map(renderizarBotonMenu)}
              </div>
            </>
          )}
        </div>

        {/* CERRAR SESIÓN */}
        <div className="pt-2 mt-1" style={{ borderTop: `1px solid ${sidebarBorder}` }}>
          <button 
            onClick={handleCerrarSesion}
            className="btn d-flex align-items-center w-100 px-2 py-1.5 fw-semibold transition-all"
            style={{ 
              borderRadius: '6px', 
              border: '1px solid transparent', 
              fontSize: '0.8rem', 
              backgroundColor: 'transparent',
              color: '#ff4d4d',
              justifyContent: colapsado ? 'center' : 'flex-start',
              paddingLeft: colapsado ? '0px' : '0.55rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc3545';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#ff4d4d';
            }}
          >
            <i 
              className="bi bi-box-arrow-left" 
              style={{ fontSize: '0.9rem', marginRight: colapsado ? '0px' : '0.55rem' }}
            ></i>
            {!colapsado && <span>Cerrar Sesión</span>}
          </button>
        </div> 
      </div>
      
      {/* Contenido Principal */}
      <div 
        className="flex-grow-1" 
        style={{ 
          minWidth: 0,
          width: '100%',
          height: '100vh',
          overflowX: 'hidden',
          overflowY: activeItem === 'Informes' ? 'auto' : 'hidden' 
        }}
      >
        <div className="p-4" style={{ width: '100%', maxWidth: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
};