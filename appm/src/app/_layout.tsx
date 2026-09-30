import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { VictoriaToastProvider } from '@/components/victoria/toast';
import { haySesionActiva } from '@/lib/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Cada vez que el usuario usa Atrás/Adelante (popstate) y NO hay
    // sesión activa, en vez de solo "mandarlo" al login, volvemos a
    // empujar /login HACIA ADELANTE en el historial. Es una trampa: no
    // importa cuántas veces le dé a Atrás, cada intento choca con esta
    // nueva entrada y nunca llega a asentarse en una pantalla protegida.
    function protegerHistorial() {
      if (!haySesionActiva()) {
        window.history.pushState(null, '', '/login');
        router.replace('/login');
      }
    }

    window.addEventListener('popstate', protegerHistorial);
    return () => window.removeEventListener('popstate', protegerHistorial);
  }, []);

  return (
    <VictoriaToastProvider>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </VictoriaToastProvider>
  );
}
