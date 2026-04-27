// app/(tabs)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useChat } from "../../context/ChatContext";

export default function TabsLayout() {
  const { totalUnreadCount } = useChat();

  return (
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
          tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#7d5739",
            color: "#fffdf9",
            fontSize: 11,
            fontWeight: "900",
          },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={
                focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"
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
  );
}
