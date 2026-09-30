import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import { DetalleMateria, NotaTarea, obtenerNotasMateria } from '@/lib/seguimiento';

const ESTADO_INFO: Record<
  string,
  { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  aprobado: { label: 'Aprobado', color: '#146c43', bg: '#d1f2dc', icon: 'checkmark-circle-outline' },
  en_revision: { label: 'En revisión', color: '#8a6d1d', bg: '#f3e6bf', icon: 'time-outline' },
  rechazado: { label: 'Desaprobado', color: '#8a2b2b', bg: '#f3cfcf', icon: 'close-circle-outline' },
  pendiente: { label: 'Pendiente', color: '#555555', bg: '#e4e4e4', icon: 'ellipse-outline' },
};

// Colores de la barra en la pestaña Promedios — un poco más suaves que
// los badges, para que se vean bien uno junto al otro en la lista.
const COLOR_BARRA: Record<string, string> = {
  aprobado: '#8FAE6A',
  en_revision: '#C2B280',
  rechazado: '#C17A86',
  pendiente: '#D8D8D8',
};

function infoEstado(estado: string) {
  return ESTADO_INFO[estado] ?? ESTADO_INFO.pendiente;
}

function BarraCalificacion({ tarea }: { tarea: NotaTarea }) {
  const [hover, setHover] = useState(false);
  const color = COLOR_BARRA[tarea.estado] ?? COLOR_BARRA.pendiente;
  const porcentaje = tarea.nota !== null ? Math.min(100, Math.max(4, (tarea.nota / 10) * 100)) : 3;

  return (
    <View style={styles.barraFila}>
      <Text style={styles.barraTitulo} numberOfLines={1}>
        {tarea.titulo}
      </Text>
      <View style={styles.barraPista}>
        <Pressable
          style={[styles.barraRellena, { width: `${porcentaje}%`, backgroundColor: color }]}
          onHoverIn={() => setHover(true)}
          onHoverOut={() => setHover(false)}
        />
        {hover ? (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitulo} numberOfLines={1}>
              {tarea.titulo}
            </Text>
            <Text style={styles.tooltipTexto}>
              Calificación: {tarea.nota !== null ? tarea.nota.toFixed(1) : 'Sin calificar'}/10.0
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function SeguimientoDetalleScreen() {
  const { trimestre, materia } = useLocalSearchParams<{ trimestre: string; materia: string }>();
  const claveTrimestre = (trimestre ?? '').toUpperCase();
  const idCompetencia = Number(materia);

  const [detalle, setDetalle] = useState<DetalleMateria | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'tareas' | 'promedios'>('tareas');

  useEffect(() => {
    if (!idCompetencia) return;
    obtenerNotasMateria(claveTrimestre, idCompetencia)
      .then(setDetalle)
      .catch((err) => setError(err.message));
  }, [claveTrimestre, idCompetencia]);

  const infoPromedio =
    detalle?.estado_promedio === 'Aprobado'
      ? ESTADO_INFO.aprobado
      : detalle?.estado_promedio === 'Sin calificar'
        ? ESTADO_INFO.pendiente
        : ESTADO_INFO.en_revision;

  const aprobadas = detalle?.tareas.filter((t) => t.estado === 'aprobado').length ?? 0;
  const enRevision = detalle?.tareas.filter((t) => t.estado === 'en_revision').length ?? 0;
  const desaprobadas = detalle?.tareas.filter((t) => t.estado === 'rechazado').length ?? 0;
  const calificadas = detalle?.tareas.filter((t) => t.nota !== null).length ?? 0;

  return (
    <VictoriaScreenShell>
      <PaneHeader
        eyebrow="Volver a seguimiento"
        title={detalle ? `${detalle.nombre} - Trimestre ${detalle.numero}` : 'Materia'}
        backHref={`/victoria/seguimiento/${claveTrimestre}`}
      />

      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabButton, tab === 'tareas' && styles.tabButtonActive]}
          onPress={() => setTab('tareas')}>
          <Ionicons name="list-outline" size={14} color={tab === 'tareas' ? VictoriaColors.white : '#555555'} />
          <Text style={[styles.tabText, tab === 'tareas' && styles.tabTextActive]}>Tareas y Notas</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, tab === 'promedios' && styles.tabButtonActive]}
          onPress={() => setTab('promedios')}>
          <Ionicons
            name="bar-chart-outline"
            size={14}
            color={tab === 'promedios' ? VictoriaColors.white : '#555555'}
          />
          <Text style={[styles.tabText, tab === 'promedios' && styles.tabTextActive]}>Promedios</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!detalle && !error ? <ActivityIndicator color={VictoriaColors.white} style={styles.loader} /> : null}

      {detalle ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <View style={styles.summaryIcon}>
              <Ionicons name="ribbon-outline" size={18} color={VictoriaColors.textOnLight} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Promedio General</Text>
              <Text style={styles.summaryValue}>
                {detalle.promedio !== null ? detalle.promedio.toFixed(1) : '—'}
                <Text style={styles.summaryValueSuffix}>/10.0</Text>
              </Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: infoPromedio.bg }]}>
            <Text style={[styles.badgeText, { color: infoPromedio.color }]}>{detalle.estado_promedio}</Text>
          </View>
        </View>
      ) : null}

      {detalle && tab === 'tareas' ? (
        detalle.tareas.length === 0 ? (
          <Text style={styles.empty}>Aún no hay tareas registradas para esta materia.</Text>
        ) : (
          <View style={styles.list}>
            {detalle.tareas.map((tarea) => {
              const info = infoEstado(tarea.estado);
              return (
                <View key={tarea.id_tarea} style={styles.row}>
                  <View style={styles.mainCol}>
                    <View style={styles.rowTop}>
                      <Text style={styles.taskTitle}>{tarea.titulo}</Text>
                      <View style={[styles.badge, { backgroundColor: info.bg }]}>
                        <Ionicons name={info.icon} size={13} color={info.color} />
                        <Text style={[styles.badgeText, { color: info.color }]}>{info.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.taskDesc}>
                      {tarea.tiene_archivo ? 'Archivo adjunto' : 'Sin archivo adjunto'}
                    </Text>
                    {tarea.nota !== null ? (
                      <View style={styles.gradeRow}>
                        <View style={[styles.gradeChip, { backgroundColor: info.bg }]}>
                          <Text style={[styles.gradeChipText, { color: info.color }]}>
                            {tarea.nota.toFixed(1)}
                          </Text>
                        </View>
                        {tarea.comentario ? <Text style={styles.comentario}>"{tarea.comentario}"</Text> : null}
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )
      ) : null}

      {detalle && tab === 'promedios' ? (
        <View style={styles.promediosWrap}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statCardNum, { color: '#146c43' }]}>{aprobadas}</Text>
              <Text style={styles.statCardLabel}>Aprobadas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statCardNum, { color: '#8a6d1d' }]}>{enRevision}</Text>
              <Text style={styles.statCardLabel}>En Revisión</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statCardNum, { color: '#8a2b2b' }]}>{desaprobadas}</Text>
              <Text style={styles.statCardLabel}>Desaprobada</Text>
            </View>
          </View>

          <View style={styles.barrasCard}>
            <Text style={styles.barrasTitulo}>Calificaciones por tarea</Text>
            <Text style={styles.barrasSubtitulo}>
              {calificadas} {calificadas === 1 ? 'Tarea calificada' : 'Tareas calificadas'}
            </Text>

            <View style={styles.barrasLista}>
              {detalle.tareas.map((tarea) => (
                <BarraCalificacion key={tarea.id_tarea} tarea={tarea} />
              ))}
            </View>

            <View style={styles.ejeFila}>
              <View style={styles.ejeEspaciador} />
              <View style={styles.ejeLinea}>
                {[0, 2, 4, 6, 8, 10].map((n) => (
                  <Text key={n} style={styles.ejeNumero}>
                    {n}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        </View>
      ) : null}

      <ExitButton />
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: 20 },
  error: { color: '#ff8a8a', marginBottom: 12 },
  empty: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 50,
  },
  tabButtonActive: {
    backgroundColor: VictoriaColors.darkGreen,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
  },
  tabTextActive: {
    color: VictoriaColors.white,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: VictoriaColors.mutedGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: VictoriaColors.black,
  },
  summaryValueSuffix: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666666',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 50,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
  row: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 18,
  },
  mainCol: {
    gap: 6,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  taskDesc: {
    fontSize: 12,
    color: '#666666',
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  gradeChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 50,
  },
  gradeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  comentario: {
    fontSize: 12,
    color: '#555555',
    fontStyle: 'italic',
    flexShrink: 1,
  },

  // Pestaña Promedios
  promediosWrap: {
    gap: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statCardNum: {
    fontSize: 22,
    fontWeight: '700',
  },
  statCardLabel: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  barrasCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
  },
  barrasTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: VictoriaColors.black,
  },
  barrasSubtitulo: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 16,
  },
  barrasLista: {
    gap: 14,
  },
  barraFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barraTitulo: {
    width: 110,
    fontSize: 12,
    color: '#333333',
  },
  barraPista: {
    flex: 1,
    height: 22,
    justifyContent: 'center',
    position: 'relative',
  },
  barraRellena: {
    height: 12,
    borderRadius: 6,
  },
  tooltip: {
    position: 'absolute',
    top: -46,
    left: 0,
    backgroundColor: 'rgba(20, 30, 25, 0.92)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    zIndex: 10,
  },
  tooltipTitulo: {
    color: VictoriaColors.white,
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 160,
  },
  tooltipTexto: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
  },
  ejeFila: {
    flexDirection: 'row',
    marginTop: 4,
  },
  ejeEspaciador: {
    width: 122,
  },
  ejeLinea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.15)',
    paddingTop: 4,
  },
  ejeNumero: {
    fontSize: 10,
    color: '#888888',
  },
});