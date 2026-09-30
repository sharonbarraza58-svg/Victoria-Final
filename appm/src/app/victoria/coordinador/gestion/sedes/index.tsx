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
import { crearSede, obtenerSedesGestion, Sede } from '@/lib/sedes';
import { useRoleGuard } from '@/lib/role-guard';

/**
 * Alta de sedes físicas del SENA (donde trabajan los instructores). El
 * listado de solo lectura con navegación a instructores/portafolio ya
 * existe en /victoria/coordinador/sedes -- esta pantalla es la que le
 * falta a ese módulo: crear una sede nueva.
 */
export default function SedesGestionScreen() {
  const perfil = useRoleGuard(['coordinador']);
  const [sedes, setSedes] = useState<Sede[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [horario, setHorario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  function cargar() {
    if (!perfil) return;
    obtenerSedesGestion()
      .then(setSedes)
      .catch((err: any) => setError(err.message));
  }

  useEffect(cargar, [perfil]);

  function cerrarYLimpiar() {
    setModalVisible(false);
    setNombre('');
    setDescripcion('');
    setDireccion('');
    setTelefono('');
    setHorario('');
    setErrorGuardar(null);
  }

  async function guardar() {
    if (!nombre.trim()) {
      setErrorGuardar('El nombre de la sede es obligatorio.');
      return;
    }
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await crearSede({
        nombre,
        descripcion: descripcion || undefined,
        direccion_principal: direccion || undefined,
        telefono_atencion: telefono || undefined,
        horario_atencion: horario || undefined,
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
      <PaneHeader eyebrow="VICTORIA > Coordinador > Gestión" title="Sedes - SENA" />

      <Pressable style={styles.newButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add-circle-outline" size={16} color={VictoriaColors.white} />
        <Text style={styles.newButtonText}>Añadir sede</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!sedes && !error ? <ActivityIndicator color={VictoriaColors.white} /> : null}
      {sedes && sedes.length === 0 ? (
        <Text style={styles.empty}>Todavía no hay sedes registradas.</Text>
      ) : null}

      <View style={styles.list}>
        {sedes?.map((s) => (
          <ListRow
            key={s.id_sede}
            icon="business-outline"
            title={s.nombre}
            subtitle={s.direccion_principal ?? s.descripcion ?? 'Sin dirección registrada'}
          />
        ))}
      </View>

      <ExitButton />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={cerrarYLimpiar}>
        <Pressable style={styles.modalBackdrop} onPress={cerrarYLimpiar}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Añadir sede</Text>
                <Pressable onPress={cerrarYLimpiar} hitSlop={8}>
                  <Ionicons name="close" size={20} color="#556b5c" />
                </Pressable>
              </View>

              {errorGuardar ? <Text style={styles.errorText}>{errorGuardar}</Text> : null}

              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholder="Nombre de la sede"
                placeholderTextColor="#556b5c"
                style={styles.input}
              />
              <TextInput
                value={direccion}
                onChangeText={setDireccion}
                placeholder="Dirección principal"
                placeholderTextColor="#556b5c"
                style={styles.input}
              />
              <TextInput
                value={telefono}
                onChangeText={setTelefono}
                placeholder="Teléfono de atención"
                placeholderTextColor="#556b5c"
                style={styles.input}
              />
              <TextInput
                value={horario}
                onChangeText={setHorario}
                placeholder="Horario de atención"
                placeholderTextColor="#556b5c"
                style={styles.input}
              />
              <TextInput
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Descripción (opcional)"
                placeholderTextColor="#556b5c"
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
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#a2b49e',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
