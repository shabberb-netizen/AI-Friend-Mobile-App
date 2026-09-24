import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GalleryAsset, useApp } from '@/context/AppContext';
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
  const { settings, gallery, createAsset, saveAsset, isGenerating, generationError } = useApp();
  const [type, setType] = useState<CreateType>('Image');
  const [prompt, setPrompt] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [result, setResult] = useState<GalleryAsset | null>(null);
  const [saved, setSaved] = useState<boolean>(false);

  const submit = async () => {
    if (!prompt.trim() || isGenerating) return;
    setResult(null);
    setSaved(false);
    const asset = await createAsset({
      type: type.toLowerCase() as 'image' | 'video' | 'story',
      prompt,
      action: selectedAction ?? undefined,
    });
    if (asset) setResult(asset);
  };

  const saveResult = async () => {
    if (!result) return;
    await saveAsset(result);
    setSaved(true);
  };

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
            {settings.mode === 'offline' ? 'On-device preview · stays private' : 'Online generation only after you choose Online mode'}
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
            style={({ pressed }) => [styles.action, { backgroundColor: selectedAction === action.label ? colors.accent : colors.card, borderColor: selectedAction === action.label ? colors.violet : colors.border, opacity: pressed ? 0.78 : 1, transform: [{ perspective: 650 }, { rotateX: '8deg' }, { rotateY: action.label === 'Edit background' || action.label === 'Design clothing' ? '-4deg' : '4deg' }] }]}
          >
            <Feather name={action.icon} size={17} color={selectedAction === action.label ? colors.accentForeground : colors.indigoSoft} />
            <Text style={[styles.actionText, { color: selectedAction === action.label ? colors.accentForeground : colors.foreground }]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable disabled={isGenerating || !prompt.trim()} onPress={() => void submit()} style={({ pressed }) => [styles.createButton, { backgroundColor: colors.primary, opacity: isGenerating || !prompt.trim() ? 0.5 : pressed ? 0.82 : 1 }]}>
        <Feather name={isGenerating ? 'loader' : 'star'} size={18} color={colors.primaryForeground} />
        <Text style={[styles.createButtonText, { color: colors.primaryForeground }]}>{isGenerating ? `Creating ${type.toLowerCase()}…` : `Create ${type.toLowerCase()}`}</Text>
        <Feather name="arrow-up-right" size={17} color={colors.primaryForeground} />
      </Pressable>
      {generationError && (
        <View style={[styles.statusCard, { backgroundColor: colors.coralSoft }]}>
          <Feather name="alert-circle" size={16} color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.foreground }]}>{generationError}</Text>
        </View>
      )}
      {result && (
        <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.resultHeader}>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CREATED</Text>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>{result.title}</Text>
            </View>
            <Text style={[styles.resultProvider, { color: colors.mutedForeground }]}>{result.status === 'queued' ? 'Job queued' : result.provider}</Text>
          </View>
          <AssetPreview asset={result} colors={colors} />
          <Pressable onPress={() => void saveResult()} disabled={saved} style={({ pressed }) => [styles.saveButton, { backgroundColor: saved ? colors.mint : colors.secondary, opacity: pressed ? 0.75 : 1 }]}>
            <Feather name={saved ? 'check' : 'download'} size={15} color={saved ? colors.mintText : colors.secondaryForeground} />
            <Text style={[styles.saveText, { color: saved ? colors.mintText : colors.secondaryForeground }]}>{saved ? 'Saved to private gallery' : 'Save to private gallery'}</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.recentHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent ideas</Text>
        <Text style={[styles.recentHint, { color: colors.mutedForeground }]}>Your private gallery</Text>
      </View>
      <View style={styles.gallery}>
        <GalleryCard source={sunlit} label="Soft morning" colors={colors} />
        <GalleryCard source={blueHour} label="Blue hour" colors={colors} />
        {gallery.slice(0, 4).map((asset) => <GalleryCard key={asset.id} asset={asset} label={asset.title} colors={colors} />)}
      </View>
    </ScrollView>
  );
}

function AssetPreview({ asset, colors }: { asset: GalleryAsset; colors: ReturnType<typeof useColors> }) {
  if (asset.type === 'story') {
    return (
      <View style={[styles.storyPreview, { backgroundColor: colors.secondary }]}>
        <Feather name="book-open" size={18} color={colors.secondaryForeground} />
        <Text style={[styles.storyText, { color: colors.foreground }]} numberOfLines={7}>{asset.text}</Text>
      </View>
    );
  }
  if (asset.type === 'video' && !asset.uri) {
    return (
      <View style={[styles.videoPreview, { backgroundColor: colors.indigo }]}>
        <Feather name="play-circle" size={31} color={colors.coralSoft} />
        <Text style={[styles.videoText, { color: colors.coralSoft }]}>10-second video job {asset.status === 'queued' ? 'queued' : 'ready'}</Text>
      </View>
    );
  }
  return <Image source={asset.uri ? { uri: asset.uri } : asset.localKey === 'blueHour' ? blueHour : sunlit} style={styles.resultImage} contentFit="cover" transition={250} />;
}
function GalleryCard({ source, asset, label, colors }: { source?: number; asset?: GalleryAsset; label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.galleryCard, { borderColor: colors.border, backgroundColor: colors.card, transform: [{ perspective: 700 }, { rotateX: '6deg' }, { rotateY: label === 'Blue hour' ? '-4deg' : '4deg' }], shadowColor: '#000000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 6 }]}>
      {asset?.type === 'story' ? (
        <View style={[styles.galleryStory, { backgroundColor: colors.secondary }]}><Feather name="book-open" size={19} color={colors.secondaryForeground} /></View>
      ) : asset?.type === 'video' ? (
        <View style={[styles.galleryStory, { backgroundColor: colors.indigo }]}><Feather name="play" size={19} color={colors.coralSoft} /></View>
      ) : (
        <Image source={asset?.uri ? { uri: asset.uri } : asset?.localKey === 'blueHour' ? blueHour : source ?? sunlit} style={styles.galleryImage} contentFit="cover" transition={250} />
      )}
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
  promptCard: { marginHorizontal: 22, marginTop: 14, borderRadius: 22, borderWidth: 1, padding: 16, shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  fieldLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, marginBottom: 10 },
  promptInput: { minHeight: 80, fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular', textAlignVertical: 'top' },
  promptFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  localNote: { fontSize: 10, fontFamily: 'Inter_500Medium', flex: 1 },
  inspireButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
  inspireText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', letterSpacing: -0.3, marginHorizontal: 22, marginTop: 25, marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingHorizontal: 22 },
  action: { width: '48%', minHeight: 52, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, shadowColor: '#000000', shadowOpacity: 0.22, shadowRadius: 9, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  actionText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', flex: 1 },
  createButton: { marginHorizontal: 22, marginTop: 17, paddingVertical: 15, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  createButtonText: { fontSize: 13, fontFamily: 'Inter_700Bold', flex: 1 },
  recentHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginRight: 22 },
  recentHint: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  gallery: { flexDirection: 'row', gap: 10, paddingHorizontal: 22 },
  galleryCard: { flex: 1, borderRadius: 18, overflow: 'hidden', borderWidth: 1 },
  galleryImage: { width: '100%', height: 154 },
  resultCard: { marginHorizontal: 22, marginTop: 17, borderRadius: 22, borderWidth: 1, padding: 15 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 11 },
  resultTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 4 },
  resultProvider: { fontSize: 9, fontFamily: 'Inter_500Medium', maxWidth: 110, textAlign: 'right' },
  resultImage: { width: '100%', height: 220, borderRadius: 15 },
  storyPreview: { minHeight: 160, borderRadius: 15, padding: 14, gap: 9 },
  storyText: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  videoPreview: { height: 160, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 9 },
  videoText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  saveButton: { marginTop: 11, minHeight: 42, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  saveText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  statusCard: { marginHorizontal: 22, marginTop: 12, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  statusText: { flex: 1, fontSize: 11, lineHeight: 16, fontFamily: 'Inter_500Medium' },
  galleryStory: { width: '100%', height: 154, alignItems: 'center', justifyContent: 'center' },
  galleryCaption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, paddingVertical: 10 },
  galleryLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
