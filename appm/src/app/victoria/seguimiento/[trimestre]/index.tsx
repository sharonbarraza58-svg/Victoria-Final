import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, ListRow, PaneHeader, PillTab } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import {
  MateriaSeguimiento,
  ResumenTrimestre,
  obtenerMateriasSeguimiento,
  obtenerResumenSeguimiento,
} from '@/lib/seguimiento';

const TRIMESTRES_VALIDOS = ['T1', 'T2', 'T3', 'T4'];

export default function SeguimientoScreen() {
  const { trimestre } = useLocalSearchParams<{ trimestre: string }>();
  const trimestreActivo = TRIMESTRES_VALIDOS.includes((trimestre ?? '').toUpperCase())
    ? trimestre!.toUpperCase()
    : 'T1';

  const [resumen, setResumen] = useState<ResumenTrimestre[] | null>(null);
  const [materias, setMaterias] = useState<MateriaSeguimiento[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerResumenSeguimiento()
      .then(setResumen)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    setMaterias(null);
    obtenerMateriasSeguimiento(trimestreActivo)
      .then(setMaterias)
      .catch((err) => setError(err.message));
  }, [trimestreActivo]);

  const datosActivo = resumen?.find((r) => r.trimestre === trimestreActivo);
  const tabsFallback = TRIMESTRES_VALIDOS.map((t) => ({
    trimestre: t,
    numero: t[1],
    competencias: 0,
    evidencias: 0,
  }));

  return (
    <VictoriaScreenShell>
      <PaneHeader eyebrow="Aqui veras tus notas" title="Seguimiento" />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.tabsRow}>
        {(resumen ?? tabsFallback).map((datos) => (
          <PillTab
            key={datos.trimestre}
            label={datos.trimestre}
            count={datos.competencias}
            active={datos.trimestre === trimestreActivo}
            href={`/victoria/seguimiento/${datos.trimestre}`}
          />
        ))}
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryLeft}>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>{trimestreActivo}</Text>
          </View>
          <View>
            <Text style={styles.summaryTitle}>Trimestre {datosActivo?.numero ?? trimestreActivo[1]}</Text>
            <Text style={styles.summarySubtitle}>
              {datosActivo?.competencias ?? 0} competencias - {datosActivo?.evidencias ?? 0} evidencias
            </Text>
          </View>
        </View>
        <View style={styles.summaryStats}>
          <View style={styles.statBlock}>
            <Text style={styles.statNum}>{datosActivo?.evidencias ?? 0}</Text>
            <Text style={styles.statLabel}>Evidencias</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statNum}>{datosActivo?.competencias ?? 0}</Text>
            <Text style={styles.statLabel}>Competencias</Text>
          </View>
        </View>
      </View>

      {!materias && !error ? (
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      ) : null}

      <View style={styles.list}>
        {materias && materias.length === 0 ? (
          <Text style={styles.empty}>Aún no hay materias registradas para este trimestre.</Text>
        ) : null}

        {materias?.map((materia) => (
          <ListRow
            key={materia.id_competencia}
            icon="layers-outline"
            title={materia.nombre}
            subtitle={
              materia.total_archivos === 1
                ? '1 archivo subido'
                : `${materia.total_archivos} archivos subidos`
            }
            actionLabel="Ver Notas"
            actionHref={`/victoria/seguimiento/${trimestreActivo}/${materia.id_competencia}`}
            chevronHref={`/victoria/seguimiento/${trimestreActivo}/${materia.id_competencia}`}
          />
        ))}
      </View>

      <ExitButton />
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: 20 },
  error: { color: '#ff8a8a', marginBottom: 12 },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  summaryRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBadgeText: {
    fontWeight: '700',
    color: '#146c43',
    fontSize: 12,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: VictoriaColors.black,
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#555555',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statBlock: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '300',
    color: VictoriaColors.textOnLight,
  },
  statLabel: {
    fontSize: 11,
    color: '#555555',
  },
  list: {
    gap: 12,
  },
  empty: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});