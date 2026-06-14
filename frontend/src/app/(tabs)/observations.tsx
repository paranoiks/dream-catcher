// Observations — patterns drawn across the whole register.
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { CatalogLabel, Masthead, MoonPlate, Rule, Screen, Surface } from '@/components/almanac';
import { fmtDateShort, MOODS, moodOf, roman, tagCounts, type Dream } from '@/data/dreams';
import { useDreams } from '@/data/dreams-store';
import { useTheme } from '@/theme/theme';

function MoodSpark({ dreams }: { dreams: Dream[] }) {
  const { c } = useTheme();
  const w = 320;
  const h = 76;
  const padX = 4;
  const padY = 8;
  const pts = dreams.map((d, i) => ({
    x: padX + (i / Math.max(1, dreams.length - 1)) * (w - padX * 2),
    y: padY + (1 - d.mood / 6) * (h - padY * 2),
    d,
  }));
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return (
    <Svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      {[0, 0.5, 1].map((g) => (
        <Line
          key={g}
          x1={0}
          x2={w}
          y1={padY + g * (h - padY * 2)}
          y2={padY + g * (h - padY * 2)}
          stroke={c.line}
          strokeWidth={0.6}
          opacity={0.5}
          strokeDasharray="2 4"
        />
      ))}
      <Path d={path} fill="none" stroke={c.gold} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={moodOf(p.d.mood).color} stroke={c.bg1} strokeWidth={1.4} />
      ))}
    </Svg>
  );
}

export default function ObservationsScreen() {
  const { c, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dreams } = useDreams();

  const counts = useMemo(() => tagCounts(dreams), [dreams]);
  const avg = Math.round(dreams.reduce((s, d) => s + d.mood, 0) / dreams.length);
  const byTime = useMemo(() => [...dreams].sort((a, b) => a.date.localeCompare(b.date)), [dreams]);
  const dist = MOODS.map((_, i) => dreams.filter((d) => d.mood === i).length);
  const maxDist = Math.max(...dist, 1);
  const maxTag = counts[0]?.count || 1;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 26, paddingBottom: 140 }}>
        <Masthead kicker="Observations" title="Insights" sub="patterns drawn from the register" />
        <Rule double color={c.lineStrong} style={{ marginBottom: 18 }} />

        {/* two-up: prevailing humour + chief symbol */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <Surface framed style={{ flex: 1.1, paddingVertical: 16, paddingHorizontal: 14, alignItems: 'center' }}>
            <CatalogLabel tiny style={{ marginBottom: 10 }}>
              Prevailing humour
            </CatalogLabel>
            <View style={{ marginBottom: 8 }}>
              <MoonPlate mood={avg} size={86} ticks={36} />
            </View>
            <Text style={{ fontFamily: fonts.display, fontSize: 22, color: c.ink }}>{moodOf(avg).label}</Text>
          </Surface>
          <Surface framed style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 14, justifyContent: 'space-between' }}>
            <CatalogLabel tiny style={{ marginBottom: 10 }}>
              Chief symbol
            </CatalogLabel>
            <View>
              <Text style={{ fontFamily: fonts.display, fontSize: 30, color: c.gold, textTransform: 'capitalize', lineHeight: 32 }}>
                ✦ {counts[0]?.tag}
              </Text>
              <Text style={{ marginTop: 8, fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 13.5, color: c.mute }}>
                borne by {roman(counts[0]?.count)} dreams
              </Text>
            </View>
          </Surface>
        </View>

        {/* emotional weather */}
        <Surface framed style={{ padding: 18, marginBottom: 12 }}>
          <CatalogLabel tiny style={{ marginBottom: 6 }}>
            The emotional weather
          </CatalogLabel>
          <MoodSpark dreams={byTime} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <CatalogLabel tiny>{fmtDateShort(byTime[0].date)}</CatalogLabel>
            <CatalogLabel tiny>{fmtDateShort(byTime[byTime.length - 1].date)}</CatalogLabel>
          </View>
        </Surface>

        {/* distribution */}
        <Surface framed style={{ padding: 18, marginBottom: 12 }}>
          <CatalogLabel tiny style={{ marginBottom: 12 }}>
            How the nights divide
          </CatalogLabel>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 92 }}>
            {dist.map((n, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 7, height: '100%' }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 11, color: c.faint }}>{n || ''}</Text>
                <View
                  style={{
                    width: '100%',
                    height: Math.max((n / maxDist) * 72, n ? 5 : 2),
                    borderRadius: 1,
                    backgroundColor: n ? moodOf(i).color : c.line,
                    borderWidth: n ? 1 : 0,
                    borderColor: c.inkBorder,
                  }}
                />
                <CatalogLabel tiny>{moodOf(i).label.slice(0, 4)}</CatalogLabel>
              </View>
            ))}
          </View>
        </Surface>

        {/* recurring symbols */}
        <Surface framed style={{ padding: 18 }}>
          <CatalogLabel tiny style={{ marginBottom: 14 }}>
            Recurring symbols
          </CatalogLabel>
          {counts.slice(0, 6).map(({ tag, count }, i) => (
            <Pressable
              key={tag}
              onPress={() => router.push(`/symbol/${encodeURIComponent(tag)}`)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 9,
                borderTopWidth: i ? 1 : 0,
                borderColor: c.line,
                opacity: pressed ? 0.7 : 1,
              })}>
              <Text style={{ width: 70, fontFamily: fonts.body, fontSize: 14.5, color: c.ink, textTransform: 'capitalize' }}>
                {tag}
              </Text>
              <View style={{ flex: 1, height: 6, backgroundColor: c.lineHalf }}>
                <View style={{ width: `${(count / maxTag) * 100}%`, height: '100%', backgroundColor: c.gold }} />
              </View>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.gold, width: 22, textAlign: 'right', letterSpacing: 0.8 }}>
                {roman(count)}
              </Text>
            </Pressable>
          ))}
        </Surface>
      </ScrollView>
    </Screen>
  );
}
