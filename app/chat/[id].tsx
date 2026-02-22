import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function ChatDetail() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "800" }}>Sohbet #{id}</Text>

      <Text style={{ marginTop: 20 }}>
        Bu ekran ileride gerçek chat olacak.
      </Text>
    </View>
  );
}
