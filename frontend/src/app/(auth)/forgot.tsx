// Forgot password — request a reset code, then set a new password.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { authErrorMessage } from '@/auth/errors';
import { Btn, CatalogLabel, Field, Fleuron, Screen } from '@/components/almanac';
import { moodOf } from '@/data/dreams';
import { useTheme } from '@/theme/theme';

export default function ForgotScreen() {
  const { c, fonts, dispTrack } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { forgotPassword, confirmForgotPassword } = useAuth();

  const [phase, setPhase] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async () => {
    setBusy(true);
    setError(null);
    try {
      await forgotPassword(email);
      setPhase('reset');
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      await confirmForgotPassword(email, code, password);
      router.replace('/sign-in');
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const errorText = error && (
    <Text style={{ color: moodOf(0).color, fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 13.5, textAlign: 'center', marginBottom: 14 }}>
      {error}
    </Text>
  );

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 44, paddingHorizontal: 30, paddingBottom: 60 }}>
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <CatalogLabel gold style={{ marginBottom: 14 }}>
            A forgotten password
          </CatalogLabel>
          <Text style={{ fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: c.ink, letterSpacing: 40 * dispTrack, textAlign: 'center' }}>
            {phase === 'request' ? 'Recover your way' : 'Set a new password'}
          </Text>
          <Text style={{ fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 15, color: c.mute, marginTop: 8, textAlign: 'center' }}>
            {phase === 'request' ? 'we will send a code to your email' : `a code was sent to ${email}`}
          </Text>
          <View style={{ marginTop: 18 }}>
            <Fleuron width={54} />
          </View>
        </View>

        {phase === 'request' ? (
          <>
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
            {errorText}
            <Btn label={busy ? 'Sending…' : 'Send a code'} onPress={request} disabled={busy || !email.trim()} style={{ marginTop: 6 }} />
          </>
        ) : (
          <>
            <Field label="Confirmation code" value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" autoComplete="one-time-code" />
            <Field
              label="New password"
              value={password}
              onChangeText={setPassword}
              placeholder="at least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />
            {errorText}
            <Btn label={busy ? 'Resetting…' : 'Reset my password'} onPress={reset} disabled={busy || !code.trim() || !password} style={{ marginTop: 6 }} />
          </>
        )}

        <Pressable onPress={() => router.replace('/sign-in')} style={{ marginTop: 26, alignItems: 'center' }}>
          <CatalogLabel tiny>Back to sign in</CatalogLabel>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
