import React from 'react';
import type { ModuloPermiso } from '../service/matrizPermisosService';

const CATEGORIAS_SIDEBAR: { [categoria: string]: string[] } = {
  'GENERAL': ['Panel Principal'],
  'PRODUCCIÓN': ['Crear Pedido', 'Pedidos Pendientes', 'Historial de Pedidos', 'Caja', 'Repositorio Digital'],
  'STOCK': ['Insumos', 'Productos', 'Compra de Insumos'],
  'ADMINISTRACIÓN / ENTIDADES': ['Clientes', 'Proveedores', 'Equipos / Máquinas'],
  'OPCIONES DE GERENTE': ['Informes', 'Matriz de Permisos', 'Gestión de Usuarios', 'Historial de Actividad'],
  'MI CUENTA': ['Configuración']
};

interface Props {
  modulos: ModuloPermiso[];
  togglePermiso: (id: number, nombrePermiso: string) => void;
  esPermisoProtegido: (nombrePermiso: string) => boolean;
  isDark: boolean;
}

export const GrillaPermisos: React.FC<Props> = ({
  modulos,
  togglePermiso,
  esPermisoProtegido,
  isDark
}) => {
  return (
    <div style={{ columnCount: 2, columnGap: '0.75rem' }}>
      {Object.entries(CATEGORIAS_SIDEBAR).map(([catNombre, ventanasList]) => {
        const modulosDeCategoria = modulos.filter(m => ventanasList.includes(m.nombrePermiso));
        if (modulosDeCategoria.length === 0) return null;

        return (
          <div 
            key={catNombre} 
            className="p-2 px-3 rounded mb-3" 
            style={{ 
              backgroundColor: isDark ? '#141416' : '#f8fafc', 
              border: isDark ? '1px solid #2d2d30' : '1px solid #e2e8f0',
              breakInside: 'avoid'
            }}
          >
            <h6 className="fw-bold text-secondary mb-2 border-bottom border-secondary border-opacity-25 pb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
              — {catNombre}
            </h6>
            <div className="d-flex flex-column gap-2">
              {modulosDeCategoria.map(mod => {
                const bloqueado = esPermisoProtegido(mod.nombrePermiso);

                return (
                  <div 
                    key={mod.idPermiso}
                    onClick={() => togglePermiso(mod.idPermiso, mod.nombrePermiso)}
                    className="d-flex justify-content-between align-items-center px-3 py-2 rounded transition-all"
                    style={{ 
                      backgroundColor: mod.activo 
                        ? (isDark ? 'rgba(142, 69, 224, 0.15)' : '#f3e8ff') 
                        : (isDark ? '#222122' : '#ffffff'), 
                      border: mod.activo ? '1px solid #8e45e0' : (isDark ? '1px solid #2d2d30' : '1px solid #cbd5e1'),
                      cursor: bloqueado ? 'not-allowed' : 'pointer',
                      opacity: bloqueado ? 0.75 : 1
                    }}
                  >
                    <div className="d-flex align-items-center gap-1">
                      <span className={`fw-semibold ${isDark ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.85rem' }}>
                        {mod.nombrePermiso}
                      </span>
                      {bloqueado && (
                        <i className="bi bi-lock-fill text-warning ms-1" style={{ fontSize: '0.8rem' }} title="Protegido para Perfil Administrador"></i>
                      )}
                    </div>
                    <span 
                      className="px-2 py-1 rounded fw-bold" 
                      style={{ 
                        backgroundColor: mod.activo 
                          ? (isDark ? 'rgba(25, 135, 84, 0.2)' : '#d1fae5') 
                          : (isDark ? 'rgba(220, 53, 69, 0.2)' : '#fee2e2'),
                        color: mod.activo 
                          ? (isDark ? '#20c997' : '#065f46') 
                          : (isDark ? '#ff6b6b' : '#991b1b'),
                        border: mod.activo 
                          ? (isDark ? '1px solid #198754' : '1px solid #a7f3d0') 
                          : (isDark ? '1px solid #dc3545' : '1px solid #fca5a5'),
                        fontSize: '0.7rem',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {mod.activo ? 'ACTIVO' : 'DESACTIVADO'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};