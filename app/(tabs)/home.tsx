// app/(tabs)/home.tsx
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
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
  const { books, isHydrated, updateBook } = useBooks();

  const last3 = useMemo(() => books.slice(0, 3), [books]);

  const sharedBooks = useMemo(() => {
    return books
      .filter((b) => typeof b.sharedAt === "number")
      .sort((a, b) => (b.sharedAt ?? 0) - (a.sharedAt ?? 0));
  }, [books]);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}
    >
      {/* Header */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 26, fontWeight: "900", color: "#111" }}>
          ReadSphere
        </Text>
        <Text style={{ color: "#666", fontSize: 14 }}>
          Kitaplarını keşfet, takip et ve paylaş.
        </Text>
      </View>

      {/* Search */}
      <Pressable
        onPress={() => router.push("/search" as any)}
        style={{
          borderWidth: 1,
          borderColor: "#e5e5e5",
          borderRadius: 16,
          padding: 14,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ color: "#888", fontSize: 15 }}>
          🔎 Kitap veya yazar ara…
        </Text>
      </Pressable>

      {/* Last added books */}
      {last3.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
            Son Eklenenler
          </Text>

          {last3.map((b) => (
            <Pressable
              key={b.id}
              onPress={() =>
                router.push({
                  pathname: "/book/[id]" as const,
                  params: { id: b.id },
                })
              }
              style={{
                flexDirection: "row",
                gap: 12,
                padding: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#eee",
                backgroundColor: "#fff",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 54,
                  height: 78,
                  borderRadius: 10,
                  overflow: "hidden",
                  backgroundColor: "#f3f3f3",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {b.thumbnail ? (
                  <Image
                    source={{ uri: b.thumbnail }}
                    style={{ width: 54, height: 78 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f1f1f1",
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>📚</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{ fontWeight: "900", fontSize: 15, color: "#1a1a1a" }}
                  numberOfLines={2}
                >
                  {b.title}
                </Text>
                <Text style={{ color: "#666" }} numberOfLines={1}>
                  {b.author}
                </Text>
                <Text style={{ color: "#888", fontSize: 12 }}>
                  {b.status === "reading"
                    ? "Okumaya devam ediyorsun"
                    : b.status === "read"
                      ? "Okudun"
                      : "Okuma listende"}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Community feed */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
          Topluluk
        </Text>

        {DEMO_FEED.map((p) => (
          <View
            key={p.id}
            style={{
              padding: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#eee",
              backgroundColor: "#fff",
              gap: 8,
            }}
          >
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontWeight: "900", color: "#111" }}>{p.user}</Text>
              <Text style={{ color: "#888" }}>{p.time} önce</Text>
            </View>

            <Text style={{ fontWeight: "900", fontSize: 15 }}>{p.title}</Text>
            <Text style={{ color: "#666" }}>{p.author}</Text>

            <Text style={{ color: "#555", lineHeight: 20 }} numberOfLines={3}>
              “{p.shareText}”
            </Text>

            <View style={{ flexDirection: "row", gap: 14 }}>
              <Text>❤️ {p.likes}</Text>
              <Text>💬 {p.commentsCount}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* My posts */}
      {isHydrated && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
            Senin Paylaşımların
          </Text>

          {sharedBooks.length === 0 ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#eee",
                borderRadius: 18,
                paddingVertical: 28,
                paddingHorizontal: 20,
                backgroundColor: "#fff",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 36 }}>✨</Text>
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 17,
                  fontWeight: "800",
                  color: "#222",
                }}
              >
                Henüz paylaşım yok
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  color: "#666",
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Bir kitabın detay ekranına girip paylaşım oluşturarak burada
                görünmesini sağlayabilirsin.
              </Text>
            </View>
          ) : (
            sharedBooks.map((b) => (
              <View
                key={b.id}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#eee",
                  backgroundColor: "#fff",
                  gap: 10,
                }}
              >
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/book/[id]" as const,
                      params: { id: b.id },
                    })
                  }
                  style={{ flexDirection: "row", gap: 12 }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 80,
                      borderRadius: 10,
                      overflow: "hidden",
                      backgroundColor: "#f3f3f3",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {b.thumbnail ? (
                      <Image
                        source={{ uri: b.thumbnail }}
                        style={{ width: 56, height: 80 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          height: "100%",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#f1f1f1",
                        }}
                      >
                        <Text style={{ fontSize: 22 }}>📚</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1, gap: 5 }}>
                    <Text
                      style={{
                        fontWeight: "900",
                        fontSize: 15,
                        color: "#1a1a1a",
                      }}
                      numberOfLines={2}
                    >
                      {b.title}
                    </Text>

                    <Text style={{ color: "#666" }} numberOfLines={1}>
                      {b.author}
                    </Text>

                    <Text
                      style={{ color: "#555", lineHeight: 20 }}
                      numberOfLines={3}
                    >
                      “{b.shareText ?? "Paylaşım metni yok"}”
                    </Text>

                    <Text style={{ color: "#666" }}>
                      {b.rating ? "★".repeat(b.rating) : "☆"}
                    </Text>
                  </View>
                </Pressable>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
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

                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/comments/[id]" as const,
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
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: "#111",
          alignItems: "center",
          justifyContent: "center",
          elevation: 4,
        }}
      >
        <Text style={{ color: "white", fontSize: 30, fontWeight: "400" }}>
          +
        </Text>
      </Pressable>
    </ScrollView>
  );
}
