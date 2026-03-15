import React from "react";
import { Text, View } from "react-native";

type ProgressBarProps = {
  pagesRead?: number;
  pagesTotal?: number;
  height?: number;
  showLabel?: boolean;
};

export function ProgressBar({
  pagesRead = 0,
  pagesTotal,
  height = 10,
  showLabel = true,
}: ProgressBarProps) {
  const safeTotal =
    typeof pagesTotal === "number" && pagesTotal > 0 ? pagesTotal : 0;
  const safeRead =
    typeof pagesRead === "number" && pagesRead >= 0 ? pagesRead : 0;

  const percent =
    safeTotal > 0 ? Math.min(100, Math.round((safeRead / safeTotal) * 100)) : 0;

  return (
    <View style={{ gap: 6 }}>
      {showLabel && safeTotal > 0 ? (
        <Text style={{ color: "#666", fontSize: 12 }}>
          {safeRead} / {safeTotal} sayfa • %{percent}
        </Text>
      ) : null}

      <View
        style={{
          width: "100%",
          height,
          backgroundColor: "#ececec",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${percent}%`,
            height: "100%",
            backgroundColor: "#111",
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}
