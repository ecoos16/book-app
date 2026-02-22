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
import { StarRating } from "../../components/StarRating";
import { useBooks } from "../../context/BooksContext";
import type { BookStatus } from "../../types/book";

/**
 * Durum etiketleri (UI'da görünen Türkçe karşılıklar)
 */
const statusLabel: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

export default function EditBook() {
  /**
   * URL'den id alıyoruz: /edit-book/[id]
   */
  const { id } = useLocalSearchParams<{ id: string }>();

  /**
   * Context'ten:
   * - getById: kitabı bul
   * - updateBook: güncelle
   */
  const { getById, updateBook } = useBooks();

  const book = id ? getById(id) : undefined;

  /**
   * ✅ Form state'leri
   * book varsa mevcut değerlerle başlatıyoruz
   */
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [status, setStatus] = useState<BookStatus>(book?.status ?? "reading");

  // ✅ Okudum alanları
  const [note, setNote] = useState(book?.note ?? "");
  const [rating, setRating] = useState<number>(book?.rating ?? 0);

  // ✅ Okuyorum alanları (progress)
  // TextInput string tuttuğu için sayıları string olarak saklıyoruz
  const [pagesTotalText, setPagesTotalText] = useState(
    book?.pagesTotal ? String(book.pagesTotal) : "",
  );
  const [pagesReadText, setPagesReadText] = useState(
    book?.pagesRead ? String(book.pagesRead) : "",
  );

  /**
   * Kaydet butonunun aktifliği:
   * title ve author boş olmamalı
   */
  const canSave = useMemo(
    () => title.trim().length > 0 && author.trim().length > 0,
    [title, author],
  );

  /**
   * Kitap bulunamazsa güvenli ekran
   */
  if (!book) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>
          Kitap bulunamadı
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 12,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#ddd",
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "700" }}>Geri</Text>
        </Pressable>
      </ScrollView>
    );
  }

  /**
   * ✅ TextInput’tan gelen sayıları güvenli number’a çevirir
   * - NaN ise undefined
   * - negatif ise 0
   * - küsurat girilirse floor ile tamsayıya indirir
   */
  const toSafeNumber = (t: string) => {
    const n = Number(t.replace(",", "."));
    if (!Number.isFinite(n)) return undefined;
    return Math.max(0, Math.floor(n));
  };

  /**
   * ✅ Status değişince UX:
   * - Okudum değilse: rating/note temizle
   * - Okuyorum değilse: pagesTotal/pagesRead temizle
   */
  const onChangeStatus = (next: BookStatus) => {
    setStatus(next);

    // Okudum değilse -> rating/note temizle
    if (next !== "read") {
      setRating(0);
      setNote("");
    }

    // Okuyorum değilse -> progress temizle
    if (next !== "reading") {
      setPagesTotalText("");
      setPagesReadText("");
    }
  };

  /**
   * ✅ Kaydet
   * Status’a göre doğru alanları güncelleriz
   */
  const onSave = () => {
    if (!canSave) {
      Alert.alert("Eksik bilgi", "Kitap adı ve yazar zorunlu.");
      return;
    }

    // ✅ Progress alanlarını sadece Okuyorum seçiliyse kullan
    const pagesTotal =
      status === "reading" ? toSafeNumber(pagesTotalText) : undefined;
    const pagesRead =
      status === "reading" ? toSafeNumber(pagesReadText) : undefined;

    // Okunan sayfa toplamdan büyükse otomatik sınırla
    const fixedPagesRead =
      typeof pagesTotal === "number" && typeof pagesRead === "number"
        ? Math.min(pagesRead, pagesTotal)
        : pagesRead;

    updateBook(book.id, {
      // temel alanlar
      title: title.trim(),
      author: author.trim(),
      status,

      // ✅ Okudum ise rating/note kaydet, değilse temizle
      note: status === "read" && note.trim().length ? note.trim() : undefined,
      rating: status === "read" && rating > 0 ? rating : undefined,

      // ✅ Okuyorum ise progress kaydet, değilse temizle
      pagesTotal:
        status === "reading" && typeof pagesTotal === "number" && pagesTotal > 0
          ? pagesTotal
          : undefined,
      pagesRead:
        status === "reading" &&
        typeof fixedPagesRead === "number" &&
        fixedPagesRead > 0
          ? fixedPagesRead
          : undefined,
    });

    router.back();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Kitabı Düzenle</Text>

      {/* Kitap adı */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: "700" }}>Kitap Adı</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Kitap adı"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#fff",
          }}
        />
      </View>

      {/* Yazar */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: "700" }}>Yazar</Text>
        <TextInput
          value={author}
          onChangeText={setAuthor}
          placeholder="Yazar"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#fff",
          }}
        />
      </View>

      {/* Durum seçimi */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: "700" }}>Durum</Text>

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {(["reading", "read", "want"] as BookStatus[]).map((s) => {
            const active = s === status;

            return (
              <Pressable
                key={s}
                onPress={() => onChangeStatus(s)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? "#111" : "#ddd",
                  backgroundColor: active ? "#111" : "#fff",
                }}
              >
                <Text
                  style={{
                    color: active ? "#fff" : "#111",
                    fontWeight: "700",
                  }}
                >
                  {statusLabel[s]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ✅ SADECE "Okuyorum" seçiliyse Progress alanları */}
      {status === "reading" && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontWeight: "900" }}>Okuma İlerlemesi</Text>

          {/* Toplam sayfa */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: "700" }}>Toplam Sayfa</Text>
            <TextInput
              value={pagesTotalText}
              onChangeText={setPagesTotalText}
              placeholder="Örn: 320"
              keyboardType="number-pad"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 12,
                padding: 12,
                backgroundColor: "#fff",
              }}
            />
          </View>

          {/* Okunan sayfa */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: "700" }}>Okunan Sayfa</Text>
            <TextInput
              value={pagesReadText}
              onChangeText={setPagesReadText}
              placeholder="Örn: 45"
              keyboardType="number-pad"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 12,
                padding: 12,
                backgroundColor: "#fff",
              }}
            />
          </View>

          <Text style={{ color: "#888", fontSize: 12 }}>
            (Okunan sayfa toplamdan büyükse otomatik düzeltilir)
          </Text>
        </View>
      )}

      {/* ✅ SADECE "Okudum" seçiliyse Puan + Not */}
      {status === "read" && (
        <>
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "700" }}>Puan</Text>
            <StarRating value={rating} onChange={setRating} />

            <Pressable
              onPress={() => setRating(0)}
              style={{ alignSelf: "flex-start" }}
            >
              <Text style={{ color: "#666" }}>Puanı temizle</Text>
            </Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: "700" }}>Not</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Bu kitapla ilgili notun…"
              multiline
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 12,
                padding: 12,
                minHeight: 110,
                textAlignVertical: "top",
                backgroundColor: "#fff",
              }}
            />
          </View>
        </>
      )}

      {/* Kaydet */}
      <Pressable
        onPress={onSave}
        style={{
          marginTop: 8,
          backgroundColor: canSave ? "#111" : "#999",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>Kaydet</Text>
      </Pressable>

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
        <Text style={{ fontWeight: "800" }}>Geri</Text>
      </Pressable>
    </ScrollView>
  );
}
