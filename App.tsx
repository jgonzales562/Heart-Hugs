import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Bookmark, Heart } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { GradientScreen } from './src/components/GradientScreen';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { BreathingPressable } from './src/components/BreathingPressable';
import { WELLNESS_DISCLAIMER_VERSION } from './src/constants/disclaimer';
import { DISCLAIMER_ACCEPTANCE_KEY } from './src/constants/storage';
import { SettingsScreen } from './src/screens/AboutScreen';
import { TodayScreen } from './src/screens/HomeScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { SavedScreen } from './src/screens/SavedScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { WellnessProvider, useWellness } from './src/state/WellnessProvider';
import { colors, theme } from './src/theme';
import { MainTabParamList, RootStackParamList } from './src/types/navigation';
import {
  createDisclaimerAcceptance,
  hasAcceptedDisclaimerVersion,
  isLegacyDisclaimerAcceptance,
  serializeDisclaimerAcceptance,
} from './src/utils/disclaimerAcceptance';

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: colors.canvas,
    border: colors.border,
    card: colors.surface,
    primary: colors.leafDeep,
    text: colors.textPrimary,
  },
};

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.sunshine,
        tabBarActiveBackgroundColor: 'rgba(255, 79, 135, 0.2)',
        tabBarInactiveTintColor: colors.lavender,
        tabBarHideOnKeyboard: true,
        tabBarButton: ({ ref: _ref, ...props }) => (
          <BreathingPressable
            {...props}
            containerStyle={props.style}
            style={styles.tabBarPressable}
          />
        ),
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Heart color={color} size={22} strokeWidth={focused ? 2.6 : 2} />
          ),
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Bookmark color={color} size={22} strokeWidth={focused ? 2.6 : 2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={AppTabs} />
      <Stack.Screen name="Player" component={PlayerScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function MainExperience() {
  const { isHydrated } = useWellness();

  if (!isHydrated) {
    return (
      <GradientScreen contentContainerStyle={styles.loadingScreen} includeBottomSafeArea>
        <ActivityIndicator color={colors.leafDeep} />
      </GradientScreen>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState<boolean | null>(null);
  const [isAcceptingDisclaimer, setIsAcceptingDisclaimer] = useState(false);
  const [disclaimerError, setDisclaimerError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function hydrateDisclaimerState() {
      const storedValue = await AsyncStorage.getItem(DISCLAIMER_ACCEPTANCE_KEY);
      const hasAcceptedCurrentVersion = hasAcceptedDisclaimerVersion(
        storedValue,
        WELLNESS_DISCLAIMER_VERSION
      );

      if (isLegacyDisclaimerAcceptance(storedValue)) {
        const migratedAcceptance = createDisclaimerAcceptance(WELLNESS_DISCLAIMER_VERSION);

        await AsyncStorage.setItem(
          DISCLAIMER_ACCEPTANCE_KEY,
          serializeDisclaimerAcceptance(migratedAcceptance)
        ).catch((error) => {
          console.warn('Unable to migrate legacy disclaimer acceptance.', error);
        });
      }

      if (isMounted) {
        setHasAcceptedDisclaimer(hasAcceptedCurrentVersion);
      }
    }

    hydrateDisclaimerState().catch((error) => {
      console.warn('Unable to load disclaimer acceptance.', error);

      if (isMounted) {
        setHasAcceptedDisclaimer(false);
        setDisclaimerError(
          'We could not verify your previous acceptance. Please review and accept the disclaimer.'
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function acceptDisclaimer() {
    if (isAcceptingDisclaimer) {
      return;
    }

    setIsAcceptingDisclaimer(true);
    setDisclaimerError(null);

    try {
      const acceptance = createDisclaimerAcceptance(WELLNESS_DISCLAIMER_VERSION);
      await AsyncStorage.setItem(
        DISCLAIMER_ACCEPTANCE_KEY,
        serializeDisclaimerAcceptance(acceptance)
      );
      setHasAcceptedDisclaimer(true);
    } catch (error) {
      console.warn('Unable to save disclaimer acceptance.', error);
      setDisclaimerError('Your acceptance could not be saved. Please try again.');
    } finally {
      setIsAcceptingDisclaimer(false);
    }
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {hasAcceptedDisclaimer === null ? (
          <GradientScreen contentContainerStyle={styles.loadingScreen} includeBottomSafeArea>
            <View style={styles.brandMark}>
              <Heart color={colors.rose} fill={colors.roseSoft} size={28} />
            </View>
            <ActivityIndicator color={colors.leafDeep} />
          </GradientScreen>
        ) : hasAcceptedDisclaimer ? (
          <WellnessProvider>
            <MainExperience />
          </WellnessProvider>
        ) : (
          <WelcomeScreen
            errorMessage={disclaimerError}
            isAccepting={isAcceptingDisclaimer}
            onAccept={acceptDisclaimer}
          />
        )}
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.midnight,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 28,
    borderTopWidth: 0,
    borderWidth: 1,
    bottom: 14,
    height: 72,
    left: 22,
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    position: 'absolute',
    right: 22,
    shadowColor: colors.shadow,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
  },
  tabItem: {
    borderRadius: theme.radius.md,
    marginHorizontal: theme.spacing.xs,
  },
  tabBarPressable: {
    flex: 1,
  },
  tabLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.xs,
  },
  loadingScreen: {
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.lg,
    justifyContent: 'center',
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
});
