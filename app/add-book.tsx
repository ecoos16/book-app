import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { StarRating } from "../components/StarRating";
import { useBooks } from "../context/BooksContext";
import type { BookStatus } from "../types/book";

/**
 * Durum etiketleri
 */
const statusLabel: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

export default function AddBook() {
  const { addBook } = useBooks();

  // ✅ Search ekranından gelen parametreler
  const params = useLocalSearchParams<{
    title?: string;
    author?: string;
    pagesTotal?: string;
    thumbnail?: string;
    googleId?: string;
  }>();

  // Temel alanlar
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  // Durum
  const [status, setStatus] = useState<BookStatus>("reading");

  // ✅ Okudum alanları
  const [rating, setRating] = useState<number>(0);
  const [note, setNote] = useState("");

  // ✅ Okuyorum alanları (progress)
  const [pagesTotalText, setPagesTotalText] = useState(""); // TextInput string tutar
  const [pagesReadText, setPagesReadText] = useState("");

  // ✅ Autofill sadece 1 kere çalışsın (kullanıcı yazarken overwrite etmesin)
  const didHydrate = useRef(false);

  useEffect(() => {
    if (didHydrate.current) return;

    const incomingTitle = typeof params.title === "string" ? params.title : "";
    const incomingAuthor =
      typeof params.author === "string" ? params.author : "";
    const incomingPagesTotal =
      typeof params.pagesTotal === "string" ? params.pagesTotal : "";

    const hasIncoming = !!(
      incomingTitle ||
      incomingAuthor ||
      incomingPagesTotal
    );
    if (!hasIncoming) return;

    // Başlık / yazar doldur
    if (incomingTitle) setTitle(incomingTitle);
    if (incomingAuthor) setAuthor(incomingAuthor);

    // Sayfa bilgisi geldiyse reading'e uygun
    if (incomingPagesTotal) {
      setStatus("reading");
      setPagesTotalText(incomingPagesTotal);
    }

    didHydrate.current = true;
  }, [params.title, params.author, params.pagesTotal]);

  // Kaydet butonu kontrol
  const canSave = useMemo(() => {
    return title.trim().length > 0 && author.trim().length > 0;
  }, [title, author]);

  /**
   * Status değişince gereksiz alanları temizleyelim (UX için)
   */
  const onChangeStatus = (next: BookStatus) => {
    setStatus(next);

    // Okudum değilse rating/note temizle
    if (next !== "read") {
      setRating(0);
      setNote("");
    }

    // Okuyorum değilse sayfa alanlarını temizle
    if (next !== "reading") {
      setPagesTotalText("");
      setPagesReadText("");
    }
  };

  /**
   * TextInput'tan gelen sayıları güvenli number'a çeviren helper
   */
  const toSafeNumber = (t: string) => {
    const n = Number(t.replace(",", "."));
    if (!Number.isFinite(n)) return undefined;
    // sayfa sayısı negatif olamaz
    const v = Math.max(0, Math.floor(n));
    return v;
  };

  const onSubmit = () => {
    if (!canSave) {
      Alert.alert("Eksik bilgi", "Kitap adı ve yazar zorunlu.");
      return;
    }

    // ✅ Progress alanlarını sadece status=reading ise kaydet
    const pagesTotal =
      status === "reading" ? toSafeNumber(pagesTotalText) : undefined;
    const pagesRead =
      status === "reading" ? toSafeNumber(pagesReadText) : undefined;

    // Eğer toplam sayfa girilmişse ve okunan daha büyükse otomatik sınırla
    const fixedPagesRead =
      typeof pagesTotal === "number" && typeof pagesRead === "number"
        ? Math.min(pagesRead, pagesTotal)
        : pagesRead;

    const safeThumbnail =
      typeof params.thumbnail === "string" && params.thumbnail.length > 0
        ? params.thumbnail
        : undefined;

    const safeGoogleId =
      typeof params.googleId === "string" && params.googleId.length > 0
        ? params.googleId
        : undefined;

    addBook({
      title: title.trim(),
      author: author.trim(),
      status,

      // ✅ Kapak / Google referansı (ürün hissi)
      thumbnail: safeThumbnail,
      googleId: safeGoogleId,

      // Okudum -> rating/note
      rating: status === "read" && rating > 0 ? rating : undefined,
      note:
        status === "read" && note.trim().length > 0 ? note.trim() : undefined,

      // Okuyorum -> progress
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
      <Text style={{ fontSize: 22, fontWeight: "900" }}>Kitap Ekle</Text>

      {/* Kitap adı */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: "800" }}>Kitap Adı</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Örn: 1984"
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
        <Text style={{ fontWeight: "800" }}>Yazar</Text>
        <TextInput
          value={author}
          onChangeText={setAuthor}
          placeholder="Örn: George Orwell"
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
        <Text style={{ fontWeight: "800" }}>Durum</Text>
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
                  style={{ color: active ? "#fff" : "#111", fontWeight: "800" }}
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
            <Text style={{ fontWeight: "800" }}>Toplam Sayfa</Text>
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
            <Text style={{ fontWeight: "800" }}>Okunan Sayfa</Text>
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
            (İpucu: Okunan sayfa toplamdan büyükse otomatik düzeltilir)
          </Text>
        </View>
      )}

      {/* ✅ SADECE "Okudum" seçiliyse Puan + Not */}
      {status === "read" && (
        <>
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "800" }}>Puan</Text>
            <StarRating value={rating} onChange={setRating} />
            <Pressable
              onPress={() => setRating(0)}
              style={{ alignSelf: "flex-start" }}
            >
              <Text style={{ color: "#666" }}>Puanı temizle</Text>
            </Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: "800" }}>Not</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Kitap hakkında kısa notun…"
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
        onPress={onSubmit}
        style={{
          marginTop: 8,
          backgroundColor: canSave ? "#111" : "#999",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>Kaydet</Text>
      </Pressable>

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
