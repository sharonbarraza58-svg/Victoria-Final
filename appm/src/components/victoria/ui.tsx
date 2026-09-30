import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';

import { VictoriaColors, VictoriaRadius } from '@/constants/victoria-theme';

/** .pane-context-header + .hierarchy-tracker + .pane-main-title */
export function PaneHeader({
  eyebrow,
  title,
  backHref,
}: {
  eyebrow: string;
  title: string;
  backHref?: string;
}) {
  return (
    <View style={styles.paneHeader}>
      {backHref ? (
        <Link href={backHref as never} style={styles.hierarchyTracker}>
          {'< Volver - ' + eyebrow}
        </Link>
      ) : (
        <Text style={styles.hierarchyTracker}>{eyebrow}</Text>
      )}
      <Text style={styles.paneMainTitle}>{title}</Text>
    </View>
  );
}

/** .figma-data-card */
export function DataCard({
  icon,
  title,
  subtitle,
  style,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.dataCard, style]}>
      {icon ? (
        <View style={styles.dataCardIcon}>
          <Ionicons name={icon} size={20} color={VictoriaColors.textOnLight} />
        </View>
      ) : null}
      <View style={styles.dataCardText}>
        <Text style={styles.dataCardTitle}>{title}</Text>
        <Text style={styles.dataCardSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

/** .figma-highlight-num + subtitle, centered variant of the data card */
export function HighlightCard({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={[styles.dataCard, styles.highlightCard]}>
      <Text style={styles.highlightNum}>{value}</Text>
      <Text style={styles.dataCardSubtitle}>{label}</Text>
    </View>
  );
}

/** .figma-list-row */
export function ListRow({
  icon,
  title,
  subtitle,
  actionLabel,
  onPressAction,
  actionHref,
  chevronHref,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onPressAction?: () => void;
  actionHref?: string;
  chevronHref?: string;
}) {
  const action = actionLabel ? (
    <Text style={styles.actionButtonText}>{actionLabel}</Text>
  ) : null;

  return (
    <View style={styles.listRow}>
      <View style={styles.listRowMain}>
        {icon ? (
          <View style={styles.rowIconIndicator}>
            <Ionicons name={icon} size={18} color={VictoriaColors.white} />
          </View>
        ) : null}
        <View style={styles.listRowTextWrap}>
          <Text style={styles.rowMainText}>{title}</Text>
          <Text style={styles.rowSubText}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.listRowRight}>
        {actionLabel ? (
          actionHref ? (
            <Link href={actionHref as never} style={styles.actionButton}>
              {action}
            </Link>
          ) : (
            <Pressable style={styles.actionButton} onPress={onPressAction}>
              {action}
            </Pressable>
          )
        ) : null}
        {chevronHref ? (
          <Link href={chevronHref as never} style={styles.chevronButton}>
            <View style={styles.chevronInner}>
              <Ionicons name="chevron-forward" size={16} color={VictoriaColors.textOnLight} />
            </View>
          </Link>
        ) : null}
      </View>
    </View>
  );
}

/** .figma-sub-card */
export function SubCard({
  icon,
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <View style={styles.subCard}>
      <View style={styles.listRowMain}>
        {icon ? (
          <View style={styles.subCardIcon}>
            <Ionicons name={icon} size={16} color={VictoriaColors.textOnLight} />
          </View>
        ) : null}
        <View style={styles.listRowTextWrap}>
          <Text style={styles.subCardTitle}>{title}</Text>
          <Text style={styles.subCardTeacher}>{subtitle}</Text>
        </View>
      </View>
      {actionLabel && actionHref ? (
        <Link href={actionHref as never} style={styles.badgeButton}>
          {actionLabel}
        </Link>
      ) : null}
    </View>
  );
}

/** .badge.bg-success-subtle */
export function StatusBadge({ label }: { label: string }) {
  return (
    <View style={styles.statusBadge}>
      <Text style={styles.statusBadgeText}>{label}</Text>
    </View>
  );
}

/** .btn.rounded-pill trimester tabs used in portafolio / seguimiento */
export function PillTab({
  label,
  count,
  active,
  href,
}: {
  label: string;
  count: number;
  active?: boolean;
  href: string;
}) {
  return (
    <Link href={href as never} style={[styles.pillTab, active && styles.pillTabActive]}>
      <Text style={[styles.pillTabText, active && styles.pillTabTextActive]}>
        {label}
        {'  '}
      </Text>
      <View style={[styles.pillTabBadge, active && styles.pillTabBadgeActive]}>
        <Text style={[styles.pillTabBadgeText, active && styles.pillTabBadgeTextActive]}>
          {count}
        </Text>
      </View>
    </Link>
  );
}

/**
 * El botón de cerrar sesión ahora vive en VictoriaScreenShell (afuera del
 * panel de cristal, esquina inferior izquierda). Se deja este componente
 * vacío para que las pantallas que aún lo usan no se rompan.
 */
export function ExitButton() {
  return null;
}

/**
 * Chip de filtro local (Todos / De Planta / Tecnico / Transversal en la
 * lista de instructores de una sede). A diferencia de PillTab no navega:
 * cambia un estado en la misma pantalla, por eso recibe onPress en vez
 * de href, y un punto de color en vez de un contador.
 */
export function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}>
      <View style={[styles.filterChipDot, active && styles.filterChipDotActive]} />
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** Píldora de acción genérica — variantes .btn-accent-solid / .btn-accent-soft */
export function PillButton({
  label,
  icon,
  variant = 'dark',
  onPress,
  href,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'dark' | 'light';
  onPress?: () => void;
  href?: string;
}) {
  const content = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={13}
          color={variant === 'dark' ? VictoriaColors.white : VictoriaColors.textOnLight}
        />
      ) : null}
      <Text style={variant === 'dark' ? styles.pillButtonTextDark : styles.pillButtonTextLight}>
        {icon ? '  ' : ''}
        {label}
      </Text>
    </>
  );

  if (href) {
    return (
      <Link
        href={href as never}
        style={[styles.pillButton, variant === 'dark' ? styles.pillButtonDark : styles.pillButtonLight]}>
        {content}
      </Link>
    );
  }

  return (
    <Pressable
      style={[styles.pillButton, variant === 'dark' ? styles.pillButtonDark : styles.pillButtonLight]}
      onPress={onPress}>
      {content}
    </Pressable>
  );
}

/** Caja de búsqueda translúcida — "Encontrar sede" / "Encontrar instructor" */
export function SearchPill({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.searchPill}>
      <Ionicons name="search-outline" size={15} color="rgba(255,255,255,0.5)" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.45)"
        style={styles.searchPillInput}
      />
    </View>
  );
}

/** Miniatura de archivo — "Hoja de vida" del instructor, evidencias de una competencia */
export function FileThumbnail({ label, href }: { label: string; href?: string }) {
  const inner = (
    <>
      <Text style={styles.fileThumbLabel}>{label}</Text>
      <View style={styles.fileThumbPreview}>
        <Ionicons name="document-text-outline" size={22} color="rgba(28, 53, 45, 0.35)" />
      </View>
    </>
  );

  if (href) {
    return (
      <Link href={href as never} style={styles.fileThumb}>
        {inner}
      </Link>
    );
  }
  return <View style={styles.fileThumb}>{inner}</View>;
}

/**
 * Botón flotante de acción destacada — "Ir a Portafolio". Con
 * `disabled` se ve apagado y no navega ni dispara onPress; úsalo para
 * instructores contratistas, que no tienen portafolio.
 */
export function FloatingActionPill({
  label,
  href,
  onPress,
  disabled,
}: {
  label: string;
  href?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <View style={[styles.floatingAction, styles.floatingActionDisabled]}>
        <Text style={[styles.floatingActionText, styles.floatingActionTextDisabled]}>{label}</Text>
      </View>
    );
  }
  if (href) {
    return (
      <Link href={href as never} style={styles.floatingAction}>
        {label}
      </Link>
    );
  }
  return (
    <Pressable style={styles.floatingAction} onPress={onPress}>
      <Text style={styles.floatingActionText}>{label}</Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  paneHeader: {
    marginBottom: 32,
  },
  hierarchyTracker: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paneMainTitle: {
    fontSize: 32,
    fontWeight: '400',
    color: VictoriaColors.white,
    marginTop: 6,
  },
  dataCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: VictoriaRadius.card,
    padding: 18,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    flex: 1,
  },
  dataCardIcon: {
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataCardText: {
    flex: 1,
    gap: 3,
  },
  dataCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: VictoriaColors.black,
  },
  dataCardSubtitle: {
    fontSize: 13,
    color: '#444444',
    lineHeight: 18,
  },
  highlightCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightNum: {
    fontSize: 26,
    fontWeight: '300',
    color: VictoriaColors.textOnLight,
    marginBottom: 4,
  },
  listRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  listRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  listRowTextWrap: {
    flex: 1,
    gap: 2,
  },
  listRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowIconIndicator: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: VictoriaColors.mutedGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMainText: {
    fontSize: 15,
    fontWeight: '600',
    color: VictoriaColors.black,
  },
  rowSubText: {
    fontSize: 12,
    color: '#666666',
  },
  actionButton: {
    backgroundColor: VictoriaColors.darkGreen,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: VictoriaRadius.pill,
  },
  actionButtonText: {
    color: VictoriaColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
    overflow: 'hidden',
  },
  chevronInner: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: VictoriaColors.black,
  },
  subCardTeacher: {
    fontSize: 12,
    color: '#666666',
  },
  badgeButton: {
    backgroundColor: VictoriaColors.darkGreen,
    color: VictoriaColors.white,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: VictoriaRadius.pill,
    overflow: 'hidden',
  },
  statusBadge: {
    backgroundColor: '#d1f2dc',
    borderRadius: VictoriaRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#146c43',
    fontSize: 12,
    fontWeight: '600',
  },
  pillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: VictoriaRadius.pill,
    color: VictoriaColors.white,
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
  },
  pillTabActive: {
    backgroundColor: VictoriaColors.white,
  },
  pillTabText: {
    color: VictoriaColors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTabTextActive: {
    color: VictoriaColors.black,
  },
  pillTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: VictoriaRadius.pill,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  pillTabBadgeActive: {
    backgroundColor: '#d1f2dc',
  },
  pillTabBadgeText: {
    color: VictoriaColors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  pillTabBadgeTextActive: {
    color: '#146c43',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: VictoriaRadius.pill,
  },
  filterChipActive: {
    backgroundColor: VictoriaColors.white,
  },
  filterChipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: VictoriaColors.mutedGreen,
  },
  filterChipDotActive: {
    backgroundColor: VictoriaColors.darkGreen,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
  },
  filterChipTextActive: {
    color: VictoriaColors.black,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: VictoriaRadius.pill,
    overflow: 'hidden',
  },
  pillButtonDark: {
    backgroundColor: VictoriaColors.darkGreen,
  },
  pillButtonLight: {
    backgroundColor: VictoriaColors.mutedGreen,
  },
  pillButtonTextDark: {
    color: VictoriaColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  pillButtonTextLight: {
    color: VictoriaColors.textOnLight,
    fontSize: 12,
    fontWeight: '600',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: VictoriaRadius.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
    minWidth: 200,
  },
  searchPillInput: {
    flex: 1,
    color: VictoriaColors.white,
    fontSize: 13,
    paddingVertical: 0,
    outlineStyle: 'none',
  } as never,
  fileThumb: {
    width: 96,
    gap: 6,
  },
  fileThumbLabel: {
    fontSize: 11,
    color: '#555555',
  },
  fileThumbPreview: {
    width: 96,
    height: 72,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingAction: {
    backgroundColor: VictoriaColors.darkGreen,
    color: VictoriaColors.white,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: VictoriaRadius.pill,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  floatingActionText: {
    color: VictoriaColors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  floatingActionDisabled: {
    backgroundColor: 'rgba(28, 53, 45, 0.15)',
  },
  floatingActionTextDisabled: {
    color: 'rgba(28, 53, 45, 0.45)',
  },
});