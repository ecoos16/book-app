// components/StarRating.tsx

import React from "react";
import { Pressable, Text, View } from "react-native";

/**
 * ReadSphere renkleri
 */
const COLORS = {
  primary: "#7d5739",
  muted: "#c9c2b8",
  text: "#2f2a24",
};

/**
 * Yıldız puanlama bileşeni
 *
 * value: 0-5 arası değer
 * onChange: kullanıcı yeni puan seçtiğinde çalışır
 * size: yıldız boyutu
 */
export function StarRating({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (next: number) => void;
  size?: number;
}) {
  return (
    <View style={{ gap: 8 }}>
      {/* Yıldızlar */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= value;

          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              hitSlop={10}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.92 : 1 }],
              })}
            >
              <Text
                style={{
                  fontSize: size,
                  color: filled ? COLORS.primary : COLORS.muted,
                }}
              >
                ★
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Alt bilgi */}
      <Text
        style={{
          color: COLORS.text,
          fontSize: 13,
          fontWeight: "700",
        }}
      >
        {value > 0 ? `${value}/5 puan verdin` : "Henüz puan verilmedi"}
      </Text>
    </View>
  );
}
