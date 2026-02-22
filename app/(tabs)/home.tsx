import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useBooks } from "../../context/BooksContext";

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
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Ana Sayfa</Text>

      {/* ✅ PAYLAŞIMLARIN */}
      {isHydrated && (
        <View>
          <Text style={{ fontSize: 18, fontWeight: "900" }}>Paylaşımların</Text>

          {sharedBooks.length === 0 ? (
            <Text style={{ color: "#666", marginTop: 8 }}>
              Henüz paylaşım yok. Kitap detayından “Paylaş” diyebilirsin.
            </Text>
          ) : (
            sharedBooks.map((b) => (
              <View
                key={b.id}
                style={{
                  marginTop: 10,
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#eee",
                  backgroundColor: "#fff",
                  gap: 8,
                }}
              >
                {/* ✅ Kartın üst kısmı: detaya götürsün */}
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/book/[id]" as const,
                      params: { id: b.id },
                    })
                  }
                  style={{ gap: 8 }}
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

                {/* ✅ SOSYAL BUTONLAR (❤️ / 💬 / Düzenle) */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                    marginTop: 4,
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

                  {/* 💬 Yorum */}
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/share-comments/[id]" as const,
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

                  {/* Düzenle */}
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

      {/* ✅ SON EKLEDİKLERİN */}
      {isHydrated && (
        <View>
          <Text style={{ fontSize: 18, fontWeight: "900" }}>
            Son Eklediklerin
          </Text>

          {last3.length === 0 ? (
            <Text style={{ color: "#666", marginTop: 8 }}>
              Henüz kitap eklemedin.
            </Text>
          ) : (
            last3.map((b) => (
              <Pressable
                key={b.id}
                onPress={() =>
                  router.push({
                    pathname: "/book/[id]" as const,
                    params: { id: b.id },
                  })
                }
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#eee",
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ fontWeight: "700" }}>{b.title}</Text>
                <Text style={{ color: "#666" }}>{b.author}</Text>

                <Text style={{ color: "#666", marginTop: 4 }}>
                  {b.rating ? "★".repeat(b.rating) : "☆"}{" "}
                  {b.note?.trim()?.length ? " • Not var" : " • Not yok"}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      )}

      {/* ✅ FLOATING ADD BUTTON */}
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
