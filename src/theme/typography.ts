import { Platform } from 'react-native';

export const fontFamily = Platform.select({
  android: 'sans-serif-condensed',
  ios: 'AvenirNext-DemiBold',
  default: 'sans-serif',
});

export const typography = {
  title: {
    fontFamily,
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 40,
    textTransform: 'uppercase' as const,
  },
  sectionLabel: {
    fontFamily,
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
  },
  input: {
    fontFamily,
    fontSize: 25,
    fontWeight: '700' as const,
  },
  button: {
    fontFamily,
    fontSize: 20,
    fontWeight: '800' as const,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily,
    fontSize: 12,
    lineHeight: 22,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
  },
} as const;
