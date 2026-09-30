import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { VictoriaNavbar } from '@/components/victoria/navbar';
import { VictoriaRadius } from '@/constants/victoria-theme';
import { cerrarSesion } from '@/lib/auth';

const NOTCH_WIDTH = 130;
const NOTCH_HEIGHT = 50;

/**
 * Equivalente a <body class="dashboard-body"> + <header class="app-navbar">
 * + <main class="container main-content-shift"><div class="glass-viewport-wrapper">
 * de templates/base.html.
 *
 * El panel de cristal ocupa SIEMPRE el alto restante de la pantalla (debajo
 * del navbar). Si el contenido es más largo, el scroll ocurre dentro del
 * panel; el panel nunca crece ni se encoge.
 */
export function VictoriaScreenShell({ children }: { children: React.ReactNode }) {
  const viewportWrapRef = useRef<View>(null);
  const [notchLeft, setNotchLeft] = useState<number | null>(64);

  // Convierte el X absoluto del tab activo (medido por el navbar) en un
  // "left" relativo al contenedor del panel, para poder usarlo en un
  // View con position:absolute dentro de ese contenedor.
  const handleActiveTabMeasure = useCallback((tabCenterX: number) => {
    if (Platform.OS !== 'web') return;
    const el = viewportWrapRef.current as unknown as HTMLElement | null;
    if (!el || typeof el.getBoundingClientRect !== 'function') return;
    const wrapRect = el.getBoundingClientRect();
    setNotchLeft(tabCenterX - wrapRect.left - NOTCH_WIDTH / 2);
  }, []);

  async function handleLogout() {
    await cerrarSesion();
    router.replace('/login');
  }

  const panelContent = (
    <ScrollView style={styles.innerScroll} contentContainerStyle={styles.innerScrollContent}>
      {children}
    </ScrollView>
  );

  return (
    <View style={styles.body}>
      {/* Capa de fondo fija: siempre del tamaño de la ventana. */}
      <View style={styles.bgLayer} pointerEvents="none">
        <Image
          source={require('@/assets/images/victoria/dashboard-bg.jpg')}
          style={styles.bgImage}
        />
      </View>

      <VictoriaNavbar onActiveTabMeasure={handleActiveTabMeasure} />

      <View style={styles.main}>
        <View style={styles.mainContent}>
          <View style={styles.viewportWrap} ref={viewportWrapRef}>
            {Platform.OS === 'web' ? (
              <View
                style={[
                  styles.notch,
                  { left: notchLeft },
                  // backdropFilter pasado como objeto plano inline: dentro
                  // de StyleSheet.create a veces no sobrevive la
                  // conversión a CSS en web.
                  { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as object,
                ]}
              />
            ) : null}

            {Platform.OS === 'web' ? (
              <View
                style={[
                  styles.viewport,
                  { backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)' } as object,
                ]}>
                {panelContent}
              </View>
            ) : (
              <BlurView intensity={40} tint="light" style={styles.viewport}>
                {panelContent}
              </BlurView>
            )}
          </View>
        </View>
      </View>

      {/* Botón de cerrar sesión: afuera del panel, esquina inferior izquierda. */}
      <Pressable
        style={styles.logoutBtn}
        onPress={handleLogout}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión">
        <Ionicons name="log-out-outline" size={22} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Alto EXACTO de la ventana: nada se estira con el contenido.
  body: {
    flex: 1,
    backgroundColor: '#030705',
    ...(Platform.OS === 'web'
      ? ({ height: '100vh', overflow: 'hidden' } as object)
      : null),
  },
  // Capa fija al tamaño de la ventana (web) o de la pantalla (nativo).
  bgLayer: {
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
        } as object)
      : { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }),
  },
  bgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // Zona bajo el navbar: ocupa todo el alto restante.
  main: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 44, // espacio para la lengüeta (notch)
    paddingBottom: 30,
    minHeight: 0,
  },
  mainContent: {
    flex: 1,
    width: '100%',
    maxWidth: 1280,
    // Margen lateral simétrico para que el botón de cerrar sesión
    // (esquina inferior izquierda) quede afuera del panel de cristal.
    paddingHorizontal: 76,
    minHeight: 0,
  },
  viewportWrap: {
    flex: 1,
    minHeight: 0,
    ...(Platform.OS === 'web' ? ({ position: 'relative' } as object) : null),
  },
  // Trapecio ancho y alto (no un triángulo flaco): flat-top que se une
  // al borde superior del panel, imitando la "lengüeta" que sale del tab
  // activo del navbar. "left" se calcula dinámicamente arriba según qué
  // tab esté activo.
  notch: {
    position: 'absolute',
    top: -NOTCH_HEIGHT + 8,
    width: NOTCH_WIDTH,
    height: NOTCH_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.41)',
    zIndex: 2,
    ...({
      clipPath: 'polygon(50% 0%, 85% 100%, 15% 100%)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
    } as object),
  },
  // Panel de cristal: llena todo el alto disponible, tamaño fijo.
  viewport: {
    flex: 1,
    minHeight: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.41)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: VictoriaRadius.viewport,
    overflow: 'hidden',
  },
  logoutBtn: {
    position: 'absolute',
    left: 20,
    bottom: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    zIndex: 5,
  },
  // El scroll vive DENTRO del panel.
  innerScroll: {
    flex: 1,
    minHeight: 0,
  },
  innerScrollContent: {
    flexGrow: 1,
    padding: 28,
  },
});