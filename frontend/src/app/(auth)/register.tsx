// Register — create an account, then confirm the emailed code. Confirming with a
// known password signs you straight in; arriving here to confirm an existing
// account (from sign-in) returns you to sign-in afterwards.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { authErrorMessage } from '@/auth/errors';
import { Btn, CatalogLabel, Field, Fleuron, Screen } from '@/components/almanac';
import { moodOf } from '@/data/dreams';
import { useTheme } from '@/theme/theme';

export default function RegisterScreen() {
  const { c, fonts, dispTrack } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp, confirmSignUp, resendCode, signIn } = useAuth();
  const params = useLocalSearchParams<{ email?: string; step?: string }>();

  const [phase, setPhase] = useState<'form' | 'confirm'>(params.step === 'confirm' ? 'confirm' : 'form');
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSignUp = async () => {
    setBusy(true);
    setError(null);
    try {
      await signUp(email, password);
      setPhase('confirm');
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await confirmSignUp(email, code);
    } catch (e) {
      setError(authErrorMessage(e)); // bad/expired code — let them retry on this screen
      setBusy(false);
      return;
    }
    // Confirmed. Auto sign-in when we still hold the password, else go sign in.
    // A failure HERE must not strand the user on confirm — the account is already
    // confirmed, so re-confirming would error ("status CONFIRMED"). Fall through to
    // sign-in instead, where they can simply enter their credentials.
    try {
      if (password) await signIn(email, password); // navigator redirects on success
      else router.replace('/sign-in');
    } catch {
      router.replace('/sign-in');
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
            {phase === 'form' ? 'A new dreamer' : 'Confirm your account'}
          </CatalogLabel>
          <Text style={{ fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: c.ink, letterSpacing: 40 * dispTrack, textAlign: 'center' }}>
            {phase === 'form' ? 'Begin a register' : 'Check your email'}
          </Text>
          <Text style={{ fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 15, color: c.mute, marginTop: 8, textAlign: 'center' }}>
            {phase === 'form' ? 'where your nights are kept' : `a code was sent to ${email}`}
          </Text>
          <View style={{ marginTop: 18 }}>
            <Fleuron width={54} />
          </View>
        </View>

        {phase === 'form' ? (
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
            <Field
              label="Choose a password"
              value={password}
              onChangeText={setPassword}
              placeholder="at least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />
            {errorText}
            <Btn label={busy ? 'Registering…' : 'Register me'} onPress={startSignUp} disabled={busy || !email.trim() || !password} style={{ marginTop: 6 }} />
          </>
        ) : (
          <>
            <Field
              label="Confirmation code"
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="number-pad"
              autoComplete="one-time-code"
            />
            {errorText}
            <Btn label={busy ? 'Confirming…' : 'Confirm'} onPress={confirm} disabled={busy || !code.trim()} style={{ marginTop: 6 }} />
            <Pressable onPress={() => resendCode(email).catch(() => {})} style={{ marginTop: 24, alignItems: 'center' }}>
              <CatalogLabel tiny>Send a new code</CatalogLabel>
            </Pressable>
          </>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 28 }}>
          <Text style={{ fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 14, color: c.mute }}>Already keep a register?</Text>
          <Pressable onPress={() => router.replace('/sign-in')}>
            <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: c.gold, letterSpacing: 1 }}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
