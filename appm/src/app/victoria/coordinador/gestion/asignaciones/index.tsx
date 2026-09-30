import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, ListRow, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import { Usuario } from '@/lib/aprendices';
import { CompetenciaGestion, obtenerCompetenciasGestion } from '@/lib/competencias-gestion';
import { Ficha, obtenerFichas } from '@/lib/fichas';
import { Asignacion, crearAsignacion, obtenerAsignaciones } from '@/lib/instructor';
import { obtenerInstructores } from '@/lib/instructores';
import { useRoleGuard } from '@/lib/role-guard';

const TRIMESTRES = [1, 2, 3, 4] as const;

/**
 * Esta es la pantalla que le "prende" una ficha a un instructor. El
 * campo "Director de ficha" que se elige al crear/editar una ficha (en
 * Gestión > Fichas) es solo una etiqueta administrativa
 * (Ficha.id_director) -- NO le da al instructor acceso a nada. Lo único
 * que hace que una ficha+materia le aparezca a un instructor en su
 * dashboard, en su árbol de competencias y pueda crear tareas ahí, es
 * una Asignación como las que se crean aquí (POST
 * /api/instructor/asignaciones -> tabla asignacion_instructor).
 */
export default function AsignacionesGestionScreen() {
  const perfil = useRoleGuard(['coordinador']);
  const [asignaciones, setAsignaciones] = useState<Asignacion[] | null>(null);
  const [instructores, setInstructores] = useState<Usuario[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [competencias, setCompetencias] = useState<CompetenciaGestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [idInstructor, setIdInstructor] = useState<number | null>(null);
  const [idFicha, setIdFicha] = useState<number | null>(null);
  const [idCompetencia, setIdCompetencia] = useState<number | null>(null);
  const [trimestre, setTrimestre] = useState<(typeof TRIMESTRES)[number]>(1);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  function cargar() {
    if (!perfil) return;
    obtenerAsignaciones()
      .then(setAsignaciones)
      .catch((err: any) => setError(err.message));
    obtenerInstructores().then(setInstructores).catch(() => {});
    obtenerFichas().then(setFichas).catch(() => {});
    obtenerCompetenciasGestion().then(setCompetencias).catch(() => {});
  }

  useEffect(cargar, [perfil]);

  function cerrarYLimpiar() {
    setModalVisible(false);
    setIdInstructor(null);
    setIdFicha(null);
    setIdCompetencia(null);
    setTrimestre(1);
    setErrorGuardar(null);
  }

  async function guardar() {
    if (!idInstructor || !idFicha || !idCompetencia) {
      setErrorGuardar('Elige instructor, ficha y materia.');
      return;
    }
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await crearAsignacion({ id_instructor: idInstructor, id_ficha: idFicha, id_competencia: idCompetencia, trimestre });
      cerrarYLimpiar();
      cargar();
    } catch (err: any) {
      setErrorGuardar(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (perfil === undefined) {
    return (
      <VictoriaScreenShell>
        <ActivityIndicator color={VictoriaColors.white} />
      </VictoriaScreenShell>
    );
  }
  if (!perfil) return null;

  function nombreInstructor(id: number) {
    const i = instructores.find((x) => x.id_usuario === id);
    return i ? `${i.nombre} ${i.apellido ?? ''}`.trim() : `Instructor #${id}`;
  }
  function nombreCompetencia(id: number) {
    return competencias.find((c) => c.id_competencia === id)?.nombre ?? `Materia #${id}`;
  }

  return (
    <VictoriaScreenShell>
      <PaneHeader eyebrow="VICTORIA > Coordinador > Gestión" title="Asignar instructor a ficha" />
      <Text style={styles.intro}>
        Aquí es donde una ficha+materia le "aparece" a un instructor. Fijar el Director de ficha en
        Gestión &gt; Fichas es solo una etiqueta y no le da acceso a nada por sí solo.
      </Text>

      <Pressable style={styles.newButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="link-outline" size={16} color={VictoriaColors.white} />
        <Text style={styles.newButtonText}>Nueva asignación</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!asignaciones && !error ? <ActivityIndicator color={VictoriaColors.white} /> : null}
      {asignaciones && asignaciones.length === 0 ? (
        <Text style={styles.empty}>Todavía no hay asignaciones. Ningún instructor tiene fichas visibles.</Text>
      ) : null}

      <View style={styles.list}>
        {asignaciones?.map((a) => (
          <ListRow
            key={a.id_asignacion}
            icon="link-outline"
            title={`${nombreInstructor(a.id_instructor)} → Ficha ${a.id_ficha}`}
            subtitle={`${nombreCompetencia(a.id_competencia)} · Trimestre ${a.trimestre}`}
          />
        ))}
      </View>

      <ExitButton />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={cerrarYLimpiar}>
        <Pressable style={styles.modalBackdrop} onPress={cerrarYLimpiar}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva asignación</Text>
                <Pressable onPress={cerrarYLimpiar} hitSlop={8}>
                  <Ionicons name="close" size={20} color="#556b5c" />
                </Pressable>
              </View>

              {errorGuardar ? <Text style={styles.errorText}>{errorGuardar}</Text> : null}

              <Text style={styles.hint}>Instructor:</Text>
              <View style={styles.chipRow}>
                {instructores.map((i) => (
                  <Pressable
                    key={i.id_usuario}
                    onPress={() => setIdInstructor(i.id_usuario)}
                    style={[styles.chip, idInstructor === i.id_usuario && styles.chipActive]}>
                    <Text style={[styles.chipText, idInstructor === i.id_usuario && styles.chipTextActive]}>
                      {i.nombre} {i.apellido ?? ''}
                    </Text>
                  </Pressable>
                ))}
                {instructores.length === 0 ? (
                  <Text style={styles.emptyChipHint}>
                    No hay instructores todavía. Crea uno primero en Gestión &gt; Instructores.
                  </Text>
                ) : null}
              </View>

              <Text style={styles.hint}>Ficha:</Text>
              <View style={styles.chipRow}>
                {fichas.map((f) => (
                  <Pressable
                    key={f.id_ficha}
                    onPress={() => setIdFicha(f.id_ficha)}
                    style={[styles.chip, idFicha === f.id_ficha && styles.chipActive]}>
                    <Text style={[styles.chipText, idFicha === f.id_ficha && styles.chipTextActive]}>
                      Ficha {f.id_ficha}
                    </Text>
                  </Pressable>
                ))}
                {fichas.length === 0 ? (
                  <Text style={styles.emptyChipHint}>
                    No hay fichas todavía. Crea una primero en Gestión &gt; Fichas.
                  </Text>
                ) : null}
              </View>

              <Text style={styles.hint}>Materia (competencia):</Text>
              <View style={styles.chipRow}>
                {competencias.map((c) => (
                  <Pressable
                    key={c.id_competencia}
                    onPress={() => setIdCompetencia(c.id_competencia)}
                    style={[styles.chip, idCompetencia === c.id_competencia && styles.chipActive]}>
                    <Text
                      style={[styles.chipText, idCompetencia === c.id_competencia && styles.chipTextActive]}>
                      {c.nombre}
                    </Text>
                  </Pressable>
                ))}
                {competencias.length === 0 ? (
                  <Text style={styles.emptyChipHint}>
                    No hay competencias todavía. Crea una primero en Gestión &gt; Competencias.
                  </Text>
                ) : null}
              </View>

              <Text style={styles.hint}>Trimestre:</Text>
              <View style={styles.chipRow}>
                {TRIMESTRES.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setTrimestre(t)}
                    style={[styles.chip, trimestre === t && styles.chipActive]}>
                    <Text style={[styles.chipText, trimestre === t && styles.chipTextActive]}>T{t}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[styles.saveButton, guardando && { opacity: 0.6 }]}
                onPress={guardar}
                disabled={guardando}>
                <Text style={styles.saveButtonText}>{guardando ? 'Guardando...' : 'Asignar'}</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
  intro: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 13, marginBottom: 16, lineHeight: 18 },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: VictoriaColors.darkerGreen,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  newButtonText: { color: VictoriaColors.white, fontWeight: '600', fontSize: 13 },
  errorText: { color: '#ff8a8a', marginBottom: 12 },
  empty: { color: 'rgba(255, 255, 255, 0.6)' },
  list: { gap: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 520, maxHeight: '85%', backgroundColor: '#f8f9fa', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a3322' },
  hint: { fontSize: 12, color: '#556b5c', marginBottom: 8, marginTop: 4, fontWeight: '600' },
  emptyChipHint: { fontSize: 12, color: '#a33b3b', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#e2ebd9' },
  chipActive: { backgroundColor: VictoriaColors.darkerGreen },
  chipText: { fontSize: 12, fontWeight: '600', color: '#1a3322' },
  chipTextActive: { color: '#fff' },
  saveButton: { backgroundColor: '#a2b49e', borderRadius: 20, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
