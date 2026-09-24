import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const sunlit = require('@/assets/images/story-sunlit-room.jpg');
const blueHour = require('@/assets/images/story-blue-hour.jpg');

type CreateType = 'Image' | 'Video' | 'Story';
const actions = [
  { label: 'Change outfit', icon: 'user' as const },
  { label: 'Edit background', icon: 'image' as const },
  { label: 'Adjust measurements', icon: 'maximize-2' as const },
  { label: 'Design clothing', icon: 'edit-3' as const },
];

export default function CreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings } = useApp();
  const [type, setType] = useState<CreateType>('Image');
  const [prompt, setPrompt] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>CREATIVE STUDIO</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Make something new</Text>
        </View>
        <View style={[styles.modeIcon, { backgroundColor: settings.mode === 'offline' ? colors.mint : colors.coralSoft }]}>
          <Feather name={settings.mode === 'offline' ? 'shield' : 'cloud'} size={18} color={settings.mode === 'offline' ? colors.mintText : colors.primary} />
        </View>
      </View>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create images, 10-second videos, and small stories from a thought.</Text>

      <View style={[styles.typePicker, { backgroundColor: colors.secondary }]}>
        {(['Image', 'Video', 'Story'] as CreateType[]).map((item) => (
          <Pressable key={item} onPress={() => setType(item)} style={[styles.typeButton, type === item && { backgroundColor: colors.card }]}>
            <Text style={[styles.typeText, { color: type === item ? colors.foreground : colors.mutedForeground }]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DESCRIBE YOUR IDEA</Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder={type === 'Image' ? 'A quiet room, morning light, new clothes...' : type === 'Video' ? 'A 10-second moment that feels like...' : 'A short story about...'}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.promptInput, { color: colors.foreground }]}
          multiline
        />
        <View style={styles.promptFooter}>
          <Text style={[styles.localNote, { color: colors.mutedForeground }]}>
            {settings.mode === 'offline' ? 'Preview saved on this device' : 'Online generation enabled'}
          </Text>
          <Pressable onPress={() => setPrompt((current) => current || 'A hopeful new beginning in warm light')} style={({ pressed }) => [styles.inspireButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}>
            <Feather name="zap" size={14} color={colors.secondaryForeground} />
            <Text style={[styles.inspireText, { color: colors.secondaryForeground }]}>Inspire me</Text>
          </Pressable>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick edits</Text>
      <View style={styles.actionGrid}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => setSelectedAction(action.label)}
            style={({ pressed }) => [styles.action, { backgroundColor: selectedAction === action.label ? colors.accent : colors.card, borderColor: selectedAction === action.label ? colors.violet : colors.border, opacity: pressed ? 0.78 : 1 }]}
          >
            <Feather name={action.icon} size={17} color={selectedAction === action.label ? colors.accentForeground : colors.indigoSoft} />
            <Text style={[styles.actionText, { color: selectedAction === action.label ? colors.accentForeground : colors.foreground }]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => setSelectedAction('Rendering')} style={({ pressed }) => [styles.createButton, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}>
        <Feather name="star" size={18} color={colors.primaryForeground} />
        <Text style={[styles.createButtonText, { color: colors.primaryForeground }]}>Create {type.toLowerCase()}</Text>
        <Feather name="arrow-up-right" size={17} color={colors.primaryForeground} />
      </Pressable>

      <View style={styles.recentHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent ideas</Text>
        <Text style={[styles.recentHint, { color: colors.mutedForeground }]}>Your private gallery</Text>
      </View>
      <View style={styles.gallery}>
        <GalleryCard source={sunlit} label="Soft morning" colors={colors} />
        <GalleryCard source={blueHour} label="Blue hour" colors={colors} />
      </View>
    </ScrollView>
  );
}

function GalleryCard({ source, label, colors }: { source: number; label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.galleryCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Image source={source} style={styles.galleryImage} contentFit="cover" transition={250} />
      <View style={styles.galleryCaption}>
        <Text style={[styles.galleryLabel, { color: colors.foreground }]}>{label}</Text>
        <Feather name="more-horizontal" size={17} color={colors.mutedForeground} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22 },
  eyebrow: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, marginBottom: 7 },
  title: { fontSize: 25, fontFamily: 'Inter_700Bold', letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular', marginHorizontal: 22, marginTop: 9, maxWidth: 320 },
  modeIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  typePicker: { marginHorizontal: 22, marginTop: 22, borderRadius: 16, padding: 4, flexDirection: 'row' },
  typeButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 13 },
  typeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  promptCard: { marginHorizontal: 22, marginTop: 14, borderRadius: 22, borderWidth: 1, padding: 16 },
  fieldLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, marginBottom: 10 },
  promptInput: { minHeight: 80, fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular', textAlignVertical: 'top' },
  promptFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  localNote: { fontSize: 10, fontFamily: 'Inter_500Medium', flex: 1 },
  inspireButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
  inspireText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', letterSpacing: -0.3, marginHorizontal: 22, marginTop: 25, marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingHorizontal: 22 },
  action: { width: '48%', minHeight: 52, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12 },
  actionText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', flex: 1 },
  createButton: { marginHorizontal: 22, marginTop: 17, paddingVertical: 15, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  createButtonText: { fontSize: 13, fontFamily: 'Inter_700Bold', flex: 1 },
  recentHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginRight: 22 },
  recentHint: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  gallery: { flexDirection: 'row', gap: 10, paddingHorizontal: 22 },
  galleryCard: { flex: 1, borderRadius: 18, overflow: 'hidden', borderWidth: 1 },
  galleryImage: { width: '100%', height: 154 },
  galleryCaption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, paddingVertical: 10 },
  galleryLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});