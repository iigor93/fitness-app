import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { spacing } from '../theme/spacing';

type OnboardingScreenProps = {
  isSubmitting: boolean;
  onSubmit: (name: string) => Promise<void>;
};

const headingFontFamily = Platform.select({
  android: 'sans-serif-condensed',
  ios: 'AvenirNext-DemiBold',
  default: 'sans-serif',
});

export function OnboardingScreen({
  isSubmitting,
  onSubmit,
}: OnboardingScreenProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Введите имя, чтобы продолжить.');
      return;
    }

    setError('');
    await onSubmit(trimmedName);
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 24}
        style={styles.flex}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroBlock}>
            <Text style={styles.title}>Добро пожаловать</Text>
          </View>

          <View style={styles.card}>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isSubmitting}
              onChangeText={(value) => {
                setName(value);
                if (error) {
                  setError('');
                }
              }}
              onSubmitEditing={handleSubmit}
              placeholder="Введите ваше имя"
              placeholderTextColor="#656565"
              returnKeyType="done"
              style={styles.input}
              value={name}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.button,
                pressed && !isSubmitting ? styles.buttonPressed : null,
                isSubmitting ? styles.buttonDisabled : null,
              ]}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Сохраняем...' : 'Продолжить'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.caption}>
            Продолжая, вы соглашаетесь с нашей политикой конфиденциальности и
            условиями использования.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 120,
    paddingBottom: spacing.xl,
  },
  heroBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    color: '#F3E4D2',
    fontFamily: headingFontFamily,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#1B1D1D',
    borderColor: '#4C4C4C',
    borderRadius: 0,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 28,
  },
  input: {
    borderBottomColor: '#5A5A5A',
    borderBottomWidth: 1,
    color: '#F0F0F0',
    fontFamily: headingFontFamily,
    fontSize: 25,
    fontWeight: '700',
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  error: {
    color: '#FF8A8A',
    fontFamily: headingFontFamily,
    fontSize: 14,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#FF120D',
    borderRadius: 0,
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 18,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF4EF',
    fontFamily: headingFontFamily,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  caption: {
    color: '#77706A',
    fontFamily: headingFontFamily,
    fontSize: 12,
    lineHeight: 22,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
