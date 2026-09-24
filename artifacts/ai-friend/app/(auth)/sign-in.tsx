import { useSignIn } from '@clerk/expo';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, errors, fetchStatus } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const busy = fetchStatus === 'fetching';

  const submit = async () => {
    const result = await signIn.password({ emailAddress: email.trim(), password });
    if (result.error) return;
    if (signIn.status === 'complete') {
      await signIn.finalize({ navigate: () => router.replace('/(tabs)') });
    } else if (signIn.status === 'needs_client_trust') {
      const factor = signIn.supportedSecondFactors.find((item) => item.strategy === 'email_code');
      if (factor) await signIn.mfa.sendEmailCode();
    }
  };

  const verify = async () => {
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === 'complete') await signIn.finalize({ navigate: () => router.replace('/(tabs)') });
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 34, paddingBottom: 40 }}>
      <View style={styles.brand}><View style={[styles.brandMark, { backgroundColor: colors.primary }]}><Text style={[styles.brandHeart, { color: colors.primaryForeground }]}>♥</Text></View><Text style={[styles.brandName, { color: colors.foreground }]}>AI Friend</Text></View>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>WELCOME BACK</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{signIn.status === 'needs_client_trust' ? 'Verify your account' : 'Sign in to your circle'}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Secure accounts let your trusted friends and conversations follow you between devices.</Text>
      {signIn.status === 'needs_client_trust' ? (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>Email verification code</Text>
          <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="Enter your code" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
          <AuthButton label="Verify account" onPress={verify} disabled={!code || busy} colors={colors} />
          <Pressable onPress={() => signIn.mfa.sendEmailCode()}><Text style={[styles.link, { color: colors.primary }]}>Send me a new code</Text></Pressable>
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>Email address</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
          <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
          {errors.fields.identifier && <Text style={styles.error}>{errors.fields.identifier.message}</Text>}
          {errors.fields.password && <Text style={styles.error}>{errors.fields.password.message}</Text>}
          <AuthButton label="Continue" onPress={submit} disabled={!email || !password || busy} colors={colors} />
          <View style={styles.switchRow}><Text style={[styles.switchText, { color: colors.mutedForeground }]}>New here? </Text><Link href="/(auth)/sign-up" asChild><Pressable><Text style={[styles.link, { color: colors.primary }]}>Create an account</Text></Pressable></Link></View>
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
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  switchText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  link: { fontSize: 12, fontFamily: 'Inter_700Bold', textAlign: 'center', marginTop: 18 },
});