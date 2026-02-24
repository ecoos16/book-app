// app/(tabs)/home.tsx
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useBooks } from "../../context/BooksContext";

/**
 * ✅ Diğer insanların paylaşımları (mock)
 * DB gelene kadar “gerçek feed hissi” verir.
 */
const DEMO_FEED = [
  {
    id: "p1",
    user: "Eylül",
    title: "Kürk Mantolu Madonna",
    author: "Sabahattin Ali",
    shareText: "Bitirince günlerce etkisinden çıkamadım…",
    likes: 42,
    commentsCount: 8,
    time: "2s",
  },
  {
    id: "p2",
    user: "Mert",
    title: "1984",
    author: "George Orwell",
    shareText: "Bazı cümleler bugünle o kadar aynı ki ürkütüyor.",
    likes: 31,
    commentsCount: 12,
    time: "5s",
  },
];

export default function Home() {
  /**
   * ✅ updateBook: like/comment güncellemek için gerekli
   */
  const { books, isHydrated, updateBook } = useBooks();

  /**
   * ✅ Son eklenen 3 kitap
   */
  const last3 = useMemo(() => books.slice(0, 3), [books]);

  /**
   * ✅ Paylaşılan kitaplar (sharedAt olanlar)
   */
  const sharedBooks = useMemo(() => {
    return books
      .filter((b) => typeof b.sharedAt === "number")
      .sort((a, b) => (b.sharedAt ?? 0) - (a.sharedAt ?? 0));
  }, [books]);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}
    >
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Ana Sayfa</Text>

      {/* -------------------------------- */}
      {/* ✅ ARAMA BAR (şimdilik search page'e götür) */}
      {/* -------------------------------- */}
      <Pressable
        onPress={() => router.push("/search" as any)}
        style={{
          borderWidth: 1,
          borderColor: "#e5e5e5",
          borderRadius: 14,
          padding: 12,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ color: "#888" }}>🔎 Kitap / yazar ara…</Text>
      </Pressable>

      {/* -------------------------------- */}
      {/* ✅ DİĞER İNSANLARIN PAYLAŞIMLARI (MOCK FEED) */}
      {/* -------------------------------- */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "900" }}>Topluluk</Text>

        {DEMO_FEED.map((p) => (
          <View
            key={p.id}
            style={{
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#eee",
              backgroundColor: "#fff",
              gap: 8,
            }}
          >
            {/* header */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontWeight: "900" }}>{p.user}</Text>
              <Text style={{ color: "#888" }}>{p.time} önce</Text>
            </View>

            {/* book */}
            <Text style={{ fontWeight: "900" }}>{p.title}</Text>
            <Text style={{ color: "#666" }}>{p.author}</Text>

            {/* text */}
            <Text style={{ color: "#666" }} numberOfLines={3}>
              “{p.shareText}”
            </Text>

            {/* footer */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Text>❤️ {p.likes}</Text>
              <Text>💬 {p.commentsCount}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* -------------------------------- */}
      {/* ✅ PAYLAŞIMLARIN (SENİN GERÇEK LOCAL POSTLAR) */}
      {/* -------------------------------- */}
      {isHydrated && (
        <View style={{ gap: 10 }}>
          {sharedBooks.length === 0 ? (
            <Text style={{ color: "#666" }}>
              Henüz paylaşım yok. Kitap detayından “Paylaş” diyebilirsin.
            </Text>
          ) : (
            sharedBooks.map((b) => (
              <View
                key={b.id}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#eee",
                  backgroundColor: "#fff",
                  gap: 8,
                }}
              >
                {/* detaya götüren alan */}
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/book/[id]" as const,
                      params: { id: b.id },
                    })
                  }
                  style={{ gap: 6 }}
                >
                  <Text style={{ fontWeight: "900" }}>{b.title}</Text>
                  <Text style={{ color: "#666" }}>{b.author}</Text>

                  <Text style={{ color: "#666" }} numberOfLines={3}>
                    “{b.shareText ?? "Paylaşım metni yok"}”
                  </Text>

                  <Text style={{ color: "#666" }}>
                    {b.rating ? "★".repeat(b.rating) : "☆"}
                  </Text>
                </Pressable>

                {/* sosyal */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  {/* ❤️ Like */}
                  <Pressable
                    onPress={() => {
                      const liked = b.isLiked ?? false;
                      const likes = b.likes ?? 0;

                      updateBook(b.id, {
                        isLiked: !liked,
                        likes: liked ? Math.max(0, likes - 1) : likes + 1,
                      });
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: "#ddd",
                      backgroundColor: "#fff",
                    }}
                  >
                    <Text style={{ fontWeight: "900" }}>
                      {b.isLiked ? "❤️" : "🤍"} {b.likes ?? 0}
                    </Text>
                  </Pressable>

                  {/* 💬 Comments */}
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/comments/[id]" as const, // ✅ senin dosyan app/comments/[id].tsx ise bu doğru
                        params: { id: b.id },
                      })
                    }
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: "#ddd",
                      backgroundColor: "#fff",
                    }}
                  >
                    <Text style={{ fontWeight: "900" }}>
                      💬 {b.comments?.length ?? 0}
                    </Text>
                  </Pressable>

                  {/* Share edit */}
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/share/[id]" as const,
                        params: { id: b.id },
                      })
                    }
                    style={{ marginLeft: "auto" }}
                  >
                    <Text style={{ color: "#666", fontWeight: "900" }}>
                      Düzenle →
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Floating Add */}
      <Pressable
        onPress={() => router.push("/add-book")}
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#111",
          alignItems: "center",
          justifyContent: "center",
          elevation: 4,
        }}
      >
        <Text style={{ color: "white", fontSize: 28 }}>+</Text>
      </Pressable>
    </ScrollView>
  );
}
