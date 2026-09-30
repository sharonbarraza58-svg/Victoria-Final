import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, FloatingActionPill, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors, VictoriaRadius } from '@/constants/victoria-theme';
import {
  CompetenciaDetalle,
  CoordinadorApiError,
  obtenerCompetenciaDetalle,
} from '@/lib/coordinador';
import { useRoleGuard } from '@/lib/role-guard';

function formatearFecha(fecha: string | null): string {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Detalle de UNA materia dentro del portafolio de un instructor, visto
 * por el coordinador (Doc3 imagen 4 derecha: "Python - Manejo y
 * creaciones", descripción y los archivos que el instructor subió como
 * evidencia). El nombre del archivo de ruta es "[materia].tsx" pero el
 * valor que viaja en la URL es el id_competencia (así navega
 * portafolio/[trimestre]/index.tsx). Antes este archivo era una copia
 * pegada de portafolio/[trimestre]/index.tsx (la lista de materias) y
 * nunca llegaba a pedir ni mostrar el detalle de una sola competencia.
 */
export default function CoordinadorCompetenciaDetalleScreen() {
  const perfil = useRoleGuard(['coordinador']);
  const { idInstructor, trimestre, materia } = useLocalSearchParams<{
    idInstructor: string;
    trimestre: string;
    materia: string;
  }>();
  const idInstructorNum = Number(idInstructor);
  const trimestreNum = Number(trimestre);
  const idCompetenciaNum = Number(materia);

  const [competencia, setCompetencia] = useState<CompetenciaDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!perfil) return;
    if (!idInstructorNum || !trimestreNum || !idCompetenciaNum) {
      setError('No se especificó una materia válida.');
      return;
    }
    setError(null);
    obtenerCompetenciaDetalle(idInstructorNum, trimestreNum, idCompetenciaNum)
      .then((res) => {
        setCompetencia(res);
        setError(null);
      })
      .catch((err) =>
        setError(
          err instanceof CoordinadorApiError ? err.message : 'No se pudo cargar esta materia.'
        )
      );
  }, [perfil, idInstructorNum, trimestreNum, idCompetenciaNum]);

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
          eyebrow="Competencias - gestión de materias"
          title={competencia?.nombre ?? 'Materia'}
          backHref={`/victoria/coordinador/instructores/${idInstructorNum}/portafolio/${trimestreNum}` as never}
        />
        <FloatingActionPill
          label="Ir a Portafolio"
          href={`/victoria/coordinador/instructores/${idInstructorNum}/portafolio/${trimestreNum}`}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!competencia && !error ? (
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      ) : null}

      {competencia ? (
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardIcon}>
              <Ionicons name="layers-outline" size={20} color={VictoriaColors.textOnLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{competencia.nombre}</Text>
              <Text style={styles.subLinea}>
                {formatearFecha(competencia.fecha_creacion)}
                {competencia.fecha_edicion
                  ? ` (editado ${formatearFecha(competencia.fecha_edicion)})`
                  : ''}
              </Text>
              <View style={styles.trimestreBadge}>
                <Text style={styles.trimestreBadgeText}>Trimestre {competencia.trimestre}</Text>
              </View>
            </View>
          </View>

          {competencia.descripcion ? (
            <Text style={styles.descripcion}>{competencia.descripcion}</Text>
          ) : null}

          <View style={styles.divider} />

          {competencia.archivos.length === 0 ? (
            <Text style={styles.sinArchivos}>
              El instructor todavía no ha subido evidencias para esta materia.
            </Text>
          ) : (
            <>
              <View style={styles.archivosRow}>
                {competencia.archivos.map((archivo) => (
                  <View key={archivo.id_evidencia} style={styles.archivoCol}>
                    <View style={styles.archivoThumb}>
                      <Ionicons
                        name="document-text-outline"
                        size={22}
                        color="rgba(28, 53, 45, 0.35)"
                      />
                    </View>
                    <Text style={styles.archivoNombre} numberOfLines={2}>
                      {archivo.nombre_archivo}
                    </Text>
                    <View style={styles.archivoAcciones}>
                      <Pressable
                        style={styles.archivoBtn}
                        onPress={() => Linking.openURL(archivo.url)}>
                        <Ionicons name="eye-outline" size={12} color={VictoriaColors.white} />
                      </Pressable>
                      <Pressable
                        style={[styles.archivoBtn, styles.archivoBtnClaro]}
                        onPress={() => Linking.openURL(archivo.url)}>
                        <Ionicons
                          name="download-outline"
                          size={12}
                          color={VictoriaColors.textOnLight}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.footerFecha}>{formatearFecha(competencia.fecha_creacion)}</Text>
                <View style={styles.archivosBadge}>
                  <Ionicons name="attach-outline" size={12} color={VictoriaColors.textOnLight} />
                  <Text style={styles.archivosBadgeText}>
                    {competencia.archivos.length}{' '}
                    {competencia.archivos.length === 1 ? 'archivo' : 'archivos'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      ) : null}

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
  loader: { marginTop: 20 },
  error: { color: '#ff8a8a', marginBottom: 12 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: VictoriaRadius.card,
    padding: 22,
    maxWidth: 520,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: {
    fontSize: 17,
    fontWeight: '700',
    color: VictoriaColors.black,
  },
  subLinea: {
    fontSize: 12,
    color: '#777777',
    marginTop: 2,
  },
  trimestreBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
    borderRadius: VictoriaRadius.pill,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  trimestreBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: VictoriaColors.textOnLight,
  },
  descripcion: {
    fontSize: 13,
    color: '#444444',
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
  },
  sinArchivos: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
    fontStyle: 'italic',
  },
  archivosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  archivoCol: {
    width: 100,
    gap: 6,
  },
  archivoThumb: {
    width: 100,
    height: 76,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivoNombre: {
    fontSize: 11,
    color: '#444444',
  },
  archivoAcciones: {
    flexDirection: 'row',
    gap: 6,
  },
  archivoBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: VictoriaColors.darkGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivoBtnClaro: {
    backgroundColor: 'rgba(28, 53, 45, 0.1)',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  footerFecha: {
    fontSize: 11,
    color: '#888888',
  },
  archivosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
    borderRadius: VictoriaRadius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  archivosBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: VictoriaColors.textOnLight,
  },
});
