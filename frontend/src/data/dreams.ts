// dreams.ts — data model + almanac helpers (ported from dream-data.jsx).
export { MOODS, moodOf, type Mood } from '@/theme/tokens';

export type Dream = {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  mood: number; // 0–6
  tags: string[];
  body: string;
};

// ── Sample register ──────────────────────────────────────────────────────────
export const DREAMS: Dream[] = [
  {
    id: 'd1',
    title: 'A Door Made of Morning',
    date: '2026-05-29',
    mood: 6,
    tags: ['doors', 'light', 'weightless'],
    body: `There was a door standing alone in a field, and it was made entirely of warm light — the kind that comes through curtains at dawn. When I opened it, there was no other side, only more morning. I stepped through and kept falling upward, gently, like a leaf deciding not to land. I wasn't afraid. I remember laughing.`,
  },
  {
    id: 'd2',
    title: 'Weightless Above the City',
    date: '2026-05-27',
    mood: 5,
    tags: ['flying', 'city', 'weightless', 'light'],
    body: `I lifted off from a rooftop without trying. The whole city was below me, lit gold and humming. Every window was a small fire. I could steer by leaning, and the higher I went the quieter everything became, until there was only the sound of my own breathing and a wind that smelled like rain that hadn't fallen yet.`,
  },
  {
    id: 'd3',
    title: "My Father's Garden of Snow",
    date: '2026-05-24',
    mood: 4,
    tags: ['father', 'snow', 'forest', 'light'],
    body: `My father was tending a garden where everything grew out of snow — pale flowers, silver branches, a tree heavy with frozen fruit. He didn't speak, but he handed me a lantern and pointed into the forest. The snow held no cold. I understood, in the way you understand things in dreams, that he had been waiting here a long time.`,
  },
  {
    id: 'd4',
    title: 'The House That Kept Breathing',
    date: '2026-05-21',
    mood: 2,
    tags: ['house', 'doors', 'surreal', 'voices'],
    body: `I kept finding new rooms in a house I thought I knew. Each door opened onto a hallway I'd never walked, and the walls rose and fell slightly, like the house was asleep and breathing. Somewhere upstairs, voices were having a conversation about me, calm and unhurried, and every time I climbed toward them the stairs added another floor.`,
  },
  {
    id: 'd5',
    title: "The Mirror Wouldn't Hold My Face",
    date: '2026-05-18',
    mood: 1,
    tags: ['mirror', 'surreal', 'stranger', 'fire'],
    body: `I looked into a mirror and my reflection arrived a second too late, then wore the wrong expression. Behind me a candle was burning, but in the mirror the whole room was on fire and calm about it. A stranger stood where I should have been. He mouthed something I couldn't hear, and the glass grew warm under my hand.`,
  },
  {
    id: 'd6',
    title: 'The Lighthouse of Teeth',
    date: '2026-05-15',
    mood: 1,
    tags: ['ocean', 'teeth', 'light', 'father'],
    body: `A lighthouse stood far out in a black ocean, and its light came in pulses like a heartbeat. As I rowed closer I saw the tower was built of teeth, white and seamless. My father was at the top, turning the lamp by hand. He called down that the tide was a kind of clock, and that I was early, or very late — he couldn't tell which.`,
  },
  {
    id: 'd7',
    title: 'Chased Through the Glass Forest',
    date: '2026-05-11',
    mood: 0,
    tags: ['chase', 'forest', 'fire', 'stranger'],
    body: `The trees were glass and they rang when I ran past them. Something was behind me — not fast, just certain, the way a tide is certain. Where it stepped the glass caught fire without breaking. I couldn't find the edge of the forest. Every time I looked back the stranger was closer and smiling, and I woke with my heart going like a fist on a door.`,
  },
  {
    id: 'd8',
    title: 'Drowning Was Quiet',
    date: '2026-05-07',
    mood: 0,
    tags: ['water', 'ocean', 'falling', 'mother'],
    body: `I slipped under the surface of a still lake and didn't struggle. It was warm, and the light came down in long green columns. My mother was speaking to me from the shore but the water made her words into shapes I could see and not hear. I kept sinking, and the strange thing — the thing I can't shake — is how safe it felt.`,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
export function roman(n: number): string {
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let r = '';
  for (const [v, s] of map) {
    while (n >= v) {
      r += s;
      n -= v;
    }
  }
  return r || '—';
}

export function ordinal(d: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = d % 100;
  return d + (s[(v - 20) % 10] || s[v] || s[0]);
}

export type TagCount = { tag: string; count: number };

export function tagCounts(dreams: Dream[]): TagCount[] {
  const m: Record<string, number> = {};
  dreams.forEach((d) => d.tags.forEach((t) => (m[t] = (m[t] || 0) + 1)));
  return Object.entries(m)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function dreamsWithTag(dreams: Dream[], tag: string): Dream[] {
  return dreams.filter((d) => d.tags.includes(tag));
}

export function relatedDreams(dreams: Dream[], dream: Dream): Dream[] {
  return dreams.filter((d) => d.id !== dream.id && d.tags.some((t) => dream.tags.includes(t)));
}

// ascending chronological number for a dream id (roman entry № are derived, not stored)
export function ascendingIds(dreams: Dream[]): Record<string, number> {
  const o: Record<string, number> = {};
  [...dreams].sort((a, b) => a.date.localeCompare(b.date)).forEach((d, i) => (o[d.id] = i + 1));
  return o;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parse(iso: string) {
  return new Date(iso + 'T00:00:00');
}

export function fmtDateShort(iso: string): string {
  const dt = parse(iso);
  return `${MONTHS[dt.getMonth()].slice(0, 3)} ${dt.getDate()}`;
}

export function fmtAlmanac(iso: string): string {
  const dt = parse(iso);
  return `the ${ordinal(dt.getDate())} of ${MONTHS[dt.getMonth()]}`;
}

export function fmtAlmanacFull(iso: string): string {
  const dt = parse(iso);
  return `${WEEKDAYS[dt.getDay()]}, ${fmtAlmanac(iso)}, ${dt.getFullYear()}`;
}

// Split off the first letter (for a drop cap), returning [cap, rest]. The rest
// keeps a zero-width space where the letter was so spacing stays intact.
export function dropFirst(text: string): [string | null, string] {
  const s = String(text || '');
  const i = s.search(/[A-Za-z]/);
  if (i < 0) return [null, s];
  return [s[i], s.slice(0, i) + '​' + s.slice(i + 1)];
}
