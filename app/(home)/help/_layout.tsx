import { Stack } from "expo-router";

export default function HelpLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="video/[id]" />
      <Stack.Screen name="topic/[id]" />
    </Stack>
  );
}
