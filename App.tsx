import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { BookOpen, Heart, Home, Info } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { GradientScreen } from './src/components/GradientScreen';
import { DISCLAIMER_ACCEPTED_KEY } from './src/constants/storage';
import { AboutScreen } from './src/screens/AboutScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { colors, theme } from './src/theme';
import { MainTabParamList, RootStackParamList } from './src/types/navigation';

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: colors.offWhite,
    border: colors.lavenderMuted,
    card: colors.offWhite,
    primary: colors.teal,
    text: colors.navy,
  },
};

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tealDeep,
        tabBarInactiveTintColor: colors.slate,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={22} strokeWidth={focused ? 2.6 : 2} />
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <BookOpen color={color} size={22} strokeWidth={focused ? 2.6 : 2} />
          ),
        }}
      />
      <Tab.Screen
        name="About"
        component={AboutScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Info color={color} size={22} strokeWidth={focused ? 2.6 : 2} />
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
    </Stack.Navigator>
  );
}

export default function App() {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function hydrateDisclaimerState() {
      const storedValue = await AsyncStorage.getItem(DISCLAIMER_ACCEPTED_KEY);

      if (isMounted) {
        setHasAcceptedDisclaimer(storedValue === 'true');
      }
    }

    hydrateDisclaimerState().catch(() => {
      if (isMounted) {
        setHasAcceptedDisclaimer(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function acceptDisclaimer() {
    await AsyncStorage.setItem(DISCLAIMER_ACCEPTED_KEY, 'true');
    setHasAcceptedDisclaimer(true);
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {hasAcceptedDisclaimer === null ? (
        <GradientScreen contentContainerStyle={styles.loadingScreen}>
          <View style={styles.brandMark}>
            <Heart color={colors.rose} fill={colors.roseSoft} size={28} />
          </View>
          <ActivityIndicator color={colors.tealDeep} />
        </GradientScreen>
      ) : hasAcceptedDisclaimer ? (
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      ) : (
        <WelcomeScreen onAccept={acceptDisclaimer} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.offWhite,
    borderTopColor: colors.lavenderMuted,
    height: 76,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  tabItem: {
    borderRadius: theme.radius.md,
    marginHorizontal: theme.spacing.xs,
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
