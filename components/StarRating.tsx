import React from "react";
import { Pressable, Text, View } from "react-native";

export function StarRating({
  value,
  onChange,
  size = 26,
}: {
  value: number; // 0-5
  onChange: (next: number) => void;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={10}>
            <Text style={{ fontSize: size, opacity: filled ? 1 : 0.25 }}>
              ★
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
