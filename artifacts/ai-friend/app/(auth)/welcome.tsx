import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIntroGate } from '@/context/IntroGateContext';
import { useColors } from '@/hooks/useColors';

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeIntro } = useIntroGate();
  const [muted, setMuted] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const player = useVideoPlayer(require('../../assets/ai-friend-intro.mp4'), (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  useEffect(() => {
    const subscription = player.addListener('statusChange', ({ status }) => {
      setVideoReady(status === 'readyToPlay');
    });
    if (player.status === 'readyToPlay') setVideoReady(true);
    return () => subscription.remove();
  }, [player]);

  const continueTo = async (path: '/(auth)/sign-up' | '/(auth)/sign-in') => {
    if (leaving) return;
    setLeaving(true);
    await completeIntro();
    router.replace(path);
  };

  const toggleSound = () => {
    const nextMuted = !muted;
    player.muted = nextMuted;
    setMuted(nextMuted);
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 18, paddingBottom: Math.max(insets.bottom, 22) },
      ]}
      bounces={false}
    >
      <View style={styles.brandRow}>
        <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
          <Feather name="heart" size={17} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.brandName, { color: colors.foreground }]}>AI Friend</Text>
      </View>

      <View style={[styles.videoFrame, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {!videoReady ? (
          <Image
            source={require('../../assets/ai-friend-intro-poster.jpg')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessibilityLabel="AI Friend logo from the introduction video"
          />
        ) : (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
            accessibilityLabel="AI Friend animated introduction"
            testID="welcome-video"
          />
        )}
        <Pressable
          onPress={toggleSound}
          accessibilityRole="button"
          accessibilityLabel={muted ? 'Turn intro sound on' : 'Mute intro sound'}
          testID="welcome-toggle-sound"
          style={({ pressed }) => [styles.soundButton, { backgroundColor: colors.background, opacity: pressed ? 0.72 : 0.94 }]}
        >
          <Feather name={muted ? 'volume-x' : 'volume-2'} size={17} color={colors.foreground} />
        </Pressable>
      </View>

      <Text style={[styles.eyebrow, { color: colors.primary }]}>A PRIVATE SPACE TO TALK</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Meet your AI Friend</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Supportive conversations, trusted friends, and creative tools—all in one place.
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={() => void continueTo('/(auth)/sign-up')}
          disabled={leaving}
          accessibilityRole="button"
          testID="welcome-create-account"
          style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed || leaving ? 0.78 : 1 }]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Create an account</Text>
          <Feather name="arrow-right" size={17} color={colors.primaryForeground} />
        </Pressable>
        <Pressable
          onPress={() => void continueTo('/(auth)/sign-in')}
          disabled={leaving}
          accessibilityRole="button"
          testID="welcome-sign-in"
          style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.border, opacity: pressed || leaving ? 0.72 : 1 }]}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>I already have an account</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 26 },
  brandMark: { width: 35, height: 35, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  videoFrame: { width: '100%', aspectRatio: 16 / 9, borderRadius: 21, borderWidth: 1, overflow: 'hidden', marginBottom: 25 },
  soundButton: { position: 'absolute', top: 11, right: 11, width: 38, height: 38, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold', letterSpacing: -0.6 },
  subtitle: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular', marginTop: 9, maxWidth: 330 },
  actions: { marginTop: 'auto', paddingTop: 34, gap: 10 },
  primaryButton: { minHeight: 52, borderRadius: 17, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButtonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  secondaryButton: { minHeight: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});