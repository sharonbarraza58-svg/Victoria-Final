import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, PaneHeader, SubCard } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import { agruparPorTrimestre, Competencia, obtenerMisCompetencias, slugificar } from '@/lib/competencias';


const NOMBRE_TRIMESTRE: Record<string, string> = {
  T1: 'Trimestre 1',
  T2: 'Trimestre 2',
  T3: 'Trimestre 3',
  T4: 'Trimestre 4',
};

export default function CompetenciasScreen() {
  const [competencias, setCompetencias] = useState<Competencia[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

  useEffect(() => {
    obtenerMisCompetencias()
      .then((datos) => {
        setCompetencias(datos);
        const grupos = agruparPorTrimestre(datos);
        // Arranca abierto solo el primer trimestre con datos, igual que
        // el diseño (Trimestre 1 aparece desplegado de entrada).
        if (grupos.length > 0) setAbiertos(new Set([grupos[0].trimestre]));
      })
      .catch((err) => setError(err.message));
  }, []);

  function alternar(trimestre: string) {
    setAbiertos((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(trimestre)) {
        siguiente.delete(trimestre);
      } else {
        siguiente.add(trimestre);
      }
      return siguiente;
    });
  }

  const grupos = competencias ? agruparPorTrimestre(competencias) : [];

  return (
    <VictoriaScreenShell>
      <PaneHeader eyebrow="VICTORIA > Competencias" title="Competencias" />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!competencias && !error ? (
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      ) : null}

      {competencias && grupos.length === 0 ? (
        <Text style={styles.empty}>
          Todavía no hay competencias asignadas a tu programa de formación.
        </Text>
      ) : null}

      <View style={styles.grid}>
        {grupos.map((grupo) => {
          const abierto = abiertos.has(grupo.trimestre);
          return (
            <View key={grupo.trimestre} style={styles.column}>
              <Pressable style={styles.header} onPress={() => alternar(grupo.trimestre)}>
                <View style={styles.headerIcon}>
                  <Ionicons name="layers-outline" size={18} color={VictoriaColors.textOnLight} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>
                    {NOMBRE_TRIMESTRE[grupo.trimestre] ?? grupo.trimestre}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {grupo.competencias.length}{' '}
                    {grupo.competencias.length === 1 ? 'competencia' : 'competencias'}
                  </Text>
                </View>
                <Ionicons
                  name={abierto ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={VictoriaColors.textOnLight}
                />
              </Pressable>

              {abierto ? (
                <View style={styles.subList}>
                  {grupo.competencias.map((c) => (
                    <SubCard
                      key={c.id_competencia}
                      icon="layers-outline"
                      title={c.nombre}
                      subtitle={c.nombre_instructor ? `- ${c.nombre_instructor}` : 'Sin instructor asignado'}
                      actionLabel="Ver tareas"
                      actionHref={`/victoria/competencias/${grupo.trimestre}/${slugificar(c.nombre)}`}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <ExitButton />
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 20 },
  error: { color: '#ff8a8a', marginBottom: 12 },
  empty: { color: 'rgba(255, 255, 255, 0.6)' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  column: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 260,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    padding: 16,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 15, fontWeight: '600', color: VictoriaColors.black },
  headerSubtitle: { fontSize: 12, color: '#666666' },
  subList: { gap: 8 },
});