import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SidebarLayoutProps {
  activeItem: string;
  children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ activeItem, children }) => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<any>(null);
  const [fechaActual, setFechaActual] = useState<string>('');

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

  const nombrePersona = usuario?.persona?.nombre || usuario?.nombreUsuario || 'Usuario';
  const rolUsuario = usuario?.rol?.nombre || 'Empleado';

  const menuPrincipales = [
    { name: 'Panel Principal', icon: 'bi-grid-fill', path: '/dashboard' },
  ];

  const menuProduccion = [
    { name: 'Crear Pedido', icon: 'bi-pencil-square', path: '/crear-pedido' },
    { name: 'Pedidos Pendientes', icon: 'bi-clipboard-check', path: '/pedidos-pendientes' },
    { name: 'Historial de Pedidos', icon: 'bi-calendar-event', path: '/historial-pedidos' },
    { name: 'Caja', icon: 'bi-wallet2', path: '/caja' },
    { name: 'Repositorio Digital', icon: 'bi-download', path: '/repositorio' },
  ];

  const menuStock = [
    { name: 'Inventario', icon: 'bi-box-seam', path: '/inventario' },
    { name: 'Insumos', icon: 'bi-boxes', path: '/insumos' },
    { name: 'Productos', icon: 'bi-archive', path: '/productos' }, // <-- ESTO ES LO QUE TE FALTABA
  ];

  const menuEntidades = [
    { name: 'Clientes', icon: 'bi-person-fill', path: '/clientes' },
    { name: 'Proveedores', icon: 'bi-truck', path: '/proveedores' },
  ];

  const handleCerrarSesion = () => {
    localStorage.removeItem('usuario_logueado');
    localStorage.removeItem('token_sesion');
    navigate('/login');
  };

  const renderizarBotonMenu = (item: { name: string; icon: string; path: string }) => {
    const isActive = activeItem === item.name;
    return (
      <button
        key={item.name}
        onClick={() => navigate(item.path)}
        className="btn d-flex align-items-center w-100 mb-2 px-3 py-2 transition-all"
        style={{
          backgroundColor: isActive ? '#2d2d30' : 'transparent', 
          color: isActive ? '#0dcaf0' : '#d4d4d8', 
          borderRadius: '10px',
          border: isActive ? '1px solid #3f3f46' : '1px solid transparent',
          textAlign: 'left',
          fontSize: '0.95rem',
          fontWeight: isActive ? '600' : '400'
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
        <i className={`bi ${item.icon} me-3 fs-5 ${isActive ? 'text-info' : 'text-secondary'}`}></i>
        {item.name}
      </button>
    );
  };

  return (
    <div className="d-flex vh-100" style={{ backgroundColor: '#111113', color: 'white' }}>
      
      {/* Sidebar - AGREGADA LA CLASE d-print-none PARA SELECCIÓN DE IMPRESIÓN */}
      <div className="d-flex flex-column p-3 d-print-none" style={{ width: '260px', borderRight: '1px solid #2d2d30', backgroundColor: '#1a1a1c' }}>
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <i className="bi bi-triangle-half text-info fs-4"></i>
            <span className="fw-bold font-monospace tracking-wider text-white" style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>el SUR</span>
          </div>
        </div>

        {/* Info Usuario */}
        <div className="mb-4 ps-2 py-2 rounded" style={{ backgroundColor: '#222226', borderLeft: '3px solid #0dcaf0' }}>
          <div className="text-light small font-monospace" style={{ fontSize: '0.85rem' }}>
            Buenos Días: <span className="text-info fw-bold">{nombrePersona.toUpperCase()}</span>
          </div>
          <div className="text-light small font-monospace mt-1" style={{ fontSize: '0.85rem' }}>
            Fecha: <span className="text-white-50">{fechaActual}</span>
          </div>
          <div className="text-light small font-monospace mt-1" style={{ fontSize: '0.85rem' }}>
            Rol: <span className="badge bg-dark text-info border border-info-subtle">{rolUsuario}</span>
          </div>
        </div>

        <hr className="border-secondary mt-0 mb-4" style={{ opacity: 0.4 }} />

        {/* Listado del Menú con Scroll Scannable */}
        <div className="flex-grow-1" style={{ overflowY: 'auto', overflowX: 'hidden', paddingRight: '4px' }}>
          {menuPrincipales.map(renderizarBotonMenu)}

          <div className="text-light-50 small fw-bold mt-4 mb-3 ps-2 font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '1.5px', color: '#a1a1aa' }}>
            — PRODUCCIÓN
          </div>
          {menuProduccion.map(renderizarBotonMenu)}

          <div className="text-light-50 small fw-bold mt-4 mb-3 ps-2 font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '1.5px', color: '#a1a1aa' }}>
            — STOCK
          </div>
          {menuStock.map(renderizarBotonMenu)}

          <div className="text-light-50 small fw-bold mt-4 mb-3 ps-2 font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '1.5px', color: '#a1a1aa' }}>
            — ADMINISTRACIÓN / ENTIDADES
          </div>
          {menuEntidades.map(renderizarBotonMenu)}
        </div>

        {/* Botón de Cerrar Sesión */}
        <div className="mt-auto pt-3 border-top border-secondary" style={{ borderColor: '#2d2d30 !important' }}>
          <button 
            onClick={handleCerrarSesion}
            className="btn d-flex align-items-center w-100 px-3 py-2 fw-semibold transition-all"
            style={{ 
              borderRadius: '10px', 
              border: '1px solid transparent', 
              textAlign: 'left', 
              fontSize: '0.95rem', 
              backgroundColor: 'transparent',
              color: '#ff4d4d'
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
            <i className="bi bi-box-arrow-left me-3 fs-5"></i>
            Cerrar Sesión
          </button>
        </div> 
      </div>
      
      {/* Contenido Principal */}
      <div className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
};