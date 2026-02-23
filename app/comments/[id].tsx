// app/comments/[id].tsx
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useBooks } from "../../context/BooksContext";
import type { BookComment } from "../../types/book";

/**
 * ✅ Basit unique id üretici
 */
function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function CommentsScreen() {
  /**
   * ✅ Route param: /comments/[id]
   */
  const { id } = useLocalSearchParams<{ id: string }>();

  /**
   * ✅ Kitabı bulup comments güncelleyeceğiz
   */
  const { getById, updateBook } = useBooks();
  const book = id ? getById(id) : undefined;

  /**
   * ✅ Input state
   */
  const [text, setText] = useState("");

  /**
   * ✅ Kitap yoksa safe ekran
   */
  if (!book) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>
          Kitap bulunamadı
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
          <Text style={{ fontWeight: "800" }}>Geri</Text>
        </Pressable>
      </ScrollView>
    );
  }

  /**
   * ✅ Comments listesi (array)
   */
  const comments = useMemo<BookComment[]>(
    () => book.comments ?? [],
    [book.comments],
  );

  /**
   * ✅ Yeni yorum ekle
   */
  const addComment = () => {
    const t = text.trim();
    if (!t.length) {
      Alert.alert("Boş olmaz", "Yorum yazmalısın.");
      return;
    }

    const next: BookComment[] = [
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
   * ✅ Yorum sil (index ile)
   */
  const removeComment = (index: number) => {
    Alert.alert("Silinsin mi?", "Yorum silinecek.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          const next = comments.filter((_, i) => i !== index);
          updateBook(book.id, { comments: next });
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Header */}
      <Text style={{ fontSize: 22, fontWeight: "900" }}>Yorumlar</Text>
      <Text style={{ color: "#666" }}>
        {book.title} • {comments.length} yorum
      </Text>

      {/* Yorum ekleme kutusu */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#eee",
          borderRadius: 14,
          padding: 12,
          backgroundColor: "#fff",
          gap: 10,
        }}
      >
        <Text style={{ fontWeight: "900" }}>Yorum yaz</Text>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Yorumun..."
          multiline
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 12,
            minHeight: 90,
            textAlignVertical: "top",
          }}
        />

        <Pressable
          onPress={addComment}
          style={{
            backgroundColor: "#111",
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>Ekle</Text>
        </Pressable>
      </View>

      {/* Yorum listesi */}
      {comments.length === 0 ? (
        <Text style={{ color: "#666" }}>Henüz yorum yok.</Text>
      ) : (
        comments.map((c, index) => (
          <Pressable
            key={c.id}
            onLongPress={() => removeComment(index)}
            delayLongPress={250}
            style={{
              borderWidth: 1,
              borderColor: "#eee",
              borderRadius: 14,
              padding: 12,
              backgroundColor: "#fff",
              gap: 6,
            }}
          >
            <Text style={{ fontWeight: "800" }}>Yorum</Text>
            <Text style={{ color: "#444" }}>{c.text}</Text>
            <Text style={{ color: "#aaa", fontSize: 12 }}>(Uzun bas: sil)</Text>
          </Pressable>
        ))
      )}

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
