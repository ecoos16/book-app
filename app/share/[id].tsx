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

export default function ShareBook() {
  /**
   * URL'den id alıyoruz: /share/[id]
   */
  const { id } = useLocalSearchParams<{ id: string }>();

  /**
   * Context'ten kitabı bulup güncelleyeceğiz
   */
  const { getById, updateBook } = useBooks();

  const book = id ? getById(id) : undefined;

  /**
   * Eğer daha önce paylaşılmışsa shareText dolu olabilir -> input'a basıyoruz
   */
  const [shareText, setShareText] = useState(book?.shareText ?? "");

  /**
   * Paylaş/Güncelle aktiflik kontrolü
   */
  const canSubmit = useMemo(() => shareText.trim().length > 0, [shareText]);

  // Kitap yoksa güvenli ekran
  if (!book) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "900" }}>
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
          <Text style={{ fontWeight: "900" }}>Geri</Text>
        </Pressable>
      </ScrollView>
    );
  }

  /**
   * ✅ Paylaş / Güncelle
   * - sharedAt set edince "paylaşılmış" kabul edilir
   */
  const onSubmit = () => {
    if (!canSubmit) {
      Alert.alert("Boş olmaz", "Paylaşım metni yazmalısın.");
      return;
    }

    // Daha önce paylaşılmadıysa sosyal alanları default başlat
    const firstShare = typeof book.sharedAt !== "number";

    updateBook(book.id, {
      shareText: shareText.trim(),
      sharedAt: Date.now(),
      // İlk paylaşım ise like/comment alanlarını başlat
      likes: firstShare ? 0 : (book.likes ?? 0),
      isLiked: firstShare ? false : (book.isLiked ?? false),
      comments: firstShare ? [] : (book.comments ?? []),
    });

    // Home'a dön
    router.replace("/(tabs)/home");
  };

  /**
   * ✅ Paylaşımı kaldır
   * - sharedAt ve shareText temizlenir
   * - istersen likes/comments da temizlenebilir (ben temizliyorum -> daha mantıklı)
   */
  const onUnshare = () => {
    Alert.alert(
      "Paylaşım kaldırılsın mı?",
      "Bu paylaşım Ana Sayfa'dan kaldırılacak.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Kaldır",
          style: "destructive",
          onPress: () => {
            updateBook(book.id, {
              sharedAt: undefined,
              shareText: undefined,
              likes: undefined,
              isLiked: undefined,
              comments: undefined,
            });
            router.replace("/(tabs)/home");
          },
        },
      ],
    );
  };

  const alreadyShared = typeof book.sharedAt === "number";

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "900" }}>
        {alreadyShared ? "Paylaşımı Düzenle" : "Paylaş"}
      </Text>

      {/* Kitap bilgisi */}
      <View
        style={{
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontWeight: "900" }}>{book.title}</Text>
        <Text style={{ color: "#666", marginTop: 4 }}>{book.author}</Text>
      </View>

      {/* Paylaşım metni */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: "900" }}>Paylaşım Notu</Text>
        <TextInput
          value={shareText}
          onChangeText={setShareText}
          placeholder="Bu kitap hakkında ne düşünüyorsun?"
          multiline
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 12,
            minHeight: 120,
            textAlignVertical: "top",
            backgroundColor: "#fff",
          }}
        />
      </View>

      {/* Paylaş / Güncelle */}
      <Pressable
        onPress={onSubmit}
        style={{
          backgroundColor: canSubmit ? "#111" : "#999",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          {alreadyShared ? "Güncelle" : "Paylaş"}
        </Text>
      </Pressable>

      {/* Paylaşımı kaldır (sadece zaten paylaşıldıysa) */}
      {alreadyShared && (
        <Pressable
          onPress={onUnshare}
          style={{
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#ffdddd",
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontWeight: "900", color: "#c00" }}>
            Paylaşımı Kaldır
          </Text>
        </Pressable>
      )}

      {/* Vazgeç */}
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
        <Text style={{ fontWeight: "900" }}>Vazgeç</Text>
      </Pressable>
    </ScrollView>
  );
}
