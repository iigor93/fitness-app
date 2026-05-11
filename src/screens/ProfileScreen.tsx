import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Platform } from 'react-native';

import type { AppInstance } from '../services/storage/instanceStorage';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type ProfileScreenProps = {
  instance: AppInstance;
  isDeleting: boolean;
  onDelete: () => Promise<void>;
};

const headingFontFamily = Platform.select({
  android: 'sans-serif-condensed',
  ios: 'AvenirNext-DemiBold',
  default: 'sans-serif',
});

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

        <View style={styles.card}>
          <Text style={styles.label}>UUID</Text>
          <Text style={styles.uuid}>{instance.uuid}</Text>
        </View>

        <Pressable
          disabled={isDeleting}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && !isDeleting ? styles.deleteButtonPressed : null,
            isDeleting ? styles.deleteButtonDisabled : null,
          ]}
        >
          <Text style={styles.deleteButtonText}>
            {isDeleting ? 'Удаляем...' : 'Удалить данные'}
          </Text>
        </Pressable>
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
    color: '#8F8F8F',
    fontFamily: headingFontFamily,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F3E4D2',
    fontFamily: headingFontFamily,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: '#8A847E',
    fontFamily: headingFontFamily,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#1B1D1D',
    borderColor: '#4C4C4C',
    borderRadius: 0,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  label: {
    color: '#8A847E',
    fontFamily: headingFontFamily,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  uuid: {
    color: '#F1F1F1',
    fontFamily: headingFontFamily,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 28,
  },
  deleteButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FF120D',
    borderRadius: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: 18,
  },
  deleteButtonPressed: {
    opacity: 0.85,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#FFF4EF',
    fontFamily: headingFontFamily,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
