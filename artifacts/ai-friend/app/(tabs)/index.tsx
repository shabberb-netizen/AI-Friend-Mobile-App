import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const storySunlit = require('@/assets/images/story-sunlit-room.jpg');

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, toggleMode } = useApp();
  const isOffline = settings.mode === 'offline';

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>THURSDAY, SEPTEMBER 24</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Good morning, Sam</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.accentForeground }]}>S</Text>
        </View>
      </View>

      <Pressable onPress={toggleMode} style={({ pressed }) => [styles.modePill, { backgroundColor: isOffline ? colors.mint : colors.coralSoft, opacity: pressed ? 0.86 : 1 }]}>
        <Feather name={isOffline ? 'shield' : 'wifi'} size={15} color={isOffline ? colors.mintText : colors.primary} />
        <Text style={[styles.modeText, { color: isOffline ? colors.mintText : colors.primary }]}>
          {isOffline ? 'Offline mode · private by default' : 'Online mode · cloud intelligence on'}
        </Text>
        <Feather name="chevron-right" size={15} color={isOffline ? colors.mintText : colors.primary} />
      </Pressable>

      <LinearGradient colors={[colors.indigo, colors.indigoSoft]} style={[styles.hero, { borderColor: colors.border }]}>
        <View style={styles.heroCopy}>
          <View style={styles.liveDot}>
            <View style={[styles.liveDotInner, { backgroundColor: colors.primary }]} />
            <Text style={[styles.liveText, { color: colors.primary }]}>READY WHEN YOU ARE</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>What’s on your mind?</Text>
          <Text style={[styles.heroBody, { color: colors.accentForeground }]}>Talk, plan, learn, or make something together.</Text>
          <Pressable
            onPress={() => router.push('/chat')}
            style={({ pressed }) => [styles.talkButton, { backgroundColor: colors.primary, opacity: pressed ? 0.84 : 1 }]}
          >
            <Feather name="message-circle" size={17} color={colors.primaryForeground} />
            <Text style={[styles.talkButtonText, { color: colors.primaryForeground }]}>Start a conversation</Text>
          </Pressable>
        </View>
        <SpatialOrb colors={colors} />
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your shortcuts</Text>
        <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>Make today lighter</Text>
      </View>
      <View style={styles.shortcutGrid}>
        <Shortcut icon="book-open" title="Study with me" subtitle="Learn anything" color={colors.violet} onPress={() => router.push('/chat')} colors={colors} />
        <Shortcut icon="aperture" title="Make an image" subtitle="Create or edit" color={colors.primary} onPress={() => router.push('/create')} colors={colors} />
        <Shortcut icon="headphones" title="Voice & earbuds" subtitle="Hands-free mode" color={colors.indigoSoft} onPress={() => router.push('/settings')} colors={colors} />
        <Shortcut icon="map-pin" title="Private check-ins" subtitle="Only if you choose" color={colors.mintText} onPress={() => router.push('/settings')} colors={colors} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Continue creating</Text>
        <Pressable onPress={() => router.push('/create')}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>Open studio</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => router.push('/create')} style={({ pressed }) => [styles.storyCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.92 : 1, transform: [{ perspective: 900 }, { rotateX: '5deg' }, { rotateY: '-2deg' }] }]}>
        <Image source={storySunlit} style={styles.storyImage} contentFit="cover" transition={250} />
        <View style={styles.storyOverlay}>
          <Text style={[styles.storyLabel, { color: colors.primary }]}>STORY DRAFT</Text>
          <Text style={[styles.storyTitle, { color: colors.foreground }]}>A softer way to begin again</Text>
          <View style={styles.storyMeta}>
            <Feather name="clock" size={13} color={colors.foreground} />
            <Text style={[styles.storyMetaText, { color: colors.foreground }]}>2 min read · Saved on device</Text>
          </View>
        </View>
      </Pressable>

      <View style={[styles.boundaryCard, { backgroundColor: colors.secondary }]}>
        <View style={[styles.boundaryIcon, { backgroundColor: colors.accent }]}>
          <Feather name="lock" size={16} color={colors.accentForeground} />
        </View>
        <View style={styles.boundaryCopy}>
          <Text style={[styles.boundaryTitle, { color: colors.foreground }]}>Your boundaries are on</Text>
          <Text style={[styles.boundaryBody, { color: colors.secondaryForeground }]}>Location, voice, and email check-ins stay off until you choose them.</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
    </ScrollView>
  );
}

function Shortcut({ icon, title, subtitle, color, onPress, colors }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; subtitle: string; color: string; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.shortcut, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.82 : 1, transform: [{ perspective: 650 }, { rotateX: '7deg' }, { rotateY: title === 'Make an image' || title === 'Private check-ins' ? '-5deg' : '5deg' }] }]}>
      <View style={[styles.shortcutIcon, { backgroundColor: color + '18' }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.shortcutTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.shortcutSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
    </Pressable>
  );
}

function SpatialOrb({ colors }: { colors: ReturnType<typeof useColors> }) {
  const spin = useRef<Animated.Value>(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ).start();
  }, [spin]);

  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '10deg'] });
  return (
    <View style={styles.orbStage}>
      <Animated.View style={[styles.orbRingBack, { borderColor: colors.violet, transform: [{ perspective: 600 }, { rotateX: '62deg' }, { rotateZ: rotation }] }]} />
      <Animated.View style={[styles.orbRingFront, { borderColor: colors.primary, transform: [{ perspective: 600 }, { rotateY: '68deg' }, { rotateZ: rotation }] }]} />
      <View style={[styles.orbGlow, { backgroundColor: colors.primary }]} />
      <View style={[styles.orbCore, { backgroundColor: colors.primary }]}>
        <Feather name="heart" size={30} color={colors.primaryForeground} />
      </View>
      <View style={[styles.orbParticle, styles.particleOne, { backgroundColor: colors.violet }]} />
      <View style={[styles.orbParticle, styles.particleTwo, { backgroundColor: colors.coralSoft }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, marginBottom: 18 },
  eyebrow: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.3, marginBottom: 7 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.6 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  modePill: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 22, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 15, gap: 7, marginBottom: 16 },
  modeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', flex: 1 },
  hero: { marginHorizontal: 22, borderRadius: 28, minHeight: 220, padding: 22, overflow: 'hidden', flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, shadowColor: '#000000', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
  heroCopy: { flex: 1, zIndex: 2 },
  liveDot: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 16 },
  liveDotInner: { width: 7, height: 7, borderRadius: 5 },
  liveText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.4 },
  heroTitle: { fontSize: 28, lineHeight: 32, fontFamily: 'Inter_700Bold', letterSpacing: -0.8, maxWidth: 210 },
  heroBody: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular', maxWidth: 200, marginTop: 9 },
  talkButton: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 11, paddingHorizontal: 15, borderRadius: 16, marginTop: 19 },
  talkButtonText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  orbStage: { width: 110, height: 142, alignItems: 'center', justifyContent: 'center', marginTop: 24, marginRight: -8 },
  orbRingBack: { position: 'absolute', width: 99, height: 53, borderRadius: 60, borderWidth: 1 },
  orbRingFront: { position: 'absolute', width: 76, height: 112, borderRadius: 60, borderWidth: 1 },
  orbGlow: { position: 'absolute', width: 82, height: 82, borderRadius: 45, opacity: 0.14, transform: [{ scale: 1.4 }] },
  orbCore: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#FF765D', shadowOpacity: 0.65, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  orbParticle: { position: 'absolute', width: 7, height: 7, borderRadius: 5 },
  particleOne: { top: 22, right: 10 },
  particleTwo: { bottom: 20, left: 7 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginHorizontal: 22, marginTop: 28, marginBottom: 13 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  sectionHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  seeAll: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 22 },
  shortcut: { width: '48%', minHeight: 118, borderWidth: 1, borderRadius: 20, padding: 14, shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  shortcutIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  shortcutTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  shortcutSubtitle: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  storyCard: { height: 186, borderRadius: 23, overflow: 'hidden', borderWidth: 1, marginHorizontal: 22, position: 'relative', shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  storyImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  storyOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'flex-end', padding: 18, backgroundColor: 'rgba(23, 21, 44, 0.34)' },
  storyLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.4, marginBottom: 7 },
  storyTitle: { fontSize: 22, lineHeight: 27, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, maxWidth: 290 },
  storyMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  storyMetaText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  boundaryCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 20, padding: 14, marginHorizontal: 22, marginTop: 18 },
  boundaryIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  boundaryCopy: { flex: 1 },
  boundaryTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  boundaryBody: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
});