import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { AppTextInput } from '../components/ui/AppTextInput';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type OnboardingScreenProps = {
  isSubmitting: boolean;
  onSubmit: (name: string) => Promise<void>;
};

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

          <AppCard style={styles.card}>
            <AppTextInput
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
              returnKeyType="done"
              value={name}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppButton
              disabled={isSubmitting}
              label={isSubmitting ? 'Сохраняем...' : 'Продолжить'}
              onPress={handleSubmit}
            />
          </AppCard>

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
    color: colors.textAccent,
    ...typography.title,
  },
  card: {
    marginBottom: spacing.xl,
  },
  error: {
    ...typography.sectionLabel,
    color: colors.danger,
    fontSize: 14,
  },
  caption: {
    color: colors.textMuted,
    ...typography.caption,
  },
});
