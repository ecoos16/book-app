import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import { useBooks } from "../context/BooksContext";
import type { Book, BookStatus } from "../types/book";
import { ProgressBar } from "./ProgressBar";

const statusLabel: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

type SortKey = "newest" | "oldest" | "ratingDesc" | "az";

export function BooksList({ books }: { books: Book[] }) {
  const { removeBook, updateBook } = useBooks();

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    let arr = books;

    if (q.length > 0) {
      arr = arr.filter((b) => {
        const title = (b.title ?? "").toLowerCase();
        const author = (b.author ?? "").toLowerCase();
        return title.includes(q) || author.includes(q);
      });
    }

    const copy = [...arr];

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

  const isSearching = query.trim().length > 0;
  const isEmptyLibrary = books.length === 0;
  const isNoSearchResult = books.length > 0 && filteredSorted.length === 0;

  return (
    <View style={{ gap: 10, marginTop: 12 }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Kitap veya yazar ara"
        autoCorrect={false}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 11,
          backgroundColor: "#fff",
          fontSize: 15,
        }}
      />

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

      {isEmptyLibrary && !isSearching ? (
        <View
          style={{
            marginTop: 18,
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 18,
            paddingVertical: 28,
            paddingHorizontal: 20,
            backgroundColor: "#fff",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 40 }}>📚</Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 17,
              fontWeight: "800",
              color: "#222",
            }}
          >
            Henüz kitap eklemedin
          </Text>
          <Text
            style={{
              marginTop: 6,
              color: "#666",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            İlk kitabını ekleyerek kitaplığını oluşturmaya başlayabilirsin.
          </Text>
        </View>
      ) : null}

      {isNoSearchResult ? (
        <View
          style={{
            marginTop: 18,
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 18,
            paddingVertical: 28,
            paddingHorizontal: 20,
            backgroundColor: "#fff",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 36 }}>🔎</Text>
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
            Farklı bir kitap adı ya da yazar ismi deneyebilirsin.
          </Text>
        </View>
      ) : null}

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
              style={{
                borderWidth: 1,
                borderColor: "#eee",
                borderRadius: 16,
                padding: 12,
                backgroundColor: "#fff",
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", gap: 12 }}>
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
                  {b.thumbnail ? (
                    <Image
                      source={{ uri: b.thumbnail }}
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

                <View style={{ flex: 1, gap: 6 }}>
                  <View
                    style={{ flexDirection: "row", alignItems: "flex-start" }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        flex: 1,
                        color: "#1a1a1a",
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
                        borderColor: "#ddd",
                        marginLeft: 8,
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: "#444",
                        }}
                      >
                        {statusLabel[b.status]}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{ color: "#666", fontSize: 14 }}
                    numberOfLines={1}
                  >
                    {b.author}
                  </Text>

                  {typeof b.pagesTotal === "number" && b.pagesTotal > 0 ? (
                    <Text style={{ color: "#888", fontSize: 12 }}>
                      {b.pagesRead ?? 0} / {b.pagesTotal} sayfa
                    </Text>
                  ) : null}
                </View>
              </View>

              {b.status === "reading" && (
                <ProgressBar
                  pagesRead={b.pagesRead}
                  pagesTotal={b.pagesTotal}
                />
              )}

              {b.status === "read" && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: "#666", fontSize: 13 }}>
                    {b.rating && b.rating > 0
                      ? "★".repeat(b.rating)
                      : "Puan verilmemiş"}
                  </Text>

                  <Text style={{ color: "#aaa" }}> • </Text>

                  <Text style={{ color: "#666", flex: 1 }} numberOfLines={1}>
                    {b.note?.trim()?.length ? b.note : "Henüz not eklenmemiş"}
                  </Text>
                </View>
              )}

              {b.status === "want" && (
                <Text style={{ color: "#888", fontSize: 12 }}>
                  Okuma listene eklediğin kitap
                </Text>
              )}

              <Text style={{ color: "#aaa", fontSize: 12 }}>
                Uzun bas: düzenle / sil / durum değiştir
              </Text>
            </Pressable>
          ))
        : null}
    </View>
  );
}

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
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? "#111" : "#ddd",
        backgroundColor: active ? "#111" : "#fff",
      }}
    >
      <Text style={{ color: active ? "#fff" : "#111", fontWeight: "800" }}>
        {label}
      </Text>
    </Pressable>
  );
}
