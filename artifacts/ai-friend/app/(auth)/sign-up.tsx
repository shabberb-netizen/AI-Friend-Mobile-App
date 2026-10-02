import { useSignUp } from '@clerk/expo';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const busy = fetchStatus === 'fetching';
  const requiresEmailVerification = signUp.status === 'missing_requirements' && Boolean(signUp.emailAddress);

  const submit = async () => {
    const result = await signUp.password({ emailAddress: email.trim(), password });
    if (result.error) return;
    await signUp.verifications.sendEmailCode();
  };

  const chooseDifferentEmail = async () => {
    const result = await signUp.reset();
    if (result.error) return;
    setEmail('');
    setPassword('');
    setCode('');
  };

  const verify = async () => {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === 'complete') await signUp.finalize({ navigate: () => router.replace('/(tabs)') });
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 34, paddingBottom: 40 }}>
      <View style={styles.brand}><View style={[styles.brandMark, { backgroundColor: colors.primary }]}><Text style={[styles.brandHeart, { color: colors.primaryForeground }]}>♥</Text></View><Text style={[styles.brandName, { color: colors.foreground }]}>AI Friend</Text></View>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR PRIVATE CIRCLE</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{requiresEmailVerification ? 'Verify your email' : 'Create your account'}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Use an account when you want friends, messages, and safety check-ins to sync securely.</Text>
      {requiresEmailVerification ? (
        <>
          <Text style={[styles.sentTo, { color: colors.mutedForeground }]}>
            Enter the code sent to {signUp.emailAddress || 'your email address'}.
          </Text>
          <Text style={[styles.label, { color: colors.foreground }]}>Email verification code</Text>
          <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="Enter your code" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
          {errors.fields.code && <Text style={styles.error}>{errors.fields.code.message}</Text>}
          <AuthButton label="Verify and continue" onPress={verify} disabled={!code || busy} colors={colors} />
          <Pressable onPress={() => signUp.verifications.sendEmailCode()}><Text style={[styles.link, { color: colors.primary }]}>Send me a new code</Text></Pressable>
          <Pressable onPress={() => void chooseDifferentEmail()} accessibilityRole="button" accessibilityLabel="Use a different email address">
            <Text style={[styles.link, styles.changeEmailLink, { color: colors.primary }]}>Use a different email</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>Email address</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
          <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
          {errors.fields.emailAddress && <Text style={styles.error}>{errors.fields.emailAddress.message}</Text>}
          {errors.fields.password && <Text style={styles.error}>{errors.fields.password.message}</Text>}
          <AuthButton label="Create account" onPress={submit} disabled={!email || !password || busy} colors={colors} />
          <View style={styles.switchRow}><Text style={[styles.switchText, { color: colors.mutedForeground }]}>Already have an account? </Text><Link href="/(auth)/sign-in" asChild><Pressable><Text style={[styles.link, { color: colors.primary }]}>Sign in</Text></Pressable></Link></View>
        </>
      )}
      <View nativeID="clerk-captcha" />
    </ScrollView>
  );
}

function AuthButton({ label, onPress, disabled, colors }: { label: string; onPress: () => void; disabled: boolean; colors: ReturnType<typeof useColors> }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, { backgroundColor: disabled ? colors.muted : colors.primary, opacity: pressed ? 0.78 : 1 }]}><Text style={[styles.buttonText, { color: disabled ? colors.mutedForeground : colors.primaryForeground }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 42 },
  brandMark: { width: 35, height: 35, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  brandHeart: { fontSize: 18 },
  brandName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  eyebrow: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 29, lineHeight: 34, fontFamily: 'Inter_700Bold', letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular', marginTop: 10, marginBottom: 27 },
  label: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 7, marginTop: 12 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, fontSize: 14, fontFamily: 'Inter_400Regular' },
  button: { minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  error: { color: '#FF8D9A', fontSize: 11, lineHeight: 16, marginTop: 8, fontFamily: 'Inter_500Medium' },
  sentTo: { fontSize: 12, lineHeight: 17, marginTop: 10, fontFamily: 'Inter_400Regular' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  switchText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  link: { fontSize: 12, fontFamily: 'Inter_700Bold', textAlign: 'center', marginTop: 18 },
  changeEmailLink: { marginTop: 14 },
});