import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSur from '../../assets/logo-elsur.png';

interface SidebarLayoutProps {
  activeItem: string;
  children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ activeItem, children }) => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<any>(null);
  const [fechaActual, setFechaActual] = useState<string>('');
  const [colapsado, setColapsado] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario_logueado');
    if (usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch (error) {
        console.error("Error al parsear el usuario del localStorage", error);
      }
    }

    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    setFechaActual(`${dia}/${mes}/${anio}`);
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

  // Función helper para validar permisos de un módulo
  const tienePermiso = (nombreModulo: string) => {
    if (esAdmin) return true; // El Admin/Gerente tiene acceso total
    const permisos: any[] = usuario?.permisos || usuario?.rol?.permisos || [];
    return permisos.some((p: any) => 
      (typeof p === 'string' && p.toLowerCase() === nombreModulo.toLowerCase()) ||
      (p.nombrePermiso && p.nombrePermiso.toLowerCase() === nombreModulo.toLowerCase())
    );
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
    { name: 'Inventario', icon: 'bi-box-seam', path: '/inventario' },
    { name: 'Insumos', icon: 'bi-boxes', path: '/insumos' },
    { name: 'Productos', icon: 'bi-archive', path: '/productos' },
  ].filter(item => tienePermiso(item.name));

  const menuEntidades = [
    { name: 'Clientes', icon: 'bi-person-fill', path: '/clientes' },
    { name: 'Proveedores', icon: 'bi-truck', path: '/proveedores' },
  ].filter(item => tienePermiso(item.name));

  const menuGerente = [
    { name: 'Informes', icon: 'bi-file-earmark-bar-graph-fill', path: '/informes' },
    { name: 'Matriz de Permisos', icon: 'bi-shield-lock-fill', path: '/matriz-permisos' },
    { name: 'Gestión de Usuarios', icon: 'bi-people', path: '/gestion-usuarios' },
    { name: 'Historial de Actividad', icon: 'bi-clock-history', path: '/historial' },
  ];

  const menuConfiguracion = [
    { name: 'Configuración', icon: 'bi-gear-fill', path: '/configuracion' },
  ].filter(item => tienePermiso(item.name));

  const handleCerrarSesion = () => {
    localStorage.removeItem('usuario_logueado');
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
    return (
      <button
        key={item.name}
        onClick={() => handleNavegacion(item.path)}
        className="btn d-flex align-items-center w-100 mb-2 px-3 py-2 transition-all"
        style={{
          backgroundColor: isActive ? '#2d2d30' : 'transparent', 
          color: isActive ? '#8e45e0' : '#d4d4d8', 
          borderRadius: '10px',
          border: isActive ? '1px solid #8e45e0' : '1px solid transparent',
          textAlign: 'left',
          fontSize: '0.95rem',
          fontWeight: isActive ? '600' : '400',
          justifyContent: colapsado ? 'center' : 'flex-start',
          paddingLeft: colapsado ? '0px' : '1rem',
          paddingRight: colapsado ? '0px' : '1rem'
        }}
        onMouseEnter={(e) => {
          if(!isActive) {
            e.currentTarget.style.backgroundColor = '#222226';
            e.currentTarget.style.color = '#ffffff';
          }
        }}
        onMouseLeave={(e) => {
          if(!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#d4d4d8';
          }
        }}
      >
        <i 
          className={`bi ${item.icon} fs-5`} 
          style={{ 
            color: isActive ? '#8e45e0' : 'gray',
            marginRight: colapsado ? '0px' : '1rem',
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
    <div className="d-flex vh-100" style={{ backgroundColor: '#1b1b1b', color: 'white', overflow: 'hidden' }}>
      
      {/* Estilos personalizados para la barra de scroll */}
      <style>{`
        .sidebar-scroll-custom::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-scroll-custom::-webkit-scrollbar-track {
          background: transparent; 
        }
        .sidebar-scroll-custom::-webkit-scrollbar-thumb {
          background: #4a4a4d;
          border-radius: 10px;
        }
        .sidebar-scroll-custom::-webkit-scrollbar-thumb:hover {
          background: #8e45e0;
        }
        .sidebar-scroll-custom {
          scrollbar-width: thin;
          scrollbar-color: #4a4a4d transparent;
        }
      `}</style>
      
      {/* Sidebar con soporte de colapso y ancho rígido */}
      <div 
        className="d-flex flex-column flex-shrink-0 d-print-none"
        style={{ 
          width: colapsado ? '68px' : '260px',
          minWidth: colapsado ? '68px' : '260px',
          maxWidth: colapsado ? '68px' : '260px',
          borderRight: '1px solid #2d2d30', 
          backgroundColor: '#222122', 
          padding: colapsado ? '1rem 0.5rem' : '1rem', 
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
      >
        
        {/* Header del Sidebar */}
        <div className="d-flex justify-content-between align-items-center mb-4 ps-1" style={{ minHeight: '45px' }}>
          {!colapsado ? (
            <div 
              className="d-flex align-items-center gap-2" 
              style={{ cursor: 'pointer' }} 
              onClick={() => navigate('/dashboard')}
            >
              <img 
                src={logoSur} 
                alt="El SUR" 
                style={{ 
                  width: '45px',    
                  height: 'auto',    
                  objectFit: 'contain' 
                }} 
              />
              <span className="fw-bold font-monospace text-white" style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>
                el SUR
              </span>
            </div>
          ) : (
            <div style={{ flexGrow: 1 }} />
          )}

          <button 
            className="btn text-white p-1 border-0 d-flex align-items-center justify-content-center" 
            onClick={() => setColapsado(!colapsado)}
            style={{ backgroundColor: 'transparent', margin: colapsado ? '0 auto' : '0' }}
            title={colapsado ? "Expandir menú" : "Colapsar menú"}
          >
            <i className={`bi ${colapsado ? 'bi-chevron-right' : 'bi-chevron-left'} fs-4`} style={{ color: '#8e45e0' }}></i>
          </button>
        </div>

        {/* Info Usuario */}
        <div 
          className="mb-4 ps-2 py-2 rounded" 
          style={{ 
            backgroundColor: '#292829', 
            borderLeft: '3px solid #8e45e0',
            transition: 'all 0.2s'
          }}
        >
          <div className="text-light small font-monospace" style={{ fontSize: '0.85rem' }}>
            {!colapsado ? (
              <>Buenos Días: <span style={{ color: '#8e45e0' }} className="fw-bold">{nombrePersona.toUpperCase()}</span></>
            ) : (
              <div className="text-center" style={{ width: '100%' }}>
                <span style={{ color: '#8e45e0' }} className="fw-bold fs-5">{nombrePersona.substring(0, 1).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="text-light small font-monospace mt-1" style={{ fontSize: '0.85rem' }}>
            {!colapsado ? (
              <>Fecha: <span className="text-white-50">{fechaActual}</span></>
            ) : (
              <div className="text-center" style={{ width: '100%' }}>
                <i className="bi bi-calendar-event" style={{ color: '#a1a1aa' }}></i>
              </div>
            )}
          </div>
          <div className="text-light small font-monospace mt-1" style={{ fontSize: '0.85rem' }}>
            {!colapsado ? (
              <>Rol: <span className="badge bg-dark ms-2" style={{ color: '#8e45e0', border: '1px solid #8e45e0' }}>{rolUsuario}</span></>
            ) : (
              <div className="text-center" style={{ width: '100%' }}>
                <i className="bi bi-person-badge" style={{ color: '#8e45e0' }}></i>
              </div>
            )}
          </div>
        </div>

        <hr className="border-secondary mt-0 mb-4" style={{ opacity: 0.4 }} />

        {/* Lista de Navegación con Scroll */}
        <div 
          ref={scrollContainerRef} 
          className="flex-grow-1 sidebar-scroll-custom" 
          style={{ 
            overflowY: colapsado ? 'hidden' : 'auto', 
            overflowX: 'hidden', 
            paddingRight: colapsado ? '0px' : '4px' 
          }}
        >
          {menuPrincipales.map(renderizarBotonMenu)}

          {menuProduccion.length > 0 && (
            <>
              {colapsado ? <hr className="border-secondary my-3" style={{ opacity: 0.2 }} /> : (
                <div className="text-light-50 small fw-bold mt-4 mb-3 ps-2 font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '1.5px', color: '#a1a1aa' }}>
                  — PRODUCCIÓN
                </div>
              )}
              {menuProduccion.map(renderizarBotonMenu)}
            </>
          )}

          {menuStock.length > 0 && (
            <>
              {colapsado ? <hr className="border-secondary my-3" style={{ opacity: 0.2 }} /> : (
                <div className="text-light-50 small fw-bold mt-4 mb-3 ps-2 font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '1.5px', color: '#a1a1aa' }}>
                  — STOCK
                </div>
              )}
              {menuStock.map(renderizarBotonMenu)}
            </>
          )}

          {menuEntidades.length > 0 && (
            <>
              {colapsado ? <hr className="border-secondary my-3" style={{ opacity: 0.2 }} /> : (
                <div className="text-light-50 small fw-bold mt-4 mb-3 ps-2 font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '1.5px', color: '#a1a1aa' }}>
                  — ADMINISTRACIÓN / ENTIDADES
                </div>
              )}
              {menuEntidades.map(renderizarBotonMenu)}
            </>
          )}

          {esAdmin && (
            <>
              {colapsado ? <hr className="border-secondary my-3" style={{ opacity: 0.2 }} /> : (
                <div className="text-light-50 small fw-bold mt-4 mb-3 ps-2 font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '1.5px', color: '#a1a1aa' }}>
                  — OPCIONES DE GERENTE
                </div>
              )}
              {menuGerente.map(renderizarBotonMenu)}
            </>
          )}

          {menuConfiguracion.length > 0 && (
            <>
              {colapsado ? <hr className="border-secondary my-3" style={{ opacity: 0.2 }} /> : (
                <div className="text-light-50 small fw-bold mt-4 mb-3 ps-2 font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '1.5px', color: '#a1a1aa' }}>
                  — MI CUENTA
                </div>
              )}
              {menuConfiguracion.map(renderizarBotonMenu)}
            </>
          )}
        </div>

        {/* Botón de Cerrar Sesión */}
        <div className="mt-auto pt-3 border-top border-secondary" style={{ borderColor: '#2d2d30 !important' }}>
          <button 
            onClick={handleCerrarSesion}
            className="btn d-flex align-items-center w-100 px-3 py-2 fw-semibold transition-all"
            style={{ 
              borderRadius: '10px', 
              border: '1px solid transparent', 
              fontSize: '0.95rem', 
              backgroundColor: 'transparent',
              color: '#ff4d4d',
              justifyContent: colapsado ? 'center' : 'flex-start',
              paddingLeft: colapsado ? '0px' : '1rem'
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
              className="bi bi-box-arrow-left fs-5" 
              style={{ marginRight: colapsado ? '0px' : '1rem' }}
            ></i>
            {!colapsado && <span>Cerrar Sesión</span>}
          </button>
        </div> 
      </div>
      
      {/* Contenido Principal - Protegido contra desbordes */}
      <div 
        className="flex-grow-1" 
        style={{ 
          minWidth: 0,            // Clave: permite que flexbox encoja el contenido si es necesario
          width: '100%',          // Ocupa el espacio disponible
          overflowX: 'hidden',    // Evita scroll horizontal global
          overflowY: 'auto'       // Habilita scroll vertical
        }}
      >
        <div className="p-4" style={{ width: '100%', maxWidth: '100%' }}>
          {children}
        </div>
      </div>
    
    </div>
  );
};