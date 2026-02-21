import { router } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useBooks } from "../../context/BooksContext";

type FeedItem = {
  id: string;
  user: string;
  bookTitle: string;
  author: string;
  note: string;
  likes: number;
  comments: number;
  time: string;
};

const DEMO_FEED: FeedItem[] = [
  {
    id: "f1",
    user: "Eylül",
    bookTitle: "Kürk Mantolu Madonna",
    author: "Sabahattin Ali",
    note: "Bu kitabı bitirince günlerce etkisinden çıkamadım…",
    likes: 42,
    comments: 8,
    time: "2s",
  },
  {
    id: "f2",
    user: "Mert",
    bookTitle: "1984",
    author: "George Orwell",
    note: "Bazı cümleler bugünle o kadar aynı ki ürkütüyor.",
    likes: 31,
    comments: 12,
    time: "5s",
  },
  {
    id: "f3",
    user: "Defne",
    bookTitle: "Hayvan Çiftliği",
    author: "George Orwell",
    note: "Kısa ama tokat gibi. Herkes okumalı.",
    likes: 18,
    comments: 3,
    time: "1g",
  },
  {
    id: "f4",
    user: "Sena",
    bookTitle: "Simyacı",
    author: "Paulo Coelho",
    note: "En sevdiğim kısım: yola çıkma cesareti.",
    likes: 25,
    comments: 6,
    time: "3g",
  },
];

export default function Home() {
  // ✅ hook mutlaka component içinde
  const { books, isHydrated } = useBooks();

  // ✅ hesapları component içinde yap
  const last3 = useMemo(() => books.slice(0, 3), [books]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Ana Sayfa</Text>
      <Text style={{ color: "#666" }}>Bugün toplulukta neler okunuyor?</Text>

      {/* ✅ Son Eklediklerin */}
      {isHydrated && (
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>
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
                  router.push({ pathname: "/book/[id]", params: { id: b.id } })
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
              </Pressable>
            ))
          )}
        </View>
      )}

      {/* Feed */}
      <FlatList
        data={DEMO_FEED}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 90 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/book/[id]",
                // ⚠️ demo feed id’si gerçek kitap id’si değil
                // Bu yüzden detaya gidersen "Kitap bulunamadı" görebilirsin.
                params: { id: item.id },
              })
            }
            style={{
              padding: 14,
              borderRadius: 14,
              backgroundColor: "#f4f4f4",
              borderWidth: 1,
              borderColor: "#e9e9e9",
              gap: 10,
            }}
          >
            {/* header */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#ddd",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontWeight: "800" }}>
                  {item.user.slice(0, 1)}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "800" }}>{item.user}</Text>
                <Text style={{ color: "#888", fontSize: 12 }}>
                  {item.time} önce
                </Text>
              </View>
            </View>

            {/* book */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: "900" }}>
                {item.bookTitle}
              </Text>
              <Text style={{ color: "#444", marginTop: 2 }}>{item.author}</Text>
            </View>

            {/* note */}
            <Text style={{ color: "#666" }} numberOfLines={3}>
              “{item.note}”
            </Text>

            {/* footer */}
            <View style={{ flexDirection: "row", gap: 14 }}>
              <Text style={{ color: "#666" }}>❤️ {item.likes}</Text>
              <Text style={{ color: "#666" }}>💬 {item.comments}</Text>
              <Text style={{ color: "#666", marginLeft: "auto" }}>
                Detaya git →
              </Text>
            </View>
          </Pressable>
        )}
      />

      {/* Floating Add Button */}
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
        <Text style={{ color: "white", fontSize: 28, marginTop: -2 }}>+</Text>
      </Pressable>
    </View>
  );
}
