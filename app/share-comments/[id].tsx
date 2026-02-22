import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useBooks } from "../../context/BooksContext";

/**
 * Basit id üretici (yorumlar için)
 */
function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function ShareComments() {
  /**
   * /share-comments/[id] -> id parametresi
   */
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getById, updateBook } = useBooks();
  const book = id ? getById(id) : undefined;

  // Yeni yorum input
  const [text, setText] = useState("");

  // Yorumları güvenli al (undefined olabilir)
  const comments = useMemo(() => book?.comments ?? [], [book?.comments]);

  // Kitap yoksa güvenli ekran
  if (!book) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "900" }}>
          Paylaşım bulunamadı
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#ddd",
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "900" }}>Geri</Text>
        </Pressable>
      </ScrollView>
    );
  }

  /**
   * ✅ Yorum ekle
   * - comments array'ine yeni eleman ekleyip updateBook ile kaydediyoruz
   */
  const onAdd = () => {
    const t = text.trim();
    if (!t.length) return;

    const next = [
      ...comments,
      {
        id: makeId(),
        text: t,
        createdAt: Date.now(),
      },
    ];

    updateBook(book.id, { comments: next });
    setText("");
  };

  /**
   * ✅ Yorum sil (uzun basınca)
   */
  const onRemove = (commentId: string) => {
    const next = comments.filter((c) => c.id !== commentId);
    updateBook(book.id, { comments: next });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "900" }}>Yorumlar</Text>

      {/* Hangi paylaşımın yorumları */}
      <View
        style={{
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
          gap: 6,
        }}
      >
        <Text style={{ fontWeight: "900" }}>{book.title}</Text>
        <Text style={{ color: "#666" }} numberOfLines={2}>
          “{book.shareText ?? "Paylaşım metni yok"}”
        </Text>
      </View>

      {/* Yorum listesi */}
      {comments.length === 0 ? (
        <Text style={{ color: "#666" }}>Henüz yorum yok.</Text>
      ) : (
        comments.map((c) => (
          <Pressable
            key={c.id}
            onLongPress={() => onRemove(c.id)}
            delayLongPress={250}
            style={{
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#eee",
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ color: "#111" }}>{c.text}</Text>
            <Text style={{ color: "#aaa", marginTop: 6, fontSize: 12 }}>
              (Uzun bas: yorumu sil)
            </Text>
          </Pressable>
        ))
      )}

      {/* Yorum yazma alanı */}
      <View style={{ gap: 8, marginTop: 6 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Yorum yaz…"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#fff",
          }}
        />

        <Pressable
          onPress={onAdd}
          style={{
            backgroundColor: "#111",
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>Yorum Ekle</Text>
        </Pressable>
      </View>

      {/* Geri */}
      <Pressable
        onPress={() => router.back()}
        style={{
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ddd",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontWeight: "900" }}>Geri</Text>
      </Pressable>
    </ScrollView>
  );
}
