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
 * Parent component bu bileşene bir seçim fonksiyonu verir.
 * Kullanıcı bir kitaba tıkladığında seçilen kitap üst componente gönderilir.
 */
type Props = {
  onSelect: (item: GoogleBook) => void;
};

export default function BookSearchPicker({ onSelect }: Props) {
  /**
   * Kullanıcının inputa yazdığı değer
   */
  const [query, setQuery] = useState("");

  /**
   * API'den gelen kitap listesi
   */
  const [results, setResults] = useState<GoogleBook[]>([]);

  /**
   * Yükleniyor durumu
   */
  const [loading, setLoading] = useState(false);

  /**
   * Debounce uygulanmış arama metni
   * Kullanıcı yazmayı bıraktığında güncellenir
   */
  const [debouncedQuery, setDebouncedQuery] = useState("");

  /**
   * Önceki API isteğini iptal etmek için AbortController
   */
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Debounce mekanizması
   * Kullanıcı yazmayı bıraktıktan 700ms sonra gerçek arama yapılır
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
    // 2 karakterden kısa aramaları engelle
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    // Önceki isteği iptal et
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
         * AbortError normal bir durumdur
         * Kullanıcı yeni arama yazmıştır
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
   * Tek bir kitap kartını render eden yardımcı fonksiyon
   */
  const renderBookCard = (item: GoogleBook) => {
    return (
      <Pressable
        key={item.id}
        onPress={() => onSelect(item)}
        style={{
          flexDirection: "row",
          gap: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: "#eee",
          borderRadius: 14,
          backgroundColor: "#fafafa",
        }}
      >
        {/* Kitap kapağı */}
        {item.thumbnail ? (
          <Image
            source={{ uri: item.thumbnail }}
            style={{ width: 52, height: 78, borderRadius: 8 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 52,
              height: 78,
              borderRadius: 8,
              backgroundColor: "#ececec",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 18 }}>📚</Text>
          </View>
        )}

        {/* Kitap bilgileri */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            {/* Kitap adı */}
            <Text
              style={{
                fontSize: 15,
                fontWeight: "800",
                flex: 1,
                color: "#1a1a1a",
              }}
              numberOfLines={2}
            >
              {item.title || "Başlıksız"}
            </Text>

            {/* Kaynak etiketi */}
            {item.source ? (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: "#f1f1f1",
                }}
              >
                <Text
                  style={{ fontSize: 11, color: "#555", fontWeight: "600" }}
                >
                  {item.source === "google" ? "Google" : "OpenLibrary"}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Yazar */}
          <Text
            style={{ color: "#666", marginTop: 4, fontSize: 13 }}
            numberOfLines={1}
          >
            {item.authors?.join(", ") || "Yazar bilinmiyor"}
          </Text>

          {/* Sayfa sayısı */}
          <Text style={{ color: "#999", marginTop: 4, fontSize: 12 }}>
            {item.pageCount ? `${item.pageCount} sayfa` : "Sayfa bilgisi yok"}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ gap: 12 }}>
      {/* Arama inputu */}
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Kitap adı veya yazar ara"
        autoCorrect={false}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: "#fafafa",
          fontSize: 15,
        }}
      />

      {/* Yükleniyor durumu */}
      {loading ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 14,
            paddingVertical: 18,
            paddingHorizontal: 14,
            backgroundColor: "#fafafa",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ActivityIndicator />
          <Text style={{ color: "#666" }}>Kitaplar aranıyor...</Text>
        </View>
      ) : null}

      {/* Sonuç bulunamadı mesajı */}
      {!loading && debouncedQuery.length >= 2 && results.length === 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 14,
            paddingVertical: 18,
            paddingHorizontal: 14,
            backgroundColor: "#fafafa",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 22 }}>🔎</Text>
          <Text style={{ fontWeight: "700", color: "#222" }}>
            Sonuç bulunamadı
          </Text>
          <Text style={{ color: "#666", textAlign: "center" }}>
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
            borderColor: "#eee",
            borderRadius: 16,
            padding: 10,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontWeight: "800", color: "#222", marginBottom: 4 }}>
            Sonuçlar
          </Text>

          {results.map(renderBookCard)}
        </View>
      )}
    </View>
  );
}
