import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, ListRow, PaneHeader, PillTab } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import {
  CoordinadorApiError,
  obtenerPortafolioInstructor,
  PortafolioInstructor,
} from '@/lib/coordinador';
import { useRoleGuard } from '@/lib/role-guard';

/**
 * Portafolio de un instructor, visto por el coordinador (Doc3 imagen 4
 * izquierda: tabs T1-T4 + lista de materias con botón "Ver"). Es de solo
 * lectura — a diferencia de victoria/portafolio/[trimestre].tsx (la
 * versión del propio aprendiz/instructor), acá no hay opción de subir
 * archivos, solo consultarlos.
 */
export default function CoordinadorPortafolioTrimestreScreen() {
  const perfil = useRoleGuard(['coordinador']);
  const { idInstructor, trimestre } = useLocalSearchParams<{
    idInstructor: string;
    trimestre: string;
  }>();
  const idInstructorNum = Number(idInstructor);
  const trimestreActivo = Number(trimestre) || 1;

  const [portafolio, setPortafolio] = useState<PortafolioInstructor | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!perfil) return;
    if (!idInstructorNum || Number.isNaN(idInstructorNum)) {
      setError('No se especificó un instructor válido.');
      return;
    }
    setError(null);
    obtenerPortafolioInstructor(idInstructorNum)
      .then((res) => {
        setPortafolio(res);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof CoordinadorApiError ? err.message : 'No se pudo cargar el portafolio.')
      );
  }, [perfil, idInstructorNum]);

  useFocusEffect(cargar);

  if (perfil === undefined) {
    return (
      <VictoriaScreenShell>
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      </VictoriaScreenShell>
    );
  }
  if (!perfil) return null;

  const datosTrimestre = portafolio?.trimestres.find((t) => t.trimestre === trimestreActivo);

  return (
    <VictoriaScreenShell>
      <PaneHeader
        eyebrow={`Instructor ${portafolio ? (portafolio.tipo_instructor === 'planta' ? 'DE PLANTA' : 'TECNICO') : ''} · ${portafolio?.nombre_completo ?? ''}`}
        title={`Portafolio · ${portafolio?.nombre_completo ?? ''}`}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!portafolio && !error ? (
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      ) : null}

      {portafolio ? (
        <>
          <View style={styles.tabsRow}>
            {portafolio.trimestres.map((t) => (
              <PillTab
                key={t.trimestre}
                label={`T${t.trimestre}`}
                count={t.competencias.length}
                active={t.trimestre === trimestreActivo}
                href={`/victoria/coordinador/instructores/${idInstructorNum}/portafolio/${t.trimestre}`}
              />
            ))}
          </View>

          {datosTrimestre ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <View style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeText}>T{datosTrimestre.trimestre}</Text>
                </View>
                <View>
                  <Text style={styles.summaryTitle}>Trimestre {datosTrimestre.trimestre}</Text>
                  <Text style={styles.summarySubtitle}>
                    {datosTrimestre.competencias.length} competencias · {datosTrimestre.evidencias}{' '}
                    evidencias
                  </Text>
                </View>
              </View>
              <View style={styles.summaryStats}>
                <View style={styles.statBlock}>
                  <Text style={styles.statNum}>{datosTrimestre.evidencias}</Text>
                  <Text style={styles.statLabel}>Evidencias</Text>
                </View>
                <View style={styles.statBlock}>
                  <Text style={styles.statNum}>{datosTrimestre.competencias.length}</Text>
                  <Text style={styles.statLabel}>Competencias</Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.list}>
            {!datosTrimestre || datosTrimestre.competencias.length === 0 ? (
              <Text style={styles.empty}>Aún no hay materias registradas para este trimestre.</Text>
            ) : (
              datosTrimestre.competencias.map((competencia) => (
                <ListRow
                  key={competencia.id_competencia}
                  icon="diamond-outline"
                  title={competencia.nombre}
                  subtitle={
                    competencia.archivos === 1
                      ? '1 archivo subido'
                      : `${competencia.archivos} archivos subidos`
                  }
                  actionLabel="Ver"
                  onPressAction={() =>
                    router.push(
                      `/victoria/coordinador/instructores/${idInstructorNum}/portafolio/${trimestreActivo}/${competencia.id_competencia}` as never
                    )
                  }
                />
              ))
            )}
          </View>
        </>
      ) : null}

      <ExitButton />
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 20 },
  error: { color: '#ff8a8a', marginBottom: 12 },
  empty: { color: 'rgba(255, 255, 255, 0.5)' },
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
});