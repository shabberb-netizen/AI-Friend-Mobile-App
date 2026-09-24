import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSettings, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, toggleMode, updateSetting } = useApp();
  const isOffline = settings.mode === 'offline';

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>CONTROL CENTER</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Your settings</Text>
        </View>
        <View style={[styles.settingsIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="sliders" size={18} color={colors.secondaryForeground} />
        </View>
      </View>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Choose what AI Friend can access. Nothing sensitive turns on silently.</Text>

      <Pressable onPress={toggleMode} style={({ pressed }) => [styles.modeCard, { backgroundColor: isOffline ? colors.indigo : colors.primary, opacity: pressed ? 0.9 : 1 }]}>
        <View style={[styles.modeCardIcon, { backgroundColor: isOffline ? colors.violet : colors.coralSoft }]}>
          <Feather name={isOffline ? 'shield' : 'cloud'} size={21} color={isOffline ? colors.card : colors.primary} />
        </View>
        <View style={styles.modeCopy}>
          <Text style={[styles.modeLabel, { color: isOffline ? colors.accent : colors.coralSoft }]}>{isOffline ? 'OFFLINE MODE' : 'ONLINE MODE'}</Text>
          <Text style={[styles.modeTitle, { color: colors.card }]}>{isOffline ? 'Private by default' : 'More capable, still yours'}</Text>
          <Text style={[styles.modeBody, { color: isOffline ? colors.accent : colors.coralSoft }]}>{isOffline ? 'Chat, plan, and create with what is saved on your phone.' : 'Use cloud intelligence for richer answers and generation.'}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.card} />
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Permissions & access</Text>
      <View style={[styles.settingGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="map-pin" title="Location check-ins" description="Optional moments saved with your location" value={settings.locationCheckIns} onChange={(value) => updateSetting('locationCheckIns', value)} colors={colors} />
        <Divider colors={colors} />
        <SettingRow icon="mail" title="Email check-ins" description="Send a check-in only when you ask" value={settings.emailCheckIns} onChange={(value) => updateSetting('emailCheckIns', value)} colors={colors} />
        <Divider colors={colors} />
        <SettingRow icon="mic" title="Voice commands" description="Use your microphone for hands-free chat" value={settings.voiceCommands} onChange={(value) => updateSetting('voiceCommands', value)} colors={colors} />
        <Divider colors={colors} />
        <SettingRow icon="headphones" title="Earbud controls" description="Start and pause listening from your earbuds" value={settings.headphoneControls} onChange={(value) => updateSetting('headphoneControls', value)} colors={colors} />
      </View>

      <View style={[styles.notice, { backgroundColor: colors.secondary }]}>
        <Feather name="info" size={16} color={colors.secondaryForeground} />
        <Text style={[styles.noticeText, { color: colors.secondaryForeground }]}>Phone calls, messaging apps, tracking, and microphone access always require device permission. AI Friend cannot bypass your operating system.</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your companion</Text>
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
          <Feather name="heart" size={21} color={colors.primaryForeground} />
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>AI Friend</Text>
          <Text style={[styles.profileBody, { color: colors.mutedForeground }]}>Friendly, thoughtful, and learning your boundaries.</Text>
        </View>
        <Pressable onPress={() => Alert.alert('Companion profile', 'Personalization and memory controls will live here. Your local chat is already stored on this device.')} style={styles.moreButton}>
          <Feather name="more-horizontal" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SettingRow({ icon, title, description, value, onChange, colors }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; description: string; value: boolean; onChange: (value: boolean) => void; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={16} color={colors.secondaryForeground} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.muted, true: colors.primary }} thumbColor={colors.card} ios_backgroundColor={colors.muted} />
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22 },
  eyebrow: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, marginBottom: 7 },
  title: { fontSize: 25, fontFamily: 'Inter_700Bold', letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular', marginHorizontal: 22, marginTop: 9, maxWidth: 340 },
  settingsIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modeCard: { marginHorizontal: 22, marginTop: 22, borderRadius: 24, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 12 },
  modeCardIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modeCopy: { flex: 1 },
  modeLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.3, marginBottom: 4 },
  modeTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  modeBody: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginHorizontal: 22, marginTop: 27, marginBottom: 12 },
  settingGroup: { marginHorizontal: 22, borderWidth: 1, borderRadius: 22, paddingHorizontal: 14 },
  settingRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11 },
  settingIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1 },
  settingTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  settingDescription: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  divider: { height: 1, marginLeft: 45 },
  notice: { marginHorizontal: 22, marginTop: 14, borderRadius: 17, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  noticeText: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_500Medium', flex: 1 },
  profileCard: { marginHorizontal: 22, borderWidth: 1, borderRadius: 22, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  profileAvatar: { width: 42, height: 42, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  profileCopy: { flex: 1 },
  profileName: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  profileBody: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  moreButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});