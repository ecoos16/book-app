import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useBooks } from "../../context/BooksContext";

function Box({
  title,
  subtitle,
  count,
  onPress,
}: {
  title: string;
  subtitle: string;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#eee",
        backgroundColor: "#fff",
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 17, fontWeight: "900" }}>{title}</Text>
      <Text style={{ color: "#666" }}>{subtitle}</Text>

      <View
        style={{
          alignSelf: "flex-start",
          marginTop: 4,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: "#f5f5f5",
        }}
      >
        <Text style={{ fontWeight: "800", color: "#111" }}>{count} kitap</Text>
      </View>
    </Pressable>
  );
}

export default function Library() {
  const { books, isHydrated } = useBooks();

  const counts = useMemo(() => {
    return {
      reading: books.filter((b) => b.status === "reading").length,
      read: books.filter((b) => b.status === "read").length,
      want: books.filter((b) => b.status === "want").length,
    };
  }, [books]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Text style={{ fontSize: 24, fontWeight: "900" }}>Kitaplık</Text>
      <Text style={{ color: "#666" }}>
        Kitaplarını durumlarına göre düzenle ve takip et.
      </Text>

      {!isHydrated ? (
        <Text style={{ color: "#666", marginTop: 8 }}>Yükleniyor…</Text>
      ) : (
        <>
          <Box
            title="📖 Okuyorum"
            subtitle="Şu anda okumakta olduğun kitaplar"
            count={counts.reading}
            onPress={() => router.push("/lists/reading")}
          />

          <Box
            title="✅ Okudum"
            subtitle="Bitirdiğin ve puanlayabileceğin kitaplar"
            count={counts.read}
            onPress={() => router.push("/lists/read")}
          />

          <Box
            title="⭐ İstiyorum"
            subtitle="Sonra okumak için kaydettiklerin"
            count={counts.want}
            onPress={() => router.push("/lists/want")}
          />
        </>
      )}

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/add-book",
            params: { status: "want" },
          })
        }
        style={{
          marginTop: 8,
          backgroundColor: "#111",
          paddingVertical: 13,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          + Yeni Kitap Ekle
        </Text>
      </Pressable>
    </ScrollView>
  );
}
