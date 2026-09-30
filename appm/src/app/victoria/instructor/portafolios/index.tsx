import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, ListRow, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import { InstructorApiError, obtenerPortafolios, PortafolioFicha } from '@/lib/instructor';
import { useRoleGuard } from '@/lib/role-guard';

export default function InstructorPortafoliosScreen() {
  const perfil = useRoleGuard(['instructor']);
  const [portafolios, setPortafolios] = useState<PortafolioFicha[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!perfil) return;
    obtenerPortafolios()
      .then((res) => {
        setPortafolios(res);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof InstructorApiError ? err.message : 'No se pudieron cargar los portafolios.')
      );
  }, [perfil]);

  useFocusEffect(cargar);

  if (perfil === undefined) {
    return (
      <VictoriaScreenShell>
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      </VictoriaScreenShell>
    );
  }
  if (!perfil) return null;

  return (
    <VictoriaScreenShell>
      <PaneHeader eyebrow="VICTORIA > Seguimiento" title="Portafolios Fichas" />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!portafolios && !error ? (
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      ) : null}

      {portafolios && portafolios.length === 0 ? (
        <Text style={styles.empty}>Todavía no tienes fichas asignadas.</Text>
      ) : null}

      <View style={styles.list}>
        {portafolios?.map((p) => (
          <ListRow
            key={p.id_ficha}
            icon="albums-outline"
            title={`Ficha ${p.numero_ficha ?? p.id_ficha}`}
            subtitle={`${p.nombre_competencia ?? 'Materia'} · Trimestre ${p.trimestre ?? '—'} · ${p.num_aprendices} aprendices`}
            actionLabel="Ver"
            onPressAction={() => router.push(`/victoria/instructor/portafolios/${p.id_ficha}` as never)}
          />
        ))}
      </View>

      <ExitButton />
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 20 },
  error: { color: '#ff8a8a', marginBottom: 12 },
  empty: { color: 'rgba(255, 255, 255, 0.6)' },
  list: { gap: 12 },
});
