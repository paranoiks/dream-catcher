// Register — the home journal feed, newest first.
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LedgerEntry, Masthead, Rule, Screen, SectionRule, StatStrip } from '@/components/almanac';
import { ascendingIds, roman, tagCounts } from '@/data/dreams';
import { useDreams } from '@/data/dreams-store';
import { useTheme } from '@/theme/theme';

export default function RegisterScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dreams } = useDreams();

  const ascId = useMemo(() => ascendingIds(dreams), [dreams]);
  const sorted = useMemo(() => [...dreams].sort((a, b) => b.date.localeCompare(a.date)), [dreams]);
  const nightmares = dreams.filter((d) => d.mood <= 1).length;

  return (
    <Screen starDensity={36}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 26, paddingBottom: 140 }}>
        <Masthead kicker="The Somnial Register" title="Dream Catcher" sub="a nightly register of dreams">
          <Rule double color={c.lineStrong} style={{ marginTop: 4, marginBottom: 16 }} />
          <StatStrip
            stats={[
              { n: roman(dreams.length), l: 'Entries' },
              { n: roman(tagCounts(dreams).length), l: 'Symbols' },
              { n: roman(nightmares), l: 'Terrors' },
            ]}
          />
          <Rule double color={c.lineStrong} style={{ marginTop: 16 }} />
        </Masthead>
        <SectionRule label="The Register" />
        {sorted.map((d, i) => (
          <LedgerEntry
            key={d.id}
            dream={d}
            num={ascId[d.id]}
            first={i === 0}
            onPress={() => router.push(`/dream/${d.id}`)}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}
