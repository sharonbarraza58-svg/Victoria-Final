import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Link, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'; 
import { NotificationsPanel, ProfilePanel } from '@/components/victoria/panels';
import { VictoriaColors } from '@/constants/victoria-theme';
import { obtenerPerfil } from '@/lib/auth';
import { esNoLeida, obtenerNotificaciones } from '@/lib/notificaciones';

type Tab = {
  href: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  match: string;
};

// Pestañas del rol APRENDIZ (comportamiento original, sin cambios).
const TABS_APRENDIZ: Tab[] = [
  { href: '/victoria/dashboard', label: 'Inicio', icon: 'home-outline', match: '/dashboard' },
  {
    href: '/victoria/competencias',
    label: 'Competencias',
    icon: 'layers-outline',
    match: '/competencias',
  },
  {
    href: '/victoria/portafolio',
    label: 'Portafolio',
    icon: 'folder-outline',
    match: '/portafolio',
  },
  { href: '/victoria/notas', label: 'Notas', icon: 'document-text-outline', match: '/notas' },
  {
    href: '/victoria/seguimiento',
    label: 'Seguimiento',
    icon: 'create-outline',
    match: '/seguimiento',
  },
];

// Pestañas EXCLUSIVAS del rol INSTRUCTOR (Doc22). Apuntan a
// src/app/victoria/instructor/*, que a su vez están protegidas con
// useRoleGuard(['instructor']) y, en el backend, con require_instructor.
// Un aprendiz/coordinador/administrador nunca ve estos links: el navbar
// decide qué set de tabs pintar según nombre_rol (ver useEffect abajo).
const TABS_INSTRUCTOR: Tab[] = [
  {
    href: '/victoria/instructor/dashboard',
    label: 'Inicio',
    icon: 'home-outline',
    match: '/instructor/dashboard',
  },
  {
    href: '/victoria/instructor/competencias',
    label: 'Competencias',
    icon: 'layers-outline',
    match: '/instructor/competencias',
  },
  {
    href: '/victoria/instructor/portafolios',
    label: 'Portafolios',
    icon: 'folder-outline',
    match: '/instructor/portafolios',
  },
];

// Pestañas EXCLUSIVAS del rol COORDINADOR. Apuntan a
// src/app/victoria/coordinador/*, protegidas con
// useRoleGuard(['coordinador']) y, en el backend, con require_coordinador.
const TABS_COORDINADOR: Tab[] = [
  {
    href: '/victoria/coordinador/dashboard',
    label: 'Inicio',
    icon: 'home-outline',
    match: '/coordinador/dashboard',
  },
  {
    href: '/victoria/coordinador/sedes',
    label: 'Sedes',
    icon: 'business-outline',
    match: '/coordinador/sedes',
  },
  {
    // Todo lo que antes vivía en app/admin/* (fichas, programas,
    // competencias, instructores, coordinaciones académicas, sedes
    // físicas) -- ver app/victoria/coordinador/gestion/index.tsx.
    href: '/victoria/coordinador/gestion',
    label: 'Gestión',
    icon: 'construct-outline',
    match: '/coordinador/gestion',
  },
];

export function VictoriaNavbar({
  onActiveTabMeasure,
}: {
  onActiveTabMeasure?: (centerX: number) => void;
}) {
  const pathname = usePathname();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>(TABS_APRENDIZ);
  const [noLeidas, setNoLeidas] = useState(0);
  const activeTabRef = useRef<View>(null);

  useEffect(() => {
    let cancelado = false;
    obtenerPerfil().then((perfil) => {
      if (cancelado) return;
      const rol = (perfil?.nombre_rol ?? '').toLowerCase();
      if (rol === 'instructor') {
        setTabs(TABS_INSTRUCTOR);
      } else if (rol === 'coordinador') {
        setTabs(TABS_COORDINADOR);
      } else {
        setTabs(TABS_APRENDIZ);
      }
    });
    return () => {
      cancelado = true;
    };
  }, []);

  // Globito de "novedades" sobre la campana: se refresca solo, en silencio
  // (sin bloquear ni mostrar errores) al montar el navbar -- que aparece en
  // TODAS las pantallas de Victoria -- y otra vez cada vez que se cierra el
  // panel (por si el usuario marcó/leyó/borró algo mientras estaba abierto).
  useEffect(() => {
    let cancelado = false;
    obtenerNotificaciones()
      .then((datos) => {
        if (!cancelado) setNoLeidas(datos.filter(esNoLeida).length);
      })
      .catch(() => {
        // Silencioso a propósito: si no hay sesión o falla la red, el
        // globito simplemente no aparece -- no es motivo para romper el navbar.
      });
    return () => {
      cancelado = true;
    };
  }, [showNotifs]);

  // Mide en píxeles reales dónde quedó el tab activo (solo tiene sentido en
  // web, donde screen-shell dibuja la muesca con backdrop-filter). Se
  // recalcula al cambiar de pestaña y al redimensionar la ventana, así la
  // muesca sigue al tab activo sin quedar fija.
   useEffect(() => {
    if (Platform.OS !== 'web' || !onActiveTabMeasure) return;

    // Se guarda en una constante local ya verificada como no-undefined:
    // dentro de la función anidada "medir" TypeScript no arrastra el
    // chequeo de arriba (!onActiveTabMeasure) hasta ahí, así que sin esto
    // marca el error "possibly undefined" aunque en runtime sí está bien.
    const medirTabActivo = onActiveTabMeasure;

    function medir() {
      const el = activeTabRef.current as unknown as HTMLElement | null;
      if (!el || typeof el.getBoundingClientRect !== 'function') return;
      const rect = el.getBoundingClientRect();
      medirTabActivo(rect.left + rect.width / 2);
    }

    const frame = requestAnimationFrame(medir);
    window.addEventListener('resize', medir);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', medir);
    };
  }, [pathname, tabs, onActiveTabMeasure]);
  
  return (
    <BlurView intensity={25} tint="dark" style={styles.navbar}>
      <View style={styles.brandWrapper}>
        <Text style={styles.brandLetter}>V</Text>
      </View>

      <View style={styles.centralNav}>
        {tabs.map((tab) => {
          // La pantalla de detalle de tarea (/victoria/tarea/[id]) es parte
          // del flujo de Competencias aunque su URL no lo diga, así que la
          // pestaña "Competencias" debe seguir marcada activa ahí también.
          const active =
            pathname.includes(tab.match) ||
            (tab.match === '/competencias' && pathname.includes('/victoria/tarea'));
          return (
            <Link
              key={tab.href}
              ref={active ? (activeTabRef as never) : undefined}
              href={tab.href as never}
              style={[styles.menuTabItem, active && styles.menuTabItemActive]}>
              <Ionicons
                name={tab.icon}
                size={15}
                color={active ? VictoriaColors.white : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.menuTabText, active && styles.menuTabTextActive]}>
                {'  ' + tab.label}
              </Text>
            </Link>
          );
        })}
      </View>

      <View style={styles.profileActions}>
        <Pressable style={styles.actionCircle} onPress={() => setShowNotifs(true)}>
          <Ionicons name="notifications-outline" size={18} color="rgba(255,255,255,0.85)" />
          {noLeidas > 0 ? (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{noLeidas > 9 ? '9+' : noLeidas}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable style={styles.actionCircle} onPress={() => setShowProfile(true)}>
          <Ionicons name="person-circle-outline" size={20} color="rgba(255,255,255,0.85)" />
        </Pressable>
      </View>

      <NotificationsPanel
        visible={showNotifs}
        onClose={() => setShowNotifs(false)}
        onUnreadChange={setNoLeidas}
      />
      <ProfilePanel visible={showProfile} onClose={() => setShowProfile(false)} />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    flexWrap: 'wrap',
    gap: 10,
  },
  brandWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: VictoriaColors.white,
  },
  centralNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 5,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  menuTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 50,
  },
  menuTabItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  menuTabText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  menuTabTextActive: {
    color: VictoriaColors.white,
    fontWeight: '600',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#e05252',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
});