// Symbol detail — what a single symbol means across the dreamer's register.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  Augury,
  Btn,
  CatalogLabel,
  Fleuron,
  LedgerEntry,
  PushBar,
  ReadingShimmer,
  Rule,
  Screen,
  SectionRule,
} from '@/components/almanac';
import { symbolReading } from '@/ai/dream-ai';
import { ascendingIds, dreamsWithTag, roman } from '@/data/dreams';
import { useDreams } from '@/data/dreams-store';
import { useTheme } from '@/theme/theme';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function SymbolDetailScreen() {
  const { c, fonts, dispTrack } = useTheme();
  const router = useRouter();
  const { tag: rawTag } = useLocalSearchParams<{ tag: string }>();
  const tag = decodeURIComponent(String(rawTag));
  const { dreams } = useDreams();

  const list = useMemo(
    () => dreamsWithTag(dreams, tag).sort((a, b) => b.date.localeCompare(a.date)),
    [dreams, tag],
  );
  const ascId = useMemo(() => ascendingIds(dreams), [dreams]);

  const [reading, setReading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const interpret = async () => {
    setLoading(true);
    await sleep(1100); // let the casting shimmer breathe before the fallback reading
    const r = await symbolReading(tag, list);
    setReading(r);
    setLoading(false);
  };

  return (
    <Screen starDensity={28}>
      <PushBar label="Symbol" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 26, paddingBottom: 124 }}>
        <View style={{ alignItems: 'center' }}>
          <CatalogLabel gold style={{ marginBottom: 10 }}>
            A recurring symbol
          </CatalogLabel>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 52,
              color: c.ink,
              textTransform: 'capitalize',
              letterSpacing: 52 * dispTrack,
              marginBottom: 6,
              textAlign: 'center',
            }}>
            {tag}
          </Text>
          <Text style={{ fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 14, color: c.mute, marginBottom: 20, textAlign: 'center' }}>
            appears in {roman(list.length)} dream{list.length !== 1 ? 's' : ''} of your register
          </Text>
          <Fleuron width={48} />
        </View>

        <View style={{ marginVertical: 22 }}>
          {!reading && !loading && <Btn variant="outline" label="Interpret this symbol" iconLeft="star" onPress={interpret} />}
          {loading && <ReadingShimmer label={`Tracing “${tag}” through your dreams…`} />}
          {reading && <Augury body={reading} title="The symbol read" />}
        </View>

        <SectionRule label="Dreams bearing it" />
        {list.map((d, i) => (
          <LedgerEntry key={d.id} dream={d} num={ascId[d.id]} first={i === 0} onPress={() => router.push(`/dream/${d.id}`)} />
        ))}
        <Rule color="transparent" style={{ height: 1 }} />
      </ScrollView>
    </Screen>
  );
}
