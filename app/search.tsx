import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { searchGoogleBooks } from "../lib/googleBooks";
import { BookStatus } from "../types/book";
import { GoogleBook } from "../types/googleBooks";

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

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ status?: string; q?: string }>();

  const selectedStatus: BookStatus =
    params.status === "reading" ||
    params.status === "read" ||
    params.status === "want"
      ? params.status
      : "want";

  const [query, setQuery] = useState(
    typeof params.q === "string" ? params.q : "",
  );
  const q = useDebouncedValue(query, 700);

  const [items, setItems] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydratedInitialQuery = useRef(false);
  const inFlightQueryRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const isCoolingDown = Date.now() < cooldownUntil;

  useEffect(() => {
    if (hydratedInitialQuery.current) return;
    if (typeof params.q === "string" && params.q.trim()) {
      setQuery(params.q.trim());
    }
    hydratedInitialQuery.current = true;
  }, [params.q]);

  useEffect(() => {
    const trimmed = q.trim();

    if (trimmed.length < 3) {
      setItems([]);
      setError(null);
      setLoading(false);
      inFlightQueryRef.current = null;
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }

    if (isCoolingDown) return;
    if (inFlightQueryRef.current === trimmed) return;

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

  const helperText = useMemo(() => {
    const trimmed = query.trim();

    if (trimmed.length < 3) return "Aramak için en az 3 harf yaz…";
    if (isCoolingDown) return "Biraz yavaş 😅 kısa bir süre bekleniyor…";
    if (loading) return "Kitaplar aranıyor…";

    return "";
  }, [query, isCoolingDown, loading]);

  const showInitialEmpty = query.trim().length < 3 && !loading && !error;

  const showNoResults =
    query.trim().length >= 3 &&
    !loading &&
    !items.length &&
    error === "Sonuç bulunamadı.";

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

  const handleManualSubmit = () => {
    Keyboard.dismiss();
    setQuery((prev) => prev.trim());
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.bg,
        padding: 16,
        gap: 12,
      }}
    >
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
          returnKeyType="search"
          onSubmitEditing={handleManualSubmit}
          style={{ fontSize: 16, color: COLORS.text, flex: 1 }}
        />

        {!!query.trim() && (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </Pressable>
        )}
      </View>

      {!!helperText && (
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>{helperText}</Text>
      )}

      {loading && (
        <View style={{ paddingVertical: 10 }}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

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
      ) : showNoResults ? (
        <View
          style={{
            marginTop: 10,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 22,
            paddingVertical: 28,
            paddingHorizontal: 20,
            backgroundColor: COLORS.card,
            alignItems: "center",
          }}
        >
          <Text
            style={{
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
            Daha farklı bir kitap adı veya yazar deneyebilirsin.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const author =
              Array.isArray(item.authors) && item.authors.length > 0
                ? item.authors.join(", ")
                : "Bilinmeyen Yazar";

            return (
              <Pressable
                onPress={() => onSelect(item)}
                style={({ pressed }) => ({
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 22,
                  padding: 14,
                  backgroundColor: pressed ? "#f6f1ea" : COLORS.card,
                  flexDirection: "row",
                  gap: 12,
                })}
              >
                <View
                  style={{
                    width: 72,
                    height: 100,
                    borderRadius: 12,
                    backgroundColor: COLORS.primarySoft,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.thumbnail ? (
                    <Image
                      source={{ uri: item.thumbnail }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons
                      name="book-outline"
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                </View>

                <View style={{ flex: 1, justifyContent: "center", gap: 6 }}>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontSize: 17,
                      fontWeight: "900",
                      color: COLORS.text,
                    }}
                  >
                    {item.title}
                  </Text>

                  <Text numberOfLines={1} style={{ color: COLORS.muted }}>
                    {author}
                  </Text>

                  {!!item.pageCount && (
                    <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                      {item.pageCount} sayfa
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
