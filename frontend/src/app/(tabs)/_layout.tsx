import { Tabs, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/almanac';
import { useTheme } from '@/theme/theme';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Register', icon: 'register' },
  symbols: { label: 'Symbols', icon: 'symbols' },
  observations: { label: 'Observations', icon: 'chart' },
};

// minimal shape of the props expo-router hands a custom tabBar (avoids depending
// on @react-navigation/bottom-tabs types directly).
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
  };
};

// ── Almanac dock + inscribe seal (custom tab bar) ────────────────────────────
function AlmanacDock({ state, navigation }: TabBarProps) {
  const { c, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
      {/* inscribe seal */}
      <Pressable
        onPress={() => router.push('/record')}
        accessibilityLabel="Record a dream"
        style={({ pressed }) => ({
          position: 'absolute',
          right: 22,
          bottom: insets.bottom + 78,
          width: 56,
          height: 56,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: c.lineStrong,
          backgroundColor: c.bg1,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          shadowColor: '#000',
          shadowOpacity: 0.45,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        })}>
        <View style={{ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, borderRadius: 24, borderWidth: 1, borderColor: c.line }} />
        <Icon name="quill" size={23} color={c.gold} />
      </Pressable>

      <View
        style={{
          flexDirection: 'row',
          paddingTop: 12,
          paddingBottom: insets.bottom + 14,
          backgroundColor: c.bg0,
          borderTopWidth: 1,
          borderTopColor: c.lineStrong,
        }}>
        {state.routes.map((route, i) => {
          const meta = TABS[route.name];
          if (!meta) return null;
          const on = state.index === i;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!on && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <View>
                <Icon name={meta.icon} size={21} stroke={on ? 1.6 : 1.4} color={on ? c.gold : c.faint} />
                {on && (
                  <Text style={{ position: 'absolute', top: -8, left: 0, right: 0, textAlign: 'center', fontSize: 7, color: c.gold }}>
                    ✦
                  </Text>
                )}
              </View>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 9.5,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: on ? c.gold : c.faint,
                }}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AlmanacDock {...(props as unknown as TabBarProps)} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="symbols" />
      <Tabs.Screen name="observations" />
    </Tabs>
  );
}
