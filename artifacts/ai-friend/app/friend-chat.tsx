import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function FriendChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const { friends, friendMessages, sendFriendMessage } = useApp();
  const friend = friends.find((item) => item.id === friendId);
  const [draft, setDraft] = useState<string>('');
  const messages = friendMessages.filter((message) => message.friendId === friendId);

  if (!friend) {
    return <View style={[styles.missing, { backgroundColor: colors.background }]}><Text style={[styles.missingText, { color: colors.foreground }]}>Friend not found.</Text></View>;
  }

  const submit = () => {
    if (!draft.trim()) return;
    sendFriendMessage(friend.id, draft);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 14, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}><Feather name="chevron-left" size={23} color={colors.foreground} /></Pressable>
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}><Text style={[styles.initial, { color: colors.accentForeground }]}>{friend.name.slice(0, 1).toUpperCase()}</Text></View>
          <View><Text style={[styles.title, { color: colors.foreground }]}>{friend.name}</Text><Text style={[styles.status, { color: colors.mutedForeground }]}>Private contact chat</Text></View>
        </View>
        <Pressable onPress={() => Linking.openURL(`tel:${friend.phone}`).catch(() => undefined)} style={styles.headerButton}><Feather name="phone" size={18} color={colors.primary} /></Pressable>
      </View>
      <View style={[styles.notice, { backgroundColor: colors.secondary }]}>
        <Feather name="lock" size={13} color={colors.secondaryForeground} />
        <Text style={[styles.noticeText, { color: colors.secondaryForeground }]}>Saved on this phone until secure friend sync is connected.</Text>
      </View>
      <ScrollView style={styles.messages} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name="message-circle" size={22} color={colors.secondaryForeground} /></View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Start a conversation</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Write a message below. It will be kept locally and ready to sync when accounts are connected.</Text>
          </View>
        ) : messages.map((message) => (
          <View key={message.id} style={[styles.row, message.sender === 'me' ? styles.myRow : styles.theirRow]}>
            <View style={[styles.bubble, message.sender === 'me' ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.messageText, { color: message.sender === 'me' ? colors.primaryForeground : colors.foreground }]}>{message.text}</Text>
              <Text style={[styles.time, { color: message.sender === 'me' ? colors.coralSoft : colors.mutedForeground }]}>{message.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.composerWrap, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={[styles.composer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={submit} placeholder={`Message ${friend.name}`} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} multiline />
          <Pressable onPress={submit} style={[styles.send, { backgroundColor: draft.trim() ? colors.primary : colors.muted }]}><Feather name="arrow-up" size={18} color={draft.trim() ? colors.primaryForeground : colors.mutedForeground} /></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 13, borderBottomWidth: 1 },
  headerButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: { width: 37, height: 37, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  status: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  notice: { marginHorizontal: 15, marginTop: 12, borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  noticeText: { fontSize: 10, fontFamily: 'Inter_500Medium', flex: 1 },
  messages: { flex: 1 },
  empty: { alignItems: 'center', marginTop: 100, paddingHorizontal: 30 },
  emptyIcon: { width: 52, height: 52, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  emptyBody: { fontSize: 11, lineHeight: 16, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  row: { flexDirection: 'row', marginBottom: 12 },
  myRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 19, paddingHorizontal: 14, paddingVertical: 11 },
  messageText: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  time: { fontSize: 9, textAlign: 'right', marginTop: 5, fontFamily: 'Inter_500Medium' },
  composerWrap: { borderTopWidth: 1, paddingTop: 11, paddingHorizontal: 15 },
  composer: { minHeight: 49, borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'flex-end', padding: 6, gap: 6 },
  input: { flex: 1, fontSize: 14, maxHeight: 90, paddingHorizontal: 9, paddingVertical: 7, fontFamily: 'Inter_400Regular' },
  send: { width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});