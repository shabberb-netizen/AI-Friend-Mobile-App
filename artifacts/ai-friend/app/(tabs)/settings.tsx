import { Feather } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/expo';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSettings, useApp } from '@/context/AppContext';
import { ScreenMode, useThemeMode } from '@/context/ThemeContext';
import { useColors } from '@/hooks/useColors';
import { useSecurity } from '@/context/SecurityContext';
import * as Location from 'expo-location';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { Alert, AppState, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { PermissionResponse } from 'expo';
import {
  listSocialConnections,
  revokeSocialConnection,
  updateSocialConnection,
  type SocialConnection,
} from '@workspace/api-client-react';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, toggleMode, updateSetting, setCloudSync, syncError } = useApp();
  const { screenMode, setScreenMode } = useThemeMode();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const security = useSecurity();
  const isOffline = settings.mode === 'offline';
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [refreshedLocationPermission, setRefreshedLocationPermission] = useState<PermissionResponse | null>(null);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  const effectiveLocationPermission = refreshedLocationPermission ?? locationPermission;

  useEffect(() => {
    if (!isSignedIn) {
      setConnections([]);
      return;
    }
    let active = true;
    void listSocialConnections()
      .then((result) => {
        if (active) {
          setConnections(result);
          setConnectionsError(null);
        }
      })
      .catch(() => {
        if (active) setConnectionsError('Connection choices are unavailable right now.');
      });
    return () => {
      active = false;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    let mounted = true;
    const refreshPermission = async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (mounted) setRefreshedLocationPermission(permission);
      } catch {
        if (mounted) setLocationError('Location permission status is unavailable on this device.');
      }
    };

    void refreshPermission();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshPermission();
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const openDeviceSettings = () => {
    if (Platform.OS === 'web') return;
    void Linking.openSettings().catch(() => {
      Alert.alert('Settings unavailable', 'Open your device settings and allow access for AI Friend there.');
    });
  };

  const handleLocationToggle = async (enabled: boolean) => {
    setLocationError(null);
    if (!enabled) {
      updateSetting('locationCheckIns', false);
      return;
    }
    if (Platform.OS === 'web') {
      Alert.alert('Location check-ins need a mobile device', 'Native location permission is available on iOS and Android. This web preview will not turn location check-ins on.');
      return;
    }

    const permission = await requestLocationPermission();
    setRefreshedLocationPermission(permission);
    if (!permission.granted) {
      updateSetting('locationCheckIns', false);
      setLocationError(permission.canAskAgain ? 'Location access was not granted. Check-ins remain off.' : 'Location access is blocked. Open device settings to turn it back on.');
      if (!permission.canAskAgain) {
        Alert.alert('Location access blocked', 'AI Friend cannot turn this permission back on. Open device settings to allow location while using the app.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: openDeviceSettings },
        ]);
      }
      return;
    }
    updateSetting('locationCheckIns', true);
  };

  const makeLocationCheckIn = async () => {
    setLocationError(null);
    if (Platform.OS === 'web') return;
    let permission = effectiveLocationPermission;
    if (!permission?.granted) {
      permission = await requestLocationPermission();
      setRefreshedLocationPermission(permission);
    }
    if (!permission.granted) {
      setLocationError(permission.canAskAgain ? 'Location access was denied. Check-ins are paused.' : 'Location access was revoked. Open device settings to allow it again.');
      return;
    }
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const timestamp = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date());
      setLastCheckIn(`Checked in at ${timestamp} · ${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`);
    } catch {
      setLocationError('We could not read your location. Check that device location services are on and try again.');
    }
  };

  const handleEmailToggle = (enabled: boolean) => {
    if (!enabled) {
      updateSetting('emailCheckIns', false);
      return;
    }
    Alert.alert(
      'Email check-ins are opt-in',
      'Nothing is sent automatically. When you explicitly use a supported send action, the email contains the check-in time and the note you choose. Location is included only when you also choose a location check-in.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Opt in', onPress: () => updateSetting('emailCheckIns', true) },
      ],
    );
  };

  const handleVoiceToggle = async (enabled: boolean) => {
    if (!enabled) {
      updateSetting('voiceCommands', false);
      return;
    }
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Microphone access is off',
        permission.canAskAgain
          ? 'Voice commands stay off until you allow microphone access.'
          : 'Microphone access is blocked for AI Friend. Open device settings to turn it back on.',
        permission.canAskAgain
          ? [{ text: 'Not now', style: 'cancel' }]
          : [
              { text: 'Not now', style: 'cancel' },
              { text: 'Open Settings', onPress: openDeviceSettings },
            ],
      );
      return;
    }
    updateSetting('voiceCommands', true);
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const result = await security.enableBiometric();
      if (!result.enabled && result.message) Alert.alert('App lock not enabled', result.message);
      return;
    }
    await security.setBiometricEnabled(false);
  };

  const handleProfilePhoto = async () => {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access is off', 'Allow photo access to choose a profile picture. AI Friend will keep the selected image on this device.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) security.setProfilePhotoUri(result.assets[0].uri);
  };

  const handleDeactivation = () => {
    if (security.deactivationRequestedAt) {
      Alert.alert('Cancel account deactivation?', 'Your account will remain active on this device.', [
        { text: 'Keep deactivation', style: 'cancel' },
        { text: 'Cancel deactivation', onPress: security.cancelDeactivation },
      ]);
      return;
    }
    Alert.alert(
      'Deactivate account?',
      'Your account will be marked for deletion after 25 days. You can cancel during that period. Server deletion will begin only after the secure account service is connected.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: security.requestDeactivation },
      ],
    );
  };

  const handleCloudSyncToggle = (enabled: boolean) => {
    if (!isSignedIn) {
      Alert.alert('Sign in to sync', 'Your chats and creations stay on this phone until you sign in and explicitly turn on cloud sync.');
      return;
    }
    if (!enabled) {
      Alert.alert(
        'Turn off cloud sync?',
        'This stops future uploads and removes the cloud copy. Your local chats and creations stay on this phone.',
        [
          { text: 'Keep it on', style: 'cancel' },
          { text: 'Turn off and remove', style: 'destructive', onPress: () => void setCloudSync(false) },
        ],
      );
      return;
    }
    Alert.alert(
      'Cloud sync is opt-in',
      'AI Friend will sync your chat history, settings, friends, and generated media metadata to your signed-in account. You can turn this off and remove the cloud copy at any time.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Turn on sync', onPress: () => void setCloudSync(true) },
      ],
    );
  };

  const handleConnectionToggle = (connection: SocialConnection) => {
    if (connection.connected) {
      Alert.alert(
        `Disconnect ${connection.displayName}?`,
        'AI Friend will stop using this connection and remove its consent record. Other connections are not affected.',
        [
          { text: 'Keep connected', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => {
              void revokeSocialConnection(connection.provider)
                .then(() => setConnections((current) => current.map((item) => item.provider === connection.provider ? { ...item, connected: false, authorizedAt: null } : item)))
                .catch(() => setConnectionsError(`Could not disconnect ${connection.displayName}. Try again.`));
            },
          },
        ],
      );
      return;
    }

    Alert.alert(
      `Allow ${connection.displayName}?`,
      `${connection.description}\n\nCan read:\n• ${connection.readCapabilities.join('\n• ')}\n\nCan send:\n• ${connection.sendCapabilities.join('\n• ')}\n\nAI Friend will not access anything outside these supported API capabilities.`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Allow connection',
          onPress: () => {
            void updateSocialConnection(connection.provider, { enabled: true })
              .then((updated) => setConnections((current) => current.map((item) => item.provider === updated.provider ? updated : item)))
              .catch(() => setConnectionsError(`Could not connect ${connection.displayName}. Try again.`));
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign out of AI Friend?', 'Your local copy stays on this phone. Cloud sync pauses until you sign in again.', [
      { text: 'Stay signed in', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>CONTROL CENTER</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Your settings</Text>
        </View>
        <View style={[styles.settingsIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="sliders" size={18} color={colors.secondaryForeground} />
        </View>
      </View>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Choose what AI Friend can access. Nothing sensitive turns on silently.</Text>

      <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.accountIcon, { backgroundColor: colors.accent }]}><Feather name={isSignedIn ? 'check-circle' : 'user'} size={17} color={colors.accentForeground} /></View>
        <View style={styles.accountCopy}>
          <Text style={[styles.accountTitle, { color: colors.foreground }]}>{isSignedIn ? 'Account connected' : 'Connect your account'}</Text>
          <Text style={[styles.accountBody, { color: colors.mutedForeground }]}>{isSignedIn ? user?.primaryEmailAddress?.emailAddress ?? 'Signed in securely' : 'Sync trusted friends, messages, and safety circles across devices.'}</Text>
        </View>
        <Pressable onPress={() => isSignedIn ? handleSignOut() : router.push('/(auth)/sign-in')} style={[styles.accountButton, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.accountButtonText, { color: colors.secondaryForeground }]}>{isSignedIn ? 'Sign out' : 'Sign in'}</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account security</Text>
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {security.profilePhotoUri ? (
          <Image source={{ uri: security.profilePhotoUri }} style={styles.profilePhoto} />
        ) : (
          <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
            <Feather name="user" size={21} color={colors.primaryForeground} />
          </View>
        )}
        <View style={styles.profileCopy}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>Profile picture</Text>
          <Text style={[styles.profileBody, { color: colors.mutedForeground }]}>Choose a picture stored on this device.</Text>
        </View>
        <Pressable onPress={() => void handleProfilePhoto()} style={[styles.smallAction, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.smallActionText, { color: colors.secondaryForeground }]}>Upload</Text>
        </Pressable>
      </View>
      <View style={[styles.securityGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="lock" title="Face, fingerprint, or PIN lock" description="Ask for your device lock when AI Friend opens" value={security.biometricEnabled} onChange={(value) => void handleBiometricToggle(value)} colors={colors} />
      </View>
      <View style={[styles.verificationCard, { backgroundColor: colors.secondary }]}>
        <View style={[styles.verificationIcon, { backgroundColor: colors.violet }]}>
          <Feather name="shield" size={16} color={colors.primaryForeground} />
        </View>
        <View style={styles.verificationCopy}>
          <Text style={[styles.verificationTitle, { color: colors.foreground }]}>Identity verification</Text>
          <Text style={[styles.verificationBody, { color: colors.secondaryForeground }]}>Supported proof types: Aadhaar, passport, driving licence, or voter ID. A hosted KYC provider is not connected yet, so no document is uploaded or stored.</Text>
          <Text style={[styles.verificationMeta, { color: colors.mutedForeground }]}>One person / one account can only be enforced after the provider returns a verified-ID fingerprint.</Text>
        </View>
      </View>
      <View style={[styles.lifecycleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.lifecycleCopy}>
          <Text style={[styles.lifecycleTitle, { color: colors.foreground }]}>{security.deactivationRequestedAt ? 'Deactivation scheduled' : 'Deactivate account'}</Text>
          <Text style={[styles.lifecycleBody, { color: colors.mutedForeground }]}>
            {security.deactivationRequestedAt
              ? `${security.daysUntilDeletion ?? 0} days left in the 25-day recovery period.`
              : 'Start a 25-day recovery period before permanent deletion.'}
          </Text>
        </View>
        <Pressable onPress={handleDeactivation} style={[styles.lifecycleButton, { backgroundColor: security.deactivationRequestedAt ? colors.secondary : colors.coralSoft }]}>
          <Text style={[styles.lifecycleButtonText, { color: security.deactivationRequestedAt ? colors.secondaryForeground : colors.primary }]}>
            {security.deactivationRequestedAt ? 'Cancel' : 'Deactivate'}
          </Text>
        </Pressable>
      </View>
      <View style={[styles.pricingCard, { backgroundColor: colors.secondary }]}>
        <Feather name="gift" size={16} color={colors.secondaryForeground} />
        <Text style={[styles.pricingText, { color: colors.secondaryForeground }]}>AI Friend is currently in trial mode. No payment or subscription is required.</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Private sync</Text>
      <View style={[styles.settingGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow
          icon="cloud"
          title="Cloud sync"
          description={isSignedIn ? 'Sync chats, settings, friends, and media metadata only when enabled' : 'Sign in first; local-only storage remains the default'}
          value={settings.cloudSync}
          onChange={handleCloudSyncToggle}
          colors={colors}
        />
      </View>
      {syncError && <Text style={[styles.inlineError, { color: colors.destructive }]}>{syncError}</Text>}
      <Text style={[styles.privacyNote, { color: colors.mutedForeground }]}>Offline mode and cloud sync are separate choices. Online AI can be used without saving a cloud copy.</Text>

      {isSignedIn && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Optional connections</Text>
          <Text style={[styles.sectionIntro, { color: colors.mutedForeground }]}>Each service is separate. Review the exact read and send capabilities before allowing it. No broad social-app access is requested.</Text>
          {connections.map((connection) => (
            <View key={connection.provider} style={[styles.connectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.connectionHeader}>
                <View style={[styles.connectionIcon, { backgroundColor: connection.connected ? colors.mint : colors.secondary }]}>
                  <Feather name={connection.connected ? 'check' : 'link'} size={16} color={connection.connected ? colors.mintText : colors.secondaryForeground} />
                </View>
                <View style={styles.connectionCopy}>
                  <Text style={[styles.connectionTitle, { color: colors.foreground }]}>{connection.displayName}</Text>
                  <Text style={[styles.connectionStatus, { color: connection.connected ? colors.mintText : colors.mutedForeground }]}>{connection.connected ? 'Allowed for supported APIs' : 'Not connected'}</Text>
                </View>
                <Pressable onPress={() => handleConnectionToggle(connection)} style={[styles.connectionButton, { backgroundColor: connection.connected ? colors.secondary : colors.primary }]}>
                  <Text style={[styles.connectionButtonText, { color: connection.connected ? colors.secondaryForeground : colors.primaryForeground }]}>{connection.connected ? 'Disconnect' : 'Review & allow'}</Text>
                </Pressable>
              </View>
              <Text style={[styles.connectionDescription, { color: colors.mutedForeground }]}>{connection.description}</Text>
              <Text style={[styles.capabilityText, { color: colors.secondaryForeground }]}><Text style={{ fontFamily: 'Inter_700Bold' }}>Reads:</Text> {connection.readCapabilities.join(' · ')}</Text>
              <Text style={[styles.capabilityText, { color: colors.secondaryForeground }]}><Text style={{ fontFamily: 'Inter_700Bold' }}>Sends:</Text> {connection.sendCapabilities.join(' · ')}</Text>
            </View>
          ))}
          {connectionsError && <Text style={[styles.inlineError, { color: colors.destructive }]}>{connectionsError}</Text>}
        </>
      )}

      <Pressable onPress={toggleMode} style={({ pressed }) => [styles.modeCard, { backgroundColor: isOffline ? colors.indigo : colors.primary, opacity: pressed ? 0.9 : 1 }]}>
        <View style={[styles.modeCardIcon, { backgroundColor: isOffline ? colors.violet : colors.coralSoft }]}>
          <Feather name={isOffline ? 'shield' : 'cloud'} size={21} color={isOffline ? colors.primaryForeground : colors.primary} />
        </View>
        <View style={styles.modeCopy}>
          <Text style={[styles.modeLabel, { color: isOffline ? colors.accentForeground : colors.primaryForeground }]}>{isOffline ? 'OFFLINE MODE' : 'ONLINE MODE'}</Text>
          <Text style={[styles.modeTitle, { color: isOffline ? colors.foreground : colors.primaryForeground }]}>{isOffline ? 'Private by default' : 'More capable, still yours'}</Text>
          <Text style={[styles.modeBody, { color: isOffline ? colors.accentForeground : colors.primaryForeground }]}>{isOffline ? 'Chat, plan, and create with what is saved on your phone.' : 'Use cloud intelligence for richer answers and generation.'}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={isOffline ? colors.foreground : colors.primaryForeground} />
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Screen brightness</Text>
      <View style={[styles.displayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.displayHeader}>
          <View style={[styles.displayIcon, { backgroundColor: colors.secondary }]}>
            <Feather name={screenMode === 'night' ? 'moon' : 'sun'} size={17} color={colors.secondaryForeground} />
          </View>
          <View style={styles.displayCopy}>
            <Text style={[styles.displayTitle, { color: colors.foreground }]}>Choose your screen mood</Text>
            <Text style={[styles.displayBody, { color: colors.mutedForeground }]}>This changes AI Friend’s brightness and colors, not your phone’s hardware brightness.</Text>
          </View>
        </View>
        <View style={[styles.displayOptions, { backgroundColor: colors.secondary }]}>
          <DisplayOption mode="morning" label="Morning" icon="sun" selected={screenMode === 'morning'} onPress={() => setScreenMode('morning')} colors={colors} />
          <DisplayOption mode="night" label="Night" icon="moon" selected={screenMode === 'night'} onPress={() => setScreenMode('night')} colors={colors} />
          <DisplayOption mode="auto" label="Auto" icon="smartphone" selected={screenMode === 'auto'} onPress={() => setScreenMode('auto')} colors={colors} />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Permissions & access</Text>
      <View style={[styles.settingGroup, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ perspective: 800 }, { rotateX: '3deg' }], shadowColor: '#000000', shadowOpacity: 0.28, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 7 }]}>
        <SettingRow icon="map-pin" title="Location check-ins" description="Ask for foreground location only when you opt in" value={settings.locationCheckIns} onChange={handleLocationToggle} colors={colors} />
        <Divider colors={colors} />
        <SettingRow icon="mail" title="Email check-ins" description="Opt in before a requested email can be sent" value={settings.emailCheckIns} onChange={handleEmailToggle} colors={colors} />
        <Divider colors={colors} />
        <SettingRow icon="mic" title="Voice commands" description="Ask for microphone access when you start listening" value={settings.voiceCommands} onChange={handleVoiceToggle} colors={colors} />
        <Divider colors={colors} />
        <SettingRow icon="headphones" title="Earbud controls" description="Use supported start and pause speech actions" value={settings.headphoneControls} onChange={(value) => updateSetting('headphoneControls', value)} colors={colors} />
      </View>

      {settings.locationCheckIns && (
        <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.featureIcon, { backgroundColor: colors.mint }]}>
            <Feather name={effectiveLocationPermission?.granted ? 'navigation' : 'slash'} size={16} color={colors.mintText} />
          </View>
          <View style={styles.featureCopy}>
            <Text style={[styles.featureTitle, { color: colors.foreground }]}>
              {effectiveLocationPermission?.granted ? 'Location access is ready' : effectiveLocationPermission?.status === 'denied' ? 'Location access is denied or revoked' : 'Checking location access…'}
            </Text>
            <Text style={[styles.featureBody, { color: colors.mutedForeground }]}>
              {effectiveLocationPermission?.granted
                ? 'A check-in reads your current position only after you tap the button below.'
                : 'Check-ins are paused until you allow location while AI Friend is in use.'}
            </Text>
            {effectiveLocationPermission?.granted ? (
              <Pressable testID="location-check-in" onPress={() => void makeLocationCheckIn()} style={({ pressed }) => [styles.featureAction, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}>
                <Feather name="map-pin" size={14} color={colors.secondaryForeground} />
                <Text style={[styles.featureActionText, { color: colors.secondaryForeground }]}>Check in now</Text>
              </Pressable>
            ) : effectiveLocationPermission?.status === 'denied' && !effectiveLocationPermission.canAskAgain ? (
              <Pressable testID="open-location-settings" onPress={openDeviceSettings} style={({ pressed }) => [styles.featureAction, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}>
                <Feather name="settings" size={14} color={colors.secondaryForeground} />
                <Text style={[styles.featureActionText, { color: colors.secondaryForeground }]}>Open device settings</Text>
              </Pressable>
            ) : null}
            {lastCheckIn && <Text style={[styles.featureMeta, { color: colors.mintText }]}>{lastCheckIn}</Text>}
            {locationError && <Text style={[styles.featureMeta, { color: colors.destructive }]}>{locationError}</Text>}
          </View>
        </View>
      )}

      {settings.emailCheckIns && (
        <View style={[styles.disclosureCard, { backgroundColor: colors.secondary }]}>
          <Feather name="mail" size={15} color={colors.secondaryForeground} />
          <Text style={[styles.disclosureText, { color: colors.secondaryForeground }]}>Email stays off by default. AI Friend sends nothing in the background; a future send action must be requested by you and includes only the check-in time and your chosen note.</Text>
        </View>
      )}

      <View style={[styles.notice, { backgroundColor: colors.secondary }]}>
        <Feather name="info" size={16} color={colors.secondaryForeground} />
        <Text style={[styles.noticeText, { color: colors.secondaryForeground }]}>Calls and messages stay inside OS-supported dial or compose screens. AI Friend never auto-answers calls, silently sends messages, or tracks you in the background.</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your companion</Text>
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ perspective: 800 }, { rotateY: '-3deg' }], shadowColor: '#000000', shadowOpacity: 0.28, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 7 }]}>
        <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
          <Feather name="heart" size={21} color={colors.primaryForeground} />
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>AI Friend</Text>
          <Text style={[styles.profileBody, { color: colors.mutedForeground }]}>Friendly, thoughtful, and learning your boundaries.</Text>
        </View>
        <Pressable onPress={() => Alert.alert('Companion profile', 'Personalization and memory controls will live here. Your local chat is already stored on this device.')} style={styles.moreButton}>
          <Feather name="more-horizontal" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SettingRow({ icon, title, description, value, onChange, colors }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; description: string; value: boolean; onChange: (value: boolean) => void; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={16} color={colors.secondaryForeground} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.muted, true: colors.primary }} thumbColor={colors.card} ios_backgroundColor={colors.muted} />
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

function DisplayOption({ mode, label, icon, selected, onPress, colors }: { mode: ScreenMode; label: string; icon: React.ComponentProps<typeof Feather>['name']; selected: boolean; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label} screen mode`} style={({ pressed }) => [styles.displayOption, { backgroundColor: selected ? colors.card : 'transparent', borderColor: selected ? colors.violet : 'transparent', opacity: pressed ? 0.76 : 1 }]}>
      <Feather name={icon} size={14} color={selected ? colors.primary : colors.mutedForeground} />
      <Text style={[styles.displayOptionText, { color: selected ? colors.foreground : colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22 },
  eyebrow: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, marginBottom: 7 },
  title: { fontSize: 25, fontFamily: 'Inter_700Bold', letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular', marginHorizontal: 22, marginTop: 9, maxWidth: 340 },
  settingsIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modeCard: { marginHorizontal: 22, marginTop: 22, borderRadius: 24, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 12, transform: [{ perspective: 800 }, { rotateX: '5deg' }, { rotateY: '2deg' }], shadowColor: '#000000', shadowOpacity: 0.38, shadowRadius: 17, shadowOffset: { width: 0, height: 12 }, elevation: 9 },
  modeCardIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modeCopy: { flex: 1 },
  modeLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.3, marginBottom: 4 },
  modeTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  modeBody: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  accountCard: { marginHorizontal: 22, marginTop: 17, borderWidth: 1, borderRadius: 20, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  accountIcon: { width: 35, height: 35, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  accountCopy: { flex: 1 },
  accountTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  accountBody: { fontSize: 10, lineHeight: 14, fontFamily: 'Inter_400Regular' },
  accountButton: { borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8 },
  accountButtonText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  displayCard: { marginHorizontal: 22, borderWidth: 1, borderRadius: 22, padding: 14, shadowColor: '#000000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  displayHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  displayIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  displayCopy: { flex: 1 },
  displayTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  displayBody: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  displayOptions: { flexDirection: 'row', gap: 5, padding: 4, borderRadius: 15, marginTop: 14 },
  displayOption: { flex: 1, minHeight: 38, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  displayOptionText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginHorizontal: 22, marginTop: 27, marginBottom: 12 },
  settingGroup: { marginHorizontal: 22, borderWidth: 1, borderRadius: 22, paddingHorizontal: 14 },
  settingRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11 },
  settingIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1 },
  settingTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  settingDescription: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  divider: { height: 1, marginLeft: 45 },
  inlineError: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_500Medium', marginHorizontal: 22, marginTop: 8 },
  privacyNote: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular', marginHorizontal: 22, marginTop: 8 },
  sectionIntro: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular', marginHorizontal: 22, marginTop: -4, marginBottom: 12 },
  connectionCard: { marginHorizontal: 22, borderWidth: 1, borderRadius: 20, padding: 13, marginBottom: 10 },
  connectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  connectionIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  connectionCopy: { flex: 1 },
  connectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  connectionStatus: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  connectionButton: { borderRadius: 11, paddingHorizontal: 9, paddingVertical: 8 },
  connectionButtonText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  connectionDescription: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular', marginTop: 10 },
  capabilityText: { fontSize: 9, lineHeight: 14, fontFamily: 'Inter_400Regular', marginTop: 5 },
  featureCard: { marginHorizontal: 22, marginTop: 12, borderWidth: 1, borderRadius: 19, padding: 13, flexDirection: 'row', gap: 10 },
  featureIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  featureCopy: { flex: 1 },
  featureTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  featureBody: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  featureAction: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 8, marginTop: 10 },
  featureActionText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  featureMeta: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_500Medium', marginTop: 8 },
  disclosureCard: { marginHorizontal: 22, marginTop: 12, borderRadius: 17, padding: 12, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  disclosureText: { flex: 1, fontSize: 10, lineHeight: 15, fontFamily: 'Inter_500Medium' },
  notice: { marginHorizontal: 22, marginTop: 14, borderRadius: 17, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  noticeText: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_500Medium', flex: 1 },
  profileCard: { marginHorizontal: 22, borderWidth: 1, borderRadius: 22, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  profileAvatar: { width: 42, height: 42, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  profilePhoto: { width: 42, height: 42, borderRadius: 17 },
  profileCopy: { flex: 1 },
  profileName: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  profileBody: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  moreButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  smallAction: { borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8 },
  smallActionText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  securityGroup: { marginHorizontal: 22, borderWidth: 1, borderRadius: 22, paddingHorizontal: 14 },
  verificationCard: { marginHorizontal: 22, marginTop: 12, borderRadius: 19, padding: 13, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  verificationIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  verificationCopy: { flex: 1 },
  verificationTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  verificationBody: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  verificationMeta: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular', marginTop: 7 },
  lifecycleCard: { marginHorizontal: 22, marginTop: 12, borderWidth: 1, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  lifecycleCopy: { flex: 1 },
  lifecycleTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  lifecycleBody: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  lifecycleButton: { borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8 },
  lifecycleButtonText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  pricingCard: { marginHorizontal: 22, marginTop: 12, borderRadius: 17, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  pricingText: { flex: 1, fontSize: 10, lineHeight: 15, fontFamily: 'Inter_500Medium' },
});
