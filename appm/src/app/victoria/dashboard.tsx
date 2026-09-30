import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { DataCard, ExitButton, ListRow, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import { slugificar } from '@/lib/competencias';
import { obtenerPerfil, type Perfil } from '@/lib/auth';
import { obtenerProximasTareas, type TareaProxima } from '@/lib/tareas';

export default function DashboardScreen() {
  const [perfil, setPerfil] = useState<Perfil | null | undefined>(undefined);
  const [tareas, setTareas] = useState<TareaProxima[] | null>(null);

  const cargarPerfil = useCallback(() => {
    let cancelado = false;
    obtenerPerfil().then((datos) => {
      if (cancelado) return;
      if (!datos) {
        router.replace('/login');
        return;
      }

      const rol = (datos.nombre_rol ?? '').toLowerCase();
      if (rol === 'coordinador') {
        router.replace('/victoria/coordinador/dashboard');
        return;
      }
      if (rol === 'instructor') {
        router.replace('/victoria/instructor/dashboard');
        return;
      }

      setPerfil(datos);
      obtenerProximasTareas()
        .then(setTareas)
        .catch(() => setTareas([]));
    });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(cargarPerfil, [cargarPerfil]);
  useFocusEffect(cargarPerfil);

  if (perfil === undefined) {
    return (
      <VictoriaScreenShell>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={VictoriaColors.white} />
          <Text style={styles.loadingText}>Cargando tu perfil…</Text>
        </View>
      </VictoriaScreenShell>
    );
  }

  if (!perfil) {
    return null;
  }

  return (
    <VictoriaScreenShell>
      <PaneHeader eyebrow="VICTORIA > Inicio" title={`Bienvenido, ${perfil.nombre}`} />

      <Text style={styles.sectionLabel}>Mi perfil</Text>
      <View style={styles.cardsRow}>
        <DataCard
          icon="school-outline"
          title="Programa de Formación"
          subtitle={perfil.ficha_info?.programa ?? 'Sin ficha asignada'}
          style={styles.cardFlex2}
        />
        <DataCard
          icon="layers-outline"
          title={perfil.ficha_info ? String(perfil.ficha_info.id_ficha) : 'Sin ficha'}
          subtitle="Ficha de formación"
          style={styles.cardFlex1}
        />
        <DataCard
          icon="person-outline"
          title={`Trimestre ${perfil.ficha_info?.trimestre ?? '-'}`}
          subtitle={
            perfil.ficha_info?.director
              ? `Director de ficha\n${perfil.ficha_info.director}`
              : 'Sin director asignado'
          }
          style={styles.cardFlex2}
        />
      </View>

      <Text style={styles.sectionLabel}>Tareas Con Entrega Próxima</Text>
      {tareas === null ? <ActivityIndicator color={VictoriaColors.white} style={styles.loader} /> : null}
      {tareas && tareas.length === 0 ? (
        <Text style={styles.empty}>No tienes tareas pendientes por ahora.</Text>
      ) : null}
      <View style={styles.list}>
        {tareas?.map((tarea) => (
          <ListRow
            key={tarea.id_tarea}
            icon="server-outline"
            title={tarea.titulo}
            subtitle={'- ' + tarea.nombre_competencia}
            actionLabel="Ver"
            actionHref={`/victoria/competencias/${tarea.trimestre}/${slugificar(tarea.nombre_competencia)}`}
          />
        ))}
      </View>

      <ExitButton />
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  loadingText: { color: VictoriaColors.white, opacity: 0.8 },
  sectionLabel: {
    color: VictoriaColors.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    opacity: 0.85,
  },
  loader: { marginBottom: 10 },
  empty: { color: 'rgba(255, 255, 255, 0.6)', marginBottom: 10 },
  cardsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  cardFlex1: { flexGrow: 1, minWidth: 140 },
  cardFlex2: { flexGrow: 2, minWidth: 200 },
  list: { gap: 10 },
});