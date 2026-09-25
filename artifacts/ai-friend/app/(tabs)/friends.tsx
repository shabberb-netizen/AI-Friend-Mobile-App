import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatGroup, Friend, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function FriendsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { friends, addFriend, removeFriend, setFriendLocationSharing, chatGroups, createChatGroup, deleteChatGroup } = useApp();
  const [showAdd, setShowAdd] = useState<boolean>(friends.length === 0);
  const [showGroup, setShowGroup] = useState(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [permission, requestPermission] = Location.useForegroundPermissions();

  const submitFriend = () => {
    if (!addFriend(name, phone)) {
      Alert.alert('Add a friend', 'Enter a name and a phone number first.');
      return;
    }
    setName('');
    setPhone('');
    setShowAdd(false);
  };

  const toggleGroupFriend = (friendId: string) => {
    setSelectedFriendIds((current) => current.includes(friendId) ? current.filter((id) => id !== friendId) : [...current, friendId]);
  };

  const submitGroup = () => {
    if (!createChatGroup(groupName, selectedFriendIds)) {
      Alert.alert('Create a group', 'Add a group name and choose at least one friend.');
      return;
    }
    setGroupName('');
    setSelectedFriendIds([]);
    setShowGroup(false);
  };

  const confirmDeleteGroup = (group: ChatGroup) => {
    Alert.alert('Delete this group?', 'The group and its saved messages will be removed from this phone.', [
      { text: 'Keep group', style: 'cancel' },
      { text: 'Delete group', style: 'destructive', onPress: () => deleteChatGroup(group.id) },
    ]);
  };

  const shareLocation = async (friend: Friend) => {
    let currentPermission = permission;
    if (!currentPermission?.granted) {
      currentPermission = await requestPermission();
    }
    if (!currentPermission.granted) {
      Alert.alert(
        'Location permission needed',
        currentPermission.canAskAgain === false ? 'Open device settings to allow location, or keep sharing turned off.' : 'AI Friend needs foreground location permission for a one-time safety check-in.',
        currentPermission.canAskAgain === false ? [{ text: 'Not now', style: 'cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => undefined) }] : [{ text: 'OK' }],
      );
      return;
    }
    try {
      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setFriendLocationSharing(friend.id, true, {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        sharedAt: new Date().toISOString(),
      });
    } catch {
      Alert.alert('Location unavailable', 'Your device could not provide a location check-in right now.');
    }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR CIRCLE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Friends & safety</Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="users" size={19} color={colors.secondaryForeground} />
        </View>
      </View>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Call, message, and share a safety check-in with people you trust.</Text>

      <View style={[styles.safetyCard, { backgroundColor: colors.indigo, borderColor: colors.border }]}>
        <View style={[styles.safetyIcon, { backgroundColor: colors.mint }]}>
          <Feather name="shield" size={20} color={colors.mintText} />
        </View>
        <View style={styles.safetyCopy}>
          <Text style={[styles.safetyTitle, { color: colors.foreground }]}>Safety sharing is consent-first</Text>
          <Text style={[styles.safetyBody, { color: colors.accentForeground }]}>Location stays off until you choose a friend and tap Share location. No silent tracking.</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your friends</Text>
        <Pressable onPress={() => setShowAdd((current) => !current)} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}>
          <Feather name={showAdd ? 'x' : 'plus'} size={15} color={colors.primaryForeground} />
          <Text style={[styles.addButtonText, { color: colors.primaryForeground }]}>{showAdd ? 'Close' : 'Add friend'}</Text>
        </Pressable>
      </View>

      {showAdd && (
        <View style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>ADD A TRUSTED CONTACT</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Friend’s name" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
          <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number for calling" placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad" style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
          <Pressable onPress={submitFriend} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.78 : 1 }]}>
            <Feather name="user-plus" size={16} color={colors.secondaryForeground} />
            <Text style={[styles.saveButtonText, { color: colors.secondaryForeground }]}>Save friend on this phone</Text>
          </Pressable>
        </View>
      )}

      {friends.length === 0 && !showAdd && (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="users" size={21} color={colors.secondaryForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your circle is empty</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Add someone you trust to start a private contact list.</Text>
        </View>
      )}

      <View style={styles.friendList}>
        {friends.map((friend) => (
          <FriendCard key={friend.id} friend={friend} colors={colors} onChat={() => router.push({ pathname: '/friend-chat', params: { friendId: friend.id } })} onCall={() => Linking.openURL(`tel:${friend.phone}`).catch(() => Alert.alert('Calling unavailable', 'This device cannot open the phone dialer.'))} onShare={() => shareLocation(friend)} onStopShare={() => setFriendLocationSharing(friend.id, false)} onRemove={() => removeFriend(friend.id)} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Group chats</Text>
        <Pressable onPress={() => setShowGroup((current) => !current)} disabled={friends.length === 0} style={({ pressed }) => [styles.addButton, { backgroundColor: friends.length === 0 ? colors.muted : colors.violet, opacity: pressed ? 0.78 : 1 }]}>
          <Feather name={showGroup ? 'x' : 'users'} size={15} color={friends.length === 0 ? colors.mutedForeground : colors.primaryForeground} />
          <Text style={[styles.addButtonText, { color: friends.length === 0 ? colors.mutedForeground : colors.primaryForeground }]}>{showGroup ? 'Close' : 'Create group'}</Text>
        </Pressable>
      </View>
      {showGroup && (
        <View style={[styles.groupCreateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>NEW GROUP CHAT</Text>
          <TextInput value={groupName} onChangeText={setGroupName} placeholder="Group name" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
          <Text style={[styles.memberLabel, { color: colors.mutedForeground }]}>CHOOSE FRIENDS</Text>
          {friends.map((friend) => {
            const selected = selectedFriendIds.includes(friend.id);
            return (
              <Pressable key={friend.id} onPress={() => toggleGroupFriend(friend.id)} style={[styles.memberRow, { backgroundColor: selected ? colors.accent : colors.secondary, borderColor: selected ? colors.violet : colors.border }]}>
                <View style={[styles.memberAvatar, { backgroundColor: selected ? colors.primary : colors.card }]}><Text style={[styles.memberInitial, { color: selected ? colors.primaryForeground : colors.foreground }]}>{friend.name.slice(0, 1).toUpperCase()}</Text></View>
                <Text style={[styles.memberName, { color: colors.foreground }]}>{friend.name}</Text>
                <Feather name={selected ? 'check-circle' : 'circle'} size={18} color={selected ? colors.primary : colors.mutedForeground} />
              </Pressable>
            );
          })}
          <Pressable onPress={submitGroup} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.78 : 1 }]}>
            <Feather name="message-circle" size={16} color={colors.secondaryForeground} />
            <Text style={[styles.saveButtonText, { color: colors.secondaryForeground }]}>Create group chat</Text>
          </Pressable>
        </View>
      )}
      {friends.length === 0 && (
        <Text style={[styles.groupHint, { color: colors.mutedForeground }]}>Add at least one friend before creating a group chat.</Text>
      )}
      {chatGroups.length > 0 && (
        <View style={styles.groupList}>
          {chatGroups.map((group) => (
            <GroupCard key={group.id} group={group} friends={friends} colors={colors} onOpen={() => router.push({ pathname: '/group-chat', params: { groupId: group.id } })} onDelete={() => confirmDeleteGroup(group)} />
          ))}
        </View>
      )}

      <View style={[styles.syncNote, { backgroundColor: colors.secondary }]}>
        <Feather name="lock" size={15} color={colors.secondaryForeground} />
        <Text style={[styles.syncText, { color: colors.secondaryForeground }]}>Friends and messages are saved on this device. Cross-device chat and live friend-to-friend location sync require secure accounts and explicit invitations.</Text>
      </View>
    </ScrollView>
  );
}

function GroupCard({ group, friends, colors, onOpen, onDelete }: { group: ChatGroup; friends: Friend[]; colors: ReturnType<typeof useColors>; onOpen: () => void; onDelete: () => void }) {
  const memberNames = group.friendIds.map((friendId) => friends.find((friend) => friend.id === friendId)?.name).filter(Boolean).join(', ');
  return (
    <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={onOpen} style={styles.groupMain}>
        <View style={[styles.groupAvatar, { backgroundColor: colors.violet }]}><Feather name="users" size={17} color={colors.primaryForeground} /></View>
        <View style={styles.groupCopy}>
          <Text style={[styles.groupName, { color: colors.foreground }]}>{group.name}</Text>
          <Text style={[styles.groupMembers, { color: colors.mutedForeground }]} numberOfLines={1}>{memberNames || 'No members'}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </Pressable>
      <Pressable onPress={onDelete} accessibilityLabel={`Delete ${group.name}`} style={styles.groupDelete}><Feather name="trash-2" size={15} color={colors.mutedForeground} /></Pressable>
    </View>
  );
}

function FriendCard({ friend, colors, onChat, onCall, onShare, onStopShare, onRemove }: { friend: Friend; colors: ReturnType<typeof useColors>; onChat: () => void; onCall: () => void; onShare: () => void; onStopShare: () => void; onRemove: () => void }) {
  return (
    <View style={[styles.friendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.friendAvatar, { backgroundColor: colors.accent }]}>
        <Text style={[styles.friendInitial, { color: colors.accentForeground }]}>{friend.name.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.friendCopy}>
        <Text style={[styles.friendName, { color: colors.foreground }]}>{friend.name}</Text>
        <Text style={[styles.friendPhone, { color: colors.mutedForeground }]}>{friend.phone}</Text>
        <Text style={[styles.locationStatus, { color: friend.locationSharing ? colors.mintText : colors.mutedForeground }]}>{friend.locationSharing ? 'Safety check-in shared' : 'Location sharing off'}</Text>
      </View>
      <View style={styles.friendActions}>
        <Pressable onPress={onChat} style={[styles.iconButton, { backgroundColor: colors.secondary }]}><Feather name="message-circle" size={16} color={colors.secondaryForeground} /></Pressable>
        <Pressable onPress={onCall} style={[styles.iconButton, { backgroundColor: colors.coralSoft }]}><Feather name="phone" size={16} color={colors.primary} /></Pressable>
      </View>
      <View style={[styles.friendFooter, { borderTopColor: colors.border }]}>
        <Pressable onPress={friend.locationSharing ? onStopShare : onShare} style={styles.locationButton}>
          <Feather name={friend.locationSharing ? 'pause-circle' : 'map-pin'} size={14} color={friend.locationSharing ? colors.mintText : colors.secondaryForeground} />
          <Text style={[styles.locationButtonText, { color: friend.locationSharing ? colors.mintText : colors.secondaryForeground }]}>{friend.locationSharing ? 'Pause sharing' : 'Share location'}</Text>
        </Pressable>
        <Pressable onPress={onRemove} style={styles.removeButton}><Text style={[styles.removeText, { color: colors.mutedForeground }]}>Remove</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22 },
  eyebrow: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, marginBottom: 7 },
  title: { fontSize: 25, fontFamily: 'Inter_700Bold', letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular', marginHorizontal: 22, marginTop: 9, maxWidth: 340 },
  headerIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  safetyCard: { marginHorizontal: 22, marginTop: 22, padding: 15, borderRadius: 22, borderWidth: 1, flexDirection: 'row', gap: 11, alignItems: 'center' },
  safetyIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  safetyCopy: { flex: 1 },
  safetyTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  safetyBody: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 22, marginTop: 27, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 8 },
  addButtonText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  addCard: { marginHorizontal: 22, borderRadius: 21, borderWidth: 1, padding: 14 },
  cardLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 13, minHeight: 44, paddingHorizontal: 12, marginBottom: 9, fontSize: 13, fontFamily: 'Inter_400Regular' },
  saveButton: { minHeight: 43, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 2 },
  saveButtonText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  emptyCard: { marginHorizontal: 22, borderRadius: 21, borderWidth: 1, alignItems: 'center', padding: 26 },
  emptyIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  emptyBody: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 240 },
  friendList: { gap: 11, paddingHorizontal: 22 },
  groupCreateCard: { marginHorizontal: 22, borderRadius: 21, borderWidth: 1, padding: 14 },
  memberLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, marginTop: 3, marginBottom: 8 },
  memberRow: { minHeight: 46, borderRadius: 13, borderWidth: 1, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 7 },
  memberAvatar: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  memberInitial: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  memberName: { flex: 1, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  groupHint: { marginHorizontal: 22, marginTop: 10, fontSize: 10, fontFamily: 'Inter_400Regular' },
  groupList: { gap: 10, paddingHorizontal: 22, marginTop: 1 },
  groupCard: { minHeight: 67, borderRadius: 19, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  groupMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupAvatar: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  groupCopy: { flex: 1 },
  groupName: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  groupMembers: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  groupDelete: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  friendCard: { borderRadius: 21, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 },
  friendAvatar: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  friendInitial: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  friendCopy: { flex: 1, minWidth: 120 },
  friendName: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  friendPhone: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 5 },
  locationStatus: { fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  friendActions: { flexDirection: 'row', gap: 6 },
  iconButton: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  friendFooter: { width: '100%', borderTopWidth: 1, marginTop: 2, paddingTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationButtonText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  removeButton: { padding: 3 },
  removeText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  syncNote: { marginHorizontal: 22, marginTop: 17, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  syncText: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_500Medium', flex: 1 },
});