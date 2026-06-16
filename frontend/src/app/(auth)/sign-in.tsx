// Sign in — email/password against the live Cognito. Social arrives later.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { authErrorMessage, isUnconfirmed } from '@/auth/errors';
import { Btn, CatalogLabel, Field, Fleuron, Screen } from '@/components/almanac';
import { moodOf } from '@/data/dreams';
import { useTheme } from '@/theme/theme';

export default function SignInScreen() {
  const { c, fonts, dispTrack } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, resendCode } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      // the root navigator redirects to the register once signed in
    } catch (e) {
      if (isUnconfirmed(e)) {
        await resendCode(email).catch(() => {});
        router.push(`/register?email=${encodeURIComponent(email.trim())}&step=confirm`);
        return;
      }
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 44, paddingHorizontal: 30, paddingBottom: 60 }}>
        <View style={{ alignItems: 'center', marginBottom: 34 }}>
          <CatalogLabel gold style={{ marginBottom: 16 }}>
            The Somnial Register
          </CatalogLabel>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={{ alignSelf: 'stretch', textAlign: 'center', fontFamily: fonts.display, fontSize: 46, lineHeight: 54, color: c.ink, letterSpacing: 46 * dispTrack }}>
            Dream Catcher
          </Text>
          <View style={{ marginTop: 20 }}>
            <Fleuron width={54} />
          </View>
        </View>

        <Field
          label="Your email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
        />
        <Field
          label="Your password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
        />

        {error && (
          <Text style={{ color: moodOf(0).color, fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 13.5, textAlign: 'center', marginBottom: 14 }}>
            {error}
          </Text>
        )}

        <Btn
          label={busy ? 'Entering…' : 'Enter the register'}
          onPress={submit}
          disabled={busy || !email.trim() || !password}
          style={{ marginTop: 6 }}
        />

        <Pressable onPress={() => router.push('/forgot')} style={{ marginTop: 24, alignItems: 'center' }}>
          <CatalogLabel tiny>Forgotten your password?</CatalogLabel>
        </Pressable>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 28 }}>
          <Text style={{ fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 14, color: c.mute }}>New to the register?</Text>
          <Pressable onPress={() => router.push('/register')}>
            <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: c.gold, letterSpacing: 1 }}>Register an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
