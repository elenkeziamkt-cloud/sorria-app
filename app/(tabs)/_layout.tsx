import { Stack } from 'expo-router';
import { HomeButton } from '../../src/components/HomeButton';
import { colors } from '../../src/theme/colors';

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primaryDark },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { color: '#FFFFFF' },
        headerShadowVisible: false,
        headerBackTitle: '',
        headerLeft: () => <HomeButton />,
      }}
    >
      <Stack.Screen name="index"   options={{ headerShown: false }} />
      <Stack.Screen name="map" />
      <Stack.Screen name="explore" />
    </Stack>
  );
}
