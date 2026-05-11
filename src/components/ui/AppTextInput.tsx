import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function AppTextInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#656565"
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderBottomColor: colors.borderStrong,
    borderBottomWidth: 1,
    color: colors.textPrimary,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    ...typography.input,
  },
});
