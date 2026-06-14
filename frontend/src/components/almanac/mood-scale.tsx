// mood-scale.tsx — 7-level emotional scale control: moons | orbs | pills.
import { Pressable, View } from 'react-native';

import { MOODS } from '@/data/dreams';
import { useTheme, type ScaleStyle } from '@/theme/theme';
import { MoonPhase } from './moon';
import { CatalogLabel } from './primitives';

export function MoodScale({
  value,
  onChange,
  scaleStyle = 'moons',
}: {
  value: number;
  onChange?: (i: number) => void;
  scaleStyle?: ScaleStyle;
}) {
  const { c } = useTheme();
  const interactive = typeof onChange === 'function';
  const press = (i: number) => interactive && onChange!(i);

  let row: React.ReactNode;

  if (scaleStyle === 'pills') {
    row = MOODS.map((mm, i) => {
      const on = i === value;
      return (
        <Pressable
          key={mm.key}
          onPress={() => press(i)}
          style={{
            flex: 1,
            height: on ? 44 : 30,
            borderRadius: 2,
            backgroundColor: on ? mm.color : mm.pillTint,
            borderWidth: 1,
            borderColor: on ? c.ink : c.line,
          }}
        />
      );
    });
  } else if (scaleStyle === 'orbs') {
    row = MOODS.map((mm, i) => {
      const on = i === value;
      const d = 12 + i * 3;
      return (
        <Pressable
          key={mm.key}
          onPress={() => press(i)}
          style={{ flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: d,
              height: d,
              borderRadius: d / 2,
              backgroundColor: mm.color,
              borderWidth: on ? 1.5 : 1,
              borderColor: on ? c.gold : c.line,
              opacity: on || !interactive ? 1 : 0.78,
              transform: [{ scale: on ? 1.15 : 1 }],
            }}
          />
        </Pressable>
      );
    });
  } else {
    row = MOODS.map((mm, i) => {
      const on = i === value;
      return (
        <Pressable
          key={mm.key}
          onPress={() => press(i)}
          style={{ flex: 1, height: 42, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ transform: [{ scale: on ? 1.2 : 0.92 }], opacity: on || !interactive ? 1 : 0.6 }}>
            <MoonPhase mood={i} size={on ? 28 : 23} rim={on ? c.gold : c.line} />
          </View>
        </Pressable>
      );
    });
  }

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 5,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderColor: c.line,
        }}>
        {row}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <CatalogLabel tiny>Nightmare</CatalogLabel>
        <CatalogLabel tiny>Blissful</CatalogLabel>
      </View>
    </View>
  );
}
