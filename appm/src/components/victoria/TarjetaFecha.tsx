import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

// Icono que va en el centro del círculo verde
const ICONO_CENTRO = require('@/assets/images/victoria/v-logo.png');

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function fechaActual() {
  const hoy = new Date(); // calendario del dispositivo
  return { mes: MESES[hoy.getMonth()], anio: String(hoy.getFullYear()) };
}

/**
 * Tarjeta del login: el mes y el año salen del calendario del dispositivo.
 * Todo va en porcentajes, así que escala con el ancho (maxWidth).
 *
 * FIX Android/Fabric: en el primer render `ancho` vale 0, lo que producía
 * fontSize = 0 y tumbaba la app ("FontSize should be a positive value").
 * Ahora los textos solo se renderizan cuando ya hay un ancho medido, y
 * además el tamaño tiene un mínimo de 1.
 */
export function TarjetaFecha() {
  const [fecha, setFecha] = useState(fechaActual);
  const [ancho, setAncho] = useState(0);

  // Si la app queda abierta al cambiar de mes, se actualiza sola.
  useEffect(() => {
    const id = setInterval(() => setFecha(fechaActual()), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.card} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      <View style={styles.circulo} />

      {/* Icono centrado en la parte visible del círculo */}
      <View style={styles.iconoWrap} pointerEvents="none">
        <Image source={ICONO_CENTRO} style={styles.icono} resizeMode="contain" />
      </View>

      <View style={styles.mancha} />

      <BlurView intensity={90} tint="light" style={styles.panel}>
        {ancho > 0 && (
          <>
            <Text
              style={[
                styles.mes,
                {
                  fontSize: Math.max(1, ancho * 0.17),
                  lineHeight: Math.max(1, ancho * 0.19),
                },
              ]}>
              {fecha.mes}
            </Text>
            <Text
              style={[
                styles.anio,
                {
                  fontSize: Math.max(1, ancho * 0.155),
                  lineHeight: Math.max(1, ancho * 0.17),
                },
              ]}>
              {fecha.anio}
            </Text>
          </>
        )}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 522 / 860,
    backgroundColor: '#f5f5f5',
    borderRadius: 40,
    overflow: 'hidden',
  },
  circulo: {
    position: 'absolute',
    left: '20%',
    top: '30%',
    width: '65%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#1f4a2d',
  },
  iconoWrap: {
    position: 'absolute',
    left: '52.6%',
    right: '15%',
    top: '30%',
    height: '39.5%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icono: {
    width: '100%',
    aspectRatio: 1,
  },
  mancha: {
    position: 'absolute',
    left: '17%',
    top: '33%',
    width: '34%',
    height: '42%',
    borderRadius: 999,
    backgroundColor: '#2f5a3f',
  },
  panel: {
    position: 'absolute',
    left: '5.6%',
    top: '3.3%',
    bottom: '3.1%',
    width: '47%',
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(245, 247, 244, 0.6)',
    alignItems: 'center',
    paddingTop: '6%',
  },
  mes: {
    color: '#111111',
    fontWeight: '300',
  },
  anio: {
    color: '#8a8a8a',
    fontWeight: '300',
  },
});