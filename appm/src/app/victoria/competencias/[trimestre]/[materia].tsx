import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, PaneHeader, StatusBadge, SubCard } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import { Competencia, obtenerMisCompetencias, slugificar } from '@/lib/competencias';
import { ETIQUETA_ESTADO, obtenerTareasDeCompetencia, TareaConEntrega } from '@/lib/tareas';

export default function CompetenciaDetalleScreen() {
  const { trimestre, materia: materiaSlug } = useLocalSearchParams<{
    trimestre: string;
    materia: string;
  }>();

  const [competencia, setCompetencia] = useState<Competencia | null | undefined>(undefined);
  const [tareas, setTareas] = useState<TareaConEntrega[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clave = (trimestre ?? '').toUpperCase();

    obtenerMisCompetencias()
      .then((todas) => {
        const encontrada = todas.find(
          (c) => c.trimestre === clave && slugificar(c.nombre) === materiaSlug
        );
        setCompetencia(encontrada ?? null);
        if (!encontrada) return null;
        return obtenerTareasDeCompetencia(encontrada.id_competencia);
      })
      .then((datos) => {
        if (datos) setTareas(datos);
      })
      .catch((err) => setError(err.message));
  }, [trimestre, materiaSlug]);

  return (
    <VictoriaScreenShell>
      <PaneHeader
        eyebrow="Competencias"
        title={competencia?.nombre ?? 'Materia'}
        backHref="/victoria/competencias"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {competencia === undefined ? (
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      ) : null}

      {competencia === null ? (
        <Text style={styles.empty}>No se encontró esta competencia.</Text>
      ) : null}

      {competencia && tareas && tareas.length === 0 ? (
        <Text style={styles.empty}>Aún no hay tareas asignadas para esta competencia.</Text>
      ) : null}

      {competencia && tareas && tareas.length > 0 ? (
        <View style={styles.list}>
            {tareas.map((tarea) => (
            <Link key={tarea.id_tarea} href={`/victoria/tarea/${tarea.id_tarea}` as never} style={styles.link}>
              <View style={styles.row}>
                <View style={styles.mainCol}>
                  <Text style={styles.taskTitle}>{tarea.titulo}</Text>
                  {tarea.descripcion ? <Text style={styles.taskDesc}>{tarea.descripcion}</Text> : null}
                  <StatusBadge
                    label={
                      tarea.fecha_limite
                        ? `Entrega: ${new Date(tarea.fecha_limite).toLocaleDateString('es-CO')}`
                        : 'Sin fecha límite'
                    }
                  />
                </View>
                <SubCard
                  icon="layers-outline"
                  title={ETIQUETA_ESTADO[tarea.estado]}
                  subtitle={tarea.nota != null ? `Nota: ${tarea.nota}` : 'Sin calificar'}
                />
              </View>
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
  empty: { color: 'rgba(255, 255, 255, 0.5)' },
  list: { gap: 16 },
  mainCol: {
    flex: 2,
    minWidth: 260,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  taskTitle: { fontSize: 15, fontWeight: '600', color: '#000000' },
  taskDesc: { fontSize: 13, color: '#555555' },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    marginBottom: 4,
  },
  link: {
    width: '100%',
    textDecorationLine: 'none',
    ...({ outlineStyle: 'none' } as object), // quita el contorno negro de foco en web
  },
});
