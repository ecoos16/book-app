// app/search.tsx

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { searchGoogleBooks } from "../lib/googleBooks";
import { BookStatus } from "../types/book";
import { GoogleBook } from "../types/googleBooks";

/**
 * Ortak renk paleti
 */
const COLORS = {
  bg: "#fbf9f5",
  card: "#fffdf9",
  border: "#ece7df",
  text: "#2f2a24",
  muted: "#7a7268",
  primary: "#7d5739",
  primaryDark: "#6b4a2f",
  primarySoft: "#f3e2d2",
  graySoft: "#f3efe8",
  whiteSoft: "#fff7f4",
  errorSoft: "#fff4f4",
  errorBorder: "#ffd8d8",
  errorText: "#a22b2b",
};

/**
 * Girilen değeri belirli süre geciktirerek döndüren custom hook
 *
 * Amaç:
 * Kullanıcı her harf yazdığında API çağrısı yapmak yerine
 * kısa süre bekleyip son değeri kullanmak
 */
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export default function SearchScreen() {
  /**
   * Bu ekran hangi statü için açıldı?
   * Örn:
   * /search?status=reading
   * /search?status=read
   * /search?status=want
   */
  const params = useLocalSearchParams<{ status?: string }>();

  /**
   * Gelen status geçerliyse onu kullan
   * değilse varsayılan olarak "want"
   */
  const selectedStatus: BookStatus =
    params.status === "reading" ||
    params.status === "read" ||
    params.status === "want"
      ? params.status
      : "want";

  /**
   * Kullanıcının input'a yazdığı ham değer
   */
  const [query, setQuery] = useState("");

  /**
   * Debounce edilmiş arama değeri
   */
  const q = useDebouncedValue(query, 900);

  /**
   * API'den gelen kitap sonuçları
   */
  const [items, setItems] = useState<GoogleBook[]>([]);

  /**
   * Yüklenme ve hata state'leri
   */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Şu anda hangi sorgu çalışıyor?
   * Aynı sorgunun tekrar tekrar gitmesini önlemeye yardımcı olur
   */
  const inFlightQueryRef = useRef<string | null>(null);

  /**
   * Önceki isteği iptal edebilmek için AbortController ref'i
   */
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Rate limit sonrası kısa bekleme süresi
   */
  const [cooldownUntil, setCooldownUntil] = useState(0);

  /**
   * Şu anda cooldown aktif mi?
   */
  const isCoolingDown = Date.now() < cooldownUntil;

  /**
   * Debounce edilmiş query değişince kitap ara
   */
  useEffect(() => {
    const trimmed = q.trim();

    /**
     * 3 karakterden kısa ise arama yapma
     * sonuçları da temizle
     */
    if (trimmed.length < 3) {
      setItems([]);
      setError(null);
      setLoading(false);

      inFlightQueryRef.current = null;
      abortRef.current?.abort();
      abortRef.current = null;

      return;
    }

    /**
     * Cooldown varsa bekle
     */
    if (isCoolingDown) return;

    /**
     * Aynı sorgu zaten çalışıyorsa tekrar yollama
     */
    if (inFlightQueryRef.current === trimmed) return;

    /**
     * Önceki isteği iptal et
     */
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    inFlightQueryRef.current = trimmed;

    let cancelled = false;

    async function run() {
      setError(null);
      setLoading(true);

      try {
        const data = await searchGoogleBooks(trimmed, 10, controller.signal);

        if (cancelled) return;

        setItems(data);

        if (!data.length) {
          setError("Sonuç bulunamadı.");
        }
      } catch (e: any) {
        if (cancelled) return;
        if (e?.name === "AbortError") return;

        const msg = String(e?.message ?? "Bir hata oluştu");

        /**
         * Rate limit yedikse kısa cooldown uygula
         */
        if (msg.includes("429") || msg.includes("RATE_LIMIT")) {
          setCooldownUntil(Date.now() + 2500);
          setError("Çok hızlı arama yaptık 😅 2 saniye bekleyip tekrar dene.");
        } else {
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);

        if (inFlightQueryRef.current === trimmed) {
          inFlightQueryRef.current = null;
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [q, isCoolingDown]);

  /**
   * Input altındaki yardımcı bilgi metni
   */
  const helperText = useMemo(() => {
    const trimmed = query.trim();

    if (trimmed.length < 3) return "Aramak için en az 3 harf yaz…";
    if (isCoolingDown) return "Biraz yavaş 😅 kısa bir süre bekleniyor…";
    if (loading) return "Kitaplar aranıyor…";

    return "";
  }, [query, isCoolingDown, loading]);

  /**
   * İlk boş durum kartı
   */
  const showInitialEmpty = query.trim().length < 3 && !loading && !error;

  /**
   * Sonuç bulunamadı kartı
   */
  const showNoResults =
    query.trim().length >= 3 &&
    !loading &&
    !items.length &&
    error === "Sonuç bulunamadı.";

  /**
   * Kullanıcı bir kitabı seçince
   * add-book ekranına ilgili bilgileri taşı
   */
  function onSelect(book: GoogleBook) {
    const author =
      Array.isArray(book.authors) && book.authors.length > 0
        ? book.authors.join(", ")
        : "";

    router.push({
      pathname: "/add-book",
      params: {
        title: book.title ?? "",
        author,
        pagesTotal:
          typeof book.pageCount === "number" ? String(book.pageCount) : "",
        thumbnail: book.thumbnail ?? "",
        googleId: book.id ?? "",
        status: selectedStatus,
      },
    });
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.bg,
        padding: 16,
        gap: 12,
      }}
    >
      {/* Üst başlık alanı */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            paddingVertical: 11,
            paddingHorizontal: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: pressed ? "#ece6dc" : COLORS.card,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          })}
        >
          <Ionicons name="arrow-back-outline" size={16} color={COLORS.text} />
          <Text style={{ fontWeight: "900", color: COLORS.text }}>Geri</Text>
        </Pressable>

        <Text style={{ fontSize: 26, fontWeight: "900", color: COLORS.text }}>
          Kitap Ara
        </Text>
      </View>

      {/* Arama input alanı */}
      <View
        style={{
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 18,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: COLORS.card,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Ionicons name="search-outline" size={18} color={COLORS.muted} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Kitap adı, yazar…"
          placeholderTextColor="#9a9389"
          autoCapitalize="none"
          autoCorrect={false}
          style={{ fontSize: 16, color: COLORS.text, flex: 1 }}
        />
      </View>

      {/* Yardımcı metin */}
      {!!helperText && (
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>{helperText}</Text>
      )}

      {/* Loading göstergesi */}
      {loading && (
        <View style={{ paddingVertical: 10 }}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {/* Genel hata kutusu */}
      {error && !loading && error !== "Sonuç bulunamadı." && (
        <View
          style={{
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.errorBorder,
            backgroundColor: COLORS.errorSoft,
          }}
        >
          <Text
            style={{
              fontWeight: "900",
              marginBottom: 6,
              color: COLORS.errorText,
            }}
          >
            Hata
          </Text>
          <Text style={{ color: COLORS.errorText }}>{error}</Text>
        </View>
      )}

      {/* İlk boş görünüm */}
      {showInitialEmpty ? (
        <View
          style={{
            marginTop: 10,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 22,
            paddingVertical: 30,
            paddingHorizontal: 20,
            backgroundColor: COLORS.card,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: COLORS.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="search-outline" size={30} color={COLORS.primary} />
          </View>

          <Text
            style={{
              marginTop: 12,
              fontSize: 18,
              fontWeight: "900",
              color: COLORS.text,
            }}
          >
            Yeni bir kitap keşfet
          </Text>

          <Text
            style={{
              marginTop: 6,
              color: COLORS.muted,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            ReadSphere içinde kitap adı veya yazar yazarak aramaya
            başlayabilirsin.
          </Text>
        </View>
      ) : null}

      {/* Sonuç yok görünümü */}
      {showNoResults ? (
        <View
          style={{
            marginTop: 10,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 22,
            paddingVertical: 30,
            paddingHorizontal: 20,
            backgroundColor: COLORS.card,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: COLORS.graySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="book-outline" size={28} color={COLORS.primary} />
          </View>

          <Text
            style={{
              marginTop: 12,
              fontSize: 18,
              fontWeight: "900",
              color: COLORS.text,
            }}
          >
            Sonuç bulunamadı
          </Text>

          <Text
            style={{
              marginTop: 6,
              color: COLORS.muted,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Daha farklı bir kitap adı ya da yazar ismi deneyebilirsin.
          </Text>
        </View>
      ) : null}

      {/* Sonuç listesi */}
      {!showInitialEmpty && !showNoResults ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
          renderItem={({ item }) => {
            const author = item.authors?.join(", ") || "Yazar bilinmiyor";

            return (
              <Pressable
                onPress={() => onSelect(item)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  gap: 12,
                  padding: 12,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  alignItems: "center",
                  backgroundColor: pressed ? "#f5efe7" : COLORS.card,
                })}
              >
                {/* Kapak */}
                <View
                  style={{
                    width: 58,
                    height: 84,
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: COLORS.primarySoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.thumbnail ? (
                    <Image
                      source={{ uri: item.thumbnail }}
                      style={{ width: 58, height: 84 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: COLORS.primarySoft,
                        gap: 2,
                      }}
                    >
                      <Ionicons
                        name="book-outline"
                        size={24}
                        color={COLORS.primary}
                      />
                      <Text style={{ fontSize: 10, color: COLORS.muted }}>
                        Kapak yok
                      </Text>
                    </View>
                  )}
                </View>

                {/* Sağ metin alanı */}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontWeight: "900",
                      fontSize: 15,
                      color: COLORS.text,
                    }}
                  >
                    {item.title}
                  </Text>

                  <Text numberOfLines={1} style={{ color: COLORS.muted }}>
                    {author}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={{ color: COLORS.muted, fontSize: 12 }}
                  >
                    {item.pageCount
                      ? `${item.pageCount} sayfa`
                      : "Sayfa bilgisi yok"}
                    {item.categories?.length ? ` • ${item.categories[0]}` : ""}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      ) : null}
    </View>
  );
}
