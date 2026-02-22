import React, { useMemo } from "react";
import { Text, View } from "react-native";

/**
 * ProgressBar:
 * pagesRead / pagesTotal -> yüzde hesaplar ve bar çizer.
 */
export function ProgressBar({
  pagesRead,
  pagesTotal,
}: {
  pagesRead?: number;
  pagesTotal?: number;
}) {
  // ✅ Güvenli sayılar (negatif / undefined gelirse 0 yap)
  const read = Math.max(0, pagesRead ?? 0);
  const total = Math.max(0, pagesTotal ?? 0);

  // ✅ total 0 ise progress hesaplamayız
  const percent = useMemo(() => {
    if (total <= 0) return 0;
    // okunan sayfa toplamdan fazla girilirse %100'e sabitle
    const p = Math.round((Math.min(read, total) / total) * 100);
    return Math.max(0, Math.min(100, p));
  }, [read, total]);

  // total yoksa bar göstermeyelim
  if (total <= 0) {
    return (
      <Text style={{ color: "#888", fontSize: 12 }}>(Sayfa bilgisi yok)</Text>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      {/* Yüzde yazısı */}
      <Text style={{ color: "#666", fontWeight: "800", fontSize: 12 }}>
        {read}/{total} • %{percent}
      </Text>

      {/* Bar */}
      <View
        style={{
          height: 10,
          borderRadius: 999,
          backgroundColor: "#eee",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${percent}%`,
            backgroundColor: "#111",
          }}
        />
      </View>
    </View>
  );
}
