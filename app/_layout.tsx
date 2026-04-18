import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { BooksProvider } from "../context/BooksContext";
import { ChatProvider } from "../context/ChatContext";
import { PostsProvider } from "../context/PostsContext";
import { ReadingGoalProvider } from "../context/ReadingGoalContext";
import { ReadingLogProvider } from "../context/ReadingLogContext";
import { UserProvider } from "../context/UserContext";

function RootNavigator() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === "(auth)";
    const inTabsGroup = firstSegment === "(tabs)";

    // tabs dışı ama giriş yapılmış kullanıcı için izinli sayfalar
    const allowedAuthenticatedRoutes = ["edit-profile"];

    const inAllowedStandaloneRoute =
      typeof firstSegment === "string" &&
      allowedAuthenticatedRoutes.includes(firstSegment);

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (session && !inTabsGroup && !inAllowedStandaloneRoute) {
      router.replace("/(tabs)/home");
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fbf9f5",
        }}
      >
        <ActivityIndicator size="large" color="#7d5739" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  console.log("ROOT LAYOUT ÇALIŞTI");

  return (
    <AuthProvider>
      <UserProvider>
        <BooksProvider>
          <PostsProvider>
            <ReadingGoalProvider>
              <ReadingLogProvider>
                <ChatProvider>
                  <RootNavigator />
                </ChatProvider>
              </ReadingLogProvider>
            </ReadingGoalProvider>
          </PostsProvider>
        </BooksProvider>
      </UserProvider>
    </AuthProvider>
  );
}
