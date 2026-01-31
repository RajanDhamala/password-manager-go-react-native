
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { PaperProvider } from "react-native-paper";
import { ToastProvider } from "../components/Toast";
import { initializeApiConfig } from "../utils/AxiosWrapper";
import "../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      await initializeApiConfig();
      setIsConfigLoading(false);
    };
    loadConfig();
  }, []);

  if (isConfigLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading configuration...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <ToastProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </ToastProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}