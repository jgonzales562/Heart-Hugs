import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
  Svg,
} from 'react-native-svg';

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
      <CircularGradientBackdrop />
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

function CircularGradientBackdrop() {
  return (
    <Svg
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={styles.decorativeLayer}
      viewBox="0 0 390 844"
      width="100%"
    >
      <Defs>
        <RadialGradient id="sunsetAura" cx="48%" cy="45%" r="56%">
          <Stop offset="0%" stopColor="#FFD04B" stopOpacity="0.62" />
          <Stop offset="30%" stopColor="#FF8B3D" stopOpacity="0.42" />
          <Stop offset="60%" stopColor="#FF4F87" stopOpacity="0.24" />
          <Stop offset="100%" stopColor="#D63C91" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="waterAura" cx="44%" cy="48%" r="58%">
          <Stop offset="0%" stopColor="#66E2DA" stopOpacity="0.56" />
          <Stop offset="38%" stopColor="#42CFC8" stopOpacity="0.32" />
          <Stop offset="70%" stopColor="#7653C8" stopOpacity="0.2" />
          <Stop offset="100%" stopColor="#482073" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="dreamAura" cx="52%" cy="46%" r="56%">
          <Stop offset="0%" stopColor="#E4ED76" stopOpacity="0.45" />
          <Stop offset="35%" stopColor="#E6D7FF" stopOpacity="0.36" />
          <Stop offset="66%" stopColor="#D63C91" stopOpacity="0.18" />
          <Stop offset="100%" stopColor="#8B236F" stopOpacity="0" />
        </RadialGradient>
        <SvgLinearGradient id="flowCurrent" x1="0%" x2="100%" y1="40%" y2="60%">
          <Stop offset="0%" stopColor="#42DBD3" stopOpacity="0" />
          <Stop offset="35%" stopColor="#42DBD3" stopOpacity="0.16" />
          <Stop offset="68%" stopColor="#FF4F87" stopOpacity="0.14" />
          <Stop offset="100%" stopColor="#FFD04B" stopOpacity="0" />
        </SvgLinearGradient>
      </Defs>

      <Path
        d="M205 -116C326 -155 480 -48 468 94C455 242 335 284 222 229C119 179 84 -12 205 -116Z"
        fill="url(#sunsetAura)"
      />
      <Path
        d="M-143 318C-40 230 130 269 177 401C222 527 120 650 -22 638C-159 627 -228 409 -143 318Z"
        fill="url(#waterAura)"
      />
      <Path
        d="M252 612C376 548 488 653 464 790C439 930 261 955 194 842C135 744 165 657 252 612Z"
        fill="url(#dreamAura)"
      />
      <Path
        d="M-92 662C27 568 124 720 232 659C310 615 361 537 479 569"
        fill="none"
        stroke="url(#flowCurrent)"
        strokeLinecap="round"
        strokeWidth="104"
      />
    </Svg>
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
    position: 'absolute',
    right: 0,
    top: 0,
    pointerEvents: 'none',
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
