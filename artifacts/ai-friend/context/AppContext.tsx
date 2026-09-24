import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppMode = 'online' | 'offline';
export type RoleplayMode = 'friend' | 'study' | 'romantic';
export type Message = {
  id: string;
  text: string;
  sender: 'user' | 'friend';
  time: string;
};

export type AppSettings = {
  mode: AppMode;
  locationCheckIns: boolean;
  emailCheckIns: boolean;
  voiceCommands: boolean;
  headphoneControls: boolean;
};

type AppContextValue = {
  settings: AppSettings;
  messages: Message[];
  roleplayMode: RoleplayMode;
  hydrated: boolean;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  toggleMode: () => void;
  setRoleplayMode: (mode: RoleplayMode) => void;
  sendMessage: (text: string) => void;
};

const STORAGE_KEY = 'ai-friend-local-state';
const initialSettings: AppSettings = {
  mode: 'offline',
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [roleplayMode, setRoleplayMode] = useState<RoleplayMode>('friend');
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed = JSON.parse(stored) as Partial<{ settings: AppSettings; messages: Message[]; roleplayMode: RoleplayMode }>;
        if (parsed.settings) setSettings({ ...initialSettings, ...parsed.settings });
        if (parsed.messages?.length) setMessages(parsed.messages);
        if (parsed.roleplayMode) setRoleplayMode(parsed.roleplayMode);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, messages, roleplayMode })).catch(() => undefined);
  }, [hydrated, messages, roleplayMode, settings]);

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      messages,
      roleplayMode,
      hydrated,
      updateSetting: (key, value) => setSettings((current) => ({ ...current, [key]: value })),
      toggleMode: () => setSettings((current) => ({ ...current, mode: current.mode === 'offline' ? 'online' : 'offline' })),
      setRoleplayMode,
      sendMessage: (text) => {
        const cleanText = text.trim();
        if (!cleanText) return;
        const time = nowLabel();
        setMessages((current) => [
          ...current,
          { id: `${Date.now()}-user`, text: cleanText, sender: 'user', time },
          { id: `${Date.now()}-friend`, text: makeFriendReply(cleanText, settings.mode, roleplayMode), sender: 'friend', time },
        ]);
      },
    }),
    [hydrated, messages, roleplayMode, settings],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}