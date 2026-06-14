// Reading — an augury upon a dream, in three lazily-generated styles.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  Btn,
  CatalogLabel,
  DropCap,
  MoonPhase,
  PushBar,
  ReadingShimmer,
  Rule,
  Screen,
  Surface,
  TagChip,
} from '@/components/almanac';
import { dreamReading, type ReadingStyle } from '@/ai/dream-ai';
import { dropFirst, moodOf, relatedDreams, roman } from '@/data/dreams';
import { useDreams } from '@/data/dreams-store';
import { useTheme } from '@/theme/theme';

const STYLES: { key: ReadingStyle; label: string; blurb: string }[] = [
  { key: 'interpretation', label: 'Interpretation', blurb: 'A flowing reading of the dream as a whole.' },
  { key: 'symbols', label: 'Symbols', blurb: 'Each symbol weighed on its own.' },
  { key: 'patterns', label: 'Patterns', blurb: 'What recurs across dreams that share its symbols.' },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ReadingScreen() {
  const { c, fonts, dispTrack } = useTheme();
  const router = useRouter();
  const { id, auto } = useLocalSearchParams<{ id: string; auto?: string }>();
  const { dreams, getById } = useDreams();
  const dream = getById(String(id));

  const related = useMemo(() => (dream ? relatedDreams(dreams, dream) : []), [dreams, dream]);
  const [style, setStyle] = useState<ReadingStyle>('interpretation');
  const [cache, setCache] = useState<Partial<Record<ReadingStyle, string>>>({});
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const generate = async (st: ReadingStyle) => {
    if (!dream || cache[st]) return;
    setLoading(true);
    await sleep(1100); // show the casting shimmer before the fallback reading
    const r = await dreamReading(st, dream, related);
    setCache((p) => ({ ...p, [st]: r }));
    setLoading(false);
  };

  const reveal = () => {
    setRevealed(true);
    generate('interpretation');
  };

  const pick = (st: ReadingStyle) => {
    setStyle(st);
    if (!cache[st]) generate(st);
  };

  useEffect(() => {
    if (auto === '1') reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!dream) {
    return (
      <Screen starDensity={28}>
        <PushBar label="An augury" onBack={() => router.back()} />
      </Screen>
    );
  }

  const m = moodOf(dream.mood);
  const body = cache[style];
  const [cap, rest] = body ? dropFirst(body) : [null, ''];

  return (
    <Screen starDensity={28}>
      <PushBar label="An augury" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 14, paddingHorizontal: 26, paddingBottom: 124 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <CatalogLabel gold style={{ marginBottom: 8 }}>
            A reading upon
          </CatalogLabel>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, color: c.ink, lineHeight: 33, letterSpacing: 30 * dispTrack, textAlign: 'center' }}>
            {dream.title}
          </Text>
        </View>

        {!revealed ? (
          <View style={{ alignItems: 'center', paddingTop: 16 }}>
            <Surface framed style={{ paddingVertical: 32, paddingHorizontal: 24, marginBottom: 14, alignItems: 'center', width: '100%' }}>
              <Text style={{ color: c.gold, fontSize: 30, letterSpacing: 9, marginBottom: 16 }}>✦ ✶ ✦</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 15.5, lineHeight: 26, color: c.mute, marginBottom: 24, textAlign: 'center' }}>
                The reader will weigh this dream against {roman(related.length)} other{related.length !== 1 ? 's' : ''} that share its symbols, and offer a personal interpretation.
              </Text>
              <Btn label="Reveal my reading" iconLeft="star" onPress={reveal} />
            </Surface>
            <CatalogLabel tiny>Readings are reflective, not predictive</CatalogLabel>
          </View>
        ) : (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 22, marginBottom: 6, flexWrap: 'wrap' }}>
              {STYLES.map((s) => {
                const on = style === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => pick(s.key)}
                    style={{ paddingVertical: 4, borderBottomWidth: 1, borderColor: on ? c.gold : 'transparent' }}>
                    <Text
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 11.5,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        color: on ? c.gold : c.faint,
                      }}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Rule style={{ marginBottom: 14 }} />
            <Text style={{ fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 13.5, color: c.mute, marginBottom: 18, textAlign: 'center' }}>
              {STYLES.find((s) => s.key === style)!.blurb}
            </Text>

            {loading && !body ? (
              <ReadingShimmer label="Reading the dream…" />
            ) : (
              <Surface framed style={{ padding: 22 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <MoonPhase mood={dream.mood} size={20} />
                  <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
                  <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 3 }}>✦</Text>
                </View>
                <Text style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 28, color: c.ink }}>
                  {cap && <DropCap>{cap}</DropCap>}
                  {rest}
                </Text>
                <View style={{ marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderColor: c.line, flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <CatalogLabel gold tiny>
                    Symbols weighed
                  </CatalogLabel>
                  {dream.tags.map((tg) => (
                    <TagChip key={tg} tag={tg} tagStyle="plain" size="sm" onPress={() => router.push(`/symbol/${encodeURIComponent(tg)}`)} />
                  ))}
                </View>
              </Surface>
            )}
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <CatalogLabel tiny>Drawn from this dream &amp; {roman(related.length)} others sharing its symbols</CatalogLabel>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
