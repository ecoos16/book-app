import { Link, router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Login() {
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Giriş</Text>

      <Pressable
        style={{ padding: 14, backgroundColor: "black", borderRadius: 10 }}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Giriş Yap</Text>
      </Pressable>

      <Link href="/(auth)/register" style={{ textAlign: "center" }}>
        Kayıt ol
      </Link>
    </View>
  );
}
