import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { messages, settings, roleplayMode, setRoleplayMode, sendMessage } = useApp();
  const [draft, setDraft] = useState<string>('');
  const [showRoleplay, setShowRoleplay] = useState<boolean>(false);
  const isOffline = settings.mode === 'offline';

  const submit = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Feather name="chevron-left" size={23} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerIdentity}>
          <View style={[styles.friendAvatar, { backgroundColor: colors.primary }]}>
            <Feather name="heart" size={16} color={colors.primaryForeground} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Friend</Text>
            <View style={styles.statusLine}>
              <View style={[styles.statusDot, { backgroundColor: colors.mintText }]} />
              <Text style={[styles.statusText, { color: colors.mutedForeground }]}>{isOffline ? 'On-device and private' : 'Online and ready'}</Text>
            </View>
          </View>
        </View>
        <Pressable onPress={() => setShowRoleplay((current) => !current)} style={styles.headerButton}>
          <Feather name="users" size={19} color={showRoleplay ? colors.primary : colors.mutedForeground} />
        </Pressable>
      </View>
      {showRoleplay && (
          <View style={[styles.roleplayPanel, { backgroundColor: colors.card, borderBottomColor: colors.border, shadowColor: '#000000', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 9 }, elevation: 7 }]}>
          <View style={styles.roleplayHeading}>
            <View>
              <Text style={[styles.roleplayTitle, { color: colors.foreground }]}>Choose a role-play</Text>
              <Text style={[styles.roleplayHint, { color: colors.mutedForeground }]}>Fictional chat · switch anytime</Text>
            </View>
            <Pressable onPress={() => setShowRoleplay(false)} style={styles.closeRoleplay}>
              <Feather name="x" size={17} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <View style={styles.roleplayOptions}>
            <RoleplayOption
              icon="heart"
              title="Everyday friend"
              subtitle="Warm and honest"
              selected={roleplayMode === 'friend'}
              onPress={() => { setRoleplayMode('friend'); setShowRoleplay(false); }}
              colors={colors}
            />
            <RoleplayOption
              icon="book-open"
              title="Study buddy"
              subtitle="Focused and clear"
              selected={roleplayMode === 'study'}
              onPress={() => { setRoleplayMode('study'); setShowRoleplay(false); }}
              colors={colors}
            />
            <RoleplayOption
              icon="star"
              title="Romantic companion"
              subtitle="Fictional and consensual"
              selected={roleplayMode === 'romantic'}
              onPress={() => { setRoleplayMode('romantic'); setShowRoleplay(false); }}
              colors={colors}
            />
          </View>
        </View>
      )}

      <ScrollView
        style={styles.messages}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>TODAY</Text>
        <View style={[styles.roleplayBadge, { backgroundColor: colors.secondary }]}>
          <Feather name="users" size={13} color={colors.secondaryForeground} />
          <Text style={[styles.roleplayBadgeText, { color: colors.secondaryForeground }]}>
            {roleplayMode === 'romantic' ? 'Romantic companion role-play' : roleplayMode === 'study' ? 'Study buddy role-play' : 'Everyday friend role-play'}
          </Text>
          <Text style={[styles.roleplayBadgeHint, { color: colors.mutedForeground }]}>· fictional</Text>
        </View>
        {messages.map((message) => (
          <View key={message.id} style={[styles.messageRow, message.sender === 'user' ? styles.userRow : styles.friendRow]}>
            {message.sender === 'friend' && (
              <View style={[styles.smallAvatar, { backgroundColor: colors.secondary }]}>
                <Feather name="heart" size={12} color={colors.primary} />
              </View>
            )}
            <View style={[styles.bubble, message.sender === 'user' ? { backgroundColor: colors.primary, transform: [{ perspective: 600 }, { rotateY: '-2deg' }] } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, transform: [{ perspective: 600 }, { rotateY: '2deg' }], shadowColor: '#000000', shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 4 }]}>
              <Text style={[styles.messageText, { color: message.sender === 'user' ? colors.primaryForeground : colors.foreground }]}>{message.text}</Text>
              <Text style={[styles.timeText, { color: message.sender === 'user' ? colors.coralSoft : colors.mutedForeground }]}>{message.time}</Text>
            </View>
          </View>
        ))}
        <Text style={[styles.prompt, { color: colors.mutedForeground }]}>Try one of these</Text>
        <View style={styles.chips}>
          <QuickPrompt text="Help me study" icon="book-open" onPress={() => sendMessage('Help me study')} colors={colors} />
          <QuickPrompt text="Make an image" icon="aperture" onPress={() => router.push('/create')} colors={colors} />
          <QuickPrompt text="I need to talk" icon="heart" onPress={() => sendMessage('I need to talk')} colors={colors} />
        </View>
      </ScrollView>

      <View style={[styles.composerWrap, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={[styles.composer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submit}
            placeholder="Say anything..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            returnKeyType="send"
            multiline
          />
          <Pressable onPress={() => setDraft((current) => (current ? current : 'I want to use voice commands'))} style={({ pressed }) => [styles.micButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}>
            <Feather name="mic" size={17} color={colors.secondaryForeground} />
          </Pressable>
          <Pressable onPress={submit} style={({ pressed }) => [styles.sendButton, { backgroundColor: draft.trim() ? colors.primary : colors.muted, opacity: pressed ? 0.78 : 1 }]}>
            <Feather name="arrow-up" size={18} color={draft.trim() ? colors.primaryForeground : colors.mutedForeground} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function QuickPrompt({ text, icon, onPress, colors }: { text: string; icon: React.ComponentProps<typeof Feather>['name']; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, { backgroundColor: colors.secondary, opacity: pressed ? 0.78 : 1 }]}>
      <Feather name={icon} size={14} color={colors.secondaryForeground} />
      <Text style={[styles.chipText, { color: colors.secondaryForeground }]}>{text}</Text>
    </Pressable>
  );
}

function RoleplayOption({ icon, title, subtitle, selected, onPress, colors }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; subtitle: string; selected: boolean; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.roleplayOption, { backgroundColor: selected ? colors.accent : colors.secondary, borderColor: selected ? colors.violet : colors.secondary, opacity: pressed ? 0.78 : 1 }]}>
      <View style={[styles.roleplayIcon, { backgroundColor: selected ? colors.card : colors.muted }]}>
        <Feather name={icon} size={15} color={selected ? colors.primary : colors.secondaryForeground} />
      </View>
      <View style={styles.roleplayOptionCopy}>
        <Text style={[styles.roleplayOptionTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.roleplayOptionSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      {selected && <Feather name="check" size={16} color={colors.primary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 14, borderBottomWidth: 1 },
  headerButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  friendAvatar: { width: 37, height: 37, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  statusLine: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  statusDot: { width: 6, height: 6, borderRadius: 4 },
  statusText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  roleplayPanel: { borderBottomWidth: 1, paddingHorizontal: 18, paddingTop: 13, paddingBottom: 15 },
  roleplayHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  roleplayTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  roleplayHint: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  closeRoleplay: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  roleplayOptions: { gap: 7 },
  roleplayOption: { minHeight: 48, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, gap: 9 },
  roleplayIcon: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  roleplayOptionCopy: { flex: 1 },
  roleplayOptionTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  roleplayOptionSubtitle: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  messages: { flex: 1 },
  dateLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, textAlign: 'center', marginBottom: 22 },
  roleplayBadge: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 13, marginBottom: 17 },
  roleplayBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  roleplayBadgeHint: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14, gap: 8 },
  userRow: { justifyContent: 'flex-end' },
  friendRow: { justifyContent: 'flex-start' },
  smallAvatar: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  bubble: { maxWidth: '80%', borderRadius: 20, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 9 },
  messageText: { fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular' },
  timeText: { fontSize: 9, fontFamily: 'Inter_500Medium', marginTop: 6, textAlign: 'right' },
  prompt: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 7, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 15, paddingHorizontal: 11, paddingVertical: 9 },
  chipText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  composerWrap: { borderTopWidth: 1, paddingHorizontal: 15, paddingTop: 11 },
  composer: { minHeight: 49, borderWidth: 1, borderRadius: 19, flexDirection: 'row', alignItems: 'flex-end', padding: 6, gap: 6, shadowColor: '#000000', shadowOpacity: 0.28, shadowRadius: 13, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', maxHeight: 90, paddingHorizontal: 9, paddingVertical: 7 },
  micButton: { width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sendButton: { width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});