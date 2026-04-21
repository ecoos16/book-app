//components/BookSearchPicker.tsx
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

type StateMessage = {
  title: string;
  description: string;
  variant: "empty" | "error";
};

function BookCover({ thumbnail }: { thumbnail?: string }) {
  if (thumbnail) {
    return (
      <Image
        source={{ uri: thumbnail }}
        style={{ width: 56, height: 82, borderRadius: 10 }}
        resizeMode="cover"
      />
    );
  }

  return (
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
  );
}

function SearchResultCard({
  item,
  onPress,
}: {
  item: GoogleBook;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
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
      <BookCover thumbnail={item.thumbnail} />

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
                {item.source === "google" ? "Google" : "Kaynak"}
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
}

function SearchStateBox({ message }: { message: StateMessage }) {
  const isEmpty = message.variant === "empty";

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: isEmpty ? COLORS.border : COLORS.errorBorder,
        borderRadius: 18,
        paddingVertical: 22,
        paddingHorizontal: 16,
        backgroundColor: isEmpty ? COLORS.card : COLORS.errorSoft,
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
        <Ionicons
          name={isEmpty ? "search-outline" : "alert-circle-outline"}
          size={24}
          color={COLORS.primary}
        />
      </View>

      <Text
        style={{
          fontWeight: "900",
          color: isEmpty ? COLORS.text : COLORS.errorText,
        }}
      >
        {message.title}
      </Text>

      <Text
        style={{
          color: isEmpty ? COLORS.muted : COLORS.errorText,
          textAlign: "center",
        }}
      >
        {message.description}
      </Text>
    </View>
  );
}

export default function BookSearchPicker({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<StateMessage | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const q = debouncedQuery.trim();

    if (q.length === 0) {
      setResults([]);
      setMessage(null);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }

    if (q.length < 2) {
      setResults([]);
      setMessage(null);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }

    const runSearch = async () => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        setMessage(null);

        const data = await searchGoogleBooks(q, 10, controller.signal);

        setResults(data);

        if (data.length === 0) {
          setMessage({
            title: "Sonuç bulunamadı",
            description: "Farklı bir kitap adı veya yazar adı deneyebilirsin.",
            variant: "empty",
          });
        }
      } catch (error: any) {
        if (error?.name === "AbortError") return;

        setResults([]);
        setMessage({
          title: "Arama hatası",
          description:
            typeof error?.message === "string"
              ? error.message
              : "Arama sırasında bir hata oluştu.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    runSearch();
  }, [debouncedQuery]);

  const handleClear = () => {
    abortRef.current?.abort();
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setMessage(null);
    setLoading(false);
  };

  const handleSelect = (item: GoogleBook) => {
    onSelect(item);
    setResults([]);
    setMessage(null);
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
          style={{
            flex: 1,
            fontSize: 15,
            color: COLORS.text,
          }}
        />

        {!!query.trim() && (
          <Pressable onPress={handleClear}>
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </Pressable>
        )}
      </View>

      {query.trim().length > 0 && query.trim().length < 2 && (
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
          Aramak için en az 2 karakter yaz.
        </Text>
      )}

      {loading && (
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
      )}

      {!loading && !!message && <SearchStateBox message={message} />}

      {!loading && results.length > 0 && (
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

          {results.map((item) => (
            <SearchResultCard
              key={item.id}
              item={item}
              onPress={() => handleSelect(item)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
