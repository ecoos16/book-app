import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Profile() {
  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Profil</Text>

      <Pressable
        onPress={() => router.push("/add-book")}
        style={{
          backgroundColor: "#111",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>+ Kitap Ekle</Text>
      </Pressable>
      <Pressable
        style={{ padding: 14, backgroundColor: "#eee", borderRadius: 10 }}
        onPress={() => router.push({ pathname: "/lists/reading" })}
      >
        <Text>Okuyorum</Text>
      </Pressable>

      <Pressable
        style={{ padding: 14, backgroundColor: "#eee", borderRadius: 10 }}
        onPress={() => router.push({ pathname: "/lists/read" })}
      >
        <Text>Okudum</Text>
      </Pressable>

      <Pressable
        style={{ padding: 14, backgroundColor: "#eee", borderRadius: 10 }}
        onPress={() => router.push({ pathname: "/lists/want" })}
      >
        <Text>Okumak İstiyorum</Text>
      </Pressable>
    </View>
  );
}
