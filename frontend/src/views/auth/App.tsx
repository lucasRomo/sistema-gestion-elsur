import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WelcomeView } from './WelcomeView';
import { RegisterView } from './RegisterView';
import { LoginView } from './LoginView';
import { ClienteView } from '../ClienteView'; 
import { Proveedores } from '../Proveedores';
import { Insumos } from '../Insumos';
import { Productos } from '../Productos';
import { VentaRapida } from '../VentaRapida';
import { CrearPedidoView } from '../CrearPedidoView'; 
import { PedidosPendientesPage } from '../PedidosPendientesView'; 
import { HistorialPedidosPage } from '../HistorialPedidosView'; 
import { GestionUsuariosView } from '../GestionUsuariosView'; 
import { CajaView } from '../CajaView';
import { RepositorioDigitalView } from '../RepositorioDigitalView';
import { SidebarLayout } from '../../components/layouts/SidebarLayout';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { MatrizPermisosView } from '../admin/MatrizPermisosView';
import { ConfiguracionView } from '../config/ConfiguracionView';
import { InformesView } from '../informes/InformesView';
import { TurnoProvider } from '../../Context/TurnoContext';
import { HistorialActividadView } from '../HistorialActividadView';

function App() {
  return (
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
            <PedidosPendientesPage />
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

          {/* RUTAS EXCLUSIVAS DE GERENTE / ADMIN */}
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

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </TurnoProvider>
  );
}

export default App;