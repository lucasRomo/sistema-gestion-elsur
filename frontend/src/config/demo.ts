// Demo pública de la Muestra (proyecto gestapro-demo en Vercel, rama demo): se entra sin portón ni
// contraseña y se ve un cartel de "datos de prueba". En la app real esto siempre es false.
export const ES_DEMO =
  import.meta.env.VITE_DEMO === 'true' || window.location.hostname.startsWith('gestapro-demo');
