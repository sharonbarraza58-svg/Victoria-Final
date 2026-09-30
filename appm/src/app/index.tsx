import { Redirect } from 'expo-router';

/**
 * Ruta raíz ("/"). La app Victoria no usa el Home de la plantilla de Expo:
 * al entrar, redirige directo a la pantalla de login real.
 */
export default function Index() {
  return <Redirect href="/login" />;
}
