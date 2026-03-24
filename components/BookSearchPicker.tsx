// components/BookSearchPicker.tsx

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

/**
 * ReadSphere ortak renk paleti
 */
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
};

/**
 * Parent component, seçilen kitabı üst componente yollar
 */
type Props = {
  onSelect: (item: GoogleBook) => void;
};

export default function BookSearchPicker({ onSelect }: Props) {
  /**
   * Kullanıcı arama metni
   */
  const [query, setQuery] = useState("");

  /**
   * API sonuçları
   */
  const [results, setResults] = useState<GoogleBook[]>([]);

  /**
   * Yükleniyor durumu
   */
  const [loading, setLoading] = useState(false);

  /**
   * Debounce edilmiş query
   */
  const [debouncedQuery, setDebouncedQuery] = useState("");

  /**
   * Önceki isteği iptal etmek için AbortController
   */
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Debounce mekanizması
   * Kullanıcı yazmayı bıraktıktan sonra 700ms beklenir
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 700);

    return () => clearTimeout(timer);
  }, [query]);

  /**
   * Debounced query değiştiğinde API çağrısı yapılır
   */
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
        /**
         * AbortError normaldir:
         * kullanıcı yeni arama girmiştir
         */
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

  /**
   * Tek kitap kartı render helper'ı
   */
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
        {/* Kapak */}
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

        {/* Sağ bilgi alanı */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            {/* Başlık */}
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

            {/* Kaynak rozeti */}
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

          {/* Yazar */}
          <Text
            style={{ color: COLORS.muted, marginTop: 4, fontSize: 13 }}
            numberOfLines={1}
          >
            {item.authors?.join(", ") || "Yazar bilinmiyor"}
          </Text>

          {/* Sayfa sayısı */}
          <Text style={{ color: COLORS.muted, marginTop: 4, fontSize: 12 }}>
            {item.pageCount ? `${item.pageCount} sayfa` : "Sayfa bilgisi yok"}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ gap: 12 }}>
      {/* Arama inputu */}
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
          style={{
            flex: 1,
            fontSize: 15,
            color: COLORS.text,
          }}
        />
      </View>

      {/* Yükleniyor alanı */}
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

      {/* Sonuç bulunamadı */}
      {!loading && debouncedQuery.length >= 2 && results.length === 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 18,
            paddingVertical: 22,
            paddingHorizontal: 16,
            backgroundColor: COLORS.card,
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

          <Text style={{ fontWeight: "900", color: COLORS.text }}>
            Sonuç bulunamadı
          </Text>

          <Text style={{ color: COLORS.muted, textAlign: "center" }}>
            Farklı bir kitap adı veya yazar adı deneyebilirsin.
          </Text>
        </View>
      ) : null}

      {/* Sonuç listesi */}
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
