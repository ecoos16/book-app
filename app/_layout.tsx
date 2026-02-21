console.log("✅ RootLayout çalıştı");
import { Stack } from "expo-router";
import { BooksProvider } from "../context/BooksContext";

export default function RootLayout() {
  return (
    <BooksProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </BooksProvider>
  );
}
