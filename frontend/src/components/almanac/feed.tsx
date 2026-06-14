// feed.tsx — shared register building blocks: Masthead, SectionRule, Stat strip,
// LedgerEntry (a dream row), Augury (a framed reading plate).
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { fmtAlmanac, moodOf, roman, type Dream } from '@/data/dreams';
import { useTheme } from '@/theme/theme';
import { MoonPhase } from './moon';
import { CatalogLabel, Rule, Surface } from './primitives';
import { TagChip } from './tag-chip';

export function Masthead({
  kicker,
  title,
  sub,
  children,
}: {
  kicker: string;
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  const { c, fonts, dispTrack } = useTheme();
  return (
    <View style={{ alignItems: 'center', marginBottom: 26 }}>
      <CatalogLabel gold style={{ marginBottom: 14 }}>
        {kicker}
      </CatalogLabel>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 46,
          lineHeight: 48,
          color: c.ink,
          letterSpacing: 46 * dispTrack,
          textAlign: 'center',
          marginBottom: 8,
        }}>
        {title}
      </Text>
      {sub && (
        <Text
          style={{
            fontFamily: fonts.italic,
            fontStyle: 'italic',
            fontSize: 15,
            color: c.mute,
            marginBottom: 16,
            textAlign: 'center',
          }}>
          {sub}
        </Text>
      )}
      {children}
    </View>
  );
}

export function SectionRule({ label }: { label: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 30, marginBottom: 4 }}>
      <CatalogLabel gold>{label}</CatalogLabel>
      <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
    </View>
  );
}

export function StatStrip({ stats }: { stats: { n: string; l: string }[] }) {
  const { c, fonts } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
      {stats.map((s, i) => (
        <View key={s.l} style={{ flexDirection: 'row' }}>
          {i > 0 && <View style={{ width: 1, backgroundColor: c.line, alignSelf: 'stretch' }} />}
          <View style={{ paddingHorizontal: 18, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 26, color: c.gold, letterSpacing: 1 }}>
              {s.n}
            </Text>
            <View style={{ marginTop: 6 }}>
              <CatalogLabel tiny>{s.l}</CatalogLabel>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export function LedgerEntry({
  dream,
  num,
  first,
  onPress,
}: {
  dream: Dream;
  num: number;
  first?: boolean;
  onPress: () => void;
}) {
  const { c, fonts, dispTrack } = useTheme();
  const m = moodOf(dream.mood);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 20,
        borderTopWidth: 1,
        borderColor: first ? c.lineStrong : c.line,
        opacity: pressed ? 0.7 : 1,
      })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
        <CatalogLabel gold>Dream № {roman(num)}</CatalogLabel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <CatalogLabel>{m.label}</CatalogLabel>
          <MoonPhase mood={dream.mood} size={19} />
        </View>
      </View>
      <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 29, color: c.ink, letterSpacing: 26 * dispTrack }}>
        {dream.title}
      </Text>
      <Text style={{ fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 13, color: c.faint, marginTop: 5, marginBottom: 11 }}>
        {fmtAlmanac(dream.date)}
      </Text>
      <Text numberOfLines={2} style={{ fontFamily: fonts.body, fontSize: 14.5, lineHeight: 23, color: c.mute }}>
        {dream.body}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 13 }}>
        <CatalogLabel gold tiny>
          Symbols
        </CatalogLabel>
        {dream.tags.map((tag) => (
          <TagChip key={tag} tag={tag} tagStyle="plain" size="sm" />
        ))}
      </View>
    </Pressable>
  );
}

export function Augury({ body, title }: { body: string; title: string }) {
  const { c, fonts } = useTheme();
  return (
    <Surface framed style={{ padding: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Text style={{ color: c.gold }}>✦</Text>
        <CatalogLabel gold>{title}</CatalogLabel>
        <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
      </View>
      <Text style={{ fontFamily: fonts.body, fontSize: 15.5, lineHeight: 27, color: c.ink }}>{body}</Text>
    </Surface>
  );
}
