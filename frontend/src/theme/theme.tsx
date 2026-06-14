// theme.tsx — resolved design tokens (colors + fonts + prototype "tweaks") via context.
// Defaults follow the handoff's production decision: Ink & Gold + Marcellus + moons + outline.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { EDITIONS, type EditionName, type Palette } from './tokens';

export type ScaleStyle = 'moons' | 'orbs' | 'pills';
export type TagStyle = 'outline' | 'filled' | 'plain';

// Loaded font family keys (see _layout useFonts). Marcellus is a single weight;
// Spectral italic / semibold are registered as their own families for RN.
export const FONTS = {
  display: 'Marcellus',
  body: 'Spectral',
  italic: 'SpectralItalic',
  medium: 'SpectralMedium',
  semibold: 'SpectralSemiBold',
  semiItalic: 'SpectralSemiBoldItalic',
} as const;

// Marcellus display tracking ≈ 0.04em — RN letterSpacing is absolute, so callers
// use `size * DISP_TRACK`.
export const DISP_TRACK = 0.04;

export type Theme = {
  c: Palette;
  fonts: typeof FONTS;
  dispTrack: number;
  edition: EditionName;
  scaleStyle: ScaleStyle;
  tagStyle: TagStyle;
  setEdition: (e: EditionName) => void;
  setScaleStyle: (s: ScaleStyle) => void;
  setTagStyle: (t: TagStyle) => void;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [edition, setEdition] = useState<EditionName>('Ink & Gold');
  const [scaleStyle, setScaleStyle] = useState<ScaleStyle>('moons');
  const [tagStyle, setTagStyle] = useState<TagStyle>('outline');

  const value = useMemo<Theme>(
    () => ({
      c: EDITIONS[edition],
      fonts: FONTS,
      dispTrack: DISP_TRACK,
      edition,
      scaleStyle,
      tagStyle,
      setEdition,
      setScaleStyle,
      setTagStyle,
    }),
    [edition, scaleStyle, tagStyle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme must be used within ThemeProvider');
  return t;
}
