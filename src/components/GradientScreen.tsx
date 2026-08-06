import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gradients, theme } from '../theme';

type GradientScreenProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  gradientColors?: readonly [string, string, ...string[]];
  includeBottomSafeArea?: boolean;
  scroll?: boolean;
};

export function GradientScreen({
  children,
  contentContainerStyle,
  gradientColors = gradients.screen,
  includeBottomSafeArea = false,
  scroll = false,
}: GradientScreenProps) {
  return (
    <LinearGradient colors={gradientColors} style={styles.gradient}>
      <View pointerEvents="none" style={styles.decorativeLayer}>
        <View style={styles.aquaBloom} />
        <View style={styles.lavenderBloom} />
        <View style={styles.flowBand} />
        <View style={styles.largeRing} />
        <View style={styles.smallRing} />
      </View>
      <SafeAreaView
        edges={includeBottomSafeArea ? ['top', 'bottom', 'left', 'right'] : ['top', 'left', 'right']}
        style={styles.safeArea}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, contentContainerStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    overflow: 'hidden',
  },
  decorativeLayer: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  aquaBloom: {
    backgroundColor: 'rgba(73, 190, 176, 0.3)',
    borderRadius: theme.radius.full,
    height: 280,
    position: 'absolute',
    right: -118,
    top: -72,
    width: 280,
  },
  lavenderBloom: {
    backgroundColor: 'rgba(137, 105, 190, 0.32)',
    borderRadius: theme.radius.full,
    height: 230,
    left: -126,
    position: 'absolute',
    top: 360,
    width: 230,
  },
  flowBand: {
    backgroundColor: 'rgba(229, 138, 120, 0.22)',
    borderRadius: theme.radius.full,
    height: 124,
    left: -96,
    position: 'absolute',
    right: -160,
    top: 650,
    transform: [{ rotate: '-12deg' }],
  },
  largeRing: {
    borderColor: 'rgba(117, 199, 193, 0.28)',
    borderRadius: theme.radius.full,
    borderWidth: 2,
    height: 330,
    position: 'absolute',
    right: -188,
    top: 470,
    width: 330,
  },
  smallRing: {
    borderColor: 'rgba(255, 255, 255, 0.48)',
    borderRadius: theme.radius.full,
    borderWidth: 2,
    height: 116,
    left: 24,
    position: 'absolute',
    top: 170,
    width: 116,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
});
