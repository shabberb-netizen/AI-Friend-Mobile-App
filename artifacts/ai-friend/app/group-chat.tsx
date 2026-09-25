import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function GroupChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { chatGroups, friends, groupMessages, sendGroupMessage, deleteChatGroup } = useApp();
  const [draft, setDraft] = useState('');
  const group = chatGroups.find((item) => item.id === groupId);
  const messages = groupMessages.filter((message) => message.groupId === groupId);
  const members = group?.friendIds.map((friendId) => friends.find((friend) => friend.id === friendId)?.name).filter(Boolean) as string[] | undefined;

  if (!group) {
    return <View style={[styles.missing, { backgroundColor: colors.background }]}><Text style={[styles.missingText, { color: colors.foreground }]}>Group not found.</Text></View>;
  }

  const submit = () => {
    if (!draft.trim()) return;
    sendGroupMessage(group.id, draft);
    setDraft('');
  };

  const confirmDelete = () => {
    Alert.alert('Delete this group?', 'The group and its saved messages will be removed from this phone.', [
      { text: 'Keep group', style: 'cancel' },
      { text: 'Delete group', style: 'destructive', onPress: () => { deleteChatGroup(group.id); router.back(); } },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 14, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}><Feather name="chevron-left" size={23} color={colors.foreground} /></Pressable>
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: colors.violet }]}><Feather name="users" size={17} color={colors.primaryForeground} /></View>
          <View style={styles.identityCopy}>
            <Text style={[styles.title, { color: colors.foreground }]}>{group.name}</Text>
            <Text style={[styles.status, { color: colors.mutedForeground }]}>{members?.join(', ') || 'Private group chat'}</Text>
          </View>
        </View>
        <Pressable onPress={confirmDelete} accessibilityLabel="Delete group" style={styles.headerButton}><Feather name="trash-2" size={17} color={colors.primary} /></Pressable>
      </View>
      <View style={[styles.notice, { backgroundColor: colors.secondary }]}>
        <Feather name="lock" size={13} color={colors.secondaryForeground} />
        <Text style={[styles.noticeText, { color: colors.secondaryForeground }]}>Saved on this phone until secure friend sync is connected.</Text>
      </View>
      <ScrollView style={styles.messages} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name="users" size={22} color={colors.secondaryForeground} /></View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Start the group chat</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Send the first message to everyone in {group.name}.</Text>
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
          <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={submit} placeholder={`Message ${group.name}`} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} multiline />
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
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 8 },
  identityCopy: { flex: 1 },
  avatar: { width: 37, height: 37, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
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