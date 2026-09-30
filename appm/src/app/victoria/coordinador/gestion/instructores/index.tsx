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
import { Usuario } from '@/lib/aprendices';
import { Coordinacion, obtenerCoordinaciones } from '@/lib/coordinaciones';
import { crearInstructor, eliminarInstructor, obtenerInstructores } from '@/lib/instructores';
import { useRoleGuard } from '@/lib/role-guard';

/**
 * Alta de instructores. Después de crear la cuenta aquí, el coordinador
 * usa POST /api/instructor/asignaciones (pantalla aparte, o directamente
 * desde Swagger por ahora) para decirle qué ficha+materia+trimestre
 * dicta -- esta pantalla solo crea la cuenta y la vincula a una
 * Coordinación académica.
 */
export default function InstructoresGestionScreen() {
  const perfil = useRoleGuard(['coordinador']);
  const [instructores, setInstructores] = useState<Usuario[] | null>(null);
  const [coordinaciones, setCoordinaciones] = useState<Coordinacion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [correoPersonal, setCorreoPersonal] = useState('');
  const [correoSena, setCorreoSena] = useState('');
  const [idCoordinacion, setIdCoordinacion] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  function cargar() {
    if (!perfil) return;
    obtenerInstructores()
      .then(setInstructores)
      .catch((err: any) => setError(err.message));
    obtenerCoordinaciones()
      .then(setCoordinaciones)
      .catch(() => {});
  }

  useEffect(cargar, [perfil]);

  function cerrarYLimpiar() {
    setModalVisible(false);
    setNombre('');
    setApellido('');
    setNumeroDocumento('');
    setFechaNacimiento('');
    setCorreoPersonal('');
    setCorreoSena('');
    setIdCoordinacion(null);
    setErrorGuardar(null);
  }

  async function guardar() {
    if (!nombre.trim() || !numeroDocumento.trim() || !fechaNacimiento.trim() || !idCoordinacion) {
      setErrorGuardar('Nombre, documento, fecha de nacimiento y coordinación son obligatorios.');
      return;
    }
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await crearInstructor({
        nombre,
        apellido: apellido || undefined,
        fecha_nacimiento: fechaNacimiento,
        numero_documento: numeroDocumento,
        tipo_documento: tipoDocumento,
        correo_personal: correoPersonal,
        correo_sena: correoSena,
        contrasena: numeroDocumento,
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

  async function borrar(id: number) {
    await eliminarInstructor(id).catch(() => {});
    cargar();
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
      <PaneHeader eyebrow="VICTORIA > Coordinador > Gestión" title="Instructores" />

      <Pressable style={styles.newButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="person-add-outline" size={16} color={VictoriaColors.white} />
        <Text style={styles.newButtonText}>Añadir instructor</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!instructores && !error ? <ActivityIndicator color={VictoriaColors.white} /> : null}

      <View style={styles.list}>
        {instructores?.map((i) => (
          <View key={i.id_usuario} style={styles.row}>
            <ListRow
              icon="person-outline"
              title={`${i.nombre} ${i.apellido ?? ''}`.trim()}
              subtitle={`${i.tipo_documento} ${i.numero_documento} · ${i.correo_sena}`}
            />
            <Pressable onPress={() => borrar(i.id_usuario)} style={styles.deleteBtn} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color="#7a3b3b" />
            </Pressable>
          </View>
        ))}
      </View>

      <ExitButton />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={cerrarYLimpiar}>
        <Pressable style={styles.modalBackdrop} onPress={cerrarYLimpiar}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Añadir instructor</Text>
                <Pressable onPress={cerrarYLimpiar} hitSlop={8}>
                  <Ionicons name="close" size={20} color="#556b5c" />
                </Pressable>
              </View>

              {errorGuardar ? <Text style={styles.errorText}>{errorGuardar}</Text> : null}

              <TextInput value={nombre} onChangeText={setNombre} placeholder="Nombre" style={styles.input} />
              <TextInput value={apellido} onChangeText={setApellido} placeholder="Apellido" style={styles.input} />
              <TextInput
                value={numeroDocumento}
                onChangeText={setNumeroDocumento}
                placeholder="Número de documento"
                style={styles.input}
                keyboardType="numeric"
              />
              <TextInput
                value={fechaNacimiento}
                onChangeText={setFechaNacimiento}
                placeholder="Fecha de nacimiento (AAAA-MM-DD)"
                style={styles.input}
              />
              <TextInput
                value={correoPersonal}
                onChangeText={setCorreoPersonal}
                placeholder="Correo personal"
                style={styles.input}
                autoCapitalize="none"
              />
              <TextInput
                value={correoSena}
                onChangeText={setCorreoSena}
                placeholder="Correo SENA"
                style={styles.input}
                autoCapitalize="none"
              />

              <Text style={styles.hint}>Coordinación:</Text>
              <View style={styles.chipRow}>
                {coordinaciones.map((c) => (
                  <Pressable
                    key={c.id_coordinacion}
                    onPress={() => setIdCoordinacion(c.id_coordinacion)}
                    style={[styles.chip, idCoordinacion === c.id_coordinacion && styles.chipActive]}>
                    <Text style={[styles.chipText, idCoordinacion === c.id_coordinacion && styles.chipTextActive]}>
                      {c.nombre_coordinacion}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.hintSmall}>
                Contraseña inicial: el número de documento (el instructor puede cambiarla luego con
                "Olvidaste tu contraseña?").
              </Text>

              <Pressable
                style={[styles.saveButton, guardando && { opacity: 0.6 }]}
                onPress={guardar}
                disabled={guardando}>
                <Text style={styles.saveButtonText}>{guardando ? 'Guardando...' : 'Añadir instructor'}</Text>
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
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBtn: { padding: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 500, maxHeight: '85%', backgroundColor: '#f8f9fa', borderRadius: 24, padding: 24 },
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
  hint: { fontSize: 12, color: '#556b5c', marginBottom: 8 },
  hintSmall: { fontSize: 11, color: '#889b8a', marginBottom: 14, lineHeight: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#e2ebd9' },
  chipActive: { backgroundColor: VictoriaColors.darkerGreen },
  chipText: { fontSize: 12, fontWeight: '600', color: '#1a3322' },
  chipTextActive: { color: '#fff' },
  saveButton: { backgroundColor: '#a2b49e', borderRadius: 20, paddingVertical: 12, alignItems: 'center' },
  saveButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
