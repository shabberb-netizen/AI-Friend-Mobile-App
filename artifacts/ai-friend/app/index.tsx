import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { useIntroGate } from '@/context/IntroGateContext';

export default function IndexRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const { introComplete } = useIntroGate();

  if (!isLoaded || introComplete === null) return null;
  if (isSignedIn) return <Redirect href="/(tabs)" />;
  return <Redirect href={introComplete ? '/(auth)/sign-in' : '/(auth)/welcome'} />;
}