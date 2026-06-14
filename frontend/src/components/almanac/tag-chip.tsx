// tag-chip.tsx — printed-style tag: outline | filled | plain. Ported from dream-ui.jsx.
import { Pressable, Text, View } from 'react-native';

import { useTheme, type TagStyle } from '@/theme/theme';

export function TagChip({
  tag,
  tagStyle = 'outline',
  active = false,
  size = 'md',
  onPress,
}: {
  tag: string;
  tagStyle?: TagStyle;
  active?: boolean;
  size?: 'sm' | 'md';
  onPress?: () => void;
}) {
  const { c, fonts } = useTheme();
  const fs = size === 'sm' ? 12 : 13.5;

  let inner: React.ReactNode;
  let containerStyle: object = {};

  if (tagStyle === 'plain') {
    inner = (
      <>
        <Text style={{ color: c.gold, fontSize: fs * 0.8, opacity: active ? 1 : 0.7 }}>✦</Text>
        <Text style={{ color: active ? c.gold : c.ink, fontFamily: fonts.body, fontSize: fs, letterSpacing: 0.5 }}>
          {tag}
        </Text>
      </>
    );
  } else {
    const filled = tagStyle === 'filled';
    const s = filled
      ? active
        ? { backgroundColor: c.gold, color: c.onGold, borderColor: c.gold }
        : { backgroundColor: c.goldTint, color: c.ink, borderColor: 'transparent' }
      : active
        ? { backgroundColor: 'transparent', color: c.gold, borderColor: c.lineStrong }
        : { backgroundColor: 'transparent', color: c.mute, borderColor: c.line };
    containerStyle = {
      backgroundColor: s.backgroundColor,
      borderColor: s.borderColor,
      borderWidth: 1,
      borderRadius: 3,
      paddingVertical: size === 'sm' ? 3 : 5,
      paddingHorizontal: size === 'sm' ? 10 : 12,
    };
    inner = (
      <>
        <Text style={{ color: s.color, fontSize: fs * 0.78, opacity: 0.7 }}>✦</Text>
        <Text style={{ color: s.color, fontFamily: fonts.body, fontSize: fs }}>{tag}</Text>
      </>
    );
  }

  const row = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [row, containerStyle, pressed && { opacity: 0.7 }]}>
        {inner}
      </Pressable>
    );
  }
  return <View style={[row, containerStyle]}>{inner}</View>;
}
