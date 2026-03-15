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
 * Basit benzersiz id üretici
 * Yeni yorum eklerken kullanıyoruz
 */
function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function CommentsScreen() {
  /**
   * Route parametresi
   * Örn: /comments/123
   */
  const { id } = useLocalSearchParams<{ id: string }>();

  /**
   * Context içinden:
   * - kitabı getir
   * - yorumları updateBook ile güncelle
   */
  const { getById, updateBook } = useBooks();

  /**
   * İlgili kitabı bul
   */
  const book = id ? getById(id) : undefined;

  /**
   * Yeni yorum input state'i
   */
  const [text, setText] = useState("");

  /**
   * Kitap bulunamazsa güvenli boş durum ekranı göster
   */
  if (!book) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            marginTop: 20,
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 18,
            paddingVertical: 30,
            paddingHorizontal: 20,
            backgroundColor: "#fff",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 40 }}>💬</Text>

          <Text
            style={{
              marginTop: 10,
              fontSize: 18,
              fontWeight: "800",
              color: "#222",
            }}
          >
            Kitap bulunamadı
          </Text>

          <Text
            style={{
              marginTop: 6,
              color: "#666",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Bu kayıt silinmiş olabilir veya geçersiz bir yorum bağlantısı
            açılmış olabilir.
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 16,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#ddd",
              alignItems: "center",
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontWeight: "800" }}>Geri</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  /**
   * Kitabın yorum listesi
   * comments alanı yoksa boş array kullan
   */
  const comments = useMemo<BookComment[]>(
    () => book.comments ?? [],
    [book.comments],
  );

  /**
   * Yeni yorum ekle
   */
  const addComment = () => {
    const t = text.trim();

    if (!t.length) {
      Alert.alert("Boş olmaz", "Yorum yazmalısın.");
      return;
    }

    /**
     * Mevcut yorumların sonuna yeni yorum eklenir
     */
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
   * Yorum silme
   * Şimdilik index ile siliyoruz
   */
  const removeComment = (index: number) => {
    Alert.alert("Yorum silinsin mi?", "Bu yorum kaldırılacak.", [
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
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      {/* Sayfa başlığı */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 24, fontWeight: "900" }}>Yorumlar</Text>
        <Text style={{ color: "#666" }}>
          {book.title} • {comments.length} yorum
        </Text>
      </View>

      {/* Yorum yazma kartı */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#eee",
          borderRadius: 16,
          padding: 14,
          backgroundColor: "#fff",
          gap: 10,
        }}
      >
        <Text style={{ fontWeight: "800" }}>Yorum Yaz</Text>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Bu kitap hakkında düşünceni yaz..."
          multiline
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 12,
            minHeight: 100,
            textAlignVertical: "top",
            backgroundColor: "#fafafa",
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
          <Text style={{ color: "#fff", fontWeight: "900" }}>Yorumu Ekle</Text>
        </Pressable>
      </View>

      {/* Yorum listesi */}
      {comments.length === 0 ? (
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
          <Text style={{ fontSize: 34 }}>💭</Text>

          <Text
            style={{
              marginTop: 10,
              fontSize: 17,
              fontWeight: "800",
              color: "#222",
            }}
          >
            Henüz yorum yok
          </Text>

          <Text
            style={{
              marginTop: 6,
              color: "#666",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Bu kitap için ilk yorumu sen yazabilirsin.
          </Text>
        </View>
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
              gap: 8,
            }}
          >
            {/* Yorum üst başlığı */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontWeight: "800", color: "#222" }}>Yorum</Text>

              <Text style={{ color: "#aaa", fontSize: 12 }}>
                {new Date(c.createdAt).toLocaleDateString("tr-TR")}
              </Text>
            </View>

            {/* Yorum metni */}
            <Text style={{ color: "#444", lineHeight: 20 }}>{c.text}</Text>

            {/* Yardımcı bilgi */}
            <Text style={{ color: "#aaa", fontSize: 12 }}>
              Uzun bas: yorumu sil
            </Text>
          </Pressable>
        ))
      )}

      {/* Geri butonu */}
      <Pressable
        onPress={() => router.back()}
        style={{
          paddingVertical: 14,
          borderRadius: 14,
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
