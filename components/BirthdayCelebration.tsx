import React, { useMemo } from "react";
import { Text, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

type BirthdayCelebrationProps = {
  birthDate?: string | null; // YYYY-MM-DD
  firstName?: string | null;
};

function isBirthdayToday(birthDate?: string | null) {
  if (!birthDate) return false;

  const parts = birthDate.split("-");
  if (parts.length !== 3) return false;

  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const today = new Date();

  return today.getMonth() + 1 === month && today.getDate() === day;
}

export default function BirthdayCelebration({
  birthDate,
  firstName,
}: BirthdayCelebrationProps) {
  const shouldShow = useMemo(() => isBirthdayToday(birthDate), [birthDate]);

  if (!shouldShow) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        alignItems: "center",
      }}
    >
      <ConfettiCannon count={180} origin={{ x: 200, y: 0 }} fadeOut />

      <View
        style={{
          marginTop: 90,
          backgroundColor: "rgba(255,255,255,0.94)",
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#ece7df",
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            color: "#7d5739",
            textAlign: "center",
          }}
        >
          İyi ki doğdun{firstName ? `, ${firstName}` : ""}! 🎉
        </Text>
      </View>
    </View>
  );
}
