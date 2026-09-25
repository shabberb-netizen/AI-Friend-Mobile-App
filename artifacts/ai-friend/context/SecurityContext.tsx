import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const STORAGE_KEY = 'ai-friend-account-security';
const DEACTIVATION_DAYS = 25;

type StoredSecurityState = {
  biometricEnabled?: boolean;
  profilePhotoUri?: string | null;
  deactivationRequestedAt?: string | null;
};

type SecurityContextValue = {
  ready: boolean;
  locked: boolean;
  biometricEnabled: boolean;
  profilePhotoUri: string | null;
  deactivationRequestedAt: string | null;
  daysUntilDeletion: number | null;
  enableBiometric: () => Promise<{ enabled: boolean; message?: string }>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  unlock: () => Promise<boolean>;
  setProfilePhotoUri: (uri: string | null) => void;
  requestDeactivation: () => void;
  cancelDeactivation: () => void;
};

const SecurityContext = createContext<SecurityContextValue | null>(null);

function daysRemaining(requestedAt: string | null) {
  if (!requestedAt) return null;
  const deadline = new Date(requestedAt).getTime() + DEACTIVATION_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [profilePhotoUri, setProfilePhotoUriState] = useState<string | null>(null);
  const [deactivationRequestedAt, setDeactivationRequestedAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!mounted) return;
        const stored = value ? JSON.parse(value) as StoredSecurityState : {};
        const enabled = stored.biometricEnabled === true && Platform.OS !== 'web';
        setBiometricEnabledState(enabled);
        setProfilePhotoUriState(stored.profilePhotoUri ?? null);
        setDeactivationRequestedAt(stored.deactivationRequestedAt ?? null);
        setLocked(enabled);
        setReady(true);
      })
      .catch(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const stored: StoredSecurityState = { biometricEnabled, profilePhotoUri, deactivationRequestedAt };
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [biometricEnabled, deactivationRequestedAt, profilePhotoUri, ready]);

  useEffect(() => {
    if (!ready || !biometricEnabled || Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') setLocked(true);
    });
    return () => subscription.remove();
  }, [biometricEnabled, ready]);

  const unlock = async () => {
    if (!biometricEnabled || Platform.OS === 'web') {
      setLocked(false);
      return true;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock AI Friend',
      cancelLabel: 'Use device passcode',
      disableDeviceFallback: false,
    });
    if (result.success) setLocked(false);
    return result.success;
  };

  const enableBiometric = async () => {
    if (Platform.OS === 'web') return { enabled: false, message: 'Device lock is available in the iOS or Android app.' };
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return { enabled: false, message: 'This device does not have Face ID, fingerprint, or a secure lock screen.' };
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return { enabled: false, message: 'Set up Face ID, fingerprint, or a device passcode before enabling the app lock.' };
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirm app lock for AI Friend', disableDeviceFallback: false });
    if (!result.success) return { enabled: false, message: 'App lock was not enabled.' };
    setBiometricEnabledState(true);
    setLocked(false);
    return { enabled: true };
  };

  const value = useMemo<SecurityContextValue>(() => ({
    ready,
    locked,
    biometricEnabled,
    profilePhotoUri,
    deactivationRequestedAt,
    daysUntilDeletion: daysRemaining(deactivationRequestedAt),
    enableBiometric,
    setBiometricEnabled: async (enabled) => {
      if (enabled) {
        await enableBiometric();
      } else {
        setBiometricEnabledState(false);
        setLocked(false);
      }
    },
    unlock,
    setProfilePhotoUri: setProfilePhotoUriState,
    requestDeactivation: () => setDeactivationRequestedAt(new Date().toISOString()),
    cancelDeactivation: () => setDeactivationRequestedAt(null),
  }), [biometricEnabled, deactivationRequestedAt, locked, profilePhotoUri, ready]);

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}

export function useSecurity() {
  const value = useContext(SecurityContext);
  if (!value) throw new Error('useSecurity must be used within SecurityProvider');
  return value;
}

export function SecurityGate({ children }: { children: React.ReactNode }) {
  const security = useSecurity();
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (!security.ready || !security.locked || unlocking) return;
    setUnlocking(true);
    void security.unlock().finally(() => setUnlocking(false));
  }, [security]);

  if (!security.ready || !security.locked) return <>{children}</>;

  return (
    <View style={styles.lockScreen}>
      <Text style={styles.lockEyebrow}>PRIVATE CIRCLE</Text>
      <Text style={styles.lockTitle}>AI Friend is locked</Text>
      <Text style={styles.lockBody}>Use Face ID, fingerprint, or your device passcode to continue.</Text>
      <Pressable onPress={() => void security.unlock()} style={styles.unlockButton}>
        <Text style={styles.unlockText}>{unlocking ? 'Checking…' : 'Unlock AI Friend'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  lockScreen: { flex: 1, backgroundColor: '#08091A', alignItems: 'center', justifyContent: 'center', padding: 28 },
  lockEyebrow: { color: '#FF7D68', fontSize: 10, fontWeight: '700', letterSpacing: 1.6, marginBottom: 12 },
  lockTitle: { color: '#F6F4FF', fontSize: 28, fontWeight: '700', textAlign: 'center' },
  lockBody: { color: '#A6A4BC', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12, maxWidth: 300 },
  unlockButton: { backgroundColor: '#FF7D68', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14, marginTop: 24 },
  unlockText: { color: '#21111A', fontSize: 13, fontWeight: '700' },
});