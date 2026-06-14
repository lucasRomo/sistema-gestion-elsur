import React from 'react';
import { useNavigate } from 'react-router-dom';

// 1. Definimos la interfaz aquí mismo
interface SidebarLayoutProps {
  activeItem: string;
  children: React.ReactNode;
}

// 2. Usamos la interfaz en el componente
export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ activeItem, children }) => {
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Panel Principal', icon: 'bi-grid-fill', path: '/dashboard' },
    { name: 'Clientes', icon: 'bi-person-fill', path: '/clientes' },
  ];

  return (
    <div className="d-flex vh-100" style={{ backgroundColor: '#18181b', color: 'white' }}>
      {/* Sidebar */}
      <div className="d-flex flex-column p-3" style={{ width: '250px', borderRight: '1px solid #333' }}>
        <h4 className="text-center mb-4">el SUR</h4>
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`btn d-flex align-items-center mb-2 p-2 ${activeItem === item.name ? 'text-white' : 'text-secondary'}`}
            style={{
              backgroundColor: activeItem === item.name ? '#4c1d95' : 'transparent',
              borderRadius: '20px',
              border: 'none',
              textAlign: 'left'
            }}
          >
            <i className={`bi ${item.icon} me-3`}></i>
            {item.name}
          </button>
        ))}
      </div>
      
      {/* Contenido */}
      <div className="flex-grow-1 p-4">
        {children}
      </div>
    </div>
  );
};