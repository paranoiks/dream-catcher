// Record a dream — a three-step modal flow (Inscribe → Symbols → Humour) + confirmation.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Btn,
  CatalogLabel,
  Fleuron,
  Icon,
  MoodScale,
  MoonPlate,
  Rule,
  Screen,
  Surface,
  TagChip,
} from '@/components/almanac';
import { moodOf, roman, type Dream } from '@/data/dreams';
import { useDreams } from '@/data/dreams-store';
import { useTheme } from '@/theme/theme';

const SUGGESTED = [
  'light', 'water', 'fire', 'flying', 'falling', 'father', 'mother', 'ocean', 'forest', 'house',
  'doors', 'mirror', 'teeth', 'chase', 'stranger', 'snow', 'city', 'voices', 'weightless', 'surreal',
];

const STEPS = ['Inscribe', 'Symbols', 'Humour'];

export default function RecordScreen() {
  const { c, fonts, dispTrack, scaleStyle } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addDream } = useDreams();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [mood, setMood] = useState(3);
  const [saved, setSaved] = useState<Dream | null>(null);

  const toggle = (tg: string) => setTags((p) => (p.includes(tg) ? p.filter((x) => x !== tg) : [...p, tg]));
  const addCustom = () => {
    const v = custom.trim().toLowerCase();
    if (v && !tags.includes(v)) setTags((p) => [...p, v]);
    setCustom('');
  };

  const finalTitle = title.trim() || body.trim().split(/\s+/).slice(0, 4).join(' ') || 'Untitled dream';
  const m = moodOf(mood);

  const save = () => {
    const d: Dream = {
      id: 'n' + Date.now(),
      title: finalTitle,
      date: new Date().toISOString().slice(0, 10),
      mood,
      tags,
      body: body.trim(),
    };
    addDream(d);
    setSaved(d);
    setStep(3);
  };

  const qHead = { fontFamily: fonts.display, fontSize: 32, color: c.ink, marginBottom: 8, letterSpacing: 32 * dispTrack };
  const subHead = { fontFamily: fonts.italic, fontStyle: 'italic' as const, fontSize: 15, lineHeight: 23, color: c.mute, marginBottom: 22 };

  return (
    <Screen starDensity={26}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* header */}
        <View style={{ paddingTop: insets.top + 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({ width: 34, height: 34, borderRadius: 3, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
              <Icon name="close" size={17} color={c.ink} />
            </Pressable>
            <CatalogLabel>A new entry</CatalogLabel>
            <View style={{ width: 34 }} />
          </View>
          <Rule style={{ marginHorizontal: 20 }} />
          {step < 3 && (
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 14 }}>
              {STEPS.map((s, i) => (
                <Pressable
                  key={s}
                  onPress={() => i < step && setStep(i)}
                  style={{ flex: 1, alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderColor: i === step ? c.gold : c.line }}>
                  <CatalogLabel tiny gold={i <= step}>
                    № {roman(i + 1)}
                  </CatalogLabel>
                  <Text style={{ marginTop: 4, fontFamily: fonts.display, fontSize: 15, color: i === step ? c.ink : c.faint, letterSpacing: 15 * dispTrack }}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* body */}
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 26, paddingVertical: 24 }}>
          {step === 0 && (
            <View>
              <Text style={qHead}>What did you dream?</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Give it a name (optional)"
                placeholderTextColor={c.faint}
                style={{ fontFamily: fonts.display, fontSize: 26, color: c.ink, letterSpacing: 26 * dispTrack, borderBottomWidth: 1, borderColor: c.line, paddingVertical: 10, marginBottom: 18 }}
              />
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Write it before it fades — the images, the feeling, who was there…"
                placeholderTextColor={c.faint}
                multiline
                style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 27, color: c.ink, backgroundColor: c.textareaBg, borderWidth: 1, borderColor: c.line, borderRadius: 3, padding: 16, minHeight: 200, textAlignVertical: 'top' }}
              />
              <Text style={{ marginTop: 14, textAlign: 'center', fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 13, color: c.faint }}>
                {body.trim() ? `${body.trim().split(/\s+/).length} words remembered` : 'Dreams fade fastest in the first minutes after waking.'}
              </Text>
            </View>
          )}

          {step === 1 && (
            <View>
              <Text style={qHead}>What moved within it?</Text>
              <Text style={subHead}>Name the symbols, people and places. These bind your dreams to one another.</Text>
              {tags.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18, paddingBottom: 18, borderBottomWidth: 1, borderColor: c.line }}>
                  {tags.map((tg) => (
                    <TagChip key={tg} tag={tg} tagStyle="filled" active onPress={() => toggle(tg)} />
                  ))}
                </View>
              )}
              <View style={{ position: 'relative', marginBottom: 22, justifyContent: 'center' }}>
                <TextInput
                  value={custom}
                  onChangeText={setCustom}
                  onSubmitEditing={addCustom}
                  placeholder="Add your own symbol…"
                  placeholderTextColor={c.faint}
                  style={{ height: 42, paddingRight: 44, fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 16, color: c.ink, borderBottomWidth: 1, borderColor: c.line }}
                />
                <Pressable
                  onPress={addCustom}
                  style={({ pressed }) => ({ position: 'absolute', right: 0, top: 4, width: 34, height: 34, borderRadius: 3, borderWidth: 1, borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
                  <Icon name="plus" size={17} color={c.gold} />
                </Pressable>
              </View>
              <CatalogLabel gold tiny style={{ marginBottom: 12 }}>
                Common symbols
              </CatalogLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
                {SUGGESTED.filter((s) => !tags.includes(s)).map((tg) => (
                  <TagChip key={tg} tag={tg} tagStyle="outline" onPress={() => toggle(tg)} />
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={qHead}>How did it sit with you?</Text>
              <Text style={subHead}>From the depths of nightmare to something blissful.</Text>
              <View style={{ alignItems: 'center', marginVertical: 26 }}>
                <MoonPlate mood={mood} size={132} />
                <Text style={{ fontFamily: fonts.display, fontSize: 38, color: c.ink, marginTop: 18, letterSpacing: 38 * dispTrack }}>
                  {m.label}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <CatalogLabel gold>{m.short}</CatalogLabel>
                </View>
              </View>
              <Surface framed style={{ paddingTop: 20, paddingHorizontal: 18, paddingBottom: 16 }}>
                <MoodScale value={mood} onChange={setMood} scaleStyle={scaleStyle} />
              </Surface>
            </View>
          )}

          {step === 3 && saved && (
            <View style={{ alignItems: 'center', paddingTop: 24 }}>
              <MoonPlate mood={saved.mood} size={128} />
              <Text style={{ fontFamily: fonts.display, fontSize: 36, color: c.ink, marginTop: 22, marginBottom: 8, letterSpacing: 36 * dispTrack }}>
                Dream kept
              </Text>
              <Text style={{ fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 15, color: c.mute, maxWidth: 290, textAlign: 'center', lineHeight: 24 }}>
                “{saved.title}” now joins your register, bound to {roman(saved.tags.length)} symbol{saved.tags.length !== 1 ? 's' : ''}.
              </Text>
              <View style={{ marginVertical: 22 }}>
                <Fleuron width={50} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* footer */}
        <View style={{ paddingHorizontal: 26, paddingTop: 14, paddingBottom: insets.bottom + 20, borderTopWidth: 1, borderColor: c.line }}>
          {step === 0 && <Btn label="Continue" iconRight="arrowright" disabled={!body.trim()} onPress={() => setStep(1)} />}
          {step === 1 && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn variant="ghost" iconLeft="back" onPress={() => setStep(0)} style={{ width: 'auto', paddingHorizontal: 20 }} />
              <Btn label="Continue" iconRight="arrowright" onPress={() => setStep(2)} style={{ flex: 1 }} />
            </View>
          )}
          {step === 2 && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn variant="ghost" iconLeft="back" onPress={() => setStep(1)} style={{ width: 'auto', paddingHorizontal: 20 }} />
              <Btn label="Keep this dream" iconLeft="check" onPress={save} style={{ flex: 1 }} />
            </View>
          )}
          {step === 3 && saved && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn variant="ghost" label="To register" onPress={() => router.back()} style={{ flex: 1 }} />
              <Btn label="Read it" iconLeft="star" onPress={() => router.replace(`/reading/${saved.id}?auto=1`)} style={{ flex: 1 }} />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
