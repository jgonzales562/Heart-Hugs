import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootTabParamList = {
  Home: undefined;
  Library: undefined;
  Player: { sessionId?: string } | undefined;
  About: undefined;
};

export type TabScreenProps<T extends keyof RootTabParamList> = BottomTabScreenProps<
  RootTabParamList,
  T
>;
