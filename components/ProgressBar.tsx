// components/ProgressBar.tsx

import React from "react";
import { Text, View } from "react-native";

/**
 * ReadSphere ortak renk paleti
 * Sadece bu component için gerekli renkler tanımlandı.
 */
const COLORS = {
  text: "#2f2a24",
  muted: "#7a7268",
  primary: "#7d5739",
  primarySoft: "#f3e2d2",
  track: "#ece7df",
  greenSoft: "#dfe7cf",
};

type ProgressBarProps = {
  pagesRead?: number;
  pagesTotal?: number;
  height?: number;
  showLabel?: boolean;
};

/**
 * İlerleme çubuğu
 *
 * Kullanım alanları:
 * - kitap detay sayfası
 * - BooksList içindeki reading kartları
 *
 * Özellikler:
 * - güvenli sayı kontrolü yapar
 * - yüzdeyi otomatik hesaplar
 * - istenirse label gizlenebilir
 */
export function ProgressBar({
  pagesRead = 0,
  pagesTotal,
  height = 10,
  showLabel = true,
}: ProgressBarProps) {
  /**
   * Güvenli toplam ve okunan sayfa değerleri
   */
  const safeTotal =
    typeof pagesTotal === "number" && pagesTotal > 0 ? pagesTotal : 0;

  const safeRead =
    typeof pagesRead === "number" && pagesRead >= 0 ? pagesRead : 0;

  /**
   * Yüzde hesabı
   */
  const percent =
    safeTotal > 0 ? Math.min(100, Math.round((safeRead / safeTotal) * 100)) : 0;

  return (
    <View style={{ gap: 8 }}>
      {/* Üst bilgi etiketi */}
      {showLabel && safeTotal > 0 ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text
            style={{ color: COLORS.muted, fontSize: 12, fontWeight: "700" }}
          >
            {safeRead} / {safeTotal} sayfa
          </Text>

          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: COLORS.greenSoft,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                color: COLORS.primary,
                fontSize: 11,
                fontWeight: "900",
              }}
            >
              %{percent}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Track */}
      <View
        style={{
          width: "100%",
          height,
          backgroundColor: COLORS.track,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        {/* Fill */}
        <View
          style={{
            width: `${percent}%`,
            height: "100%",
            backgroundColor: COLORS.primary,
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}
