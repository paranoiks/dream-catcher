// push-bar.tsx — sticky header for pushed detail views + the "casting" shimmer.
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme';
import { Icon } from './icon';
import { CatalogLabel, Rule } from './primitives';

export function PushBar({ label, onBack }: { label?: string; onBack: () => void }) {
  const { c, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 8, backgroundColor: c.bg0, zIndex: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          marginBottom: 10,
        }}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            height: 34,
            paddingRight: 14,
            paddingLeft: 9,
            borderRadius: 3,
            borderWidth: 1,
            borderColor: c.line,
            opacity: pressed ? 0.7 : 1,
          })}>
          <Icon name="back" size={15} color={c.ink} />
          <Text style={{ color: c.ink, fontFamily: fonts.body, fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase' }}>
            Back
          </Text>
        </Pressable>
        {label ? <CatalogLabel>{label}</CatalogLabel> : <View />}
        <View style={{ width: 78 }} />
      </View>
      <Rule style={{ marginHorizontal: 20 }} />
    </View>
  );
}

export function ReadingShimmer({ label }: { label: string }) {
  const { c, fonts } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 26 }}>
      <Text style={{ color: c.gold, fontSize: 26, letterSpacing: 10, marginBottom: 14 }}>✦ ✶ ✦</Text>
      <Text style={{ fontFamily: fonts.italic, fontSize: 19, color: c.mute, fontStyle: 'italic', textAlign: 'center' }}>
        {label}
      </Text>
      <View style={{ marginTop: 14 }}>
        <CatalogLabel tiny>Consulting the register</CatalogLabel>
      </View>
    </View>
  );
}
