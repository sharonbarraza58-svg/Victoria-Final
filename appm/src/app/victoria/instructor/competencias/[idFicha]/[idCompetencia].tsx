import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { ExitButton, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors, VictoriaRadius } from '@/constants/victoria-theme';
import {
  crearTarea,
  InstructorApiError,
  obtenerTareas,
  subirAdjunto,
  Tarea,
} from '@/lib/instructor';
import { useRoleGuard } from '@/lib/role-guard';

export default function InstructorTareasScreen() {
  const perfil = useRoleGuard(['instructor']);
  const { idFicha: idFichaParam, idCompetencia: idCompetenciaParam } = useLocalSearchParams<{
    idFicha: string;
    idCompetencia: string;
  }>();
  const idFicha = Number(idFichaParam);
  const idCompetencia = Number(idCompetenciaParam);

  const [tareas, setTareas] = useState<Tarea[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const cargar = useCallback(() => {
    if (!perfil || !idFicha || !idCompetencia) return;
    obtenerTareas(idFicha, idCompetencia)
      .then((res) => {
        setTareas(res);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof InstructorApiError ? err.message : 'No se pudieron cargar las tareas.')
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil, idFicha, idCompetencia]);

  useFocusEffect(cargar);

  if (perfil === undefined) {
    return (
      <VictoriaScreenShell>
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      </VictoriaScreenShell>
    );
  }
  if (!perfil) return null;

  return (
    <VictoriaScreenShell>
      <View style={styles.headerRow}>
        <PaneHeader
          eyebrow="Volver a Competencias gestión de materias"
          title={`Ficha ${idFichaParam}`}
          backHref="/victoria/instructor/competencias"
        />
        <Pressable style={styles.newTaskBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={16} color={VictoriaColors.white} />
          <Text style={styles.newTaskBtnText}>Nueva Tarea</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!tareas && !error ? <ActivityIndicator color={VictoriaColors.white} style={styles.loader} /> : null}

      {tareas && tareas.length === 0 ? (
        <Text style={styles.empty}>Aún no hay tareas creadas para esta ficha y materia.</Text>
      ) : null}

      <View style={styles.list}>
        {tareas?.map((tarea) => (
          <Pressable
            key={tarea.id_tarea}
            style={styles.taskRow}
            onPress={() => router.push(`/victoria/instructor/tareas/${tarea.id_tarea}` as never)}>
            <View style={styles.taskMain}>
              <Text style={styles.taskTitle}>{tarea.titulo}</Text>
              {tarea.descripcion ? <Text style={styles.taskDesc}>{tarea.descripcion}</Text> : null}
              <View style={styles.chipsRow}>
                {tarea.fecha_limite ? (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>Vence {tarea.fecha_limite}</Text>
                  </View>
                ) : null}
                <View style={[styles.chip, styles.chipGreen]}>
                  <Text style={[styles.chipText, styles.chipGreenText]}>
                    {tarea.total_aprobados} aprobados
                  </Text>
                </View>
                <View style={[styles.chip, styles.chipAmber]}>
                  <Text style={[styles.chipText, styles.chipAmberText]}>
                    {tarea.total_en_revision} en revisión
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#888888" />
          </Pressable>
        ))}
      </View>

      <ExitButton />

      <NuevaTareaModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreada={(nueva) => {
          setTareas((prev) => (prev ? [nueva, ...prev] : [nueva]));
          setModalVisible(false);
        }}
        idFicha={idFicha}
        idCompetencia={idCompetencia}
      />
    </VictoriaScreenShell>
  );
}

function NuevaTareaModal({
  visible,
  onClose,
  onCreada,
  idFicha,
  idCompetencia,
}: {
  visible: boolean;
  onClose: () => void;
  onCreada: (t: Tarea) => void;
  idFicha: number;
  idCompetencia: number;
}) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [archivoUrl, setArchivoUrl] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function limpiarYCerrar() {
    setTitulo('');
    setDescripcion('');
    setFecha('');
    setArchivoUrl(null);
    setNombreArchivo(null);
    setError(null);
    onClose();
  }

  async function handleAdjuntar() {
    const resultado = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (resultado.canceled || !resultado.assets?.[0]) return;
    const archivo = resultado.assets[0];
    setSubiendo(true);
    setError(null);
    try {
      const url = await subirAdjunto({
        uri: archivo.uri,
        name: archivo.name,
        mimeType: archivo.mimeType,
      });
      setArchivoUrl(url);
      setNombreArchivo(archivo.name);
    } catch (err) {
      setError(err instanceof InstructorApiError ? err.message : 'No se pudo adjuntar el archivo.');
    } finally {
      setSubiendo(false);
    }
  }

  async function handleCrear() {
    if (!titulo.trim()) {
      setError('El título de la evidencia es obligatorio.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const nueva = await crearTarea(idFicha, idCompetencia, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        fecha_limite: fecha.trim() || undefined,
        archivo_url: archivoUrl ?? undefined,
      });
      onCreada(nueva);
      limpiarYCerrar();
    } catch (err) {
      setError(err instanceof InstructorApiError ? err.message : 'No se pudo crear la tarea.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={limpiarYCerrar}>
      <Pressable style={modalStyles.backdrop} onPress={limpiarYCerrar}>
        <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
          <ScrollView contentContainerStyle={modalStyles.cardContent}>
            <View style={modalStyles.headerRow}>
              <View>
                <Text style={modalStyles.title}>Nueva Tarea</Text>
                <Text style={modalStyles.subtitle}>Ficha {idFicha}</Text>
              </View>
              <Pressable onPress={limpiarYCerrar} hitSlop={8}>
                <Ionicons name="close" size={20} color="#556b5c" />
              </Pressable>
            </View>

            <TextInput
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Título de la evidencia"
              placeholderTextColor="#8a8a8a"
              style={modalStyles.input}
            />
            <TextInput
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Descripción (opcional)"
              placeholderTextColor="#8a8a8a"
              multiline
              style={[modalStyles.input, modalStyles.textarea]}
            />
            <TextInput
              value={fecha}
              onChangeText={setFecha}
              placeholder="dd/mm/aaaa"
              placeholderTextColor="#8a8a8a"
              style={modalStyles.input}
            />

            <Pressable style={modalStyles.attachBox} onPress={handleAdjuntar} disabled={subiendo}>
              {subiendo ? (
                <ActivityIndicator color="#556b5c" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={22} color="#556b5c" />
                  <Text style={modalStyles.attachText}>
                    {nombreArchivo ?? 'Haz clic para adjuntar un archivo'}
                  </Text>
                </>
              )}
            </Pressable>

            {error ? <Text style={modalStyles.error}>{error}</Text> : null}

            <Pressable
              style={[modalStyles.submitBtn, guardando && modalStyles.submitBtnDisabled]}
              onPress={handleCrear}
              disabled={guardando}>
              {guardando ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={modalStyles.submitText}>Crear Tarea</Text>
              )}
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 20 },
  error: { color: '#ff8a8a', marginBottom: 12 },
  empty: { color: 'rgba(255, 255, 255, 0.6)' },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  newTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: VictoriaColors.darkGreen,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: VictoriaRadius.pill,
  },
  newTaskBtnText: {
    color: VictoriaColors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  list: {
    gap: 12,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  taskMain: {
    flex: 1,
    gap: 6,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: VictoriaColors.black,
  },
  taskDesc: {
    fontSize: 13,
    color: '#555555',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: VictoriaRadius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  chipText: {
    fontSize: 11,
    color: '#444444',
    fontWeight: '600',
  },
  chipGreen: { backgroundColor: '#d1f2dc' },
  chipGreenText: { color: '#146c43' },
  chipAmber: { backgroundColor: '#fdecc8' },
  chipAmberText: { color: '#8a5a00' },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
  },
  card: {
    width: 420,
    maxWidth: '100%',
    maxHeight: '85%',
    backgroundColor: 'rgba(225, 232, 222, 0.98)',
    borderRadius: 25,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 24,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a3322',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b6b6b',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1a1a1a',
  },
  textarea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  attachBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  attachText: {
    fontSize: 12,
    color: '#556b5c',
    textAlign: 'center',
  },
  error: {
    color: '#b3261e',
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: '#143520',
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
