import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppMode = 'online' | 'offline';
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
  hydrated: boolean;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  toggleMode: () => void;
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

function makeFriendReply(text: string, mode: AppMode) {
  const normalized = text.toLowerCase();
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
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed = JSON.parse(stored) as Partial<{ settings: AppSettings; messages: Message[] }>;
        if (parsed.settings) setSettings({ ...initialSettings, ...parsed.settings });
        if (parsed.messages?.length) setMessages(parsed.messages);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, messages })).catch(() => undefined);
  }, [hydrated, messages, settings]);

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      messages,
      hydrated,
      updateSetting: (key, value) => setSettings((current) => ({ ...current, [key]: value })),
      toggleMode: () => setSettings((current) => ({ ...current, mode: current.mode === 'offline' ? 'online' : 'offline' })),
      sendMessage: (text) => {
        const cleanText = text.trim();
        if (!cleanText) return;
        const time = nowLabel();
        setMessages((current) => [
          ...current,
          { id: `${Date.now()}-user`, text: cleanText, sender: 'user', time },
          { id: `${Date.now()}-friend`, text: makeFriendReply(cleanText, settings.mode), sender: 'friend', time },
        ]);
      },
    }),
    [hydrated, messages, settings],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}