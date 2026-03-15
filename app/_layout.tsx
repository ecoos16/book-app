/**
 * Expo Router stack navigation
 */
import { Stack } from "expo-router";

/**
 * GLOBAL STATE PROVIDER'LAR
 * Bu provider'lar tüm uygulamayı sarar.
 * Böylece her sayfa global state erişebilir.
 */
import { BooksProvider } from "../context/BooksContext";
import { PostsProvider } from "../context/PostsContext";
import { ReadingGoalProvider } from "../context/ReadingGoalContext";
import { ReadingLogProvider } from "../context/ReadingLogContext";
import { UserProvider } from "../context/UserContext";

/**
 * Debug: layout render kontrol
 */
console.log("✅ RootLayout render edildi");

export default function RootLayout() {
  return (
    <UserProvider>
      <BooksProvider>
        <PostsProvider>
          <ReadingGoalProvider>
            <ReadingLogProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </ReadingLogProvider>
          </ReadingGoalProvider>
        </PostsProvider>
      </BooksProvider>
    </UserProvider>
  );
}
