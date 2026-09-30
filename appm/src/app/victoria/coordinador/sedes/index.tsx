import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, PaneHeader, PillButton, SearchPill } from '@/components/victoria/ui';
import { VictoriaColors, VictoriaRadius } from '@/constants/victoria-theme';
import {
  CoordinadorApiError,
  obtenerSedeDetalle,
  obtenerSedes,
  SedeDetalle,
  SedeResumen,
} from '@/lib/coordinador';
import { useRoleGuard } from '@/lib/role-guard';

/**
 * Sedes - SENA (Doc3 imagen 1 derecha e imagen 2 izquierda). Cada sede es
 * una tarjeta expandible: colapsada muestra nombre + descripción corta +
 * chevron; expandida agrega dirección, teléfono y horario (GET
 * /api/coordinador/sedes/{id}, ver lib/coordinador.ts::obtenerSedeDetalle).
 * El botón "Instructores" navega a la lista de instructores de esa sede.
 */
export default function CoordinadorSedesScreen() {
  const perfil = useRoleGuard(['coordinador']);
  const [sedes, setSedes] = useState<SedeResumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [expandida, setExpandida] = useState<number | null>(null);
  // Caché de detalle por sede (dirección/teléfono/horario) — se pide una
  // sola vez por sede la primera vez que se expande, no en cada toggle.
  const [detalles, setDetalles] = useState<Record<number, SedeDetalle>>({});
  const [cargandoDetalle, setCargandoDetalle] = useState<number | null>(null);
  const [errorDetalle, setErrorDetalle] = useState<Record<number, string>>({});

  const cargar = useCallback(() => {
    if (!perfil) return;
    // Limpia cualquier error de una carga anterior ANTES de pedir de
    // nuevo: si no se limpia aquí, un error viejo ("Sede no encontrada",
    // por ejemplo al volver a esta pantalla) se queda pegado en pantalla
    // aunque la sesión siga activa y esta nueva carga sí funcione.
    setError(null);
    obtenerSedes()
      .then((res) => {
        setSedes(res);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof CoordinadorApiError ? err.message : 'No se pudieron cargar las sedes.')
      );
  }, [perfil]);

  useFocusEffect(cargar);

  const alternarSede = useCallback(
    (idSede: number) => {
      setExpandida((actual) => (actual === idSede ? null : idSede));
      if (detalles[idSede] || cargandoDetalle === idSede) return;
      setCargandoDetalle(idSede);
      obtenerSedeDetalle(idSede)
        .then((detalle) => {
          setDetalles((prev) => ({ ...prev, [idSede]: detalle }));
          setErrorDetalle((prev) => {
            const { [idSede]: _quitado, ...resto } = prev;
            return resto;
          });
        })
        .catch((err) =>
          setErrorDetalle((prev) => ({
            ...prev,
            [idSede]:
              err instanceof CoordinadorApiError ? err.message : 'No se pudo cargar la información de la sede.',
          }))
        )
        .finally(() => setCargandoDetalle((actual) => (actual === idSede ? null : actual)));
    },
    [detalles, cargandoDetalle]
  );

  if (perfil === undefined) {
    return (
      <VictoriaScreenShell>
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      </VictoriaScreenShell>
    );
  }
  if (!perfil) return null;

  const filtradas = (sedes ?? []).filter((s) =>
    s.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  return (
    <VictoriaScreenShell>
      <View style={styles.headerRow}>
        <PaneHeader eyebrow="VICTORIA > Sedes vigentes" title="Sedes · SENA" />
        <SearchPill value={busqueda} onChangeText={setBusqueda} placeholder="Encontrar sede" />
      </View>
      <Text style={styles.subtitle}>» Servicio Nacional de Aprendizaje</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!sedes && !error ? <ActivityIndicator color={VictoriaColors.white} style={styles.loader} /> : null}
      {sedes && filtradas.length === 0 ? (
        <Text style={styles.empty}>No se encontraron sedes con ese nombre.</Text>
      ) : null}

      <View style={styles.list}>
        {filtradas.map((sede) => {
          const abierta = expandida === sede.id_sede;
          const detalle = detalles[sede.id_sede];
          return (
            <View key={sede.id_sede} style={styles.card}>
              <Pressable style={styles.cardHeader} onPress={() => alternarSede(sede.id_sede)}>
                <View style={styles.cardIcon}>
                  <Ionicons name="layers-outline" size={18} color={VictoriaColors.white} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{sede.nombre}</Text>
                  <Text style={styles.cardDescription} numberOfLines={abierta ? undefined : 2}>
                    {sede.descripcion ?? 'Sin descripción registrada.'}
                  </Text>
                </View>
                <Ionicons
                  name={abierta ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#555555"
                />
              </Pressable>

              {abierta ? (
                <View style={styles.detailBlock}>
                  {cargandoDetalle === sede.id_sede && !detalle ? (
                    <ActivityIndicator color={VictoriaColors.darkGreen} style={styles.detailLoader} />
                  ) : null}
                  {errorDetalle[sede.id_sede] ? (
                    <Text style={styles.detailError}>{errorDetalle[sede.id_sede]}</Text>
                  ) : null}
                  {detalle?.direccion_principal ? (
                    <Text style={styles.detailLine}>
                      <Text style={styles.detailLabel}>Dirección principal: </Text>
                      {detalle.direccion_principal}
                    </Text>
                  ) : null}
                  {detalle?.telefono_atencion ? (
                    <Text style={styles.detailLine}>
                      <Text style={styles.detailLabel}>Teléfonos de atención: </Text>
                      {detalle.telefono_atencion}
                    </Text>
                  ) : null}
                  {detalle?.horario_atencion ? (
                    <Text style={styles.detailLine}>
                      <Text style={styles.detailLabel}>Horario de atención: </Text>
                      {detalle.horario_atencion}
                    </Text>
                  ) : null}
                  {detalle &&
                  !detalle.direccion_principal &&
                  !detalle.telefono_atencion &&
                  !detalle.horario_atencion ? (
                    <Text style={styles.detailLine}>Esta sede aún no tiene datos de contacto registrados.</Text>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.cardActions}>
                <PillButton
                  label="Información"
                  icon="information-circle-outline"
                  variant="dark"
                  onPress={() => alternarSede(sede.id_sede)}
                />
                <PillButton
                  label="Instructores"
                  icon="people-outline"
                  variant="light"
                  onPress={() =>
                    router.push(`/victoria/coordinador/sedes/${sede.id_sede}/instructores` as never)
                  }
                />
              </View>
            </View>
          );
        })}
      </View>

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
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: -22,
    marginBottom: 24,
  },
  loader: { marginTop: 20 },
  error: { color: '#ff8a8a', marginBottom: 12 },
  empty: { color: 'rgba(255, 255, 255, 0.6)' },
  list: { gap: 14 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: VictoriaRadius.card,
    padding: 18,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: VictoriaColors.darkGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: VictoriaColors.textOnLight,
    textTransform: 'uppercase',
  },
  cardDescription: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 17,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  detailBlock: {
    gap: 6,
    paddingTop: 2,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  detailLoader: {
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  detailError: {
    fontSize: 12,
    color: '#b3261e',
  },
  detailLine: {
    fontSize: 12,
    color: '#333333',
    lineHeight: 18,
  },
  detailLabel: {
    fontWeight: '700',
    color: VictoriaColors.textOnLight,
  },
});