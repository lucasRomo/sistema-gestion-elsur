import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WelcomeView } from './WelcomeView';
import { RegisterView } from './RegisterView';
import { LoginView } from './LoginView';
import { ClienteView } from '../ClienteView'; 
import { Proveedores } from '../Proveedores';
import { Insumos } from '../Insumos';
import { Productos } from '../Productos';
import { VentaRapida } from '../VentaRapida';
import { GestionUsuariosView } from '../GestionUsuariosView'; 
import { CrearPedidoView } from '../CrearPedidoView'; 
import { PedidosPendientesPage } from '../PedidosPendientesView'; 
import { HistorialPedidosPage } from '../HistorialPedidosView';
import { SidebarLayout } from '../../components/layouts/SidebarLayout';

import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { MatrizPermisosView } from '../admin/MatrizPermisosView';
import { ConfiguracionView } from '../config/ConfiguracionView';
import { InformesView } from '../informes/InformesView';

function App() {
  return (
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
            <SidebarLayout activeItem="Pedidos Pendientes">
              <PedidosPendientesPage />
            </SidebarLayout>
          </ProtectedRoute>
        } />

        <Route path="/historial-pedidos" element={
          <ProtectedRoute permisoRequerido="Historial de Pedidos">
            <SidebarLayout activeItem="Historial de Pedidos">
              <HistorialPedidosPage />
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
          <ProtectedRoute soloAdmin={true}>
            <SidebarLayout activeItem="Matriz de Permisos">
              <MatrizPermisosView />
            </SidebarLayout>
          </ProtectedRoute>
        } />

        <Route path="/informes" element={
          <ProtectedRoute soloAdmin={true}>
            <SidebarLayout activeItem="Informes">
              <InformesView />
            </SidebarLayout>
          </ProtectedRoute>
        } />
 
        <Route path="/gestion-usuarios" element={
          <ProtectedRoute soloAdmin={true}>
            <SidebarLayout activeItem="Gestión de Usuarios">
              <GestionUsuariosView />
            </SidebarLayout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;