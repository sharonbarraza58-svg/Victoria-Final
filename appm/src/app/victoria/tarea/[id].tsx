import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, FileThumbnail, PaneHeader, PillButton, StatusBadge } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import { obtenerDetalleTarea, TareaDetalle } from '@/lib/tareas';

export default function TareaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tarea, setTarea] = useState<TareaDetalle | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    obtenerDetalleTarea(Number(id))
      .then(setTarea)
      .catch((err) => {
        setError(err.message);
        setTarea(null);
      });
  }, [id]);

  return (
    <VictoriaScreenShell>
      <PaneHeader eyebrow="Competencias" title={tarea?.titulo ?? 'Tarea'} backHref="/victoria/competencias" />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {tarea === undefined ? <ActivityIndicator color={VictoriaColors.white} style={styles.loader} /> : null}
      {tarea === null && !error ? <Text style={styles.empty}>No se encontró esta tarea.</Text> : null}

      {tarea ? (
        <View style={styles.row}>
          <View style={styles.mainCol}>
            <Text style={styles.title}>{tarea.titulo}</Text>

            {tarea.nombre_instructor ? (
              <Text style={styles.meta}>
                {tarea.nombre_instructor} · {new Date(tarea.fecha_creacion).toLocaleDateString('es-CO')}
              </Text>
            ) : null}
            {tarea.fecha_limite ? (
              <Text style={styles.meta}>
                Fecha límite: {new Date(tarea.fecha_limite).toLocaleDateString('es-CO')}
              </Text>
            ) : null}

            {tarea.descripcion ? <Text style={styles.desc}>{tarea.descripcion}</Text> : null}

            {tarea.archivos_referencia.length > 0 ? (
              <View style={styles.filesRow}>
                {tarea.archivos_referencia.map((archivo) => (
                  <FileThumbnail key={archivo.id_archivo} label={archivo.nombre_archivo} href={archivo.url} />
                ))}
              </View>
            ) : null}

            <View style={styles.badgesRow}>
              {tarea.fecha_limite ? (
                <StatusBadge label={new Date(tarea.fecha_limite).toLocaleDateString('es-CO')} />
              ) : null}
              {tarea.archivos_referencia.length > 0 ? (
                <StatusBadge
                  label={`${tarea.archivos_referencia.length} ${
                    tarea.archivos_referencia.length === 1 ? 'archivo' : 'archivos'
                  }`}
                />
              ) : null}
            </View>
          </View>

          <PillButton label="Ir a Portafolio" variant="dark" href="/victoria/portafolio" />
        </View>
      ) : null}

      <ExitButton />
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 20 },
  error: { color: '#ff8a8a', marginBottom: 12 },
  empty: { color: 'rgba(255, 255, 255, 0.5)' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' },
  mainCol: {
    flex: 1,
    minWidth: 280,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '600', color: '#000000' },
  meta: { fontSize: 12, color: '#666666' },
  desc: { fontSize: 13, color: '#444444', marginTop: 6 },
  filesRow: { flexDirection: 'row', gap: 12, marginTop: 6, flexWrap: 'wrap' },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
});