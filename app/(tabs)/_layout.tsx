import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { BooksProvider } from "../../context/BooksContext";
import { ChatProvider } from "../../context/ChatContext";
import { PostsProvider } from "../../context/PostsContext";
import { ReadingGoalProvider } from "../../context/ReadingGoalContext";
import { ReadingLogProvider } from "../../context/ReadingLogContext";
import { UserProvider } from "../../context/UserContext";

export default function TabsLayout() {
  return (
    <UserProvider>
      <BooksProvider>
        <PostsProvider>
          <ReadingGoalProvider>
            <ReadingLogProvider>
              <ChatProvider>
                <Tabs
                  screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: "#7d5739",
                    tabBarInactiveTintColor: "#8b8b84",
                    tabBarStyle: {
                      backgroundColor: "#fffdf9",
                      borderTopColor: "#ece7df",
                      borderTopWidth: 1,
                      height: 74,
                      paddingTop: 8,
                      paddingBottom: 10,
                    },
                    tabBarLabelStyle: {
                      fontSize: 11,
                      fontWeight: "700",
                    },
                    tabBarItemStyle: {
                      marginTop: 2,
                    },
                    sceneStyle: {
                      backgroundColor: "#fbf9f5",
                    },
                  }}
                >
                  <Tabs.Screen
                    name="home"
                    options={{
                      title: "Ana Sayfa",
                      tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                          name={focused ? "home" : "home-outline"}
                          color={color}
                          size={size}
                        />
                      ),
                    }}
                  />
                  <Tabs.Screen
                    name="chat"
                    options={{
                      title: "Sohbet",
                      tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                          name={
                            focused
                              ? "chatbubble-ellipses"
                              : "chatbubble-ellipses-outline"
                          }
                          color={color}
                          size={size}
                        />
                      ),
                    }}
                  />
                  <Tabs.Screen
                    name="library"
                    options={{
                      title: "Kitaplık",
                      tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                          name={focused ? "library" : "library-outline"}
                          color={color}
                          size={size}
                        />
                      ),
                    }}
                  />
                  <Tabs.Screen
                    name="profile"
                    options={{
                      title: "Profil",
                      tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                          name={focused ? "person" : "person-outline"}
                          color={color}
                          size={size}
                        />
                      ),
                    }}
                  />
                </Tabs>
              </ChatProvider>
            </ReadingLogProvider>
          </ReadingGoalProvider>
        </PostsProvider>
      </BooksProvider>
    </UserProvider>
  );
}
