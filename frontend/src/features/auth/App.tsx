import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WelcomeView } from '../primermenu/view/WelcomeView';
import { RegisterView } from '../primermenu/view/RegisterView';
import { LoginView } from '../primermenu/view/LoginView';
import { SidebarLayout } from '../../components/layouts/SidebarLayout';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { PortonGate } from '../../components/common/PortonGate'; 
import { TurnoProvider } from '../../Context/TurnoContext';
import { ThemeProvider } from '../../Context/ThemeContext';
import { useIsMobile } from "../../hook/useIsMobile";
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { DialogHost } from '../../components/common/DialogHost';
import { ToastHost } from '../../components/common/ToastHost';
import { BannerSinConexion } from '../../components/common/BannerSinConexion';
import { CerrarModalConEscape } from '../../components/common/CerrarModalConEscape';
import { BackupReminderModal } from '../../components/common/BackupReminderModal';

// Cada pantalla se descarga recién cuando se entra a ella: antes el login bajaba todo el
// sistema (~4 MB de JS con ExcelJS, jsPDF, gráficos y el visor de PDF).
const ClienteView = lazy(() => import('../../features/clientes/view/ClienteView').then(m => ({ default: m.ClienteView })));
const Proveedores = lazy(() => import('../../features/proveedores/view/Proveedores').then(m => ({ default: m.Proveedores })));
const Insumos = lazy(() => import('../../features/insumos/view/Insumos').then(m => ({ default: m.Insumos })));
const Productos = lazy(() => import('../../features/productos/view/Productos').then(m => ({ default: m.Productos })));
const DashboardPrincipal = lazy(() => import('../dashboardprincipal/view/DashboardPrincipalView').then(m => ({ default: m.DashboardPrincipal })));
const CrearPedidoView = lazy(() => import('../pedidos/crearpedidos/view/CrearPedidoView').then(m => ({ default: m.CrearPedidoView })));
const PedidosPendientesView = lazy(() => import('../../features/pedidos/pedidospendientes/view/PedidosPendientesView').then(m => ({ default: m.PedidosPendientesView })));
const HistorialPedidosPage = lazy(() => import('../../features/pedidos/historialpedidos/view/HistorialPedidosView').then(m => ({ default: m.HistorialPedidosPage })));
const GestionUsuariosView = lazy(() => import('../../features/usuarios/view/GestionUsuariosView').then(m => ({ default: m.GestionUsuariosView })));
const CajaView = lazy(() => import('../../features/caja/view/CajaView').then(m => ({ default: m.CajaView })));
const RepositorioDigitalView = lazy(() => import('../../features/repositorio/view/RepositorioDigitalView').then(m => ({ default: m.RepositorioDigitalView })));
const MatrizPermisosView = lazy(() => import('../../features/matrizpermisos/view/MatrizPermisosView').then(m => ({ default: m.MatrizPermisosView })));
const ConfiguracionView = lazy(() => import('../../features/configuracion/views/ConfiguracionView').then(m => ({ default: m.ConfiguracionView })));
const InformesView = lazy(() => import('../../features/informes/views/InformesView').then(m => ({ default: m.InformesView })));
const HistorialActividadView = lazy(() => import('../../features/historial/view/HistorialActividadView').then(m => ({ default: m.HistorialActividadView })));
const MaquinasView = lazy(() => import('../../features/maquinas/view/MaquinasView').then(m => ({ default: m.MaquinasView })));
// El layout móvil importa Informes (gráficos + jsPDF): también se carga a demanda.
const MobileLayout = lazy(() => import('../../components/layouts/MobileLayout').then(m => ({ default: m.MobileLayout })));
const CompraInsumosView = lazy(() => import('../compraInsumos/views/CompraInsumosView').then(m => ({ default: m.CompraInsumosView })));

const CargandoPantalla = () => (
  <div className="d-flex flex-column align-items-center justify-content-center font-monospace" style={{ minHeight: '100vh' }}>
    <div className="spinner-border mb-3" role="status" style={{ color: '#8e45e0', width: '3rem', height: '3rem' }} />
    <span className="fw-bold" style={{ color: '#8e45e0' }}>Cargando...</span>
  </div>
);

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
          <Suspense fallback={<CargandoPantalla />}>
          <Routes>
            <Route path="/" element={
              <PortonGate>
                <WelcomeView onIrARegistro={() => window.location.href='/registro'} onIrALogin={() => window.location.href='/login'} />
              </PortonGate>
            } />

            <Route path="/registro" element={
              <PortonGate>
                <RegisterView onVolver={() => window.location.href='/'} />
              </PortonGate>
            } />
            
            <Route path="/login" element={
              <PortonGate>
                <LoginView 
                  onLoginExitoso={() => {
                    window.location.href = isMobile ? '/informes' : '/dashboard';
                  }} 
                  onVolver={() => window.location.href='/'} 
                />
              </PortonGate>
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
          </Suspense>
          <LoadingOverlay />
          <DialogHost />
          <ToastHost />
          <BannerSinConexion />
          <CerrarModalConEscape />
          <BackupReminderModal />
        </BrowserRouter>
      </TurnoProvider>
    </ThemeProvider>
  );
}

export default App;