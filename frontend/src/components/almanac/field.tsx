// field.tsx — almanac labeled input: small-caps gold label over an underline input.
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme/theme';
import { CatalogLabel } from './primitives';

export function Field({ label, style, ...props }: { label: string } & TextInputProps) {
  const { c, fonts } = useTheme();
  return (
    <View style={{ marginBottom: 18 }}>
      <CatalogLabel gold tiny style={{ marginBottom: 8 }}>
        {label}
      </CatalogLabel>
      <TextInput
        placeholderTextColor={c.faint}
        style={[
          { height: 44, borderBottomWidth: 1, borderColor: c.line, color: c.ink, fontFamily: fonts.body, fontSize: 17 },
          style,
        ]}
        {...props}
      />
    </View>
  );
}
