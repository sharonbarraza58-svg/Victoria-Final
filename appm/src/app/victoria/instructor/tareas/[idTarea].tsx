import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { EntregaGradeCard } from '@/components/victoria/entrega-grade-card';
import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, HighlightCard, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors, VictoriaRadius } from '@/constants/victoria-theme';
import {
  actualizarEntrega,
  EstadoEntrega,
  InstructorApiError,
  obtenerTareaDetalle,
  TareaDetalle,
} from '@/lib/instructor';
import { useRoleGuard } from '@/lib/role-guard';

export default function InstructorTareaDetalleScreen() {
  const perfil = useRoleGuard(['instructor']);
  const { idTarea: idTareaParam } = useLocalSearchParams<{ idTarea: string }>();
  const idTarea = Number(idTareaParam);

  const [tarea, setTarea] = useState<TareaDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!perfil || !idTarea) return;
    obtenerTareaDetalle(idTarea)
      .then((res) => {
        setTarea(res);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof InstructorApiError ? err.message : 'No se pudo cargar la tarea.')
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil, idTarea]);

  useFocusEffect(cargar);

  if (perfil === undefined) {
    return (
      <VictoriaScreenShell>
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      </VictoriaScreenShell>
    );
  }
  if (!perfil) return null;

  async function guardarCambiosEntrega(
    idEntrega: number,
    cambios: { estado?: EstadoEntrega; nota?: number; comentario?: string }
  ) {
    const actualizada = await actualizarEntrega(idEntrega, cambios);
    setTarea((prev) =>
      prev
        ? {
            ...prev,
            entregas: prev.entregas.map((e) => (e.id_entrega === idEntrega ? actualizada : e)),
            total_aprobados: prev.entregas.filter((e) =>
              e.id_entrega === idEntrega ? actualizada.estado === 'aprobado' : e.estado === 'aprobado'
            ).length,
            total_en_revision: prev.entregas.filter((e) =>
              e.id_entrega === idEntrega
                ? actualizada.estado === 'en_revision'
                : e.estado === 'en_revision'
            ).length,
          }
        : prev
    );
  }

  return (
    <VictoriaScreenShell>
      <PaneHeader
        eyebrow="Volver a la ficha"
        title={tarea?.titulo ?? 'Tarea'}
        backHref={tarea ? `/victoria/instructor/competencias/${tarea.id_ficha}/${tarea.id_competencia}` : '/victoria/instructor/competencias'}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!tarea && !error ? <ActivityIndicator color={VictoriaColors.white} style={styles.loader} /> : null}

      {tarea ? (
        <>
          <Text style={styles.metaLine}>
            Ficha {tarea.numero_ficha ?? tarea.id_ficha} · {tarea.nombre_competencia ?? 'Materia'}
            {tarea.fecha_limite ? ` · Fecha límite: ${tarea.fecha_limite}` : ''}
          </Text>
          {tarea.descripcion ? <Text style={styles.descripcion}>{tarea.descripcion}</Text> : null}

          <View style={styles.statsRow}>
            <HighlightCard value={tarea.total_aprendices} label="Aprendices" />
            <HighlightCard value={tarea.total_aprobados} label="Aprobados" />
            <HighlightCard value={tarea.total_en_revision} label="En revisión" />
            <HighlightCard value={tarea.total_pendientes} label="Pendientes" />
          </View>

          <View style={styles.headerActions}>
            <Text style={styles.sectionLabel}>Entregas</Text>
            <Pressable
              style={styles.portfolioBtn}
              onPress={() => router.push(`/victoria/instructor/portafolios/${tarea.id_ficha}` as never)}>
              <Text style={styles.portfolioBtnText}>Ir a Portafolio</Text>
              <Ionicons name="arrow-forward" size={14} color={VictoriaColors.white} />
            </Pressable>
          </View>

          <View style={styles.list}>
            {tarea.entregas.length === 0 ? (
              <Text style={styles.empty}>Todavía no hay aprendices en esta ficha.</Text>
            ) : (
              tarea.entregas.map((entrega) => (
                <EntregaGradeCard
                  key={entrega.id_entrega}
                  titulo={entrega.nombre_aprendiz}
                  archivoUrl={entrega.archivo_url}
                  estado={entrega.estado}
                  nota={entrega.nota}
                  comentario={entrega.comentario}
                  onGuardar={(cambios) => guardarCambiosEntrega(entrega.id_entrega, cambios)}
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
  empty: { color: 'rgba(255, 255, 255, 0.6)' },
  metaLine: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginBottom: 6,
  },
  descripcion: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  portfolioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: VictoriaColors.darkGreen,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: VictoriaRadius.pill,
  },
  portfolioBtnText: {
    color: VictoriaColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    gap: 10,
  },
});
