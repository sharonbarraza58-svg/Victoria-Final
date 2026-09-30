import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { VictoriaScreenShell } from '@/components/victoria/screen-shell';
import { ExitButton, ListRow, PaneHeader } from '@/components/victoria/ui';
import { VictoriaColors } from '@/constants/victoria-theme';
import { useRoleGuard } from '@/lib/role-guard';

/**
 * Todo lo que antes eran las pantallas de "Administrador" en
 * victoria-admin-completo (app/admin/*) vive ahora aquí, bajo el
 * coordinador: coordinaciones académicas, sedes físicas, competencias,
 * instructores, fichas y programas. El resto del panel de coordinador
 * (Inicio, Sedes -> Instructores -> Portafolio) es de solo lectura; esta
 * sección es donde se crean y editan los datos maestros del sistema.
 */
export default function GestionHubScreen() {
  const perfil = useRoleGuard(['coordinador']);

  if (perfil === undefined) {
    return (
      <VictoriaScreenShell>
        <ActivityIndicator color={VictoriaColors.white} />
      </VictoriaScreenShell>
    );
  }
  if (!perfil) return null;

  const secciones = [
    {
      href: '/victoria/coordinador/gestion/asignaciones',
      icon: 'link-outline' as const,
      title: 'Asignar instructor a ficha',
      subtitle: 'Esto es lo que hace que la ficha le aparezca al instructor',
    },
    {
      href: '/victoria/coordinador/gestion/fichas',
      icon: 'folder-outline' as const,
      title: 'Fichas',
      subtitle: 'Crear y consultar fichas de formación',
    },
    {
      href: '/victoria/coordinador/gestion/programas',
      icon: 'school-outline' as const,
      title: 'Programas',
      subtitle: 'Programas de formación por coordinación',
    },
    {
      href: '/victoria/coordinador/gestion/competencias',
      icon: 'layers-outline' as const,
      title: 'Competencias',
      subtitle: 'Materias que dictan los instructores',
    },
    {
      href: '/victoria/coordinador/gestion/instructores',
      icon: 'person-outline' as const,
      title: 'Instructores',
      subtitle: 'Alta de cuentas de instructor',
    },
    {
      href: '/victoria/coordinador/gestion/sedes',
      icon: 'business-outline' as const,
      title: 'Sedes',
      subtitle: 'Sedes físicas del SENA',
    },
    {
      href: '/victoria/coordinador/gestion/coordinaciones',
      icon: 'grid-outline' as const,
      title: 'Coordinaciones académicas',
      subtitle: 'Ej. Coordinación de TIC',
    },
  ];

  return (
    <VictoriaScreenShell>
      <PaneHeader eyebrow="VICTORIA > Coordinador" title="Gestión" />
      <Text style={styles.intro}>
        Datos maestros del sistema. Todo lo que antes hacía un administrador, el coordinador lo
        gestiona desde aquí.
      </Text>

      <View style={styles.list}>
        {secciones.map((s) => (
          <ListRow
            key={s.href}
            icon={s.icon}
            title={s.title}
            subtitle={s.subtitle}
            actionLabel="Abrir"
            actionHref={s.href}
          />
        ))}
      </View>

      <ExitButton />
    </VictoriaScreenShell>
  );
}

const styles = StyleSheet.create({
  intro: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  list: { gap: 12 },
});
