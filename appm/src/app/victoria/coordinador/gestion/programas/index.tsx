import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, ListRow, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import { Coordinacion, obtenerCoordinaciones } from '@/lib/coordinaciones';
import { crearPrograma, obtenerProgramas, Programa } from '@/lib/programas';
import { useRoleGuard } from '@/lib/role-guard';

const NIVELES = ['Técnico', 'Tecnólogo', 'Especialización', 'Complementaria'] as const;

export default function ProgramasGestionScreen() {
  const perfil = useRoleGuard(['coordinador']);
  const [programas, setProgramas] = useState<Programa[] | null>(null);
  const [coordinaciones, setCoordinaciones] = useState<Coordinacion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [nivel, setNivel] = useState<typeof NIVELES[number]>('Tecnólogo');
  const [descripcion, setDescripcion] = useState('');
  const [urlPrograma, setUrlPrograma] = useState('');
  const [idCoordinacion, setIdCoordinacion] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  function cargar() {
    if (!perfil) return;
    obtenerProgramas()
      .then(setProgramas)
      .catch((err: any) => setError(err.message));
    obtenerCoordinaciones().then(setCoordinaciones).catch(() => {});
  }

  useEffect(cargar, [perfil]);

  function cerrarYLimpiar() {
    setModalVisible(false);
    setNombre('');
    setNivel('Tecnólogo');
    setDescripcion('');
    setUrlPrograma('');
    setIdCoordinacion(null);
    setErrorGuardar(null);
  }

  async function guardar() {
    if (!nombre.trim() || !urlPrograma.trim() || !idCoordinacion) {
      setErrorGuardar('Nombre, enlace del programa y coordinación son obligatorios.');
      return;
    }
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await crearPrograma({
        nombre,
        nivel_formacion: nivel,
        descripcion: descripcion || undefined,
        url_programa: urlPrograma,
        id_coordinacion: idCoordinacion,
      });
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

  return (
    <VictoriaScreenShell>
      <PaneHeader eyebrow="VICTORIA > Coordinador > Gestión" title="Programas de formación" />

      <Pressable style={styles.newButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add-circle-outline" size={16} color={VictoriaColors.white} />
        <Text style={styles.newButtonText}>Nuevo programa</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!programas && !error ? <ActivityIndicator color={VictoriaColors.white} /> : null}
      {programas && programas.length === 0 ? (
        <Text style={styles.empty}>Todavía no hay programas registrados.</Text>
      ) : null}

      <View style={styles.list}>
        {programas?.map((p) => (
          <ListRow
            key={p.id_programa}
            icon="school-outline"
            title={p.nombre}
            subtitle={p.nivel_formacion ?? 'Sin nivel definido'}
          />
        ))}
      </View>

      <ExitButton />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={cerrarYLimpiar}>
        <Pressable style={styles.modalBackdrop} onPress={cerrarYLimpiar}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nuevo programa</Text>
                <Pressable onPress={cerrarYLimpiar} hitSlop={8}>
                  <Ionicons name="close" size={20} color="#556b5c" />
                </Pressable>
              </View>

              {errorGuardar ? <Text style={styles.errorText}>{errorGuardar}</Text> : null}

              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholder="Nombre del programa"
                style={styles.input}
              />
              <TextInput
                value={urlPrograma}
                onChangeText={setUrlPrograma}
                placeholder="Enlace del programa (SofiaPlus, etc.)"
                autoCapitalize="none"
                style={styles.input}
              />

              <Text style={styles.hint}>Nivel de formación:</Text>
              <View style={styles.chipRow}>
                {NIVELES.map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setNivel(n)}
                    style={[styles.chip, nivel === n && styles.chipActive]}>
                    <Text style={[styles.chipText, nivel === n && styles.chipTextActive]}>{n}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.hint}>Coordinación:</Text>
              <View style={styles.chipRow}>
                {coordinaciones.map((c) => (
                  <Pressable
                    key={c.id_coordinacion}
                    onPress={() => setIdCoordinacion(c.id_coordinacion)}
                    style={[styles.chip, idCoordinacion === c.id_coordinacion && styles.chipActive]}>
                    <Text
                      style={[styles.chipText, idCoordinacion === c.id_coordinacion && styles.chipTextActive]}>
                      {c.nombre_coordinacion}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Descripción (opcional)"
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
              />

              <Pressable
                style={[styles.saveButton, guardando && { opacity: 0.6 }]}
                onPress={guardar}
                disabled={guardando}>
                <Text style={styles.saveButtonText}>{guardando ? 'Guardando...' : 'Guardar'}</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
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
  list: { gap: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 520, maxHeight: '85%', backgroundColor: '#f8f9fa', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a3322' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 14,
    color: '#1a3322',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: '#556b5c', marginBottom: 8, marginTop: 4, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#e2ebd9' },
  chipActive: { backgroundColor: VictoriaColors.darkerGreen },
  chipText: { fontSize: 12, fontWeight: '600', color: '#1a3322' },
  chipTextActive: { color: '#fff' },
  saveButton: { backgroundColor: '#a2b49e', borderRadius: 20, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
