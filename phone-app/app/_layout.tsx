import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#F9F9F8",
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" options={{ presentation: "modal" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
