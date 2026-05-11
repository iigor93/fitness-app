import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DumbbellLogo } from '../components/ui/DumbbellLogo';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import {
  clearAppInstance,
  loadAppInstance,
  saveAppInstance,
  type AppInstance,
} from '../services/storage/instanceStorage';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function generateUuid() {
  const cryptoApi = (
    globalThis as {
      crypto?: {
        getRandomValues?: (array: Uint8Array) => Uint8Array;
        randomUUID?: () => string;
      };
    }
  ).crypto;

  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  const bytes = new Uint8Array(16);

  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

export function RootNavigator() {
  const [instance, setInstance] = useState<AppInstance | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      const storedInstance = await loadAppInstance();
      setInstance(storedInstance);
      setIsBootstrapping(false);
    }

    bootstrap();
  }, []);

  async function handleCreateInstance(name: string) {
    try {
      setIsSubmitting(true);

      const nextInstance = {
        name,
        uuid: generateUuid(),
      };

      await saveAppInstance(nextInstance);
      setInstance(nextInstance);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteInstance() {
    try {
      setIsDeleting(true);
      await clearAppInstance();
      setInstance(null);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isBootstrapping) {
    return (
      <View style={styles.loadingContainer}>
        <DumbbellLogo size={116} />
        <Text style={styles.loadingText}>IRON TRACK</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={instance ? 'profile' : 'onboarding'}
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '700',
        },
      }}
    >
      {instance ? (
        <Stack.Screen name="Profile">
          {() => (
            <ProfileScreen
              instance={instance}
              isDeleting={isDeleting}
              onDelete={handleDeleteInstance}
            />
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Onboarding">
          {() => (
            <OnboardingScreen
              isSubmitting={isSubmitting}
              onSubmit={handleCreateInstance}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: 20,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textAccent,
    ...typography.sectionLabel,
    fontSize: 18,
    letterSpacing: 1.4,
  },
});
