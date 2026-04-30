import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gradients, theme } from '../theme';

type GradientScreenProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  gradientColors?: readonly [string, string, ...string[]];
  scroll?: boolean;
};

export function GradientScreen({
  children,
  contentContainerStyle,
  gradientColors = gradients.screen,
  scroll = false,
}: GradientScreenProps) {
  return (
    <LinearGradient colors={gradientColors} style={styles.gradient}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
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
