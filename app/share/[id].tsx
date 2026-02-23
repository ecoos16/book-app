// app/share/[id].tsx
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
   * ✅ Route param: /share/[id]
   */
  const { id } = useLocalSearchParams<{ id: string }>();

  /**
   * ✅ Context: kitabı bul + güncelle
   */
  const { getById, updateBook } = useBooks();

  /**
   * ✅ Kitabı getir
   */
  const book = id ? getById(id) : undefined;

  /**
   * ✅ Kitap yoksa güvenli ekran
   */
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
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontWeight: "900" }}>Geri</Text>
        </Pressable>
      </ScrollView>
    );
  }

  /**
   * ✅ Daha önce paylaşılmış mı?
   * sharedAt varsa "paylaşılmış" sayıyoruz
   */
  const alreadyShared = typeof book.sharedAt === "number";

  /**
   * ✅ Otomatik öneri metni
   * - not/puan varsa daha "gerçek" olur
   * - yoksa basit bir şablon
   */
  const suggestedText = useMemo(() => {
    const stars = book.rating ? "★".repeat(book.rating) : "";
    const note = book.note?.trim();

    if (note?.length) {
      return `${book.title} • ${book.author}\n${stars ? stars + "\n" : ""}\n“${note}”`;
    }

    return `${book.title} • ${book.author}\n\nYeni bitirdim, tavsiye ederim.`;
  }, [book.author, book.note, book.rating, book.title]);

  /**
   * ✅ Input state
   * - daha önce paylaşılmışsa shareText ile başlar
   * - yoksa öneri metni ile başlar (kullanıcı isterse değiştirir)
   */
  const [shareText, setShareText] = useState<string>(
    (book.shareText ?? "").trim().length
      ? (book.shareText ?? "")
      : suggestedText,
  );

  /**
   * ✅ Buton aktif mi?
   */
  const canSubmit = useMemo(() => shareText.trim().length > 0, [shareText]);

  /**
   * ✅ Paylaş / Güncelle
   * - sharedAt set edince "paylaşıldı" sayılır
   * - ilk kez paylaşılıyorsa likes/isLiked/comments default kurulur
   */
  const onSubmit = () => {
    const text = shareText.trim();

    if (!text.length) {
      Alert.alert("Boş olmaz", "Paylaşım metni yazmalısın.");
      return;
    }

    /**
     * ✅ İlk paylaşım mı?
     */
    const firstShare = typeof book.sharedAt !== "number";

    updateBook(book.id, {
      // paylaşım bilgileri
      shareText: text,
      sharedAt: Date.now(),

      // ✅ sosyal alanlar: ilk paylaşımda başlat
      likes: firstShare ? 0 : (book.likes ?? 0),
      isLiked: firstShare ? false : (book.isLiked ?? false),
      comments: firstShare ? (book.comments ?? []) : (book.comments ?? []),
    });

    /**
     * ✅ Home'a dön
     */
    router.replace("/(tabs)/home");
  };

  /**
   * ✅ Paylaşımı kaldır
   * - sharedAt + shareText temizlenir
   * - istersen sosyal alanları da temizleyebilirsin (ben temizliyorum)
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

              // ✅ sosyal alanları da sıfırla (istersen kaldırabilirsin)
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

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "900" }}>
        {alreadyShared ? "Paylaşımı Düzenle" : "Paylaş"}
      </Text>

      {/* ------------------------------------------------ */}
      {/* ✅ Kitap Kartı */}
      {/* ------------------------------------------------ */}
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
        <Text style={{ fontWeight: "900", fontSize: 16 }}>{book.title}</Text>
        <Text style={{ color: "#666" }}>{book.author}</Text>

        {/* ✅ Ek küçük bilgi (puan/not varsa) */}
        <Text style={{ color: "#666" }}>
          {book.rating ? "★".repeat(book.rating) : "☆"}
          {book.note?.trim()?.length ? " • Not var" : " • Not yok"}
        </Text>
      </View>

      {/* ------------------------------------------------ */}
      {/* ✅ Paylaşım Metni */}
      {/* ------------------------------------------------ */}
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
            minHeight: 140,
            textAlignVertical: "top",
            backgroundColor: "#fff",
          }}
        />
      </View>

      {/* ------------------------------------------------ */}
      {/* ✅ Paylaş / Güncelle */}
      {/* ------------------------------------------------ */}
      <Pressable
        onPress={onSubmit}
        disabled={!canSubmit}
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

      {/* ------------------------------------------------ */}
      {/* ✅ Paylaşımı Kaldır (sadece paylaşıldıysa) */}
      {/* ------------------------------------------------ */}
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

      {/* ------------------------------------------------ */}
      {/* ✅ Vazgeç */}
      {/* ------------------------------------------------ */}
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
