import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams } from 'expo-router';
import { createElement, useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import { API_BASE_URL } from '@/lib/api-config';
import { obtenerPerfil, type Perfil } from '@/lib/auth';
import {
  ArchivoPortafolio,
  CarpetaAprendiz,
  crearCarpetaEnSubcarpeta,
  obtenerArchivosDeSubcarpeta,
  obtenerCarpetasDeSubcarpeta,
  subirArchivoASubcarpeta,
} from '@/lib/portafolio';

const NOMBRES_CARPETA: Record<string, string> = {
  planes_mejoramiento: 'Planes de mejoramiento',
  etapa_productiva: 'Formato etapa productiva',
  evidencias_aprendizaje: 'Evidencias de aprendizaje',
  plan_trabajo_concertado: 'Plan de trabajo concertado',
  otros: 'Otros',
};

const NOMBRES_SUBCARPETA: Record<string, string> = {
  trim_1: 'TRIM_I',
  trim_2: 'TRIM_II',
  trim_3: 'TRIM_III',
  trim_4: 'TRIM_IV',
};

// Logo V hecho con vistas normales, sin imágenes ni librerías.
function LogoV({ size = 96 }: { size?: number }) {
  const escala = size / 96;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          left: 22.8 * escala,
          top: 7 * escala,
          width: 22 * escala,
          height: 70 * escala,
          borderRadius: 11 * escala,
          backgroundColor: '#1F5A33',
          transform: [{ rotate: '-24deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 51.2 * escala,
          top: 7 * escala,
          width: 22 * escala,
          height: 70 * escala,
          borderRadius: 11 * escala,
          backgroundColor: '#4E9B68',
          transform: [{ rotate: '24deg' }],
        }}
      />
    </View>
  );
}

// Zona donde se pueden soltar archivos. Solo funciona en web: en móvil
// devuelve un View normal sin arrastrar y soltar.
function ZonaSoltar({
  children,
  onArrastrando,
  onArchivo,
}: {
  children: ReactNode;
  onArrastrando: (valor: boolean) => void;
  onArchivo: (archivo: File) => void;
}) {
  if (Platform.OS !== 'web') return <View>{children}</View>;

  return createElement(
    'div',
    {
      onDragOver: (e: any) => {
        e.preventDefault();
        onArrastrando(true);
      },
      onDragLeave: () => onArrastrando(false),
      onDrop: (e: any) => {
        e.preventDefault();
        onArrastrando(false);
        const archivo = e.dataTransfer?.files?.[0];
        if (archivo) onArchivo(archivo);
      },
    },
    children,
  );
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
}

export default function ArchivosSubcarpetaScreen() {
  const { categoria, subcarpeta } = useLocalSearchParams<{ categoria: string; subcarpeta: string }>();
  const claveCategoria = categoria ?? 'otros';
  const claveSubcarpeta = subcarpeta ?? 'trim_1';
  const nombreCarpeta = NOMBRES_CARPETA[claveCategoria] ?? claveCategoria;
  const nombreSubcarpeta = NOMBRES_SUBCARPETA[claveSubcarpeta] ?? claveSubcarpeta;

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [archivos, setArchivos] = useState<ArchivoPortafolio[] | null>(null);
  const [carpetas, setCarpetas] = useState<CarpetaAprendiz[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalCarpeta, setModalCarpeta] = useState(false);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState('');
  const [creandoCarpeta, setCreandoCarpeta] = useState(false);
  const [errorCarpeta, setErrorCarpeta] = useState<string | null>(null);

  const cargar = useCallback(() => {
    obtenerArchivosDeSubcarpeta(claveCategoria, claveSubcarpeta)
      .then(setArchivos)
      .catch((err) => setError(err.message));
    obtenerCarpetasDeSubcarpeta(claveCategoria, claveSubcarpeta)
      .then(setCarpetas)
      .catch((err) => setError(err.message));
  }, [claveCategoria, claveSubcarpeta]);

  useEffect(() => {
    obtenerPerfil().then(setPerfil);
    cargar();
  }, [cargar]);

  const nombreCompleto = perfil ? [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') : '';

  async function subir(archivo: File) {
    setSubiendo(true);
    setError(null);
    try {
      await subirArchivoASubcarpeta(claveCategoria, claveSubcarpeta, archivo);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubiendo(false);
    }
  }

  function abrirSelectorArchivo() {
    setMenuAbierto(false);
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip';
    input.onchange = () => {
      const archivo = input.files?.[0];
      if (archivo) subir(archivo);
    };
    input.click();
  }

  function abrirVentanaCarpeta() {
    setMenuAbierto(false);
    setNombreNuevaCarpeta('');
    setErrorCarpeta(null);
    setModalCarpeta(true);
  }

  function cerrarVentanaCarpeta() {
    setModalCarpeta(false);
    setNombreNuevaCarpeta('');
    setErrorCarpeta(null);
  }

  async function crearCarpeta() {
    const nombre = nombreNuevaCarpeta.trim();
    if (!nombre || creandoCarpeta) return;
    setCreandoCarpeta(true);
    setErrorCarpeta(null);
    try {
      await crearCarpetaEnSubcarpeta(claveCategoria, claveSubcarpeta, nombre);
      cerrarVentanaCarpeta();
      cargar();
    } catch (err) {
      setErrorCarpeta((err as Error).message);
    } finally {
      setCreandoCarpeta(false);
    }
  }

  const cargando = (!archivos || !carpetas) && !error;
  const vacio = archivos?.length === 0 && carpetas?.length === 0;

  return (
    <VictoriaScreenShell>
      <PaneHeader
        eyebrow="Portafolio 2026"
        title={nombreCompleto ? `Portafolio - ${nombreCompleto}` : 'Portafolio'}
        backHref={`/victoria/portafolio/${claveCategoria}` as never}
      />

      <View style={styles.topRow}>
        <View style={styles.breadcrumbRow}>
          <Link href={'/victoria/portafolio' as never} style={styles.crumb}>
            Portafolio{nombreCompleto ? ` - ${nombreCompleto}` : ''}
          </Link>
          <Text style={styles.crumbSep}>›</Text>
          <Link href={`/victoria/portafolio/${claveCategoria}` as never} style={styles.crumb}>
            {nombreCarpeta.toUpperCase()}
          </Link>
          <Text style={styles.crumbSep}>›</Text>
          <Text style={styles.crumbActual}>{nombreSubcarpeta}</Text>
        </View>

        <View style={styles.nuevoContenedor}>
          <Pressable
            style={styles.uploadButton}
            onPress={() => setMenuAbierto((abierto) => !abierto)}
            disabled={subiendo}>
            <Ionicons name="cloud-upload-outline" size={16} color={VictoriaColors.white} />
            <Text style={styles.uploadButtonText}>{subiendo ? 'Subiendo…' : 'Nuevo'}</Text>
          </Pressable>

          {menuAbierto ? (
            <View style={styles.menu}>
              <Pressable style={styles.menuItem} onPress={abrirVentanaCarpeta}>
                <Ionicons name="folder-outline" size={16} color={VictoriaColors.white} />
                <Text style={styles.menuTexto}>Carpeta Nueva</Text>
              </Pressable>
              <View style={styles.menuLinea} />
              <Pressable style={styles.menuItem} onPress={abrirSelectorArchivo}>
                <Ionicons name="cloud-upload-outline" size={16} color={VictoriaColors.white} />
                <Text style={styles.menuTexto}>Subir Archivos</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ZonaSoltar onArrastrando={setArrastrando} onArchivo={subir}>
        <View style={[styles.table, arrastrando && styles.tableArrastrando]}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.colNombre, styles.headerNombre]}>Nombre</Text>
            <Text style={[styles.headerCell, styles.colDato]}>Modificado</Text>
            <Text style={[styles.headerCell, styles.colDato]}>Modificado Por</Text>
            <Text style={[styles.headerCell, styles.colDato]}>Archivos</Text>
          </View>

          {cargando ? <ActivityIndicator color={VictoriaColors.darkGreen} style={styles.loader} /> : null}

          {vacio ? (
            <View style={styles.vacio}>
              <LogoV size={96} />
              <Text style={styles.vacioTitulo}>Arrastra y suelta el contenido</Text>
              <Text style={styles.vacioTexto}>O pulsa la opción “Nuevo”</Text>
            </View>
          ) : null}

          {carpetas?.map((carpeta) => (
            <Link
              key={`carpeta-${carpeta.id_carpeta}`}
              href={`/victoria/portafolio/${claveCategoria}/${claveSubcarpeta}/carpeta/${carpeta.id_carpeta}` as never}
              asChild>
              <Pressable style={styles.row}>
                <View style={[styles.rowMain, styles.colNombre]}>
                  <View style={styles.folderIcon}>
                    <Ionicons name="folder" size={16} color={VictoriaColors.white} />
                  </View>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {carpeta.nombre}
                  </Text>
                </View>
                <Text style={[styles.rowText, styles.colDato]}>{formatearFecha(carpeta.ultima_modificacion)}</Text>
                <Text style={[styles.rowText, styles.colDato]}>{nombreCompleto || '—'}</Text>
                <Text style={[styles.rowText, styles.colDato]}>
                  {carpeta.total_archivos} {carpeta.total_archivos === 1 ? 'doc' : 'docs'}
                </Text>
              </Pressable>
            </Link>
          ))}

          {archivos?.map((archivo) => (
            <Pressable
              key={`archivo-${archivo.id_archivo}`}
              style={styles.row}
              onPress={() => Linking.openURL(`${API_BASE_URL}${archivo.url}`)}>
              <View style={[styles.rowMain, styles.colNombre]}>
                <View style={styles.fileIcon}>
                  <Ionicons name="document-text-outline" size={16} color={VictoriaColors.white} />
                </View>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {archivo.nombre_archivo}
                </Text>
              </View>
              <Text style={[styles.rowText, styles.colDato]}>{formatearFecha(archivo.fecha_subida)}</Text>
              <Text style={[styles.rowText, styles.colDato]}>{nombreCompleto || '—'}</Text>
              <Text style={[styles.rowText, styles.colDato]}>—</Text>
            </Pressable>
          ))}
        </View>
      </ZonaSoltar>

      <ExitButton />

      <Modal visible={modalCarpeta} transparent animationType="fade" onRequestClose={cerrarVentanaCarpeta}>
        <View style={styles.modalFondo}>
          <View style={styles.modalTarjeta}>
            <Pressable style={styles.modalCerrar} onPress={cerrarVentanaCarpeta}>
              <Ionicons name="close" size={18} color={VictoriaColors.black} />
            </Pressable>

            <Text style={styles.modalTitulo}>Carpeta Nueva</Text>
            <Text style={styles.modalSubtitulo}>
              Portafolio{nombreCompleto ? ` - ${nombreCompleto}` : ''}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre de la carpeta"
              placeholderTextColor="#777777"
              value={nombreNuevaCarpeta}
              onChangeText={setNombreNuevaCarpeta}
              onSubmitEditing={crearCarpeta}
              maxLength={100}
              autoFocus
            />

            {errorCarpeta ? <Text style={styles.modalError}>{errorCarpeta}</Text> : null}

            <Pressable
              style={[
                styles.modalBoton,
                (!nombreNuevaCarpeta.trim() || creandoCarpeta) && styles.modalBotonInactivo,
              ]}
              onPress={crearCarpeta}
              disabled={!nombreNuevaCarpeta.trim() || creandoCarpeta}>
              <Text style={styles.modalBotonTexto}>{creandoCarpeta ? 'Creando…' : 'Crear carpeta'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: 30 },
  error: { color: '#ff8a8a', marginBottom: 12 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 10,
    position: 'relative',
    zIndex: 10,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
  },
  crumb: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textDecorationLine: 'none',
  },
  crumbSep: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' },
  crumbActual: { fontSize: 12, fontWeight: '700', color: VictoriaColors.white },
  nuevoContenedor: {
    position: 'relative',
    alignItems: 'flex-end',
    zIndex: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: VictoriaColors.darkGreen,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 50,
  },
  uploadButtonText: {
    color: VictoriaColors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  menu: {
    position: 'absolute',
    top: 46,
    right: 0,
    minWidth: 170,
    backgroundColor: VictoriaColors.darkGreen,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    zIndex: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  menuTexto: {
    color: VictoriaColors.white,
    fontSize: 13,
    fontWeight: '500',
  },
  menuLinea: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  table: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 320,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tableArrastrando: {
    borderColor: VictoriaColors.darkGreen,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  headerNombre: { paddingLeft: 40 },
  vacio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 6,
  },
  vacioTitulo: {
    fontSize: 18,
    color: VictoriaColors.black,
    marginTop: 16,
  },
  vacioTexto: {
    fontSize: 12,
    color: '#666666',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  folderIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: VictoriaColors.darkGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: VictoriaColors.mutedGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: VictoriaColors.black,
    flexShrink: 1,
  },
  rowText: {
    fontSize: 13,
    color: '#555555',
  },
  colNombre: { flex: 3 },
  colDato: { flex: 1.2, textAlign: 'center' },

  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalTarjeta: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(238, 243, 238, 0.97)',
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  modalCerrar: {
    position: 'absolute',
    top: 14,
    right: 16,
    padding: 4,
  },
  modalTitulo: {
    fontSize: 24,
    fontWeight: '700',
    color: VictoriaColors.black,
  },
  modalSubtitulo: {
    fontSize: 11,
    color: '#555555',
    marginTop: 2,
    marginBottom: 18,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#666666',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 13,
    color: VictoriaColors.black,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    ...({ outlineStyle: 'none' } as object),
  },
  modalError: {
    color: '#b33a3a',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  modalBoton: {
    marginTop: 14,
    backgroundColor: VictoriaColors.darkGreen,
    borderRadius: 50,
    paddingVertical: 9,
    paddingHorizontal: 26,
  },
  modalBotonInactivo: {
    backgroundColor: VictoriaColors.mutedGreen,
    opacity: 0.7,
  },
  modalBotonTexto: {
    color: VictoriaColors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});