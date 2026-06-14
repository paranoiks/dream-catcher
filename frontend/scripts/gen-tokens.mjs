// gen-tokens.mjs — convert the design's OKLCH palette + color-mix derivations
// into static RN-friendly hex (#rrggbb / #rrggbbaa). Run: node scripts/gen-tokens.mjs
import { writeFileSync } from 'node:fs';

// ── OKLCH → sRGB ─────────────────────────────────────────────────────────────
function oklchToRgb(L, C, H, alpha = 1) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const gamma = (x) => {
    x = Math.max(0, Math.min(1, x));
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  };
  return { r: gamma(r), g: gamma(g), b: gamma(bl), a: alpha };
}

function toHex({ r, g, b, a }) {
  const c = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  const base = `#${c(r)}${c(g)}${c(b)}`;
  return a >= 1 ? base : base + c(a);
}

// parse "oklch(L C H)" or "oklch(L C H / A)"
function parseOklch(str) {
  const m = str.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)/);
  if (!m) throw new Error('bad oklch: ' + str);
  return { L: +m[1], C: +m[2], H: +m[3], a: m[4] != null ? +m[4] : 1 };
}
const hex = (str) => toHex(oklchToRgb(...Object.values(pickLCHA(parseOklch(str)))));
const pickLCHA = (o) => ({ L: o.L, C: o.C, H: o.H, a: o.a });

// color-mix(in oklch, A pa, B pb) — A,B oklch components; shortest-hue interp
function mixOklch(A, B, pa) {
  const pb = 1 - pa;
  // powerless hue when chroma ~0
  let ha = A.C < 1e-4 ? B.H : A.H;
  let hb = B.C < 1e-4 ? A.H : B.H;
  let d = hb - ha;
  if (d > 180) d -= 360; else if (d < -180) d += 360;
  const H = ha + d * pb;
  return { L: A.L * pa + B.L * pb, C: A.C * pa + B.C * pb, H, a: A.a * pa + B.a * pb };
}
const mixHex = (aStr, bStr, pa) => toHex(oklchToRgb(...Object.values(pickLCHA(mixOklch(parseOklch(aStr), parseOklch(bStr), pa)))));

// alpha-only: color C at alpha p (= color-mix(in oklch, C p%, transparent))
function alphaHex(str, p) {
  const o = parseOklch(str);
  return toHex(oklchToRgb(o.L, o.C, o.H, o.a * p));
}

// ── source palette (verbatim from dream-data.jsx + README) ───────────────────
const EDITIONS_SRC = {
  'Ink & Gold': {
    bg0: 'oklch(0.155 0.028 268)', bg1: 'oklch(0.185 0.030 268)', bg2: 'oklch(0.225 0.032 269)',
    line: 'oklch(0.80 0.09 84 / 0.34)', lineStrong: 'oklch(0.80 0.09 84 / 0.62)',
    ink: 'oklch(0.93 0.022 86)', mute: 'oklch(0.76 0.03 80)', faint: 'oklch(0.60 0.035 78)',
    accent: 'oklch(0.81 0.10 84)', gold: 'oklch(0.83 0.10 86)', glow: 'oklch(0.81 0.10 84 / 0.30)',
    star: 'oklch(0.88 0.05 86)',
  },
  'Oxblood & Bronze': {
    bg0: 'oklch(0.155 0.035 20)', bg1: 'oklch(0.185 0.038 20)', bg2: 'oklch(0.225 0.040 22)',
    line: 'oklch(0.72 0.08 52 / 0.36)', lineStrong: 'oklch(0.72 0.08 52 / 0.64)',
    ink: 'oklch(0.92 0.025 60)', mute: 'oklch(0.75 0.035 50)', faint: 'oklch(0.59 0.05 42)',
    accent: 'oklch(0.76 0.09 56)', gold: 'oklch(0.79 0.09 60)', glow: 'oklch(0.76 0.09 56 / 0.30)',
    star: 'oklch(0.85 0.05 62)',
  },
  'Verdigris & Brass': {
    bg0: 'oklch(0.150 0.028 200)', bg1: 'oklch(0.182 0.030 200)', bg2: 'oklch(0.222 0.032 202)',
    line: 'oklch(0.78 0.08 108 / 0.34)', lineStrong: 'oklch(0.78 0.08 108 / 0.62)',
    ink: 'oklch(0.93 0.022 120)', mute: 'oklch(0.76 0.03 130)', faint: 'oklch(0.59 0.04 150)',
    accent: 'oklch(0.80 0.09 110)', gold: 'oklch(0.82 0.09 110)', glow: 'oklch(0.80 0.09 110 / 0.30)',
    star: 'oklch(0.87 0.05 120)',
  },
};

const MOODS_SRC = [
  { key: 'nightmare', label: 'Nightmare', short: 'Terror',  color: 'oklch(0.58 0.17 18)',  moon: 0.0 },
  { key: 'troubling', label: 'Troubling', short: 'Dread',   color: 'oklch(0.60 0.15 350)', moon: 0.18 },
  { key: 'restless',  label: 'Restless',  short: 'Unease',  color: 'oklch(0.63 0.13 312)', moon: 0.36 },
  { key: 'hazy',      label: 'Hazy',      short: 'Neutral', color: 'oklch(0.72 0.05 250)', moon: 0.5 },
  { key: 'tender',    label: 'Tender',    short: 'Calm',    color: 'oklch(0.78 0.10 200)', moon: 0.66 },
  { key: 'wondrous',  label: 'Wondrous',  short: 'Awe',     color: 'oklch(0.83 0.12 160)', moon: 0.84 },
  { key: 'blissful',  label: 'Blissful',  short: 'Rapture', color: 'oklch(0.87 0.12 90)',  moon: 1.0 },
];

// shared dark disc behind the moon, ink-text on gold, vignette, etc.
const MOON_DARK = 'oklch(0.12 0.02 268 / 0.9)';   // MoonPhase backing disc
const MOON_PLATE_DARK = 'oklch(0.12 0.02 268)';   // MoonPlate backing disc (opaque)
const ON_GOLD = 'oklch(0.18 0.03 84)';            // text on a gold fill (TagChip active)
const ON_GOLD_BTN = 'oklch(0.17 0.03 84)';        // text on gold button
const VIGNETTE = 'oklch(0.10 0.02 268 / 0.6)';    // starfield vignette edge
const BODY_BG_TOP = 'oklch(0.185 0.03 268)';      // app backdrop radial center
const BODY_BG_BOT = 'oklch(0.095 0.018 268)';     // app backdrop radial edge

// ── build ────────────────────────────────────────────────────────────────────
const editions = {};
for (const [name, p] of Object.entries(EDITIONS_SRC)) {
  const e = {};
  for (const [k, v] of Object.entries(p)) e[k] = hex(v);
  // alpha-derived helpers used across the UI
  e.surface = alphaHex(p.bg1, 0.88);                 // Surface/Plate fill
  e.textareaBg = alphaHex(p.bg1, 0.7);               // record textarea fill
  e.lineHalf = alphaHex(p.line, 0.5);                // progress-bar track
  e.goldTint = alphaHex(p.gold, 0.13);               // filled tag (inactive) bg
  e.inkBorder = alphaHex(p.ink, 0.3);                // distribution bar border
  // moon tints per mood (interpolated in oklch, exactly like color-mix)
  e.moonLit = MOODS_SRC.map((m) => mixHex(p.ink, m.color, 0.64));      // MoonPhase glyph
  e.moonPlateLit = MOODS_SRC.map((m) => mixHex(p.ink, m.color, 0.6));  // MoonPlate hero
  e.moonDark = hex(MOON_DARK);
  e.moonPlateDark = hex(MOON_PLATE_DARK);
  e.onGold = hex(ON_GOLD);
  e.onGoldBtn = hex(ON_GOLD_BTN);
  e.vignette = hex(VIGNETTE);
  e.bodyBgTop = hex(BODY_BG_TOP);
  e.bodyBgBot = hex(BODY_BG_BOT);
  editions[name] = e;
}

const moods = MOODS_SRC.map((m) => ({ ...m, color: hex(m.color), pillTint: alphaHex(m.color, 0.22) }));

// ── emit ─────────────────────────────────────────────────────────────────────
const out = `// AUTO-GENERATED by scripts/gen-tokens.mjs — do not edit by hand.
// OKLCH design tokens converted to static sRGB hex for React Native.

export type EditionName = ${Object.keys(EDITIONS_SRC).map((n) => `'${n}'`).join(' | ')};

export type Palette = {
  bg0: string; bg1: string; bg2: string;
  line: string; lineStrong: string;
  ink: string; mute: string; faint: string;
  accent: string; gold: string; glow: string; star: string;
  surface: string; textareaBg: string; lineHalf: string; goldTint: string; inkBorder: string;
  moonLit: string[]; moonPlateLit: string[];
  moonDark: string; moonPlateDark: string;
  onGold: string; onGoldBtn: string; vignette: string;
  bodyBgTop: string; bodyBgBot: string;
};

export const EDITIONS: Record<EditionName, Palette> = ${JSON.stringify(editions, null, 2)} as const;

export const EDITION_NAMES = ${JSON.stringify(Object.keys(EDITIONS_SRC))} as const;

export type Mood = { key: string; label: string; short: string; color: string; pillTint: string; moon: number };

export const MOODS: Mood[] = ${JSON.stringify(moods, null, 2)};

export const moodOf = (i: number): Mood => MOODS[Math.max(0, Math.min(6, i))];
`;

writeFileSync(new URL('../src/theme/tokens.ts', import.meta.url), out);
console.log('wrote src/theme/tokens.ts');
console.log('Ink & Gold sample:', editions['Ink & Gold'].gold, editions['Ink & Gold'].bg0);
console.log('moonLit[6]:', editions['Ink & Gold'].moonLit[6]);
console.log('mood colors:', moods.map((m) => m.color).join(' '));
