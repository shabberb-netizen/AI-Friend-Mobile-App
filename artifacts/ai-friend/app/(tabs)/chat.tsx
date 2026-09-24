import { Feather } from '@expo/vector-icons';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type BrowserSpeechResult = { [index: number]: { transcript: string } };
type BrowserSpeechEvent = Event & { results: { [index: number]: BrowserSpeechResult } };
type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: BrowserSpeechEvent) => void) | null;
  start: () => void;
  stop: () => void;
};
type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { messages, settings, roleplayMode, setRoleplayMode, sendMessage, isChatting, chatError } = useApp();
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const [draft, setDraft] = useState<string>('');
  const [showRoleplay, setShowRoleplay] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const isOffline = settings.mode === 'offline';
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakNextReplyRef = useRef<boolean>(false);
  const latestFriendMessage = [...messages].reverse().find((message) => message.sender === 'friend');

  const submit = () => {
    if (!draft.trim()) return;
    void sendMessage(draft);
    setDraft('');
  };

  const speakMessage = (text: string) => {
    setVoiceError(null);
    setIsSpeaking(true);
    Speech.stop().catch(() => undefined);
    Speech.speak(text, {
      rate: 0.98,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        setVoiceError('Speech output is not available on this device.');
      },
    });
  };

  const toggleSpeech = () => {
    if (!latestFriendMessage) return;
    if (isSpeaking) {
      Speech.stop().catch(() => undefined);
      setIsSpeaking(false);
      return;
    }
    speakMessage(latestFriendMessage.text);
  };

  const startVoiceCommand = async () => {
    setVoiceError(null);
    if (!settings.voiceCommands) {
      setVoiceError('Turn on Voice commands in Settings first. AI Friend will ask for microphone access there.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      if (recorder.isRecording) await recorder.stop().catch(() => undefined);
      setIsListening(false);
      return;
    }

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setVoiceError(permission.canAskAgain ? 'Microphone access was denied. Voice commands remain off.' : 'Microphone access is blocked. Open device settings to allow it again.');
      if (!permission.canAskAgain) {
        Alert.alert('Microphone access blocked', 'Open device settings to allow microphone access for AI Friend.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ]);
      }
      return;
    }

    if (Platform.OS === 'web') {
      const browserWindow = globalThis as typeof globalThis & { SpeechRecognition?: BrowserSpeechRecognitionConstructor; webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor };
      const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
      if (!Recognition) {
        setVoiceError('This browser granted microphone access, but speech-to-text is not available here. Type your command instead.');
        return;
      }
      const recognition = new Recognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        setIsListening(false);
        recognitionRef.current = null;
        if (!transcript) {
          setVoiceError('I did not hear a command. Try again or type it instead.');
          return;
        }
        setDraft(transcript);
        speakNextReplyRef.current = true;
        void sendMessage(transcript);
      };
      recognition.onerror = () => {
        setIsListening(false);
        recognitionRef.current = null;
        setVoiceError('Speech input stopped before a command was captured. Try again or type it instead.');
      };
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      recognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
      return;
    }

    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: 5 });
      setIsListening(true);
      recordingTimerRef.current = setTimeout(async () => {
        await recorder.stop().catch(() => undefined);
        setIsListening(false);
        setVoiceError('Microphone capture finished. Speech-to-text is not available in this Expo build yet, so use the text field for the command.');
      }, 5000);
    } catch {
      setIsListening(false);
      setVoiceError('Microphone capture could not start on this device.');
    }
  };

  useEffect(() => {
    if (!speakNextReplyRef.current || isChatting) return;
    const reply = [...messages].reverse().find((message) => message.sender === 'friend');
    if (!reply) return;
    speakNextReplyRef.current = false;
    speakMessage(reply.text);
  }, [isChatting, messages]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    Speech.stop().catch(() => undefined);
  }, []);

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
        <View style={styles.headerActions}>
          <Pressable onPress={() => setShowRoleplay((current) => !current)} style={styles.headerButton}>
            <Feather name="users" size={19} color={showRoleplay ? colors.primary : colors.mutedForeground} />
          </Pressable>
          <Pressable onPress={() => router.push('/settings')} style={styles.headerButton}>
            <Feather name="sliders" size={19} color={colors.mutedForeground} />
          </Pressable>
        </View>
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
            <RoleplayOption icon="heart" title="Everyday friend" subtitle="Warm and honest" selected={roleplayMode === 'friend'} onPress={() => { setRoleplayMode('friend'); setShowRoleplay(false); }} colors={colors} />
            <RoleplayOption icon="book-open" title="Study buddy" subtitle="Focused and clear" selected={roleplayMode === 'study'} onPress={() => { setRoleplayMode('study'); setShowRoleplay(false); }} colors={colors} />
            <RoleplayOption icon="star" title="Romantic companion" subtitle="Fictional and consensual" selected={roleplayMode === 'romantic'} onPress={() => { setRoleplayMode('romantic'); setShowRoleplay(false); }} colors={colors} />
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
        {chatError && (
          <View style={[styles.notice, { backgroundColor: colors.secondary }]}>
            <Feather name="shield" size={15} color={colors.secondaryForeground} />
            <Text style={[styles.noticeText, { color: colors.secondaryForeground }]}>{chatError}</Text>
          </View>
        )}
        {voiceError && (
          <View style={[styles.notice, { backgroundColor: colors.coralSoft }]}>
            <Feather name="mic-off" size={15} color={colors.primary} />
            <Text style={[styles.noticeText, { color: colors.foreground }]}>{voiceError}</Text>
          </View>
        )}
        {messages.map((message) => (
          <View key={message.id} style={[styles.messageRow, message.sender === 'user' ? styles.userRow : styles.friendRow]}>
            {message.sender === 'friend' && (
              <View style={[styles.smallAvatar, { backgroundColor: colors.secondary }]}>
                <Feather name="heart" size={12} color={colors.primary} />
              </View>
            )}
            <View style={[styles.bubble, message.sender === 'user' ? { backgroundColor: colors.primary, transform: [{ perspective: 600 }, { rotateY: '-2deg' }] } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, transform: [{ perspective: 600 }, { rotateY: '2deg' }], shadowColor: '#000000', shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 4 }]}>
              <Text style={[styles.messageText, { color: message.sender === 'user' ? colors.primaryForeground : colors.foreground }]}>{message.text}</Text>
              {message.sender === 'friend' && (
                <Pressable accessibilityLabel="Read this reply aloud" testID={`speak-${message.id}`} onPress={() => speakMessage(message.text)} style={styles.speakButton}>
                  <Feather name="volume-2" size={14} color={colors.primary} />
                  <Text style={[styles.speakLabel, { color: colors.primary }]}>Read aloud</Text>
                </Pressable>
              )}
              <Text style={[styles.timeText, { color: message.sender === 'user' ? colors.coralSoft : colors.mutedForeground }]}>{message.time}</Text>
            </View>
          </View>
        ))}
        {isChatting && (
          <View style={styles.typingRow}>
            <View style={[styles.smallAvatar, { backgroundColor: colors.secondary }]}>
              <Feather name="heart" size={12} color={colors.primary} />
            </View>
            <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.typingText, { color: colors.mutedForeground }]}>Thinking…</Text>
            </View>
          </View>
        )}
        <Text style={[styles.prompt, { color: colors.mutedForeground }]}>Try one of these</Text>
        <View style={styles.chips}>
          <QuickPrompt text="Help me study" icon="book-open" onPress={() => void sendMessage('Help me study')} colors={colors} />
          <QuickPrompt text="Make an image" icon="aperture" onPress={() => router.push('/create')} colors={colors} />
          <QuickPrompt text="I need to talk" icon="heart" onPress={() => void sendMessage('I need to talk')} colors={colors} />
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
            editable={!isChatting}
          />
          {settings.headphoneControls && (
            <Pressable accessibilityLabel={isSpeaking ? 'Pause spoken reply' : 'Play latest reply through supported audio'} disabled={isChatting || !latestFriendMessage} onPress={toggleSpeech} style={({ pressed }) => [styles.micButton, { backgroundColor: colors.secondary, opacity: isChatting || !latestFriendMessage ? 0.45 : pressed ? 0.75 : 1 }]}>
              <Feather name={isSpeaking ? 'pause' : 'headphones'} size={17} color={colors.secondaryForeground} />
            </Pressable>
          )}
          <Pressable accessibilityLabel={isListening ? 'Stop voice command' : 'Start voice command'} testID="voice-command" disabled={isChatting} onPress={() => void startVoiceCommand()} style={({ pressed }) => [styles.micButton, { backgroundColor: isListening ? colors.primary : colors.secondary, opacity: isChatting ? 0.45 : pressed ? 0.75 : 1 }]}>
            <Feather name={isListening ? 'square' : 'mic'} size={17} color={isListening ? colors.primaryForeground : colors.secondaryForeground} />
          </Pressable>
          <Pressable disabled={isChatting} onPress={submit} style={({ pressed }) => [styles.sendButton, { backgroundColor: draft.trim() && !isChatting ? colors.primary : colors.muted, opacity: isChatting ? 0.55 : pressed ? 0.78 : 1 }]}>
            <Feather name="arrow-up" size={18} color={draft.trim() && !isChatting ? colors.primaryForeground : colors.mutedForeground} />
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
  headerActions: { flexDirection: 'row', alignItems: 'center' },
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
  speakButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  speakLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 15, padding: 11, marginBottom: 15 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 16, fontFamily: 'Inter_500Medium' },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14 },
  typingBubble: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  typingText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
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
