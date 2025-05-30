import { Stack } from 'expo-router';

export default function SettingsTabsLayout() {
  return (
    <Stack>
      <Stack.Screen name="AllExpanses" />
      <Stack.Screen name="AllIncomes" />
    </Stack>
  );
}