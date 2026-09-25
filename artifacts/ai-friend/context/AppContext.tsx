import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/expo';
import { fetch as expoFetch } from 'expo/fetch';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  generateAiAsset,
  getSyncState,
  updateSyncState,
  type GenerateAiAssetRequest,
  type GeneratedAiAsset,
  type SyncSnapshot,
} from '@workspace/api-client-react';

export type AppMode = 'online' | 'offline';
export type RoleplayMode = 'friend' | 'study' | 'romantic';
export type Message = {
  id: string;
  text: string;
  sender: 'user' | 'friend';
  time: string;
};

export type Friend = {
  id: string;
  name: string;
  phone: string;
  locationSharing: boolean;
  lastLocation?: SafetyLocation;
};

export type SafetyLocation = {
  latitude: number;
  longitude: number;
  sharedAt: string;
};

export type FriendMessage = {
  id: string;
  friendId: string;
  text: string;
  sender: 'me' | 'friend';
  time: string;
};

export type GalleryAsset = GeneratedAiAsset & {
  localKey?: 'sunlit' | 'blueHour';
};

export type AppSettings = {
  mode: AppMode;
  cloudSync: boolean;
  locationCheckIns: boolean;
  emailCheckIns: boolean;
  voiceCommands: boolean;
  headphoneControls: boolean;
};

type AppContextValue = {
  settings: AppSettings;
  messages: Message[];
  roleplayMode: RoleplayMode;
  gallery: GalleryAsset[];
  hydrated: boolean;
  isChatting: boolean;
  chatError: string | null;
  isGenerating: boolean;
  generationError: string | null;
  syncError: string | null;
  friends: Friend[];
  friendMessages: FriendMessage[];
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setCloudSync: (enabled: boolean) => Promise<void>;
  toggleMode: () => void;
  setRoleplayMode: (mode: RoleplayMode) => void;
  sendMessage: (text: string) => Promise<void>;
  createAsset: (request: Omit<GenerateAiAssetRequest, 'prompt'> & { prompt: string }) => Promise<GalleryAsset | null>;
  saveAsset: (asset: GalleryAsset) => Promise<void>;
  addFriend: (name: string, phone: string) => boolean;
  removeFriend: (friendId: string) => void;
  sendFriendMessage: (friendId: string, text: string) => void;
  setFriendLocationSharing: (friendId: string, sharing: boolean, location?: SafetyLocation) => void;
};

const STORAGE_KEY = 'ai-friend-local-state';
const initialSettings: AppSettings = {
  mode: 'offline',
  cloudSync: false,
  locationCheckIns: false,
  emailCheckIns: false,
  voiceCommands: false,
  headphoneControls: false,
};

const initialMessages: Message[] = [
  {
    id: 'welcome',
    text: 'Hey, I’m here. You can talk to me about your day, ask me to help you study, or make something creative together.',
    sender: 'friend',
    time: 'Now',
  },
];

const AppContext = createContext<AppContextValue | null>(null);

function nowLabel() {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date());
}

function makeFriendReply(text: string, mode: AppMode, roleplayMode: RoleplayMode) {
  const normalized = text.toLowerCase();
  if (roleplayMode === 'romantic') {
    if (normalized.includes('sad') || normalized.includes('lonely') || normalized.includes('stress')) {
      return 'Come a little closer to the conversation. I’m listening, and we can take this one gentle step at a time.';
    }
    return 'In this fictional romantic role-play, I’m right here with you. Tell me what kind of moment you want to imagine.';
  }
  if (roleplayMode === 'study') {
    return 'Your study buddy is ready. Give me the subject, the part that feels difficult, and how much time you have today.';
  }
  if (roleplayMode === 'friend') {
    return 'I’m here as your fictional everyday friend. Tell me the honest version, even if it is messy.';
  }
  if (normalized.includes('study') || normalized.includes('learn')) {
    return 'Absolutely. Tell me the subject and your deadline, and I’ll turn it into a small, manageable study plan.';
  }
  if (normalized.includes('image') || normalized.includes('photo') || normalized.includes('design')) {
    return 'Let’s make it. Describe the mood, subject, and any changes you want, like outfit, background, or lighting.';
  }
  if (normalized.includes('sad') || normalized.includes('lonely') || normalized.includes('stress')) {
    return 'I’m listening. You don’t have to make it sound neat. What feels heaviest right now?';
  }
  if (mode === 'offline') {
    return 'I’m in offline mode, so this stays on your phone. I can still help you reflect, plan, write, and shape ideas here.';
  }
  return 'I’m with you. We can keep talking, make a plan, or turn that thought into something useful.';
}

function apiUrl(path: string) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}${path}` : path;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readError(response: Response) {
  const body = await response.text().catch(() => '');
  try {
    const parsed = JSON.parse(body) as { error?: string };
    return parsed.error ?? `Request failed (${response.status})`;
  } catch {
    return body || `Request failed (${response.status})`;
  }
}

async function streamOnlineChat(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  onContent: (content: string) => void,
) {
  const response = await expoFetch(apiUrl('/api/ai/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ messages: history }),
  });
  if (!response.ok) throw new Error(await readError(response));
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Online AI returned no response stream.');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data) continue;
      const parsed = JSON.parse(data) as { content?: string; error?: string };
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.content) {
        fullContent += parsed.content;
        onContent(parsed.content);
      }
    }
  }
  if (!fullContent) throw new Error('Online AI returned an empty response.');
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [roleplayMode, setRoleplayMode] = useState<RoleplayMode>('friend');
  const [gallery, setGallery] = useState<GalleryAsset[]>([]);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [isChatting, setIsChatting] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncReady, setSyncReady] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendMessages, setFriendMessages] = useState<FriendMessage[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed = JSON.parse(stored) as Partial<{ settings: AppSettings; messages: Message[]; gallery: GalleryAsset[]; roleplayMode: RoleplayMode; friends: Friend[]; friendMessages: FriendMessage[] }>;
        if (parsed.settings) setSettings({ ...initialSettings, ...parsed.settings });
        if (parsed.messages?.length) setMessages(parsed.messages);
        if (parsed.gallery?.length) setGallery(parsed.gallery);
        if (parsed.roleplayMode) setRoleplayMode(parsed.roleplayMode);
        if (parsed.friends?.length) setFriends(parsed.friends);
        if (parsed.friendMessages?.length) setFriendMessages(parsed.friendMessages);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated || !isSignedIn) {
      setSyncReady(false);
      return;
    }

    let active = true;
    void getSyncState()
      .then((remote) => {
        if (!active) return;
        if (remote.enabled) {
          const state = remote.state as SyncSnapshot;
          if (state.settings && typeof state.settings === 'object') {
            setSettings((current) => ({ ...current, ...(state.settings as Partial<AppSettings>), cloudSync: true }));
          }
          if (Array.isArray(state.messages) && state.messages.length) setMessages(state.messages as Message[]);
          if (Array.isArray(state.gallery)) setGallery(state.gallery as GalleryAsset[]);
          if (typeof state.roleplayMode === 'string') setRoleplayMode(state.roleplayMode as RoleplayMode);
          if (Array.isArray(state.friends)) setFriends(state.friends as Friend[]);
          if (Array.isArray(state.friendMessages)) setFriendMessages(state.friendMessages as FriendMessage[]);
        }
        setSyncError(null);
        setSyncReady(true);
      })
      .catch(() => {
        if (!active) return;
        setSyncError('Cloud sync is unavailable right now. Your local copy is still safe.');
        setSyncReady(true);
      });

    return () => {
      active = false;
    };
  }, [hydrated, isSignedIn]);

  const syncSnapshot = (): SyncSnapshot => ({
    settings,
    messages,
    gallery,
    roleplayMode,
    friends,
    friendMessages,
  });

  useEffect(() => {
    if (!syncReady || !isSignedIn || !settings.cloudSync) return;
    const timer = setTimeout(() => {
      void updateSyncState({ enabled: true, state: syncSnapshot() })
        .then(() => setSyncError(null))
        .catch(() => setSyncError('Could not save the latest cloud copy. Your local copy is still safe.'));
    }, 400);
    return () => clearTimeout(timer);
  }, [friendMessages, friends, gallery, isSignedIn, messages, roleplayMode, settings, syncReady]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, messages, gallery, roleplayMode, friends, friendMessages })).catch(() => undefined);
  }, [friendMessages, friends, gallery, hydrated, messages, roleplayMode, settings]);

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      messages,
      roleplayMode,
      gallery,
      hydrated,
      isChatting,
      chatError,
      isGenerating,
      generationError,
      syncError,
      friends,
      friendMessages,
      updateSetting: (key, value) => setSettings((current) => ({ ...current, [key]: value })),
      setCloudSync: async (enabled) => {
        if (!isSignedIn) {
          setSyncError('Sign in before turning on cloud sync.');
          return;
        }
        setSyncError(null);
        setSettings((current) => ({ ...current, cloudSync: enabled }));
        try {
          await updateSyncState(
            enabled
              ? { enabled: true, state: syncSnapshot() }
              : { enabled: false, clearCloudCopy: true },
          );
        } catch {
          setSyncError(enabled ? 'Cloud sync could not be enabled. Your local copy is still safe.' : 'Cloud sync could not be turned off. Try again.');
          if (enabled) setSettings((current) => ({ ...current, cloudSync: false }));
        }
      },
      toggleMode: () => setSettings((current) => ({ ...current, mode: current.mode === 'offline' ? 'online' : 'offline' })),
      setRoleplayMode,
      sendMessage: async (text) => {
        const cleanText = text.trim();
        if (!cleanText) return;
        const time = nowLabel();
        const userMessage = { id: makeId('user'), text: cleanText, sender: 'user' as const, time };
        const currentMessages = [...messages];
        setChatError(null);
        setMessages((current) => [...current, userMessage]);

        if (settings.mode === 'offline') {
          setMessages((current) => [
            ...current,
            { id: makeId('friend'), text: makeFriendReply(cleanText, settings.mode, roleplayMode), sender: 'friend', time },
          ]);
          return;
        }

        setIsChatting(true);
        let assistantId: string | null = null;
        let assistantText = '';
        try {
          await streamOnlineChat(
            [
              ...currentMessages
                .filter((message) => message.sender === 'user' || message.sender === 'friend')
                .map((message) => ({ role: message.sender === 'friend' ? ('assistant' as const) : ('user' as const), content: message.text })),
              { role: 'user', content: roleplayMode === 'friend' ? cleanText : `[Fictional ${roleplayMode} role-play] ${cleanText}` },
            ],
            (content) => {
              assistantText += content;
              if (!assistantId) {
                assistantId = makeId('friend');
                setMessages((current) => [...current, { id: assistantId!, text: assistantText, sender: 'friend', time: nowLabel() }]);
              } else {
                setMessages((current) => current.map((message) => (message.id === assistantId ? { ...message, text: assistantText } : message)));
              }
            },
          );
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'Online AI could not answer.';
          setChatError(`Online unavailable — using offline fallback. ${reason}`);
          setMessages((current) => [
            ...current,
            {
              id: makeId('friend'),
              text: `${makeFriendReply(cleanText, 'offline', roleplayMode)} This answer stayed on your phone because Online mode was unavailable.`,
              sender: 'friend',
              time: nowLabel(),
            },
          ]);
        } finally {
          setIsChatting(false);
        }
      },
      createAsset: async (request) => {
        const prompt = request.prompt.trim();
        if (!prompt) return null;
        setGenerationError(null);
        setIsGenerating(true);
        try {
          if (settings.mode === 'offline') {
            const localAsset: GalleryAsset = {
              id: makeId('local'),
              type: request.type,
              title: request.action ?? (request.type === 'video' ? 'Offline motion idea' : 'Offline idea'),
              prompt,
              text: request.type === 'story' ? `A small beginning:\n\n${prompt}\n\nKeep this idea close and build it one gentle step at a time.` : undefined,
              localKey: request.type === 'story' ? 'blueHour' : 'sunlit',
              status: 'complete',
              provider: 'On-device preview',
            };
            return localAsset;
          }
          const asset = await generateAiAsset(request);
          return asset;
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'Online generation failed.';
          setGenerationError(`Could not create this online. ${reason}`);
          return null;
        } finally {
          setIsGenerating(false);
        }
      },
      saveAsset: async (asset) => {
        setGallery((current) => [asset, ...current.filter((item) => item.id !== asset.id)].slice(0, 20));
      },
      addFriend: (name, phone) => {
        const cleanName = name.trim();
        const cleanPhone = phone.trim();
        if (!cleanName || !cleanPhone) return false;
        setFriends((current) => [...current, { id: makeId('friend'), name: cleanName, phone: cleanPhone, locationSharing: false }]);
        return true;
      },
      removeFriend: (friendId) => {
        setFriends((current) => current.filter((friend) => friend.id !== friendId));
        setFriendMessages((current) => current.filter((message) => message.friendId !== friendId));
      },
      sendFriendMessage: (friendId, text) => {
        const cleanText = text.trim();
        if (!cleanText) return;
        setFriendMessages((current) => [...current, { id: makeId('friend-message'), friendId, text: cleanText, sender: 'me', time: nowLabel() }]);
      },
      setFriendLocationSharing: (friendId, sharing, location) => {
        setFriends((current) => current.map((friend) => friend.id === friendId ? { ...friend, locationSharing: sharing, lastLocation: sharing ? location : undefined } : friend));
      },
    }),
    [chatError, friendMessages, friends, gallery, generationError, hydrated, isChatting, isGenerating, isSignedIn, messages, roleplayMode, settings, syncError],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}