import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { useBooks } from "../../context/BooksContext";

function Box({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#eee",
        backgroundColor: "#fff",
        gap: 6,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "900" }}>{title}</Text>
      <Text style={{ color: "#666" }}>{subtitle}</Text>
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
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "900" }}>Kitaplık</Text>

      {!isHydrated ? (
        <Text style={{ color: "#666" }}>Yükleniyor…</Text>
      ) : (
        <>
          <Box
            title={`📖 Okuyorum (${counts.reading})`}
            subtitle="Şu an okuduğun kitaplar"
            onPress={() => router.push("/lists/reading")}
          />

          <Box
            title={`✅ Okudum (${counts.read})`}
            subtitle="Bitirdiğin kitaplar"
            onPress={() => router.push("/lists/read")}
          />

          <Box
            title={`⭐ Okumak İstiyorum (${counts.want})`}
            subtitle="Listeye eklediklerin"
            onPress={() => router.push("/lists/want")}
          />
        </>
      )}

      {/* İstersen ekstra hızlı buton */}
      <Pressable
        onPress={() => router.push("/add-book")}
        style={{
          marginTop: 8,
          backgroundColor: "#111",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>+ Kitap Ekle</Text>
      </Pressable>
    </ScrollView>
  );
}
