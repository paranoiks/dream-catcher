// dream-ai.ts — dream readings in three styles with graceful written fallbacks.
// Ported from dream-ai.jsx. The LLM call is stubbed for now (returns null) so the
// hand-written, cross-referential fallbacks are always shown — these weave in the
// actual related-dream content. The real endpoint gets wired in later.
import { MOODS, type Dream } from '@/data/dreams';

export type ReadingStyle = 'interpretation' | 'symbols' | 'patterns';

const SYMBOLS: Record<string, string> = {
  fire: 'transformation, anger, and purification',
  water: 'the unconscious and the tide of emotion',
  ocean: 'the vast unconscious — depth, the mother, being overwhelmed',
  falling: "a loss of control, or a surrender you haven't named",
  flying: 'freedom, transcendence, the wish to rise above',
  weightless: 'release, and the letting-go of a burden',
  father: 'authority, protection, and the inner judge',
  mother: 'origin, nurture, and the pull of dependence',
  light: 'awareness, hope, and revelation',
  teeth: 'vulnerability and the fear of losing power',
  chase: 'something unfaced that follows you',
  house: 'the self — the many rooms of your psyche',
  doors: 'thresholds and the choices waiting on the other side',
  mirror: 'self-image, truth, and the shadow',
  stranger: 'an unknown part of yourself',
  forest: 'the wild unconscious, where one gets lost and grows',
  city: 'the collective, ambition, and noise',
  snow: 'stillness, a clean slate, or emotional cold',
  voices: 'conscience and the unheard self',
  surreal: 'the psyche bending logic to process something deep',
};

export const meaning = (t: string): string =>
  SYMBOLS[t] || 'a private symbol whose meaning is still forming';

const moodWord = (i: number): string => MOODS[i].label.toLowerCase();

function excerpt(d: Dream, n = 160): string {
  return d.body.length > n ? d.body.slice(0, n).trim() + '…' : d.body;
}

// Stub: no LLM wired yet. Returns null so the fallback is used. When the backend
// is ready, build the prompt (see commented construction below) and call it here.
async function callLLM(_prompt: string): Promise<string | null> {
  return null;
}

// ── Dream reading in three styles ────────────────────────────────────────────
export async function dreamReading(
  style: ReadingStyle,
  dream: Dream,
  related: Dream[],
): Promise<string> {
  const relText = related.length
    ? related
        .map((d) => `• "${d.title}" (felt ${moodWord(d.mood)}; symbols: ${d.tags.join(', ')}): ${excerpt(d, 120)}`)
        .join('\n')
    : 'None yet — this dream stands alone.';
  const common = `You are a thoughtful, poetic dream interpreter — warm, literary, never clinical or generic. Address the dreamer as "you". Write in plain prose with NO markdown.\n\nTHE DREAM ("${dream.title}", which felt ${moodWord(dream.mood)}):\n${dream.body}\n\nSYMBOLS PRESENT: ${dream.tags.join(', ')}\n\nOTHER DREAMS THAT SHARE THESE SYMBOLS:\n${relText}\n`;
  const styles: Record<ReadingStyle, string> = {
    interpretation: common + `\nWrite a flowing interpretive reading (about 130 words) as a short letter to the dreamer.`,
    symbols: common + `\nWrite a reading organized around the 3 most important symbols. About 130 words.`,
    patterns: common + `\nWrite a reading (about 130 words) on the recurring pattern across these dreams.`,
  };
  const llm = await callLLM(styles[style]);
  return (llm && stripMarkdown(llm)) || fallback(style, dream, related);
}

function stripMarkdown(s: string): string {
  return s.trim().replace(/\*+/g, '').replace(/^#+\s*/gm, '');
}

function fallback(style: ReadingStyle, dream: Dream, related: Dream[]): string {
  const tags = dream.tags;
  const top = tags.slice(0, 3);
  const relCount = related.length;
  const mood = moodWord(dream.mood);

  if (style === 'symbols') {
    return top
      .map((t) => {
        const also = related.filter((d) => d.tags.includes(t)).length;
        const echo = also
          ? ` It returns in ${also} of your other dream${also > 1 ? 's' : ''}, so it is not a passing image but a thread you are following.`
          : '';
        return `${t.toUpperCase()} — In "${dream.title}" this carries ${meaning(t)}.${echo}`;
      })
      .join('\n\n');
  }

  if (style === 'patterns') {
    const shared: Record<string, number> = {};
    related.forEach((d) => d.tags.forEach((t) => {
      if (tags.includes(t)) shared[t] = (shared[t] || 0) + 1;
    }));
    const recurring = Object.entries(shared)
      .sort((a, b) => b[1] - a[1])
      .map((e) => e[0])
      .slice(0, 2);
    const pat = recurring.length
      ? `The thread that keeps returning is ${recurring.join(' and ')} — ${meaning(recurring[0])}.`
      : `This dream stands a little apart from the others, a single bright knot in the weave.`;
    return `${pat} Across ${relCount + 1} of your dreams the emotional weather circles back to something ${mood}, as though the night is rehearsing the same question in different rooms. ${
      recurring.length
        ? `Notice where ${recurring[0]} appears: it tends to arrive when something in waking life is asking to be either held or released.`
        : 'When a symbol arrives only once, it can be the most honest of all — pay it attention before it learns to hide.'
    } The pattern is not a verdict. It is an invitation to look again, gently.`;
  }

  // interpretation
  const symPhrase = top.map(meaning)[0];
  const relPhrase = relCount
    ? `You have dreamed near this territory before — ${relCount} other night${relCount > 1 ? 's' : ''} share its symbols, which suggests "${dream.title}" is part of a longer conversation you are having with yourself.`
    : `This one arrives on its own, unrepeated, which can make it feel especially vivid and worth remembering.`;
  return `"${dream.title}" reads as a dream about ${symPhrase}. That it felt ${mood} is the key the rest turns on — the emotion is the dream telling you how to hold its images. ${relPhrase} Sit with ${top[0]} in particular: in your dreaming it keeps the company of ${
    top.slice(1).join(' and ') || 'silence'
  }, and that pairing is rarely accidental. Nothing here predicts your waking life. But a dream like this often surfaces when some part of you is ready to be noticed. Let it stay with you through the morning.`;
}

// ── Symbol reading (across all dreams carrying a tag) ─────────────────────────
export async function symbolReading(tag: string, dreams: Dream[]): Promise<string> {
  const text = dreams.map((d) => `• "${d.title}" (${moodWord(d.mood)}): ${excerpt(d, 130)}`).join('\n');
  const prompt = `You are a poetic dream interpreter. The dreamer keeps returning to one symbol: "${tag}". Here are their dreams that contain it:\n${text}\n\nWrite about 110 words on what "${tag}" seems to mean for THIS dreamer specifically.`;
  const llm = await callLLM(prompt);
  if (llm) return stripMarkdown(llm);

  const moods = dreams.map((d) => d.mood);
  const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
  const tone = avg <= 2 ? 'unease' : avg >= 4 ? 'tenderness and wonder' : 'a restless in-between';
  return `For you, ${tag} carries ${meaning(tag)}. It surfaces across ${dreams.length} of your dreams, and where it appears the feeling tends toward ${tone}. Notice that it rarely arrives alone — it gathers other images to it, the way a single word can summon a whole memory. That recurrence matters more than any single appearance: a symbol that keeps coming back is usually standing in for something your waking mind hasn't finished with. You don't need to solve ${tag}. Just keep noticing when it visits, and what feeling it brings through the door with it.`;
}
