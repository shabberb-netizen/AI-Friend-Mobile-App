import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ScreenMode = 'morning' | 'night' | 'auto';

type ThemeContextValue = {
  screenMode: ScreenMode;
  setScreenMode: (mode: ScreenMode) => void;
};

const STORAGE_KEY = 'ai-friend-screen-mode';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [screenMode, setScreenModeState] = useState<ScreenMode>('night');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'morning' || stored === 'night' || stored === 'auto') setScreenModeState(stored);
      })
      .catch(() => undefined);
  }, []);

  const setScreenMode = (mode: ScreenMode) => {
    setScreenModeState(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => undefined);
  };

  return <ThemeContext.Provider value={{ screenMode, setScreenMode }}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode must be used inside ThemeProvider');
  return context;
}