// icon.tsx — inline SVG icon set (1.4–1.6px stroke, currentColor), ported from dream-ui.jsx.
import Svg, { Circle, Line, Path, Rect, type SvgProps } from 'react-native-svg';

export type IconName =
  | 'register' | 'symbols' | 'star' | 'chart' | 'quill' | 'moon'
  | 'chevright' | 'back' | 'close' | 'search' | 'check' | 'plus' | 'arrowright';

type Props = {
  name: IconName;
  size?: number;
  stroke?: number;
  color?: string;
  style?: SvgProps['style'];
};

export function Icon({ name, size = 22, stroke = 1.5, color = 'currentColor', style }: Props) {
  const p = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {name === 'register' && (
        <>
          <Rect x={4.5} y={3.5} width={15} height={17} rx={0.5} {...p} />
          <Path d="M8 8h8M8 12h8M8 16h5" {...p} />
        </>
      )}
      {(name === 'symbols' || name === 'star') && (
        <Path d="M12 3l2.2 5.6L20 9.2l-4.4 3.7L17 19l-5-3.3L7 19l1.4-6.1L4 9.2l5.8-.6L12 3z" {...p} />
      )}
      {name === 'chart' && (
        <>
          <Path d="M4 20V4M20 20H4" {...p} />
          <Path d="M7 16l3.5-4 3 2.5L20 7" {...p} />
        </>
      )}
      {name === 'quill' && (
        <>
          <Path d="M20 4C12 5 7 10 5 19l3-3c1 0 8-1 11-8 1.5-3 1-4 1-4z" {...p} />
          <Path d="M5 19l5-5" {...p} />
        </>
      )}
      {name === 'moon' && <Path d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 0010.5 10.5z" {...p} />}
      {name === 'chevright' && <Path d="M9 5l7 7-7 7" {...p} />}
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...p} />}
      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={6.5} {...p} />
          <Path d="M20 20l-4-4" {...p} />
        </>
      )}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7" {...p} />}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...p} />}
      {name === 'arrowright' && <Path d="M4 12h15M13 6l6 6-6 6" {...p} />}
    </Svg>
  );
}
