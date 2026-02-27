import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
  const q = useDebouncedValue(query, 450);

  const [items, setItems] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);

      const trimmed = q.trim();
      if (!trimmed) {
        setItems([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchGoogleBooks(trimmed, 20);
        if (!cancelled) setItems(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Bir hata oluştu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [q]);

  const emptyText = useMemo(() => {
    if (!q.trim()) return "Kitap aramak için yazmaya başla…";
    if (loading) return "";
    if (error) return "";
    return "Sonuç bulunamadı.";
  }, [q, loading, error]);

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

        <Text style={{ fontSize: 20, fontWeight: "900" }}>Kitap Ara</Text>
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
          onChangeText={setQuery}
          placeholder="Kitap adı, yazar…"
          autoCapitalize="none"
          autoCorrect={false}
          style={{ fontSize: 16 }}
        />
      </View>

      {loading && (
        <View style={{ paddingVertical: 10 }}>
          <ActivityIndicator />
        </View>
      )}

      {error && (
        <View
          style={{
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#f2b8b5",
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontWeight: "900", marginBottom: 6 }}>Hata</Text>
          <Text>{error}</Text>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={{ paddingTop: 20 }}>
              <Text style={{ color: "#666" }}>{emptyText}</Text>
            </View>
          ) : null
        }
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
                  width: 52,
                  height: 74,
                  borderRadius: 10,
                  overflow: "hidden",
                  backgroundColor: "#f3f3f3",
                }}
              >
                {item.thumbnail ? (
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={{ width: 52, height: 74 }}
                    resizeMode="cover"
                  />
                ) : null}
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text numberOfLines={2} style={{ fontWeight: "900" }}>
                  {item.title}
                </Text>

                <Text numberOfLines={1} style={{ color: "#444" }}>
                  {author}
                </Text>

                <Text numberOfLines={1} style={{ color: "#777", fontSize: 12 }}>
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
    </View>
  );
}
