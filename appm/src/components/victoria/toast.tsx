import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

/**
 * Aviso flotante ("toast") de confirmación, reutilizable en toda la app.
 *
 * Antes, cuando una acción terminaba bien (guardar una nota, borrar una
 * notificación, cerrar sesión...) la única señal era que el modal se
 * cerraba o la lista se actualizaba sola -- fácil de no notar. Este
 * componente agrega el mismo tipo de aviso "✓ Hecho" que ya usaban las
 * guías de referencia del proyecto (esquina inferior, con blur oscuro,
 * igual que el resto de superposiciones de Victoria), pero centralizado:
 * se monta UNA vez en app/_layout.tsx (VictoriaToastProvider) y cualquier
 * pantalla lo dispara con el hook useVictoriaToast(), sin tener que montar
 * su propio Modal/estado para esto.
 */

type TipoToast = 'exito' | 'error' | 'info';

type ToastContextValue = {
  mostrarExito: (mensaje: string) => void;
  mostrarError: (mensaje: string) => void;
  mostrarInfo: (mensaje: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONO_POR_TIPO: Record<TipoToast, keyof typeof Ionicons.glyphMap> = {
  exito: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
};

// Mismos verdes/rojos que ya usa el resto de la app (VictoriaColors /
// errorText de las otras pantallas) -- no se inventó paleta nueva.
const COLOR_POR_TIPO: Record<TipoToast, string> = {
  exito: '#8fa47e',
  error: '#e07a7a',
  info: '#7aa8c9',
};

const DURACION_MS = 2600;

export function VictoriaToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ mensaje: string; tipo: TipoToast } | null>(null);
  const opacidad = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ocultar = useCallback(() => {
    Animated.timing(opacidad, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setToast(null);
    });
  }, [opacidad]);

  const mostrar = useCallback(
    (mensaje: string, tipo: TipoToast) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ mensaje, tipo });
      opacidad.setValue(0);
      Animated.timing(opacidad, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timeoutRef.current = setTimeout(ocultar, DURACION_MS);
    },
    [opacidad, ocultar]
  );

  const valor = useMemo<ToastContextValue>(
    () => ({
      mostrarExito: (mensaje: string) => mostrar(mensaje, 'exito'),
      mostrarError: (mensaje: string) => mostrar(mensaje, 'error'),
      mostrarInfo: (mensaje: string) => mostrar(mensaje, 'info'),
    }),
    [mostrar]
  );

  return (
    <ToastContext.Provider value={valor}>
      {children}
      {toast ? (
        <Animated.View pointerEvents="none" style={[styles.wrap, { opacity: opacidad }]}>
          <BlurView intensity={40} tint="dark" style={styles.card}>
            <Ionicons name={ICONO_POR_TIPO[toast.tipo]} size={18} color={COLOR_POR_TIPO[toast.tipo]} />
            <Text style={styles.texto}>{toast.mensaje}</Text>
          </BlurView>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

/** Úsalo en cualquier pantalla: const { mostrarExito } = useVictoriaToast(); */
export function useVictoriaToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Nunca debería pasar (VictoriaToastProvider vive en app/_layout.tsx,
    // por encima de todo el Stack), pero si algo lo usa fuera de ese árbol
    // preferimos no tronar la pantalla -- simplemente no se ve el aviso.
    return { mostrarExito: () => {}, mostrarError: () => {}, mostrarInfo: () => {} };
  }
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    maxWidth: '90%',
  },
  texto: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
});
