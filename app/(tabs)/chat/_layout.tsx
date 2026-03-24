// app/(tabs)/chat/_layout.tsx

import { Stack } from "expo-router";

/**
 * Sohbet stack yapısı
 *
 * Burada header kapalı tutuluyor çünkü:
 * - chat list
 * - chat detail
 * - new chat
 * ekranlarının hepsinde özel header tasarımı kullanıyoruz.
 */
export default function ChatStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
