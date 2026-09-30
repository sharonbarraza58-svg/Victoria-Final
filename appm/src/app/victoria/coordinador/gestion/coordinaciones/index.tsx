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
import { Coordinacion, crearCoordinacion, obtenerCoordinaciones } from '@/lib/coordinaciones';
import { useRoleGuard } from '@/lib/role-guard';

/**
 * Gestión de Coordinaciones académicas (ej. "Coordinación de TIC").
 * Portado de victoria-admin-completo/app/admin/sedes/index.tsx -- ese
 * nombre ahí era confuso (llamaba "Sede" a esta entidad); aquí queda
 * claro que esto es Coordinacion, distinto del modelo Sede física
 * (ver ../sedes/index.tsx).
 */
export default function CoordinacionesGestionScreen() {
  const perfil = useRoleGuard(['coordinador']);
  const [coordinaciones, setCoordinaciones] = useState<Coordinacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [areaEnfoque, setAreaEnfoque] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  function cargar() {
    if (!perfil) return;
    obtenerCoordinaciones()
      .then(setCoordinaciones)
      .catch((err: any) => setError(err.message));
  }

  useEffect(cargar, [perfil]);

  function cerrarYLimpiar() {
    setModalVisible(false);
    setNombre('');
    setDescripcion('');
    setAreaEnfoque('');
    setErrorGuardar(null);
  }

  async function guardar() {
    if (!nombre.trim() || !descripcion.trim() || !areaEnfoque.trim()) {
      setErrorGuardar('Todos los campos son obligatorios.');
      return;
    }
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await crearCoordinacion({
        nombre_coordinacion: nombre,
        descripcion_coordinacion: descripcion,
        area_enfoque: areaEnfoque,
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
      <PaneHeader eyebrow="VICTORIA > Coordinador > Gestión" title="Coordinaciones académicas" />

      <Pressable style={styles.newButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add-circle-outline" size={16} color={VictoriaColors.white} />
        <Text style={styles.newButtonText}>Nueva coordinación</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!coordinaciones && !error ? <ActivityIndicator color={VictoriaColors.white} /> : null}
      {coordinaciones && coordinaciones.length === 0 ? (
        <Text style={styles.empty}>Todavía no hay coordinaciones registradas.</Text>
      ) : null}

      <View style={styles.list}>
        {coordinaciones?.map((c) => (
          <ListRow
            key={c.id_coordinacion}
            icon="layers-outline"
            title={c.nombre_coordinacion}
            subtitle={c.area_enfoque}
          />
        ))}
      </View>

      <ExitButton />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={cerrarYLimpiar}>
        <Pressable style={styles.modalBackdrop} onPress={cerrarYLimpiar}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva coordinación</Text>
                <Pressable onPress={cerrarYLimpiar} hitSlop={8}>
                  <Ionicons name="close" size={20} color="#556b5c" />
                </Pressable>
              </View>

              {errorGuardar ? <Text style={styles.errorText}>{errorGuardar}</Text> : null}

              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholder="Nombre (ej. Coordinación de TIC)"
                placeholderTextColor="#556b5c"
                style={styles.input}
              />
              <TextInput
                value={areaEnfoque}
                onChangeText={setAreaEnfoque}
                placeholder="Área de enfoque (ej. Tecnología)"
                placeholderTextColor="#556b5c"
                style={styles.input}
              />
              <TextInput
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Descripción"
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
