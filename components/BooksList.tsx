// components/BooksList.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import { useBooks } from "../context/BooksContext";
import type { Book, BookStatus } from "../types/book";
import { ProgressBar } from "./ProgressBar";

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
  primaryDark: "#6b4a2f",
  primarySoft: "#f3e2d2",
  peachSoft: "#f7dfcc",
  greenSoft: "#dfe7cf",
  graySoft: "#f3efe8",
  whiteSoft: "#fff7f4",
  dangerSoft: "#fff4f4",
  dangerBorder: "#ffd8d8",
  dangerText: "#a22b2b",
};

/**
 * Kitap durumlarının kullanıcıya gösterilecek Türkçe karşılığı
 */
const statusLabel: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

type SortKey = "newest" | "oldest" | "ratingDesc" | "az";

/**
 * Ortak sıralama chip'i
 */
function SortChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? COLORS.primary : COLORS.border,
        backgroundColor: active
          ? COLORS.primary
          : pressed
            ? "#ece6dc"
            : COLORS.card,
      })}
    >
      <Text
        style={{
          color: active ? COLORS.whiteSoft : COLORS.text,
          fontWeight: "900",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function BooksList({ books }: { books: Book[] }) {
  /**
   * Kitap işlemleri
   */
  const { removeBook, updateBook } = useBooks();

  /**
   * Yerel arama ve sıralama state'leri
   */
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  /**
   * Arama + sıralama uygulanmış liste
   */
  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    let arr = books;

    /**
     * Arama varsa başlık ve yazarda filtreleme yap
     */
    if (q.length > 0) {
      arr = arr.filter((b) => {
        const title = (b.title ?? "").toLowerCase();
        const author = (b.author ?? "").toLowerCase();
        return title.includes(q) || author.includes(q);
      });
    }

    /**
     * Orijinal diziyi bozmamak için kopya al
     */
    const copy = [...arr];

    /**
     * Seçilen sıralama tipine göre sırala
     */
    copy.sort((a, b) => {
      const aCreated =
        typeof a.createdAt === "number"
          ? a.createdAt
          : new Date(a.createdAt).getTime() || 0;

      const bCreated =
        typeof b.createdAt === "number"
          ? b.createdAt
          : new Date(b.createdAt).getTime() || 0;

      if (sortKey === "newest") return bCreated - aCreated;
      if (sortKey === "oldest") return aCreated - bCreated;

      if (sortKey === "ratingDesc") {
        const ra = a.rating ?? 0;
        const rb = b.rating ?? 0;
        if (rb !== ra) return rb - ra;
        return bCreated - aCreated;
      }

      return (a.title ?? "").localeCompare(b.title ?? "", "tr");
    });

    return copy;
  }, [books, query, sortKey]);

  /**
   * Durum değiştirirken bazı alanları temizle
   * Böylece eski durumdan kalan gereksiz veri kalmaz
   */
  const setStatusClean = (b: Book, next: BookStatus) => {
    if (next === "reading") {
      updateBook(b.id, {
        status: "reading",
        rating: undefined,
        note: undefined,
      });
      return;
    }

    if (next === "read") {
      updateBook(b.id, {
        status: "read",
        pagesRead: undefined,
      });
      return;
    }

    updateBook(b.id, {
      status: "want",
      rating: undefined,
      note: undefined,
      pagesRead: undefined,
    });
  };

  /**
   * Silme onayı
   */
  const confirmDelete = (b: Book) => {
    Alert.alert(
      "Kitabı sil",
      `"${b.title}" kitabını silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => removeBook(b.id),
        },
      ],
    );
  };

  /**
   * Uzun basınca aksiyon menüsü
   */
  const openActions = (b: Book) => {
    Alert.alert(b.title, "Ne yapmak istiyorsun?", [
      {
        text: "Detay",
        onPress: () =>
          router.push({
            pathname: "/book/[id]" as const,
            params: { id: b.id },
          }),
      },
      {
        text: "Düzenle",
        onPress: () =>
          router.push({
            pathname: "/edit-book/[id]" as const,
            params: { id: b.id },
          }),
      },
      {
        text: "Durum → Okuyorum",
        onPress: () => setStatusClean(b, "reading"),
      },
      {
        text: "Durum → Okudum",
        onPress: () => setStatusClean(b, "read"),
      },
      {
        text: "Durum → İstiyorum",
        onPress: () => setStatusClean(b, "want"),
      },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => confirmDelete(b),
      },
      {
        text: "Vazgeç",
        style: "cancel",
      },
    ]);
  };

  /**
   * Yardımcı durumlar
   */
  const isSearching = query.trim().length > 0;
  const isEmptyLibrary = books.length === 0;
  const isNoSearchResult = books.length > 0 && filteredSorted.length === 0;

  return (
    <View style={{ gap: 12, marginTop: 12 }}>
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
          placeholder="Kitap veya yazar ara"
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

      {/* Sıralama chip'leri */}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <SortChip
          label="Yeni"
          active={sortKey === "newest"}
          onPress={() => setSortKey("newest")}
        />
        <SortChip
          label="Eski"
          active={sortKey === "oldest"}
          onPress={() => setSortKey("oldest")}
        />
        <SortChip
          label="Puan"
          active={sortKey === "ratingDesc"}
          onPress={() => setSortKey("ratingDesc")}
        />
        <SortChip
          label="A→Z"
          active={sortKey === "az"}
          onPress={() => setSortKey("az")}
        />
      </View>

      {/* Kütüphane tamamen boşsa */}
      {isEmptyLibrary && !isSearching ? (
        <View
          style={{
            marginTop: 18,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 22,
            paddingVertical: 28,
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
            <Ionicons name="library-outline" size={28} color={COLORS.primary} />
          </View>

          <Text
            style={{
              marginTop: 12,
              fontSize: 17,
              fontWeight: "900",
              color: COLORS.text,
            }}
          >
            Henüz kitap eklemedin
          </Text>

          <Text
            style={{
              marginTop: 6,
              color: COLORS.muted,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            İlk kitabını ekleyerek kitaplığını oluşturmaya başlayabilirsin.
          </Text>
        </View>
      ) : null}

      {/* Aramada sonuç yoksa */}
      {isNoSearchResult ? (
        <View
          style={{
            marginTop: 18,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 22,
            paddingVertical: 28,
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
            <Ionicons name="search-outline" size={28} color={COLORS.primary} />
          </View>

          <Text
            style={{
              marginTop: 12,
              fontSize: 17,
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
            Farklı bir kitap adı ya da yazar ismi deneyebilirsin.
          </Text>
        </View>
      ) : null}

      {/* Kitap kartları */}
      {!isEmptyLibrary && !isNoSearchResult
        ? filteredSorted.map((b) => (
            <Pressable
              key={b.id}
              onPress={() =>
                router.push({
                  pathname: "/book/[id]" as const,
                  params: { id: b.id },
                })
              }
              onLongPress={() => openActions(b)}
              delayLongPress={250}
              style={({ pressed }) => ({
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 18,
                padding: 12,
                backgroundColor: pressed ? "#f5efe7" : COLORS.card,
                gap: 10,
              })}
            >
              <View style={{ flexDirection: "row", gap: 12 }}>
                {/* Kapak alanı */}
                <View
                  style={{
                    width: 60,
                    height: 86,
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: COLORS.primarySoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {b.thumbnail ? (
                    <Image
                      source={{ uri: b.thumbnail }}
                      style={{ width: 60, height: 86 }}
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
                        gap: 3,
                      }}
                    >
                      <Ionicons
                        name="book-outline"
                        size={24}
                        color={COLORS.primary}
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          color: COLORS.muted,
                        }}
                      >
                        Kapak yok
                      </Text>
                    </View>
                  )}
                </View>

                {/* Sağ bilgi alanı */}
                <View style={{ flex: 1, gap: 6 }}>
                  <View
                    style={{ flexDirection: "row", alignItems: "flex-start" }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "900",
                        flex: 1,
                        color: COLORS.text,
                      }}
                      numberOfLines={2}
                    >
                      {b.title}
                    </Text>

                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        marginLeft: 8,
                        backgroundColor: COLORS.graySoft,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: COLORS.primary,
                        }}
                      >
                        {statusLabel[b.status]}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{ color: COLORS.muted, fontSize: 14 }}
                    numberOfLines={1}
                  >
                    {b.author}
                  </Text>

                  {typeof b.pagesTotal === "number" && b.pagesTotal > 0 ? (
                    <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                      {b.pagesRead ?? 0} / {b.pagesTotal} sayfa
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Reading için progress */}
              {b.status === "reading" && (
                <ProgressBar
                  pagesRead={b.pagesRead}
                  pagesTotal={b.pagesTotal}
                />
              )}

              {/* Read için puan ve not */}
              {b.status === "read" && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                    {b.rating && b.rating > 0
                      ? "★".repeat(b.rating)
                      : "Puan verilmemiş"}
                  </Text>

                  <Text style={{ color: COLORS.muted }}> • </Text>

                  <Text
                    style={{ color: COLORS.muted, flex: 1 }}
                    numberOfLines={1}
                  >
                    {b.note?.trim()?.length ? b.note : "Henüz not eklenmemiş"}
                  </Text>
                </View>
              )}

              {/* Want için kısa açıklama */}
              {b.status === "want" && (
                <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                  Okuma listene eklediğin kitap
                </Text>
              )}

              {/* Alt yardımcı metin */}
              <Text style={{ color: "#a49d93", fontSize: 12 }}>
                Uzun bas: düzenle / sil / durum değiştir
              </Text>
            </Pressable>
          ))
        : null}
    </View>
  );
}
