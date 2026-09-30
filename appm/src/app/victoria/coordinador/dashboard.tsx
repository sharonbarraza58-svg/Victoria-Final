import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { DataCard, ExitButton, ListRow, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import {
  CoordinadorApiError,
  DashboardCoordinador,
  obtenerDashboardCoordinador,
} from '@/lib/coordinador';
import { useRoleGuard } from '@/lib/role-guard';

/**
 * Dashboard exclusivo del rol coordinador (Doc3, imagen 1 izquierda:
 * "Bienvenido Administrador" con las tarjetas Programa/Ficha/Trimestre y
 * la lista "Instructores vistos recientemente"). Mismo patrón que
 * victoria/instructor/dashboard.tsx: useRoleGuard bloquea la pantalla a
 * quien no sea coordinador, y GET /api/coordinador/dashboard trae los
 * datos reales.
 */
export default function CoordinadorDashboardScreen() {
  const perfil = useRoleGuard(['coordinador']);
  const [datos, setDatos] = useState<DashboardCoordinador | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    if (!perfil) return;
    setCargando(true);
    obtenerDashboardCoordinador()
      .then((res) => {
        setDatos(res);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof CoordinadorApiError ? err.message : 'No se pudo cargar el dashboard.')
      )
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
              subtitle="Programa de Formación"
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
              subtitle={`Director de ficha\n${datos.nombre_director_ficha ?? '—'}`}
              style={styles.cardFlex1}
            />
          </View>

          <Text style={styles.sectionLabel}>Instructores vistos recientemente</Text>
          {datos.fichas_recientes.length === 0 ? (
            <Text style={styles.empty}>Todavía no hay fichas para mostrar.</Text>
          ) : (
            <View style={styles.list}>
              {datos.fichas_recientes.map((ficha) => (
                <ListRow
                  key={ficha.id_ficha}
                  icon="folder-outline"
                  title={`Ficha ${ficha.numero_ficha ?? ficha.id_ficha}`}
                  subtitle={`${ficha.nombre_programa ?? 'Programa'} · ${ficha.num_estudiantes} estudiantes`}
                  actionLabel="Ver"
                  onPressAction={() => router.push('/victoria/coordinador/sedes' as never)}
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
    minWidth: 220,
    flexBasis: '31%',
  },
  cardFlex1: {
    minWidth: 160,
    flexBasis: '20%',
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
