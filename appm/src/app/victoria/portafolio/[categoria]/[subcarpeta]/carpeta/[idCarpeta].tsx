import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams } from 'expo-router';
import { createElement, useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import { API_BASE_URL } from '@/lib/api-config';
import { obtenerPerfil, type Perfil } from '@/lib/auth';
import {
  ArchivoPortafolio,
  obtenerArchivosDeCarpeta,
  obtenerDetalleCarpeta,
  subirArchivoACarpeta,
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

export default function ArchivosCarpetaScreen() {
  const { categoria, subcarpeta, idCarpeta } = useLocalSearchParams<{
    categoria: string;
    subcarpeta: string;
    idCarpeta: string;
  }>();
  const claveCategoria = categoria ?? 'otros';
  const claveSubcarpeta = subcarpeta ?? 'trim_1';
  const numeroCarpeta = Number(idCarpeta);
  const nombreCarpetaFija = NOMBRES_CARPETA[claveCategoria] ?? claveCategoria;
  const nombreSubcarpeta = NOMBRES_SUBCARPETA[claveSubcarpeta] ?? claveSubcarpeta;

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [nombreCarpeta, setNombreCarpeta] = useState<string | null>(null);
  const [archivos, setArchivos] = useState<ArchivoPortafolio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  const cargar = useCallback(() => {
    obtenerDetalleCarpeta(claveCategoria, claveSubcarpeta, numeroCarpeta)
      .then((carpeta) => setNombreCarpeta(carpeta.nombre))
      .catch((err) => setError(err.message));
    obtenerArchivosDeCarpeta(claveCategoria, claveSubcarpeta, numeroCarpeta)
      .then(setArchivos)
      .catch((err) => setError(err.message));
  }, [claveCategoria, claveSubcarpeta, numeroCarpeta]);

  useEffect(() => {
    obtenerPerfil().then(setPerfil);
    cargar();
  }, [cargar]);

  const nombreCompleto = perfil ? [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') : '';

  async function subir(archivo: File) {
    setSubiendo(true);
    setError(null);
    try {
      await subirArchivoACarpeta(claveCategoria, claveSubcarpeta, numeroCarpeta, archivo);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubiendo(false);
    }
  }

  function abrirSelectorArchivo() {
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

  return (
    <VictoriaScreenShell>
      <PaneHeader
        eyebrow="Portafolio 2026"
        title={nombreCarpeta ?? '...'}
        backHref={`/victoria/portafolio/${claveCategoria}/${claveSubcarpeta}` as never}
      />

      <View style={styles.topRow}>
        <View style={styles.breadcrumbRow}>
          <Link href={'/victoria/portafolio' as never} style={styles.crumb}>
            Portafolio{nombreCompleto ? ` - ${nombreCompleto}` : ''}
          </Link>
          <Text style={styles.crumbSep}>›</Text>
          <Link href={`/victoria/portafolio/${claveCategoria}` as never} style={styles.crumb}>
            {nombreCarpetaFija.toUpperCase()}
          </Link>
          <Text style={styles.crumbSep}>›</Text>
          <Link href={`/victoria/portafolio/${claveCategoria}/${claveSubcarpeta}` as never} style={styles.crumb}>
            {nombreSubcarpeta}
          </Link>
          <Text style={styles.crumbSep}>›</Text>
          <Text style={styles.crumbActual}>{nombreCarpeta ?? '...'}</Text>
        </View>

        <Pressable style={styles.uploadButton} onPress={abrirSelectorArchivo} disabled={subiendo}>
          <Ionicons name="cloud-upload-outline" size={16} color={VictoriaColors.white} />
          <Text style={styles.uploadButtonText}>{subiendo ? 'Subiendo…' : 'Nuevo'}</Text>
        </Pressable>
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

          {!archivos && !error ? (
            <ActivityIndicator color={VictoriaColors.darkGreen} style={styles.loader} />
          ) : null}

          {archivos && archivos.length === 0 ? (
            <View style={styles.vacio}>
              <LogoV size={96} />
              <Text style={styles.vacioTitulo}>Arrastra y suelta el contenido</Text>
              <Text style={styles.vacioTexto}>O pulsa la opción “Nuevo”</Text>
            </View>
          ) : null}

          {archivos?.map((archivo) => (
            <Pressable
              key={archivo.id_archivo}
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
              <Text style={[styles.rowText, styles.colDato]}>
                {new Date(archivo.fecha_subida).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
              </Text>
              <Text style={[styles.rowText, styles.colDato]}>{nombreCompleto || '—'}</Text>
              <Text style={[styles.rowText, styles.colDato]}>—</Text>
            </Pressable>
          ))}
        </View>
      </ZonaSoltar>

      <ExitButton />
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
});