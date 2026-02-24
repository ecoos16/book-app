import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text } from "react-native";

export default function SearchScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "900" }}>Arama</Text>

      <Pressable
        onPress={() => router.back()}
        style={{
          paddingVertical: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#ddd",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontWeight: "900" }}>Geri</Text>
      </Pressable>
    </ScrollView>
  );
}
