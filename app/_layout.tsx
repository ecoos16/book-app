// app/_layout.tsx
import { Stack } from "expo-router";

import { BooksProvider } from "../context/BooksContext";
import { ChatProvider } from "../context/ChatContext";
import { PostsProvider } from "../context/PostsContext";
import { ReadingGoalProvider } from "../context/ReadingGoalContext";
import { ReadingLogProvider } from "../context/ReadingLogContext";
import { UserProvider } from "../context/UserContext";

export default function RootLayout() {
  console.log("ROOT LAYOUT ÇALIŞTI");

  return (
    <UserProvider>
      <BooksProvider>
        <PostsProvider>
          <ReadingGoalProvider>
            <ReadingLogProvider>
              <ChatProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </ChatProvider>
            </ReadingLogProvider>
          </ReadingGoalProvider>
        </PostsProvider>
      </BooksProvider>
    </UserProvider>
  );
}
