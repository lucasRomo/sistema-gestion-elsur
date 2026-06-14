import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WelcomeView } from './WelcomeView';
import { RegisterView } from './RegisterView';
import { LoginView } from './LoginView';
import { ClienteView } from '../ClienteView'; // Tu nueva vista

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas de Autenticación */}
        <Route path="/" element={<WelcomeView onIrARegistro={() => window.location.href='/registro'} onIrALogin={() => window.location.href='/login'} />} />
        <Route path="/registro" element={<RegisterView onVolver={() => window.location.href='/'} />} />
        <Route path="/login" element={<LoginView onLoginExitoso={() => window.location.href='/clientes'} onVolver={() => window.location.href='/'} />} />

        {/* Módulos de la App (Después del login) */}
        <Route path="/clientes" element={<ClienteView />} />
        {/* Aquí irán tus futuras rutas: <Route path="/inventario" element={<InventarioView />} /> */}
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;