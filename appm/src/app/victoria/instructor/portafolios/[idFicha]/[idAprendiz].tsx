import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { EntregaGradeCard } from '@/components/victoria/entrega-grade-card';
import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import {
  actualizarEntrega,
  EstadoEntrega,
  InstructorApiError,
  obtenerPortafolioAprendiz,
  PortafolioAprendiz,
} from '@/lib/instructor';
import { useRoleGuard } from '@/lib/role-guard';

/**
 * Portafolio de UN aprendiz: se abre al dar clic sobre su fila en
 * /instructor/portafolios/{id_ficha}. Muestra sus materias (competencias)
 * y, dentro de cada una, las actividades asignadas con el archivo que ese
 * aprendiz subió (Word/PDF/video), su estado, nota y comentario -- todo
 * editable desde aquí mismo, igual que en la vista de la tarea.
 */
export default function PortafolioAprendizScreen() {
  const perfil = useRoleGuard(['instructor']);
  const { idFicha: idFichaParam, idAprendiz: idAprendizParam } = useLocalSearchParams<{
    idFicha: string;
    idAprendiz: string;
  }>();
  const idFicha = Number(idFichaParam);
  const idAprendiz = Number(idAprendizParam);

  const [portafolio, setPortafolio] = useState<PortafolioAprendiz | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!perfil || !idFicha || !idAprendiz) return;
    obtenerPortafolioAprendiz(idFicha, idAprendiz)
      .then((res) => {
        setPortafolio(res);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof InstructorApiError ? err.message : 'No se pudo cargar el portafolio.')
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil, idFicha, idAprendiz]);

  useFocusEffect(cargar);

  if (perfil === undefined) {
    return (
      <VictoriaScreenShell>
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      </VictoriaScreenShell>
    );
  }
  if (!perfil) return null;

  async function guardarCambiosActividad(
    idTarea: number,
    idEntrega: number | null,
    cambios: { estado?: EstadoEntrega; nota?: number; comentario?: string }
  ) {
    if (!idEntrega) return; // sin entrega todavía no hay nada que calificar
    const actualizada = await actualizarEntrega(idEntrega, cambios);
    setPortafolio((prev) =>
      prev
        ? {
            ...prev,
            competencias: prev.competencias.map((c) => ({
              ...c,
              actividades: c.actividades.map((act) =>
                act.id_tarea === idTarea
                  ? {
                      ...act,
                      estado: actualizada.estado,
                      nota: actualizada.nota,
                      comentario: actualizada.comentario,
                    }
                  : act
              ),
            })),
          }
        : prev
    );
  }

  return (
    <VictoriaScreenShell>
      <PaneHeader
        eyebrow="Volver a la ficha"
        title={portafolio?.nombre_aprendiz ?? 'Portafolio'}
        backHref={`/victoria/instructor/portafolios/${idFichaParam}`}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!portafolio && !error ? (
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      ) : null}

      {portafolio ? (
        <>
          <Text style={styles.metaLine}>Ficha {portafolio.numero_ficha ?? portafolio.id_ficha}</Text>

          {portafolio.competencias.length === 0 ? (
            <Text style={styles.empty}>No tienes materias asignadas en esta ficha todavía.</Text>
          ) : (
            <View style={styles.competencias}>
              {portafolio.competencias.map((comp) => (
                <View key={comp.id_competencia} style={styles.competenciaBlock}>
                  <Text style={styles.competenciaNombre}>{comp.nombre}</Text>

                  {comp.actividades.length === 0 ? (
                    <Text style={styles.empty}>Aún no has creado actividades para esta materia.</Text>
                  ) : (
                    <View style={styles.list}>
                      {comp.actividades.map((act) => (
                        <EntregaGradeCard
                          key={act.id_tarea}
                          titulo={act.titulo}
                          subtitulo={act.fecha_limite ? `Fecha límite: ${act.fecha_limite}` : undefined}
                          archivoUrl={act.archivo_url}
                          estado={act.estado}
                          nota={act.nota}
                          comentario={act.comentario}
                          sinEntrega={!act.id_entrega}
                          onGuardar={(cambios) =>
                            guardarCambiosActividad(act.id_tarea, act.id_entrega, cambios)
                          }
                        />
                      ))}
                    </View>
                  )}
                </View>
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
  loader: { marginTop: 20 },
  error: { color: '#ff8a8a', marginBottom: 12 },
  empty: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 },
  metaLine: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginBottom: 20,
  },
  competencias: { gap: 24 },
  competenciaBlock: { gap: 10 },
  competenciaNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: VictoriaColors.white,
  },
  list: { gap: 10 },
});
