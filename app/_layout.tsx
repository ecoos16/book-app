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
import { ReadingGoalProvider } from "../context/ReadingGoalContext";
import { ReadingLogProvider } from "../context/ReadingLogContext";
import { UserProvider } from "../context/UserContext";

/**
 * Debug: layout render kontrol
 */
console.log("✅ RootLayout render edildi");

export default function RootLayout() {
  return (
    /**
     * Provider sırası teknik olarak fark etmez
     * ama okunabilirlik için mantıklı sırada yazıyoruz
     */

    <UserProvider>
      <BooksProvider>
        <ReadingGoalProvider>
          <ReadingLogProvider>
            {/* Tüm sayfalar burada render edilir */}
            <Stack screenOptions={{ headerShown: false }} />
          </ReadingLogProvider>
        </ReadingGoalProvider>
      </BooksProvider>
    </UserProvider>
  );
}
