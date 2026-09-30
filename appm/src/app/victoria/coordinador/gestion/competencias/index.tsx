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
import {
  CompetenciaGestion,
  crearCompetencia,
  obtenerCompetenciasGestion,
} from '@/lib/competencias-gestion';
import { useRoleGuard } from '@/lib/role-guard';

const TRIMESTRES = ['T1', 'T2', 'T3', 'T4'] as const;

export default function CompetenciasGestionScreen() {
  const perfil = useRoleGuard(['coordinador']);
  const [competencias, setCompetencias] = useState<CompetenciaGestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [trimestre, setTrimestre] = useState<typeof TRIMESTRES[number]>('T1');
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  function cargar() {
    if (!perfil) return;
    obtenerCompetenciasGestion()
      .then(setCompetencias)
      .catch((err: any) => setError(err.message));
  }

  useEffect(cargar, [perfil]);

  function cerrarYLimpiar() {
    setModalVisible(false);
    setNombre('');
    setDescripcion('');
    setTrimestre('T1');
    setErrorGuardar(null);
  }

  async function guardar() {
    if (!nombre.trim()) {
      setErrorGuardar('El nombre de la competencia es obligatorio.');
      return;
    }
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await crearCompetencia({
        nombre,
        descripcion: descripcion || undefined,
        trimestre,
        fecha_carga: new Date().toISOString(),
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
      <PaneHeader eyebrow="VICTORIA > Coordinador > Gestión" title="Competencias" />

      <Pressable style={styles.newButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add-circle-outline" size={16} color={VictoriaColors.white} />
        <Text style={styles.newButtonText}>Nueva competencia</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!competencias && !error ? <ActivityIndicator color={VictoriaColors.white} /> : null}
      {competencias && competencias.length === 0 ? (
        <Text style={styles.empty}>Todavía no hay competencias registradas.</Text>
      ) : null}

      <View style={styles.list}>
        {competencias?.map((c) => (
          <ListRow
            key={c.id_competencia}
            icon="layers-outline"
            title={c.nombre}
            subtitle={`Trimestre ${c.trimestre}`}
          />
        ))}
      </View>

      <ExitButton />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={cerrarYLimpiar}>
        <Pressable style={styles.modalBackdrop} onPress={cerrarYLimpiar}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva competencia</Text>
                <Pressable onPress={cerrarYLimpiar} hitSlop={8}>
                  <Ionicons name="close" size={20} color="#556b5c" />
                </Pressable>
              </View>

              {errorGuardar ? <Text style={styles.errorText}>{errorGuardar}</Text> : null}

              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholder="Nombre (ej. Programación Web)"
                placeholderTextColor="#556b5c"
                style={styles.input}
              />

              <Text style={styles.label}>Trimestre</Text>
              <View style={styles.trimestreRow}>
                {TRIMESTRES.map((t) => (
                  <Pressable
                    key={t}
                    style={[styles.trimestreChip, trimestre === t && styles.trimestreChipActivo]}
                    onPress={() => setTrimestre(t)}>
                    <Text style={[styles.trimestreChipText, trimestre === t && styles.trimestreChipTextActivo]}>
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Descripción (opcional)"
                placeholderTextColor="#556b5c"
                multiline
                numberOfLines={4}
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a3322' },
  label: { fontSize: 12, color: '#556b5c', marginBottom: 8, fontWeight: '600' },
  trimestreRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  trimestreChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  trimestreChipActivo: { backgroundColor: '#8fa47e', borderColor: '#8fa47e' },
  trimestreChipText: { color: '#556b5c', fontWeight: '600', fontSize: 13 },
  trimestreChipTextActivo: { color: '#ffffff' },
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
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#a2b49e',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
