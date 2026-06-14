// moon.tsx — the signature moon-dial. MoonPhase (glyph) + MoonPlate (astrolabe hero).
// Geometry ported verbatim from dream-ui.jsx: accurate lunar terminator.
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { MOODS, moodOf } from '@/data/dreams';
import { useTheme } from '@/theme/theme';

function terminatorPath(r: number, f: number): string {
  const x = r * Math.cos(Math.PI * f);
  const sweep = x > 0 ? 0 : 1;
  return `M0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${Math.abs(x).toFixed(2)} ${r} 0 0 ${sweep} 0 ${-r} Z`;
}

type PhaseProps = {
  /** mood index 0–6 — preferred; sets both phase fraction and lit colour */
  mood?: number;
  /** explicit phase fraction (used by MoodScale's 7 glyphs) */
  f?: number;
  /** explicit lit colour override */
  lit?: string;
  size?: number;
  rim?: string;
};

export function MoonPhase({ mood, f, lit, size = 28, rim }: PhaseProps) {
  const { c } = useTheme();
  const r = size / 2 - 1;
  const frac = f ?? (mood != null ? MOODS[mood].moon : 0);
  const litColor = lit ?? (mood != null ? c.moonLit[mood] : c.ink);
  return (
    <Svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}>
      <Circle cx={0} cy={0} r={r} fill={c.moonDark} />
      {frac > 0.01 && <Path d={terminatorPath(r, frac)} fill={litColor} />}
      <Circle cx={0} cy={0} r={r} fill="none" stroke={rim ?? c.lineStrong} strokeWidth={1} />
    </Svg>
  );
}

type PlateProps = {
  mood: number;
  size?: number;
  ticks?: number;
};

export function MoonPlate({ mood, size = 132, ticks = 48 }: PlateProps) {
  const { c } = useTheme();
  const m = moodOf(mood);
  const R = size / 2;
  const ring = R - 2;
  const inner = R - 16;
  const r = inner - 2;

  return (
    <Svg width={size} height={size} viewBox={`${-R} ${-R} ${size} ${size}`}>
      <Circle r={ring} fill="none" stroke={c.line} strokeWidth={1} />
      <Circle r={ring - 8.5} fill="none" stroke={c.line} strokeWidth={0.6} opacity={0.6} />
      {Array.from({ length: ticks }, (_, i) => {
        const a = (i / ticks) * Math.PI * 2;
        const major = i % 4 === 0;
        const o = ring;
        const ii = ring - (major ? 6 : 3);
        return (
          <Line
            key={i}
            x1={Math.cos(a) * ii}
            y1={Math.sin(a) * ii}
            x2={Math.cos(a) * o}
            y2={Math.sin(a) * o}
            stroke={c.line}
            strokeWidth={major ? 1 : 0.6}
            opacity={major ? 0.9 : 0.55}
          />
        );
      })}
      <G>
        <Circle r={r} fill={c.moonPlateDark} />
        {m.moon > 0.01 && <Path d={terminatorPath(r, m.moon)} fill={c.moonPlateLit[mood]} />}
        <Circle r={r} fill="none" stroke={c.lineStrong} strokeWidth={1} />
      </G>
    </Svg>
  );
}
