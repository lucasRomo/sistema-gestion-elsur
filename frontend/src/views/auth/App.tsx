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
import { TurnoProvider } from '../../Context/TurnoContext';

function App() {
  return (
    <TurnoProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomeView onIrARegistro={() => window.location.href='/registro'} onIrALogin={() => window.location.href='/login'} />} />
        <Route path="/registro" element={<RegisterView onVolver={() => window.location.href='/'} />} />
        <Route path="/login" element={<LoginView onLoginExitoso={() => window.location.href='/clientes'} onVolver={() => window.location.href='/'} />} />

        <Route path="/clientes" element={<ClienteView />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/insumos" element={<Insumos />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/dashboard" element={<VentaRapida />} /> 

        <Route path="/caja" element={<CajaView /> } />
        <Route path="/gestion-usuarios" element={<GestionUsuariosView />} />
        <Route path="/crear-pedido" element={<CrearPedidoView />} />
        <Route path="/pedidos-pendientes" element={<PedidosPendientesPage />} />
        <Route path="/historial-pedidos" element={<HistorialPedidosPage />} />
        <Route path="/caja" element={<CajaView />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
    </TurnoProvider>
  );
}

export default App;