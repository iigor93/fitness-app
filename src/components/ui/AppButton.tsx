import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type AppButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'success';
};

export function AppButton({
  disabled = false,
  label,
  onPress,
  variant = 'primary',
}: AppButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'success' ? styles.buttonSuccess : styles.buttonPrimary,
        pressed && !disabled
          ? variant === 'success'
            ? styles.buttonSuccessPressed
            : styles.buttonPrimaryPressed
          : null,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 18,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  buttonSuccess: {
    backgroundColor: '#1F9D55',
  },
  buttonSuccessPressed: {
    backgroundColor: '#188448',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.textOnPrimary,
    ...typography.button,
  },
});
