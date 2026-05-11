import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';

type DumbbellLogoProps = {
  size?: number;
};

export function DumbbellLogo({ size = 96 }: DumbbellLogoProps) {
  const plateWidth = size * 0.09;
  const plateGap = size * 0.03;
  const barWidth = size * 0.38;
  const barHeight = size * 0.06;
  const plateHeights = [size * 0.24, size * 0.18, size * 0.12];
  const plateStep = plateWidth + plateGap * 0.6;
  const leftAnchor = size / 2 - barWidth / 2 - plateGap - plateWidth;
  const rightAnchor = size / 2 + barWidth / 2 + plateGap;

  return (
    <View style={[styles.container, { width: size, height: size * 0.48 }]}>
      {plateHeights.map((height, index) => (
        <View
          key={`left-${index}`}
          style={[
            styles.plate,
            {
              width: plateWidth,
              height,
              left: leftAnchor - index * plateStep,
              top: size * 0.24 - height / 2,
            },
          ]}
        />
      ))}

      <View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: barHeight,
            left: size / 2 - barWidth / 2,
            top: size * 0.24 - barHeight / 2,
          },
        ]}
      />

      {plateHeights.map((height, index) => (
        <View
          key={`right-${index}`}
          style={[
            styles.plate,
            {
              width: plateWidth,
              height,
              left: rightAnchor + index * plateStep,
              top: size * 0.24 - height / 2,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plate: {
    backgroundColor: colors.primary,
    position: 'absolute',
  },
  bar: {
    backgroundColor: colors.primary,
    position: 'absolute',
  },
});
