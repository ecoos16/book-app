import { router } from "expo-router";
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
import { GoogleBook } from "../types/googleBooks";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query, 900);

  const [items, setItems] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inFlightQueryRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [cooldownUntil, setCooldownUntil] = useState(0);
  const isCoolingDown = Date.now() < cooldownUntil;

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

        if (msg.includes("429")) {
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
    const author = book.authors?.join(", ") ?? "";

    router.push({
      pathname: "/add-book",
      params: {
        title: book.title,
        author,
        pagesTotal: book.pageCount ? String(book.pageCount) : "",
        thumbnail: book.thumbnail ?? "",
        googleId: book.id,
      },
    });
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#ddd",
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontWeight: "900" }}>Geri</Text>
        </Pressable>

        <Text style={{ fontSize: 22, fontWeight: "900" }}>Kitap Ara</Text>
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: "#fff",
        }}
      >
        <TextInput
          value={query}
          onChangeText={(t) => setQuery(t)}
          placeholder="Kitap adı, yazar…"
          autoCapitalize="none"
          autoCorrect={false}
          style={{ fontSize: 16 }}
        />
      </View>

      {!!helperText && (
        <Text style={{ color: "#666", fontSize: 12 }}>{helperText}</Text>
      )}

      {loading && (
        <View style={{ paddingVertical: 10 }}>
          <ActivityIndicator />
        </View>
      )}

      {error && !loading && error !== "Sonuç bulunamadı." && (
        <View
          style={{
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#f2b8b5",
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontWeight: "900", marginBottom: 6 }}>Hata</Text>
          <Text style={{ color: "#555" }}>{error}</Text>
        </View>
      )}

      {showInitialEmpty ? (
        <View
          style={{
            marginTop: 10,
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 18,
            paddingVertical: 30,
            paddingHorizontal: 20,
            backgroundColor: "#fff",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 42 }}>🔎</Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 17,
              fontWeight: "800",
              color: "#222",
            }}
          >
            Yeni bir kitap keşfet
          </Text>
          <Text
            style={{
              marginTop: 6,
              color: "#666",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            ReadSphere içinde kitap adı veya yazar yazarak aramaya
            başlayabilirsin.
          </Text>
        </View>
      ) : null}

      {showNoResults ? (
        <View
          style={{
            marginTop: 10,
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 18,
            paddingVertical: 30,
            paddingHorizontal: 20,
            backgroundColor: "#fff",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 38 }}>📭</Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 17,
              fontWeight: "800",
              color: "#222",
            }}
          >
            Sonuç bulunamadı
          </Text>
          <Text
            style={{
              marginTop: 6,
              color: "#666",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Daha farklı bir kitap adı ya da yazar ismi deneyebilirsin.
          </Text>
        </View>
      ) : null}

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
                style={{
                  flexDirection: "row",
                  gap: 12,
                  padding: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#eee",
                  alignItems: "center",
                  backgroundColor: "#fff",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 80,
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: "#f3f3f3",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.thumbnail ? (
                    <Image
                      source={{ uri: item.thumbnail }}
                      style={{ width: 56, height: 80 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f1f1f1",
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>📚</Text>
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#777",
                          marginTop: 2,
                        }}
                      >
                        No cover
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontWeight: "900",
                      fontSize: 15,
                      color: "#1a1a1a",
                    }}
                  >
                    {item.title}
                  </Text>

                  <Text numberOfLines={1} style={{ color: "#444" }}>
                    {author}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={{ color: "#777", fontSize: 12 }}
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
