import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { DataCard, ExitButton, ListRow, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import { DashboardInstructor, InstructorApiError, obtenerDashboardInstructor } from '@/lib/instructor';
import { useRoleGuard } from '@/lib/role-guard';

/**
 * Dashboard exclusivo del rol instructor (Doc22, imagen 1 derecha).
 * useRoleGuard ya se encarga de: (a) mandar a /login si no hay sesión, y
 * (b) mandar a /victoria/dashboard si el usuario logueado NO es instructor.
 * Aun así, GET /api/instructor/dashboard vuelve a exigir el rol en el
 * backend -- este guard es solo para no mostrar la pantalla, no la única
 * defensa.
 */
export default function InstructorDashboardScreen() {
  const perfil = useRoleGuard(['instructor']);
  const [datos, setDatos] = useState<DashboardInstructor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    if (!perfil) return;
    setCargando(true);
    obtenerDashboardInstructor()
      .then((res) => {
        setDatos(res);
        setError(null);
      })
      .catch((err) => setError(err instanceof InstructorApiError ? err.message : 'No se pudo cargar el dashboard.'))
      .finally(() => setCargando(false));
  }, [perfil]);

  useFocusEffect(cargar);

  if (perfil === undefined) {
    return (
      <VictoriaScreenShell>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={VictoriaColors.white} />
        </View>
      </VictoriaScreenShell>
    );
  }
  if (!perfil) return null;

  return (
    <VictoriaScreenShell>
      <PaneHeader eyebrow="VICTORIA > Inicio" title={`Bienvenido, ${perfil.nombre}`} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {cargando && !datos ? (
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      ) : null}

      {datos ? (
        <>
          <View style={styles.cardsRow}>
            <DataCard
              icon="school-outline"
              title={datos.nombre_programa_principal ?? 'Sin programa asignado'}
              subtitle={datos.descripcion_programa_principal ?? 'Programa de Formación'}
              style={styles.cardFlex2}
            />
            <DataCard
              icon="id-card-outline"
              title={datos.numero_ficha_principal ?? '—'}
              subtitle="Ficha de formación"
              style={styles.cardFlex1}
            />
            <DataCard
              icon="calendar-outline"
              title={datos.trimestre_actual ? `Trimestre ${datos.trimestre_actual}` : 'Sin trimestre'}
              subtitle={`${datos.total_fichas} ficha(s) · ${datos.total_aprendices} aprendices`}
              style={styles.cardFlex1}
            />
          </View>

          <Text style={styles.sectionLabel}>Fichas vistas recientemente</Text>
          {datos.fichas_recientes.length === 0 ? (
            <Text style={styles.empty}>
              Todavía no tienes fichas asignadas. Pídele a un administrador que te asigne una
              ficha y materia desde POST /api/instructor/asignaciones.
            </Text>
          ) : (
            <View style={styles.list}>
              {datos.fichas_recientes.map((ficha) => (
                <ListRow
                  key={ficha.id_ficha}
                  icon="folder-outline"
                  title={`Ficha ${ficha.numero_ficha ?? ficha.id_ficha}`}
                  subtitle={`${ficha.nombre_competencia ?? 'Materia'} · ${ficha.num_estudiantes} estudiantes`}
                  actionLabel="Ver"
                  onPressAction={() =>
                    router.push(`/victoria/instructor/portafolios/${ficha.id_ficha}` as never)
                  }
                />
              ))}
            </View>
          )}
        </>
      ) : null}

      <ExitButton />
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loader: {
    marginVertical: 20,
  },
  error: {
    color: '#ff8a8a',
    marginBottom: 12,
  },
  empty: {
    color: 'rgba(255, 255, 255, 0.55)',
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  cardFlex2: {
    minWidth: 240,
    flexBasis: '38%',
  },
  cardFlex1: {
    minWidth: 180,
    flexBasis: '25%',
  },
  sectionLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
  list: {
    gap: 12,
  },
});
