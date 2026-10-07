import { LinearGradient } from 'expo-linear-gradient';
import { memo, useId, type ReactElement, type ReactNode } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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

const DEFAULT_BACKGROUND_OVERLAY_COLORS = [
  'rgba(27, 16, 55, 0.38)',
  'rgba(27, 16, 55, 0.74)',
  'rgba(19, 9, 42, 0.92)',
] as const;
const FULL_SAFE_AREA_EDGES = ['top', 'bottom', 'left', 'right'] as const;
const TOP_SAFE_AREA_EDGES = ['top', 'left', 'right'] as const;

type GradientScreenProps = {
  readonly backgroundImageSource?: ImageSourcePropType;
  readonly backgroundOverlayColors?: readonly [string, string, ...string[]];
  readonly children: ReactNode;
  readonly contentContainerStyle?: StyleProp<ViewStyle>;
  readonly gradientColors?: readonly [string, string, ...string[]];
  readonly includeBottomSafeArea?: boolean;
  readonly scroll?: boolean;
  readonly scrollEnabled?: boolean;
};

export function GradientScreen({
  backgroundImageSource,
  backgroundOverlayColors = DEFAULT_BACKGROUND_OVERLAY_COLORS,
  children,
  contentContainerStyle,
  gradientColors = gradients.screen,
  includeBottomSafeArea = false,
  scroll = false,
  scrollEnabled = true,
}: GradientScreenProps): ReactElement {
  return (
    <View style={styles.gradient}>
      {backgroundImageSource ? (
        <ImageBackground
          accessible={false}
          imageStyle={styles.backgroundImage}
          resizeMode="cover"
          source={backgroundImageSource}
          style={styles.backgroundLayer}
        >
          <LinearGradient colors={backgroundOverlayColors} style={styles.backgroundOverlay} />
        </ImageBackground>
      ) : (
        <LinearGradient colors={gradientColors} style={styles.backgroundLayer}>
          <CircularGradientBackdrop />
        </LinearGradient>
      )}
      <SafeAreaView
        edges={includeBottomSafeArea ? FULL_SAFE_AREA_EDGES : TOP_SAFE_AREA_EDGES}
        style={styles.safeArea}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentContainerStyle]}
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, contentContainerStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

const CircularGradientBackdrop = memo(function CircularGradientBackdrop(): ReactElement {
  const gradientIdPrefix = useId().replace(/:/g, '');
  const sunsetAuraId = `${gradientIdPrefix}-sunsetAura`;
  const waterAuraId = `${gradientIdPrefix}-waterAura`;
  const dreamAuraId = `${gradientIdPrefix}-dreamAura`;
  const flowCurrentId = `${gradientIdPrefix}-flowCurrent`;

  return (
    <Svg
      accessible={false}
      height="100%"
      pointerEvents="none"
      preserveAspectRatio="xMidYMid slice"
      style={styles.decorativeLayer}
      viewBox="0 0 390 844"
      width="100%"
    >
      <Defs>
        <RadialGradient id={sunsetAuraId} cx="48%" cy="45%" r="56%">
          <Stop offset="0%" stopColor="#FFDC38" stopOpacity="0.9" />
          <Stop offset="30%" stopColor="#FF7A2F" stopOpacity="0.7" />
          <Stop offset="60%" stopColor="#FF3F82" stopOpacity="0.46" />
          <Stop offset="100%" stopColor="#D63C91" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={waterAuraId} cx="44%" cy="48%" r="58%">
          <Stop offset="0%" stopColor="#49F0E3" stopOpacity="0.86" />
          <Stop offset="38%" stopColor="#19CFC8" stopOpacity="0.6" />
          <Stop offset="70%" stopColor="#6F3FD1" stopOpacity="0.38" />
          <Stop offset="100%" stopColor="#482073" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={dreamAuraId} cx="52%" cy="46%" r="56%">
          <Stop offset="0%" stopColor="#EAF257" stopOpacity="0.74" />
          <Stop offset="35%" stopColor="#C9A7FF" stopOpacity="0.62" />
          <Stop offset="66%" stopColor="#E72B9A" stopOpacity="0.38" />
          <Stop offset="100%" stopColor="#8B236F" stopOpacity="0" />
        </RadialGradient>
        <SvgLinearGradient id={flowCurrentId} x1="0%" x2="100%" y1="40%" y2="60%">
          <Stop offset="0%" stopColor="#42DBD3" stopOpacity="0" />
          <Stop offset="35%" stopColor="#25E1D6" stopOpacity="0.34" />
          <Stop offset="68%" stopColor="#FF3E8C" stopOpacity="0.32" />
          <Stop offset="100%" stopColor="#FFD04B" stopOpacity="0" />
        </SvgLinearGradient>
      </Defs>

      <Path
        d="M205 -116C326 -155 480 -48 468 94C455 242 335 284 222 229C119 179 84 -12 205 -116Z"
        fill={`url(#${sunsetAuraId})`}
      />
      <Path
        d="M-143 318C-40 230 130 269 177 401C222 527 120 650 -22 638C-159 627 -228 409 -143 318Z"
        fill={`url(#${waterAuraId})`}
      />
      <Path
        d="M252 612C376 548 488 653 464 790C439 930 261 955 194 842C135 744 165 657 252 612Z"
        fill={`url(#${dreamAuraId})`}
      />
      <Path
        d="M-92 662C27 568 124 720 232 659C310 615 361 537 479 569"
        fill="none"
        stroke={`url(#${flowCurrentId})`}
        strokeLinecap="round"
        strokeWidth="104"
      />
    </Svg>
  );
});

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    overflow: 'hidden',
  },
  backgroundImage: {
    height: '100%',
    width: '100%',
  },
  backgroundLayer: StyleSheet.absoluteFill,
  backgroundOverlay: {
    flex: 1,
  },
  decorativeLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
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
