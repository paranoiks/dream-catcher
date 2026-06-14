// primitives.tsx — almanac design-system atoms: CatalogLabel, Rule, Fleuron,
// DropCap, CornerTicks, Surface/Plate, Btn. Ported from dream-ui.jsx.
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme/theme';
import { Icon, type IconName } from './icon';

// ── Small-caps catalog label ─────────────────────────────────────────────────
export function CatalogLabel({
  children,
  tiny,
  gold,
  style,
}: {
  children: ReactNode;
  tiny?: boolean;
  gold?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const { c, fonts } = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: fonts.body,
          fontSize: tiny ? 10 : 11.5,
          letterSpacing: tiny ? 2.0 : 2.4,
          textTransform: 'uppercase',
          color: gold ? c.gold : c.faint,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

// ── Hairline rule / double rule ──────────────────────────────────────────────
export function Rule({
  double,
  color,
  style,
}: {
  double?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const col = color ?? c.line;
  if (double) {
    return <View style={[{ height: 3, borderTopWidth: 1, borderBottomWidth: 1, borderColor: col }, style]} />;
  }
  return <View style={[{ height: 1, backgroundColor: col }, style]} />;
}

// ── Fleuron divider — gold ✦ flanked by gradient hairlines ────────────────────
export function Fleuron({ width = 60, style }: { width?: number; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const line = c.lineStrong;
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, style]}>
      <LinearGradient
        colors={['transparent', line]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 1, width }}
      />
      <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 3, marginHorizontal: 12 }}>✦</Text>
      <LinearGradient
        colors={[line, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 1, width }}
      />
    </View>
  );
}

// ── Drop cap (raised initial — RN has no float, so the glyph is an inline cap) ─
export function DropCap({ children }: { children: ReactNode }) {
  const { c, fonts, dispTrack } = useTheme();
  return (
    <Text style={{ fontFamily: fonts.display, fontSize: 46, color: c.gold, letterSpacing: 46 * dispTrack }}>
      {children}
    </Text>
  );
}

// ── Corner ticks (for framed plates) ─────────────────────────────────────────
export function CornerTicks({ size = 9, color, inset = 5 }: { size?: number; color?: string; inset?: number }) {
  const { c } = useTheme();
  const col = color ?? c.lineStrong;
  const base: ViewStyle = { position: 'absolute', width: size, height: size };
  return (
    <>
      <View style={[base, { top: inset, left: inset, borderTopWidth: 1, borderLeftWidth: 1, borderColor: col }]} />
      <View style={[base, { top: inset, right: inset, borderTopWidth: 1, borderRightWidth: 1, borderColor: col }]} />
      <View style={[base, { bottom: inset, left: inset, borderBottomWidth: 1, borderLeftWidth: 1, borderColor: col }]} />
      <View style={[base, { bottom: inset, right: inset, borderBottomWidth: 1, borderRightWidth: 1, borderColor: col }]} />
    </>
  );
}

// ── Plate (panel) — flat ink fill, hairline border, optional corner ticks ─────
export function Surface({
  children,
  framed,
  style,
  onPress,
}: {
  children?: ReactNode;
  framed?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  const content = (
    <>
      {framed && <CornerTicks inset={5} />}
      {children}
    </>
  );
  const boxStyle: StyleProp<ViewStyle> = [
    { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 4 },
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [boxStyle, pressed && { opacity: 0.85 }]}>
        {content}
      </Pressable>
    );
  }
  return <View style={boxStyle}>{content}</View>;
}
export const Plate = Surface;

// ── Buttons — foil / outline / ghost ─────────────────────────────────────────
type BtnVariant = 'primary' | 'outline' | 'ghost';

export function Btn({
  label,
  iconLeft,
  iconRight,
  variant = 'primary',
  onPress,
  disabled,
  style,
}: {
  label?: string;
  iconLeft?: IconName;
  iconRight?: IconName;
  variant?: BtnVariant;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, fonts } = useTheme();
  const variants: Record<BtnVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: c.gold, fg: c.onGoldBtn, border: c.gold },
    outline: { bg: 'transparent', fg: c.gold, border: c.lineStrong },
    ghost: { bg: 'transparent', fg: c.mute, border: c.line },
  };
  const v = variants[variant];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, borderColor: v.border, opacity: disabled ? 0.4 : pressed ? 0.9 : 1 },
        pressed && !disabled && { transform: [{ scale: 0.985 }] },
        style,
      ]}>
      {iconLeft && <Icon name={iconLeft} size={16} color={v.fg} />}
      {label != null && (
        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, letterSpacing: 2.4, textTransform: 'uppercase', color: v.fg }}>
          {label}
        </Text>
      )}
      {iconRight && <Icon name={iconRight} size={16} color={v.fg} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 3,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: 9,
    paddingHorizontal: 22,
  },
});
