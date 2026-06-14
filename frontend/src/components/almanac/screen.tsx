// screen.tsx — every view sits on the ink ground with a starfield behind and a
// double-hairline manuscript page border drawn above (the printed-page margin).
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme';
import { StarField } from './starfield';

export function PageBorder() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={[styles.border, { top: insets.top, bottom: Math.max(insets.bottom, 8) }]}>
      <View style={[StyleSheet.absoluteFill, { borderWidth: 1, borderColor: c.line }]} />
      <View style={[styles.innerBorder, { borderWidth: 1, borderColor: c.line, opacity: 0.45 }]} />
    </View>
  );
}

export function Screen({
  children,
  starDensity = 34,
}: {
  children: ReactNode;
  starDensity?: number;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: c.bg0 }]}>
      <StarField density={starDensity} />
      <View style={styles.content}>{children}</View>
      <PageBorder />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  content: { flex: 1 },
  border: { position: 'absolute', left: 11, right: 11, zIndex: 36 },
  innerBorder: { position: 'absolute', top: 4, left: 4, right: 4, bottom: 4 },
});
