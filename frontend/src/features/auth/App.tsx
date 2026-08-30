import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WelcomeView } from '../primermenu/view/WelcomeView';
import { RegisterView } from '../primermenu/view/RegisterView';
import { LoginView } from '../primermenu/view/LoginView';
import { ClienteView } from '../../features/clientes/view/ClienteView';
import { Proveedores } from '../../features/proveedores/view/Proveedores';
import { Insumos } from '../../features/insumos/view/Insumos';
import { Productos } from '../../features/productos/view/Productos';
import { DashboardPrincipal } from '../dashboardprincipal/view/DashboardPrincipalView';
import { CrearPedidoView } from '../../features/pedidos/view/CrearPedidoView'; 
import { PedidosPendientesView } from '../../features/pedidos/view/PedidosPendientesView'; 
import { HistorialPedidosPage } from '../../features/pedidos/view/HistorialPedidosView'; 
import { GestionUsuariosView } from '../../features/usuarios/view/GestionUsuariosView'; 
import { CajaView } from '../../features/caja/view/CajaView';
import { RepositorioDigitalView } from '../../features/repositorio/view/RepositorioDigitalView';
import { SidebarLayout } from '../../components/layouts/SidebarLayout';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { MatrizPermisosView } from '../../features/matrizpermisos/view/MatrizPermisosView';
import { ConfiguracionView } from '../../features/configuracion/views/ConfiguracionView';
import { InformesView } from '../../features/informes/views/InformesView';
import { TurnoProvider } from '../../Context/TurnoContext';
import { HistorialActividadView } from '../../features/historial/view/HistorialActividadView';
import { MaquinasView } from '../../features/maquinas/view/MaquinasView';
import { ThemeProvider } from '../../Context/ThemeContext';
import { MobileLayout } from '../../components/layouts/MobileLayout';
import { useIsMobile } from "../../hook/useIsMobile";
import { CompraInsumosView } from '../compraInsumos/views/CompraInsumosView';

function App() {
  const isMobile = useIsMobile();

  const renderLayout = (children: React.ReactNode, activeItem: string) => {
  if (isMobile) {
    return <MobileLayout />; 
  }
  return <SidebarLayout activeItem={activeItem}>{children}</SidebarLayout>;
};

  return (
    <ThemeProvider>
      <TurnoProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WelcomeView onIrARegistro={() => window.location.href='/registro'} onIrALogin={() => window.location.href='/login'} />} />
            <Route path="/registro" element={<RegisterView onVolver={() => window.location.href='/'} />} />
            
            <Route path="/login" element={
              <LoginView 
                onLoginExitoso={() => {
                  window.location.href = isMobile ? '/informes' : '/dashboard';
                }} 
                onVolver={() => window.location.href='/'} 
              />
            } />

            <Route path="/clientes" element={
              <ProtectedRoute permisoRequerido="Clientes">
                {renderLayout(<ClienteView />, "Clientes")}
              </ProtectedRoute>
            } />

            <Route path="/proveedores" element={
              <ProtectedRoute permisoRequerido="Proveedores">
                {renderLayout(<Proveedores />, "Proveedores")}
              </ProtectedRoute>
            } />

            <Route path="/insumos" element={
              <ProtectedRoute permisoRequerido="Insumos">
                {renderLayout(<Insumos />, "Insumos")}
              </ProtectedRoute>
            } />

            <Route path="/productos" element={
              <ProtectedRoute permisoRequerido="Productos">
                {renderLayout(<Productos />, "Productos")}
              </ProtectedRoute>
            } />

            <Route path="/compra-insumos" element={
              <ProtectedRoute permisoRequerido="Compra de Insumos">
                <SidebarLayout activeItem="Compra de Insumos">
                  <CompraInsumosView />
                </SidebarLayout>
              </ProtectedRoute>
            } />

            <Route path="/compra-insumos" element={
              <ProtectedRoute permisoRequerido="Compra de Insumos">
                <SidebarLayout activeItem="Compra de Insumos">
                  <CompraInsumosView />
                </SidebarLayout>
              </ProtectedRoute>
            } />

            <Route path="/crear-pedido" element={
              <ProtectedRoute permisoRequerido="Crear Pedido">
                {renderLayout(<CrearPedidoView />, "Crear Pedido")}
              </ProtectedRoute>
            } />

            <Route path="/pedidos-pendientes" element={
              <ProtectedRoute permisoRequerido="Pedidos Pendientes">
                <PedidosPendientesView />
              </ProtectedRoute>
            } />

            <Route path="/historial-pedidos" element={
              <ProtectedRoute permisoRequerido="Historial de Pedidos">
             <HistorialPedidosPage />
              </ProtectedRoute>
            } />

            <Route path="/caja" element={
              <ProtectedRoute permisoRequerido="Caja">
              <CajaView />
              </ProtectedRoute>
            } />

            <Route path="/repositorio" element={
              <ProtectedRoute permisoRequerido="Repositorio Digital">
                {renderLayout(<RepositorioDigitalView />, "Repositorio Digital")}
              </ProtectedRoute>
            } />

            <Route path="/configuracion" element={
              <ProtectedRoute permisoRequerido="Configuración">
                {renderLayout(<ConfiguracionView />, "Configuración")}
              </ProtectedRoute>
            } />

            {/* RUTAS EXCLUSIVAS Y GERENCIA */}
            <Route path="/matriz-permisos" element={
              <ProtectedRoute permisoRequerido="Matriz de Permisos">
                {renderLayout(<MatrizPermisosView />, "Matriz de Permisos")}
              </ProtectedRoute>
            } />

            <Route path="/historial" element={
              <ProtectedRoute permisoRequerido="Historial de Actividad">
                {renderLayout(<HistorialActividadView />, "Historial de Actividad")}
              </ProtectedRoute>
            } />

            <Route path="/informes" element={
              <ProtectedRoute permisoRequerido="Informes">
                {renderLayout(<InformesView />, "Informes")}
              </ProtectedRoute>
            } />

            <Route path="/gestion-usuarios" element={
              <ProtectedRoute permisoRequerido="Gestión de Usuarios">
               <GestionUsuariosView />
              </ProtectedRoute>
            } />

            <Route path="/maquinas" element={
              <ProtectedRoute permisoRequerido="Equipos / Máquinas">
                {renderLayout(<MaquinasView />, "Equipos / Máquinas")}
              </ProtectedRoute>
            } />

            <Route path="/mobile-home" element={
              <ProtectedRoute permisoRequerido="Panel Principal">
                <MobileLayout />
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute permisoRequerido="Panel Principal">
                {renderLayout(<DashboardPrincipal />, "Panel Principal")}
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </TurnoProvider>
    </ThemeProvider>
  );
}

export default App;