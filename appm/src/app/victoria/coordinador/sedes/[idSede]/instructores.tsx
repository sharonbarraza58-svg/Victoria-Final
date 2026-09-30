import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, FilterChip, ListRow, PaneHeader, SearchPill } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import {
  CoordinadorApiError,
  InstructorResumen,
  obtenerInstructoresSede,
  obtenerSedeDetalle,
  TipoInstructor,
} from '@/lib/coordinador';
import { useRoleGuard } from '@/lib/role-guard';

const FILTROS: { label: string; valor: TipoInstructor | 'todos' }[] = [
  { label: 'Todos', valor: 'todos' },
  { label: 'De Planta', valor: 'planta' },
  { label: 'Tecnico', valor: 'tecnico' },
  { label: 'Transversal', valor: 'transversal' },
];

/**
 * Instructores de una sede (Doc3 imagen 2 derecha: "Instrucotres SEDE
 * Fontibon" con tabs Todos/De Planta/Tecnico/Transversal). El filtro es
 * local (no navega), y cada fila lleva al detalle del instructor con
 * ?idSede= y ?tipo= en la query para que el botón "Volver a instructores
 * ..." de esa pantalla sepa a dónde regresar.
 */
export default function CoordinadorInstructoresSedeScreen() {
  const perfil = useRoleGuard(['coordinador']);
  const { idSede } = useLocalSearchParams<{ idSede: string }>();
  const idSedeNum = Number(idSede);

  const [nombreSede, setNombreSede] = useState<string | null>(null);
  const [instructores, setInstructores] = useState<InstructorResumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<TipoInstructor | 'todos'>('todos');
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(() => {
    if (!perfil) return;
    // Sin un id de sede válido en la URL no hay nada que pedir: se avisa
    // explícito en vez de dejar el spinner girando para siempre.
    if (!idSedeNum || Number.isNaN(idSedeNum)) {
      setError('No se especificó una sede válida.');
      return;
    }
    // Limpia el error de una carga previa (p. ej. "Sede no encontrada" de
    // una visita anterior a otro id) ANTES de pedir de nuevo, para que no
    // se quede pegado en pantalla si esta carga sí funciona.
    setError(null);
    obtenerSedeDetalle(idSedeNum)
      .then((sede) => setNombreSede(sede.nombre))
      .catch(() => undefined);
    obtenerInstructoresSede(idSedeNum)
      .then((res) => {
        setInstructores(res);
        setError(null);
      })
      .catch((err) =>
        setError(
          err instanceof CoordinadorApiError ? err.message : 'No se pudieron cargar los instructores.'
        )
      );
  }, [perfil, idSedeNum]);

  useFocusEffect(cargar);

  if (perfil === undefined) {
    return (
      <VictoriaScreenShell>
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      </VictoriaScreenShell>
    );
  }
  if (!perfil) return null;

  const filtrados = (instructores ?? [])
    .filter((i) => filtro === 'todos' || i.tipo_instructor === filtro)
    .filter((i) => i.nombre_completo.toLowerCase().includes(busqueda.trim().toLowerCase()));

  return (
    <VictoriaScreenShell>
      <View style={styles.headerRow}>
        <PaneHeader
          eyebrow={`VICTORIA > Fichas Sede ${nombreSede ?? ''}`}
          title={`Instructores SEDE ${nombreSede ?? ''}`}
          backHref="/victoria/coordinador/sedes"
        />
        <SearchPill value={busqueda} onChangeText={setBusqueda} placeholder="Encontrar instructor" />
      </View>

      <View style={styles.filtersRow}>
        {FILTROS.map((f) => (
          <FilterChip
            key={f.valor}
            label={f.label}
            active={filtro === f.valor}
            onPress={() => setFiltro(f.valor)}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!instructores && !error ? (
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      ) : null}
      {instructores && filtrados.length === 0 ? (
        <Text style={styles.empty}>No hay instructores para este filtro.</Text>
      ) : null}

      <View style={styles.list}>
        {filtrados.map((instructor) => (
          <ListRow
            key={instructor.id_usuario}
            icon="person-outline"
            title={instructor.nombre_completo}
            subtitle={
              instructor.tipo_instructor === 'planta'
                ? 'Instructor de planta'
                : instructor.tipo_instructor === 'tecnico'
                  ? 'Instructor técnico'
                  : 'Instructor transversal'
            }
            actionHref={`/victoria/coordinador/instructores/${instructor.id_usuario}?idSede=${idSedeNum}&tipo=${instructor.tipo_instructor}` as never}
            actionLabel="Ver"
          />
        ))}
      </View>

      <ExitButton />
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  loader: { marginTop: 20 },
  error: { color: '#ff8a8a', marginBottom: 12 },
  empty: { color: 'rgba(255, 255, 255, 0.6)' },
  list: { gap: 12 },
});