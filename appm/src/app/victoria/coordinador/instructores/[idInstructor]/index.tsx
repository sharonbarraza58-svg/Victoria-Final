import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, FloatingActionPill, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors, VictoriaRadius } from '@/constants/victoria-theme';
import {
  CoordinadorApiError,
  InstructorDetalle,
  obtenerInstructorDetalle,
  TipoInstructor,
} from '@/lib/coordinador';
import { useRoleGuard } from '@/lib/role-guard';

const ETIQUETA_TIPO: Record<TipoInstructor, string> = {
  planta: 'Instructor de planta',
  tecnico: 'Instructor técnico',
  transversal: 'Instructor transversal',
};

const ETIQUETA_TIPO_MAYUS: Record<TipoInstructor, string> = {
  planta: 'DE PLANTA',
  tecnico: 'TECNICOS',
  transversal: 'TRANSVERSALES',
};

function formatearVigencia(vigencia: string | null): string {
  if (!vigencia) return '';
  const fecha = new Date(vigencia);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Detalle de UN instructor visto por el coordinador (Doc3 imagen 3
 * izquierda: tarjeta "Sandra Yanneth Rueda" con especialidad, tipo de
 * contrato, ficha + horario, contacto y hoja de vida). Antes este archivo
 * era una copia pegada de sedes/[idSede]/instructores.tsx (la lista) y
 * por eso al entrar acá se veía la lista de nuevo en vez del detalle, y
 * el id_instructor de la URL nunca se llegaba a usar.
 */
export default function CoordinadorInstructorDetalleScreen() {
  const perfil = useRoleGuard(['coordinador']);
  const { idInstructor, idSede, tipo } = useLocalSearchParams<{
    idInstructor: string;
    idSede?: string;
    tipo?: TipoInstructor;
  }>();
  const idInstructorNum = Number(idInstructor);

  const [instructor, setInstructor] = useState<InstructorDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!perfil) return;
    if (!idInstructorNum || Number.isNaN(idInstructorNum)) {
      setError('No se especificó un instructor válido.');
      return;
    }
    setError(null);
    obtenerInstructorDetalle(idInstructorNum)
      .then((res) => {
        setInstructor(res);
        setError(null);
      })
      .catch((err) =>
        setError(
          err instanceof CoordinadorApiError ? err.message : 'No se pudo cargar el instructor.'
        )
      );
  }, [perfil, idInstructorNum]);

  useFocusEffect(cargar);

  if (perfil === undefined) {
    return (
      <VictoriaScreenShell>
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      </VictoriaScreenShell>
    );
  }
  if (!perfil) return null;

  // El tipo puede venir por query (?tipo=... desde la lista) o, si se
  // entró directo por URL, del propio instructor ya cargado -- así el
  // link "Volver" nunca queda con una etiqueta vacía.
  const tipoParaVolver = (tipo ?? instructor?.tipo_instructor) as TipoInstructor | undefined;
  const backHref = idSede
    ? (`/victoria/coordinador/sedes/${idSede}/instructores` as never)
    : ('/victoria/coordinador/sedes' as never);

  return (
    <VictoriaScreenShell>
      <View style={styles.headerRow}>
        <PaneHeader
          eyebrow={`Instructores ${tipoParaVolver ? ETIQUETA_TIPO_MAYUS[tipoParaVolver] : ''}`}
          title={instructor?.nombre_completo ?? 'Instructor'}
          backHref={backHref}
        />
        {instructor ? (
          instructor.tipo_instructor === 'transversal' ? (
            // Los instructores transversales no manejan portafolio de
            // competencias -- el botón se muestra apagado en vez de
            // ocultarse, para que quede claro que no es un error sino
            // que no aplica para este tipo de instructor.
            <FloatingActionPill label="Portafolio no disponible" disabled />
          ) : (
            <FloatingActionPill
              label="Ir a Portafolio"
              href={`/victoria/coordinador/instructores/${idInstructorNum}/portafolio`}
            />
          )
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!instructor && !error ? (
        <ActivityIndicator color={VictoriaColors.white} style={styles.loader} />
      ) : null}

      {instructor ? (
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardIcon}>
              <Ionicons name="person-outline" size={20} color={VictoriaColors.textOnLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{instructor.nombre_completo}</Text>
              <Text style={styles.subLinea}>
                {ETIQUETA_TIPO[instructor.tipo_instructor]} · C.C. {instructor.numero_documento}
              </Text>
            </View>
          </View>

          {instructor.especialidad ? (
            <Text style={styles.especialidad}>{instructor.especialidad}</Text>
          ) : null}

          {instructor.tipo_contrato ? (
            <Text style={styles.detalleLinea}>
              Tipo de contrato: {instructor.tipo_contrato}
              {instructor.vigencia_contrato
                ? `  (Vigencia hasta ${formatearVigencia(instructor.vigencia_contrato)})`
                : ''}
            </Text>
          ) : null}

          {instructor.numero_ficha ? (
            <Text style={styles.detalleLinea}>
              Ficha {instructor.numero_ficha}
              {instructor.horario_ficha ? ` — ${instructor.horario_ficha}` : ''}
            </Text>
          ) : null}

          <View style={styles.contactoRow}>
            <View style={styles.contactoPill}>
              <Ionicons name="mail-outline" size={13} color={VictoriaColors.white} />
              <Text style={styles.contactoPillText}>{instructor.correo_sena}</Text>
            </View>
            {instructor.telefono ? (
              <View style={[styles.contactoPill, styles.contactoPillClaro]}>
                <Ionicons name="call-outline" size={13} color={VictoriaColors.textOnLight} />
                <Text style={styles.contactoPillTextClaro}>{instructor.telefono}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.hojaVidaBlock}>
            <Text style={styles.hojaVidaLabel}>Hoja de vida</Text>
            {instructor.hoja_vida_url ? (
              <View style={styles.hojaVidaRow}>
                <View style={styles.hojaVidaThumb}>
                  <Ionicons name="document-text-outline" size={26} color="rgba(28, 53, 45, 0.4)" />
                </View>
                <View style={styles.hojaVidaAcciones}>
                  <Pressable
                    style={styles.hojaVidaBtn}
                    onPress={() => Linking.openURL(instructor.hoja_vida_url!)}>
                    <Ionicons name="eye-outline" size={14} color={VictoriaColors.white} />
                    <Text style={styles.hojaVidaBtnText}>Vista previa</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.hojaVidaBtn, styles.hojaVidaBtnClaro]}
                    onPress={() => Linking.openURL(instructor.hoja_vida_url!)}>
                    <Ionicons name="download-outline" size={14} color={VictoriaColors.textOnLight} />
                    <Text style={styles.hojaVidaBtnTextClaro}>Descargar</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Text style={styles.sinArchivo}>Aún no ha subido su hoja de vida.</Text>
            )}
          </View>
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
    maxWidth: 460,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
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
    fontSize: 18,
    fontWeight: '700',
    color: VictoriaColors.black,
  },
  subLinea: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  especialidad: {
    fontSize: 13,
    fontWeight: '600',
    color: VictoriaColors.textOnLight,
  },
  detalleLinea: {
    fontSize: 12,
    color: '#555555',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 53, 45, 0.08)',
  },
  contactoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  contactoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: VictoriaColors.darkGreen,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: VictoriaRadius.pill,
  },
  contactoPillClaro: {
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
  },
  contactoPillText: {
    color: VictoriaColors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  contactoPillTextClaro: {
    color: VictoriaColors.textOnLight,
    fontSize: 11,
    fontWeight: '600',
  },
  hojaVidaBlock: {
    marginTop: 12,
  },
  hojaVidaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 8,
  },
  hojaVidaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  hojaVidaThumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hojaVidaAcciones: {
    gap: 8,
  },
  hojaVidaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: VictoriaColors.darkGreen,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: VictoriaRadius.pill,
  },
  hojaVidaBtnClaro: {
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
  },
  hojaVidaBtnText: {
    color: VictoriaColors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  hojaVidaBtnTextClaro: {
    color: VictoriaColors.textOnLight,
    fontSize: 11,
    fontWeight: '600',
  },
  sinArchivo: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
    fontStyle: 'italic',
  },
});
