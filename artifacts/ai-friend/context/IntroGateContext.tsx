import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type IntroGateContextValue = {
  introComplete: boolean | null;
  completeIntro: () => Promise<void>;
};

export const IntroGateContext = createContext<IntroGateContextValue | null>(null);

const INTRO_COMPLETE_KEY = '@ai-friend/onboarding-intro-complete';

export function IntroGateProvider({ children }: { children: ReactNode }) {
  const [introComplete, setIntroComplete] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(INTRO_COMPLETE_KEY)
      .then((value) => {
        if (active) setIntroComplete(value === 'true');
      })
      .catch(() => {
        if (active) setIntroComplete(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const completeIntro = useCallback(async () => {
    try {
      await AsyncStorage.setItem(INTRO_COMPLETE_KEY, 'true');
    } catch {
      // Continue even if this device cannot persist the intro preference.
    }
    setIntroComplete(true);
  }, []);

  const value = useMemo(() => ({ introComplete, completeIntro }), [introComplete, completeIntro]);
  return <IntroGateContext.Provider value={value}>{children}</IntroGateContext.Provider>;
}

export function useIntroGate() {
  const context = useContext(IntroGateContext);
  if (!context) {
    throw new Error('useIntroGate must be used within an IntroGateProvider.');
  }
  return context;
}