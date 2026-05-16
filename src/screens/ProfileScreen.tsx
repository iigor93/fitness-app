import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import type { AppInstance } from '../services/storage/instanceStorage';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type ProfileScreenProps = {
  instance: AppInstance;
  isDeleting: boolean;
  onDelete: () => Promise<void>;
};

export function ProfileScreen({
  instance,
  isDeleting,
  onDelete,
}: ProfileScreenProps) {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Ваш профиль</Text>
          <Text style={styles.title}>Привет, {instance.name}</Text>
          <Text style={styles.subtitle}>
            Ниже пока показываем сохранённый идентификатор экземпляра
            приложения.
          </Text>
        </View>

        <AppCard style={styles.card}>
          <Text style={styles.label}>UUID</Text>
          <Text style={styles.uuid}>{instance.uuid}</Text>
        </AppCard>

        <AppButton
          disabled={isDeleting}
          label={isDeleting ? 'Удаляем...' : 'Удалить данные'}
          onPress={onDelete}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  hero: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.textSecondary,
    ...typography.sectionLabel,
  },
  title: {
    color: colors.textAccent,
    ...typography.title,
  },
  subtitle: {
    color: colors.textSecondary,
    ...typography.body,
  },
  card: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.sectionLabel,
    color: colors.textSecondary,
    fontSize: 13,
    letterSpacing: 1,
  },
  uuid: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 28,
  },
});
