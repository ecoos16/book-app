import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { searchGoogleBooks } from "../lib/googleBooks";
import type { GoogleBook } from "../types/googleBooks";

type Props = {
  onSelect: (item: GoogleBook) => void;
};

export default function BookSearchPicker({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 700);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function fetchBooks() {
      try {
        setLoading(true);
        const data = await searchGoogleBooks(
          debouncedQuery,
          10,
          controller.signal,
        );
        setResults(data);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.log("Kitap arama hatası:", error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <View style={{ gap: 12 }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Kitap ara"
        autoCorrect={false}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: "#fff",
        }}
      />

      {loading && <ActivityIndicator />}

      {!loading && debouncedQuery.length >= 2 && results.length === 0 ? (
        <Text style={{ color: "#666" }}>Sonuç bulunamadı.</Text>
      ) : null}

      <View style={{ gap: 8 }}>
        {results.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item)}
            style={{
              flexDirection: "row",
              gap: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: "#eee",
              borderRadius: 12,
              backgroundColor: "#fff",
            }}
          >
            {item.thumbnail ? (
              <Image
                source={{ uri: item.thumbnail }}
                style={{ width: 50, height: 75, borderRadius: 8 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 50,
                  height: 75,
                  borderRadius: 8,
                  backgroundColor: "#eee",
                }}
              />
            )}

            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", flex: 1 }}>
                  {item.title || "Başlıksız"}
                </Text>

                {item.source ? (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: "#f2f2f2",
                    }}
                  >
                    <Text style={{ fontSize: 11, color: "#555" }}>
                      {item.source === "google" ? "Google" : "OpenLibrary"}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={{ color: "#666", marginTop: 4 }}>
                {item.authors?.join(", ") || "Yazar bilinmiyor"}
              </Text>

              <Text style={{ color: "#999", marginTop: 4 }}>
                {item.pageCount
                  ? `${item.pageCount} sayfa`
                  : "Sayfa bilgisi yok"}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
