import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WelcomeView } from '../primermenu/view/WelcomeView';
import { RegisterView } from '../primermenu/view/RegisterView';
import { LoginView } from '../primermenu/view/LoginView';
import { ClienteView } from '../../features/clientes/view/ClienteView';
import { Proveedores } from '../../features/proveedores/view/Proveedores';
import { Insumos } from '../../features/insumos/view/Insumos';
import { Productos } from '../../features/productos/view/Productos';
import { VentaRapida } from '../dashboardprincipal/view/DashboardPrincipalView';
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

function App() {
  return (
    <ThemeProvider>
      <TurnoProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WelcomeView onIrARegistro={() => window.location.href='/registro'} onIrALogin={() => window.location.href='/login'} />} />
            <Route path="/registro" element={<RegisterView onVolver={() => window.location.href='/'} />} />
            <Route path="/login" element={<LoginView onLoginExitoso={() => window.location.href='/dashboard'} onVolver={() => window.location.href='/'} />} />

            {/* RUTAS OPERATIVAS CON SIDEBAR Y PROTECCIÓN DE PERMISOS */}
            <Route path="/dashboard" element={
              <ProtectedRoute permisoRequerido="Panel Principal">
                <SidebarLayout activeItem="Panel Principal">
                  <VentaRapida />
                </SidebarLayout>
              </ProtectedRoute>
            } />

            <Route path="/clientes" element={
              <ProtectedRoute permisoRequerido="Clientes">
                <SidebarLayout activeItem="Clientes">
                  <ClienteView />
                </SidebarLayout>
              </ProtectedRoute>
            } />

            <Route path="/proveedores" element={
              <ProtectedRoute permisoRequerido="Proveedores">
                <SidebarLayout activeItem="Proveedores">
                  <Proveedores />
                </SidebarLayout>
              </ProtectedRoute>
            } />

            <Route path="/insumos" element={
              <ProtectedRoute permisoRequerido="Insumos">
                <SidebarLayout activeItem="Insumos">
                  <Insumos />
                </SidebarLayout>
              </ProtectedRoute>
            } />

            <Route path="/productos" element={
              <ProtectedRoute permisoRequerido="Productos">
                <SidebarLayout activeItem="Productos">
                  <Productos />
                </SidebarLayout>
              </ProtectedRoute>
            } />

            <Route path="/crear-pedido" element={
              <ProtectedRoute permisoRequerido="Crear Pedido">
                <SidebarLayout activeItem="Crear Pedido">
                  <CrearPedidoView />
                </SidebarLayout>
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
                <SidebarLayout activeItem="Repositorio Digital">
                  <RepositorioDigitalView />
                </SidebarLayout>
              </ProtectedRoute>
            } />

            <Route path="/configuracion" element={
              <ProtectedRoute permisoRequerido="Configuración">
                <SidebarLayout activeItem="Configuración">
                  <ConfiguracionView />
                </SidebarLayout>
              </ProtectedRoute>
            } />

            {/* RUTAS EXCLUSIVAS Y GERENCIA */}
            <Route path="/matriz-permisos" element={
              <ProtectedRoute permisoRequerido="Matriz de Permisos">
                <SidebarLayout activeItem="Matriz de Permisos">
                  <MatrizPermisosView />
                </SidebarLayout>
              </ProtectedRoute>
            } />

            <Route path="/historial" element={
              <ProtectedRoute permisoRequerido="Historial de Actividad">
                <SidebarLayout activeItem="Historial de Actividad">
                  <HistorialActividadView /> 
                </SidebarLayout>
              </ProtectedRoute>
            } />

            <Route path="/informes" element={
              <ProtectedRoute permisoRequerido="Informes">
                <SidebarLayout activeItem="Informes">
                  <InformesView />
                </SidebarLayout>
              </ProtectedRoute>
            } />

            <Route path="/gestion-usuarios" element={
              <ProtectedRoute permisoRequerido="Gestión de Usuarios">
                <GestionUsuariosView />
              </ProtectedRoute>
            } />

            <Route path="/maquinas" element={
              <ProtectedRoute permisoRequerido="Equipos / Máquinas">
                <SidebarLayout activeItem="Equipos / Máquinas">
                  <MaquinasView />
                </SidebarLayout>
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