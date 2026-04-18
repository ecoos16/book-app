import { Ionicons } from "@expo/vector-icons";
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

const COLORS = {
  bg: "#fbf9f5",
  card: "#fffdf9",
  border: "#ece7df",
  text: "#2f2a24",
  muted: "#7a7268",
  primary: "#7d5739",
  primarySoft: "#f3e2d2",
  graySoft: "#f3efe8",
  whiteSoft: "#fff7f4",
  errorSoft: "#fff4f4",
  errorBorder: "#ffd8d8",
  errorText: "#a22b2b",
};

type Props = {
  onSelect: (item: GoogleBook) => void;
};

export default function BookSearchPicker({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const runSearch = async (searchText: string) => {
    const q = searchText.trim();

    if (q.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      console.log("🔎 BOOK SEARCH QUERY:", q);

      const data = await searchGoogleBooks(q, 10, controller.signal);

      console.log("📚 BOOK SEARCH RESULTS:", data);

      setResults(data);

      if (!data.length) {
        setError("Sonuç bulunamadı.");
      }
    } catch (error: any) {
      if (error?.name === "AbortError") return;

      console.log("❌ BOOK SEARCH ERROR:", error);

      const message =
        typeof error?.message === "string"
          ? error.message
          : "Arama sırasında bir hata oluştu.";

      setResults([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch(debouncedQuery);

    return () => {
      abortRef.current?.abort();
    };
  }, [debouncedQuery]);

  const renderBookCard = (item: GoogleBook) => {
    return (
      <Pressable
        key={item.id}
        onPress={() => onSelect(item)}
        style={({ pressed }) => ({
          flexDirection: "row",
          gap: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 18,
          backgroundColor: pressed ? "#f5efe7" : COLORS.card,
          alignItems: "center",
        })}
      >
        {item.thumbnail ? (
          <Image
            source={{ uri: item.thumbnail }}
            style={{ width: 56, height: 82, borderRadius: 10 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 82,
              borderRadius: 10,
              backgroundColor: COLORS.primarySoft,
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <Ionicons name="book-outline" size={24} color={COLORS.primary} />
            <Text style={{ fontSize: 10, color: COLORS.muted }}>Kapak yok</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "900",
                flex: 1,
                color: COLORS.text,
              }}
              numberOfLines={2}
            >
              {item.title || "Başlıksız"}
            </Text>

            {item.source ? (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: COLORS.graySoft,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: COLORS.primary,
                    fontWeight: "800",
                  }}
                >
                  {item.source === "google" ? "Google" : "OpenLibrary"}
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            style={{ color: COLORS.muted, marginTop: 4, fontSize: 13 }}
            numberOfLines={1}
          >
            {item.authors?.join(", ") || "Yazar bilinmiyor"}
          </Text>

          <Text style={{ color: COLORS.muted, marginTop: 4, fontSize: 12 }}>
            {item.pageCount ? `${item.pageCount} sayfa` : "Sayfa bilgisi yok"}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 16,
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
          placeholder="Kitap adı veya yazar ara"
          placeholderTextColor="#9a9389"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={() => runSearch(query)}
          style={{
            flex: 1,
            fontSize: 15,
            color: COLORS.text,
          }}
        />

        {!!query.trim() && (
          <Pressable
            onPress={() => {
              setQuery("");
              setDebouncedQuery("");
              setResults([]);
              setError(null);
            }}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </Pressable>
        )}
      </View>

      {query.trim().length > 0 && query.trim().length < 2 && (
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
          Aramak için en az 2 karakter yaz.
        </Text>
      )}

      {loading ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 18,
            paddingVertical: 18,
            paddingHorizontal: 14,
            backgroundColor: COLORS.card,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ActivityIndicator color={COLORS.primary} />
          <Text style={{ color: COLORS.muted }}>Kitaplar aranıyor...</Text>
        </View>
      ) : null}

      {!loading && !!error && (
        <View
          style={{
            borderWidth: 1,
            borderColor:
              error === "Sonuç bulunamadı."
                ? COLORS.border
                : COLORS.errorBorder,
            borderRadius: 18,
            paddingVertical: 22,
            paddingHorizontal: 16,
            backgroundColor:
              error === "Sonuç bulunamadı." ? COLORS.card : COLORS.errorSoft,
            alignItems: "center",
            gap: 8,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: COLORS.graySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="search-outline" size={24} color={COLORS.primary} />
          </View>

          <Text
            style={{
              fontWeight: "900",
              color:
                error === "Sonuç bulunamadı." ? COLORS.text : COLORS.errorText,
            }}
          >
            {error === "Sonuç bulunamadı."
              ? "Sonuç bulunamadı"
              : "Arama hatası"}
          </Text>

          <Text
            style={{
              color:
                error === "Sonuç bulunamadı." ? COLORS.muted : COLORS.errorText,
              textAlign: "center",
            }}
          >
            {error === "Sonuç bulunamadı."
              ? "Farklı bir kitap adı veya yazar adı deneyebilirsin."
              : error}
          </Text>
        </View>
      )}

      {results.length > 0 && (
        <View
          style={{
            gap: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 20,
            padding: 10,
            backgroundColor: COLORS.card,
          }}
        >
          <Text
            style={{
              fontWeight: "900",
              color: COLORS.text,
              marginBottom: 4,
              fontSize: 15,
            }}
          >
            Sonuçlar
          </Text>

          {results.map(renderBookCard)}
        </View>
      )}
    </View>
  );
}
