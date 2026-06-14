// Symbols — the index of recurring symbols with dotted leaders.
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogLabel, Icon, Masthead, Rule, Screen } from '@/components/almanac';
import { roman, tagCounts } from '@/data/dreams';
import { useDreams } from '@/data/dreams-store';
import { useTheme } from '@/theme/theme';

export default function SymbolsScreen() {
  const { c, fonts, dispTrack } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dreams } = useDreams();
  const [q, setQ] = useState('');

  const counts = useMemo(() => tagCounts(dreams), [dreams]);
  const shown = counts.filter((c2) => c2.tag.includes(q.toLowerCase().trim()));

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 26, paddingBottom: 140 }}>
        <Masthead kicker="Index" title="Symbols & Themes" sub="the recurring images of your nights" />
        <Rule double color={c.lineStrong} style={{ marginBottom: 18 }} />

        <View style={{ position: 'relative', marginBottom: 18, justifyContent: 'center' }}>
          <View style={{ position: 'absolute', left: 2, zIndex: 1 }}>
            <Icon name="search" size={17} color={c.faint} />
          </View>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Seek a symbol…"
            placeholderTextColor={c.faint}
            style={{
              height: 40,
              paddingLeft: 28,
              paddingRight: 4,
              borderBottomWidth: 1,
              borderColor: c.line,
              color: c.ink,
              fontFamily: fonts.italic,
              fontStyle: 'italic',
              fontSize: 16,
            }}
          />
        </View>

        {shown.map(({ tag, count }) => (
          <Pressable
            key={tag}
            onPress={() => router.push(`/symbol/${encodeURIComponent(tag)}`)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 10,
              paddingVertical: 13,
              borderBottomWidth: 1,
              borderColor: c.line,
              opacity: pressed ? 0.7 : 1,
            })}>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 21,
                color: c.ink,
                textTransform: 'capitalize',
                letterSpacing: 21 * dispTrack,
              }}>
              {tag}
            </Text>
            <View style={{ flex: 1, borderBottomWidth: 1, borderStyle: 'dotted', borderColor: c.lineStrong, transform: [{ translateY: -4 }] }} />
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.gold, letterSpacing: 1 }}>{roman(count)}</Text>
          </Pressable>
        ))}

        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <CatalogLabel tiny>Tap a symbol to read its meaning across your dreams</CatalogLabel>
        </View>
      </ScrollView>
    </Screen>
  );
}
