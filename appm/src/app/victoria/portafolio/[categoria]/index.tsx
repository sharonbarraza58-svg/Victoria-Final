import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import { obtenerPerfil, type Perfil } from '@/lib/auth';
import { Subcarpeta, obtenerSubcarpetas } from '@/lib/portafolio';

const NOMBRES_CARPETA: Record<string, string> = {
  planes_mejoramiento: 'Planes de mejoramiento',
  etapa_productiva: 'Formato etapa productiva',
  evidencias_aprendizaje: 'Evidencias de aprendizaje',
  plan_trabajo_concertado: 'Plan de trabajo concertado',
  otros: 'Otros',
};

export default function SubcarpetasPortafolioScreen() {
  const { categoria } = useLocalSearchParams<{ categoria: string }>();
  const clave = categoria ?? 'otros';

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [subcarpetas, setSubcarpetas] = useState<Subcarpeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerPerfil().then(setPerfil);
    obtenerSubcarpetas(clave)
      .then(setSubcarpetas)
      .catch((err) => setError(err.message));
  }, [clave]);

  const nombreCompleto = perfil ? [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') : '';

  return (
    <VictoriaScreenShell>
      <PaneHeader
        eyebrow="Portafolio"
        title={NOMBRES_CARPETA[clave] ?? clave}
        backHref="/victoria/portafolio"
      />

      <Text style={styles.breadcrumb}>
        Portafolio &gt; {(NOMBRES_CARPETA[clave] ?? clave).toUpperCase()}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!subcarpetas && !error ? (
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      ) : null}

      {subcarpetas ? (
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.colNombre, styles.headerNombre]}>Nombre</Text>
            <Text style={[styles.headerCell, styles.colDato]}>Modificado</Text>
            <Text style={[styles.headerCell, styles.colDato]}>Modificado Por</Text>
            <Text style={[styles.headerCell, styles.colDato]}>Archivos</Text>
          </View>

          {subcarpetas.map((sub) => (
            <Link key={sub.subcarpeta} href={`/victoria/portafolio/${clave}/${sub.subcarpeta}` as never} asChild>
              <Pressable style={styles.row}>
                <View style={[styles.rowMain, styles.colNombre]}>
                  <View style={styles.folderIcon}>
                    <Ionicons name="folder" size={16} color={VictoriaColors.white} />
                  </View>
                  <Text style={styles.rowTitle}>{sub.nombre}</Text>
                </View>
                <Text style={[styles.rowText, styles.colDato]}>
                  {sub.ultima_modificacion
                    ? new Date(sub.ultima_modificacion).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                      })
                    : '—'}
                </Text>
                <Text style={[styles.rowText, styles.colDato]}>
                  {sub.total_archivos > 0 ? nombreCompleto : '—'}
                </Text>
                <Text style={[styles.rowText, styles.colDato]}>
                  {sub.total_archivos} {sub.total_archivos === 1 ? 'doc' : 'docs'}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      ) : null}

      <ExitButton />
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 20 },
  error: { color: '#ff8a8a', marginBottom: 12 },
  breadcrumb: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 14,
  },
  table: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  headerNombre: { paddingLeft: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  folderIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: VictoriaColors.darkGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: VictoriaColors.black,
    flexShrink: 1,
  },
  rowText: {
    fontSize: 13,
    color: '#555555',
  },
  colNombre: { flex: 3 },
  colDato: { flex: 1.2, textAlign: 'center' },
});