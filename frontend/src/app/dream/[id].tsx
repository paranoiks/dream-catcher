// Dream plate — read one full dream, reach its reading + related dreams.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  Btn,
  CatalogLabel,
  DropCap,
  Fleuron,
  MoonPhase,
  MoonPlate,
  PushBar,
  Rule,
  Screen,
  SectionRule,
  TagChip,
} from '@/components/almanac';
import { ascendingIds, dropFirst, fmtAlmanacFull, moodOf, relatedDreams, roman } from '@/data/dreams';
import { useDreams } from '@/data/dreams-store';
import { useTheme } from '@/theme/theme';

export default function DreamDetailScreen() {
  const { c, fonts, dispTrack } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dreams, getById } = useDreams();
  const dream = getById(String(id));

  const related = useMemo(() => (dream ? relatedDreams(dreams, dream) : []), [dreams, dream]);
  const ascId = useMemo(() => ascendingIds(dreams), [dreams]);
  const num = dream ? ascId[dream.id] : 0;

  if (!dream) {
    return (
      <Screen starDensity={28}>
        <PushBar onBack={() => router.back()} />
      </Screen>
    );
  }

  const m = moodOf(dream.mood);
  const [cap, rest] = dropFirst(dream.body);

  return (
    <Screen starDensity={28}>
      <PushBar label={`Dream № ${roman(num)}`} onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 14, paddingHorizontal: 26, paddingBottom: 124 }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ marginBottom: 14 }}>
            <MoonPlate mood={dream.mood} size={104} ticks={44} />
          </View>
          <CatalogLabel gold>
            {m.label} · {m.short}
          </CatalogLabel>
        </View>
        <Text
          style={{
            marginTop: 14,
            marginBottom: 6,
            textAlign: 'center',
            fontFamily: fonts.display,
            fontSize: 42,
            lineHeight: 45,
            color: c.ink,
            letterSpacing: 42 * dispTrack,
          }}>
          {dream.title}
        </Text>
        <Text
          style={{ textAlign: 'center', fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 14, color: c.mute, marginBottom: 18 }}>
          recorded {fmtAlmanacFull(dream.date)}
        </Text>
        <Fleuron width={54} />
        <Text style={{ fontFamily: fonts.body, fontSize: 17, lineHeight: 31, color: c.ink, marginVertical: 24 }}>
          {cap && <DropCap>{cap}</DropCap>}
          {rest}
        </Text>
        <Rule />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 16, marginBottom: 26 }}>
          <CatalogLabel gold tiny>
            Symbols
          </CatalogLabel>
          {dream.tags.map((tg) => (
            <TagChip key={tg} tag={tg} tagStyle="plain" onPress={() => router.push(`/symbol/${encodeURIComponent(tg)}`)} />
          ))}
        </View>
        <Btn label="Reveal a reading" iconLeft="star" onPress={() => router.push(`/reading/${dream.id}`)} />

        {related.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <SectionRule label="See also" />
            {related.slice(0, 3).map((d, i) => (
              <Pressable
                key={d.id}
                onPress={() => router.push(`/dream/${d.id}`)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 14,
                  borderTopWidth: i ? 1 : 0,
                  borderColor: c.line,
                  opacity: pressed ? 0.7 : 1,
                })}>
                <MoonPhase mood={d.mood} size={22} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontFamily: fonts.display, fontSize: 18, color: c.ink, letterSpacing: 18 * dispTrack }}>
                    {d.title}
                  </Text>
                  <Text style={{ fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 12.5, color: c.faint }}>
                    shares {d.tags.filter((x) => dream.tags.includes(x)).join(', ')}
                  </Text>
                </View>
                <CatalogLabel gold tiny>
                  № {roman(ascId[d.id])}
                </CatalogLabel>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
