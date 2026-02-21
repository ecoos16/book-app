import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Register() {
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Kayıt</Text>

      <Pressable
        style={{ padding: 14, backgroundColor: "black", borderRadius: 10 }}
        onPress={() => router.back()}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Geri</Text>
      </Pressable>
    </View>
  );
}
