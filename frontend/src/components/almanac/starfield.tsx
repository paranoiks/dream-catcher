// starfield.tsx — sparse, faint stars + a soft radial vignette (no neon).
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/theme';

export function StarField({ density = 34 }: { density?: number }) {
  const { c } = useTheme();
  const stars = useMemo(() => {
    let seed = 11;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    return Array.from({ length: density }, () => ({
      x: rnd() * 100,
      y: rnd() * 100,
      r: 0.3 + rnd() * 1.0,
      o: 0.18 + rnd() * 0.4,
    }));
  }, [density]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="vignette" cx="50%" cy="18%" rx="120%" ry="80%">
            <Stop offset="0.55" stopColor={c.vignette} stopOpacity={0} />
            <Stop offset="1" stopColor={c.vignette} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        {stars.map((s, i) => (
          <Circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill={c.star} opacity={s.o} />
        ))}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#vignette)" />
      </Svg>
    </View>
  );
}
