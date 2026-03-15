import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import BookSearchPicker from "../components/BookSearchPicker";
import { StarRating } from "../components/StarRating";
import { useBooks } from "../context/BooksContext";
import type { BookStatus } from "../types/book";
import type { GoogleBook } from "../types/googleBooks";

/**
 * Durum etiketleri
 * UI'da kullanıcıya Türkçe olarak gösterilecek karşılıklar
 */
const statusLabel: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

export default function AddBook() {
  /**
   * Global context içinden yeni kitap ekleme fonksiyonu
   */
  const { addBook } = useBooks();

  /**
   * Route parametreleri
   * Liste ekranlarından veya search ekranından bilgi gelebilir
   */
  const params = useLocalSearchParams<{
    title?: string;
    author?: string;
    pagesTotal?: string;
    thumbnail?: string;
    googleId?: string;
    status?: BookStatus;
  }>();

  /**
   * API'den seçilen son kitabı tutuyoruz
   * Önizleme kartında kullanıyoruz
   */
  const [selectedGoogleBook, setSelectedGoogleBook] =
    useState<GoogleBook | null>(null);

  /**
   * Temel form state'leri
   */
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  /**
   * Kitabın listede hangi durumda olacağı
   */
  const [status, setStatus] = useState<BookStatus>("reading");

  /**
   * "Okudum" durumuna özel alanlar
   */
  const [rating, setRating] = useState<number>(0);
  const [note, setNote] = useState("");

  /**
   * Sayfa bilgileri
   * TextInput kullandığımız için string tutuyoruz
   */
  const [pagesTotalText, setPagesTotalText] = useState("");
  const [pagesReadText, setPagesReadText] = useState("");

  /**
   * API'den gelen kapak ve benzersiz id
   */
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [googleId, setGoogleId] = useState<string | undefined>(undefined);

  /**
   * Parametrelerden gelen verinin formu sadece 1 kez doldurması için ref
   */
  const didHydrate = useRef(false);

  /**
   * Ekran ilk açıldığında route'tan gelen verileri forma bas
   */
  useEffect(() => {
    if (didHydrate.current) return;

    const incomingTitle = typeof params.title === "string" ? params.title : "";
    const incomingAuthor =
      typeof params.author === "string" ? params.author : "";
    const incomingPagesTotal =
      typeof params.pagesTotal === "string" ? params.pagesTotal : "";
    const incomingThumbnail =
      typeof params.thumbnail === "string" ? params.thumbnail : "";
    const incomingGoogleId =
      typeof params.googleId === "string" ? params.googleId : "";

    const incomingStatus =
      params.status === "reading" ||
      params.status === "read" ||
      params.status === "want"
        ? params.status
        : undefined;

    const hasIncoming = !!(
      incomingTitle ||
      incomingAuthor ||
      incomingPagesTotal ||
      incomingThumbnail ||
      incomingGoogleId ||
      incomingStatus
    );

    if (!hasIncoming) return;

    if (incomingTitle) setTitle(incomingTitle);
    if (incomingAuthor) setAuthor(incomingAuthor);
    if (incomingPagesTotal) setPagesTotalText(incomingPagesTotal);
    if (incomingThumbnail) setThumbnail(incomingThumbnail);
    if (incomingGoogleId) setGoogleId(incomingGoogleId);
    if (incomingStatus) setStatus(incomingStatus);

    /**
     * Eğer route'tan gelen durum "read" ise ve toplam sayfa da geldiyse
     * kitabı tamamlanmış gibi işaretleyebiliriz
     */
    if (incomingStatus === "read" && incomingPagesTotal) {
      setPagesReadText(incomingPagesTotal);
    }

    didHydrate.current = true;
  }, [
    params.title,
    params.author,
    params.pagesTotal,
    params.thumbnail,
    params.googleId,
    params.status,
  ]);

  /**
   * Kaydet butonu aktif mi?
   * Kitap adı ve yazar zorunlu
   */
  const canSave = useMemo(() => {
    return title.trim().length > 0 && author.trim().length > 0;
  }, [title, author]);

  /**
   * String numeric inputu güvenli sayıya çevir
   */
  const toSafeNumber = (t: string) => {
    const onlyDigits = t.replace(/[^\d]/g, "");

    if (!onlyDigits) return undefined;

    const n = Number(onlyDigits);

    if (!Number.isFinite(n)) return undefined;

    return Math.max(0, Math.floor(n));
  };

  /**
   * Kullanıcı durum değiştirince ilgili alanları temizle / ayarla
   */
  const onChangeStatus = (next: BookStatus) => {
    setStatus(next);

    // "Okudum" dışındaki durumlarda puan ve not gereksiz
    if (next !== "read") {
      setRating(0);
      setNote("");
    }

    // "Okudum" seçildiyse ve toplam sayfa bilgisi varsa
    // okunan sayfayı otomatik toplam sayfaya eşitle
    if (next === "read" && pagesTotalText) {
      setPagesReadText(pagesTotalText);
    }

    // "İstiyorum" seçildiyse okunan sayfa bilgisi silinsin
    if (next === "want") {
      setPagesReadText("");
    }
  };

  /**
   * API'den kitap seçilince formu doldur
   */
  const handleSelectGoogleBook = (item: GoogleBook) => {
    setSelectedGoogleBook(item);

    const nextTitle = item.title?.trim() || "";

    const nextAuthor =
      Array.isArray(item.authors) && item.authors.length > 0
        ? item.authors.join(", ")
        : "";

    const nextPagesTotal =
      typeof item.pageCount === "number" && item.pageCount > 0
        ? String(item.pageCount)
        : "";

    // Temel bilgiler
    setTitle(nextTitle);
    setAuthor(nextAuthor);
    setPagesTotalText(nextPagesTotal);

    // Metadata
    setThumbnail(item.thumbnail || undefined);
    setGoogleId(item.id || undefined);

    /**
     * Eğer kullanıcı "Okudum" durumundaysa
     * ve sayfa sayısı geldiyse kitabı tamamlanmış kabul et
     */
    if (status === "read" && nextPagesTotal) {
      setPagesReadText(nextPagesTotal);
    }

    /**
     * Eğer durum "İstiyorum" ise okunan sayfa gereksiz
     */
    if (status === "want") {
      setPagesReadText("");
    }
  };

  /**
   * Form gönderme
   */
  const onSubmit = () => {
    if (!canSave) {
      Alert.alert("Eksik bilgi", "Kitap adı ve yazar zorunlu.");
      return;
    }

    // Toplam sayfa artık genel bilgi olarak saklanabilir
    const pagesTotal = toSafeNumber(pagesTotalText);

    // Okunan sayfa sadece reading ve read için anlamlı
    const pagesRead =
      status === "reading" || status === "read"
        ? toSafeNumber(pagesReadText)
        : undefined;

    // Okunan sayfa toplam sayfayı aşmasın
    const fixedPagesRead =
      typeof pagesTotal === "number" && typeof pagesRead === "number"
        ? Math.min(pagesRead, pagesTotal)
        : pagesRead;

    /**
     * Yeni kitabı context'e ekle
     */
    addBook({
      title: title.trim(),
      author: author.trim(),
      status,
      thumbnail,
      googleId,

      // Sadece "Okudum" için değerlendirme alanları
      rating: status === "read" && rating > 0 ? rating : undefined,
      note:
        status === "read" && note.trim().length > 0 ? note.trim() : undefined,

      // Toplam sayfa varsa her durumda saklanabilir
      pagesTotal:
        typeof pagesTotal === "number" && pagesTotal > 0
          ? pagesTotal
          : undefined,

      // Okunan sayfa sadece reading / read için geçerli
      pagesRead:
        (status === "reading" || status === "read") &&
        typeof fixedPagesRead === "number" &&
        fixedPagesRead > 0
          ? fixedPagesRead
          : undefined,
    });

    // Kaydettikten sonra geri dön
    router.back();
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 14 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Başlık alanı */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 24, fontWeight: "900" }}>Kitap Ekle</Text>
        <Text style={{ color: "#666" }}>
          Kitabı ara, bilgileri otomatik doldur ve listene ekle.
        </Text>
      </View>

      {/* Arama kartı */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#eee",
          borderRadius: 16,
          padding: 14,
          backgroundColor: "#fff",
          gap: 8,
        }}
      >
        <Text style={{ fontWeight: "800" }}>Kitap Ara</Text>
        <BookSearchPicker onSelect={handleSelectGoogleBook} />
      </View>

      {/* Seçilen kitap önizleme kartı */}
      {(selectedGoogleBook || thumbnail || title || author) && (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 16,
            padding: 12,
            backgroundColor: "#fff",
            flexDirection: "row",
            gap: 12,
          }}
        >
          {/* Kapak görseli */}
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              style={{ width: 64, height: 96, borderRadius: 10 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 64,
                height: 96,
                borderRadius: 10,
                backgroundColor: "#eee",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 22 }}>📚</Text>
            </View>
          )}

          {/* Kitap özeti */}
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text style={{ fontWeight: "800", fontSize: 16 }} numberOfLines={2}>
              {title || "Kitap seçilmedi"}
            </Text>

            <Text style={{ color: "#666", marginTop: 4 }} numberOfLines={1}>
              {author || "Yazar bilgisi yok"}
            </Text>

            {pagesTotalText ? (
              <Text style={{ color: "#888", marginTop: 4 }}>
                {pagesTotalText} sayfa
              </Text>
            ) : null}

            {googleId ? (
              <Text style={{ color: "#aaa", marginTop: 4, fontSize: 12 }}>
                API ile seçildi
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Temel bilgi kartı */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#eee",
          borderRadius: 16,
          padding: 14,
          backgroundColor: "#fff",
          gap: 12,
        }}
      >
        <Text style={{ fontWeight: "800" }}>Temel Bilgiler</Text>

        {/* Kitap adı */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: "700" }}>Kitap Adı</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Örn: 1984"
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 12,
              padding: 12,
              backgroundColor: "#fafafa",
            }}
          />
        </View>

        {/* Yazar */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: "700" }}>Yazar</Text>
          <TextInput
            value={author}
            onChangeText={setAuthor}
            placeholder="Örn: George Orwell"
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 12,
              padding: 12,
              backgroundColor: "#fafafa",
            }}
          />
        </View>

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
              backgroundColor: "#fafafa",
            }}
          />
        </View>
      </View>

      {/* Durum kartı */}
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
        <Text style={{ fontWeight: "800" }}>Durum</Text>

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {(["reading", "read", "want"] as BookStatus[]).map((s) => {
            const active = s === status;

            return (
              <Pressable
                key={s}
                onPress={() => onChangeStatus(s)}
                style={{
                  paddingHorizontal: 14,
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
                    fontWeight: "800",
                  }}
                >
                  {statusLabel[s]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Reading / Read için okunan sayfa kartı */}
      {(status === "reading" || status === "read") && (
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
          <Text style={{ fontWeight: "800" }}>
            {status === "reading" ? "Okuma İlerlemesi" : "Okuma Bilgisi"}
          </Text>

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
                backgroundColor: "#fafafa",
              }}
            />
          </View>

          <Text style={{ color: "#888", fontSize: 12 }}>
            Okunan sayfa toplamdan büyükse otomatik düzeltilir.
          </Text>
        </View>
      )}

      {/* Sadece read için değerlendirme kartı */}
      {status === "read" && (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 16,
            padding: 14,
            backgroundColor: "#fff",
            gap: 12,
          }}
        >
          <Text style={{ fontWeight: "800" }}>Değerlendirme</Text>

          {/* Yıldız puanı */}
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

          {/* Not alanı */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: "700" }}>Not</Text>
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
                backgroundColor: "#fafafa",
              }}
            />
          </View>
        </View>
      )}

      {/* Kaydet butonu */}
      <Pressable
        onPress={onSubmit}
        style={{
          marginTop: 4,
          backgroundColor: canSave ? "#111" : "#999",
          paddingVertical: 14,
          borderRadius: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>Kaydet</Text>
      </Pressable>

      {/* Vazgeç butonu */}
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
        <Text style={{ fontWeight: "900" }}>Vazgeç</Text>
      </Pressable>
    </ScrollView>
  );
}
