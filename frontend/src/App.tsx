import { useState } from 'react';
import { WelcomeView } from './views/auth/WelcomeView';
import { RegisterView } from './views/auth/RegisterView';

function App() {
  const [vistaActual, setVistaActual] = useState<'bienvenida' | 'registro'>('bienvenida');

  return (
    <>
      {vistaActual === 'bienvenida' ? (
        // Le pasamos una función al botón de registro (puedes añadirla a las props de WelcomeView)
        <WelcomeView onIrARegistro={() => setVistaActual('registro')} />
      ) : (
        <RegisterView onVolver={() => setVistaActual('bienvenida')} />
      )}
    </>
  );
}

export default App;