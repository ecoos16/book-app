import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useBooks } from "../context/BooksContext";
import type { Book, BookStatus } from "../types/book";
import { ProgressBar } from "./ProgressBar"; // ✅ Progress bar component

/**
 * Status label'ları (UI Türkçe)
 */
const statusLabel: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

type SortKey = "newest" | "oldest" | "ratingDesc" | "az";

export function BooksList({ books }: { books: Book[] }) {
  /**
   * ✅ removeBook: sil
   * ✅ updateBook: güncelle (status/progress/not/puan)
   */
  const { removeBook, updateBook } = useBooks();

  // Arama ve sıralama state
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  /**
   * ✅ Filtre + Sıralama
   */
  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = books;

    // 🔎 filter
    if (q.length) {
      arr = arr.filter((b) => {
        const t = (b.title ?? "").toLowerCase();
        const a = (b.author ?? "").toLowerCase();
        return t.includes(q) || a.includes(q);
      });
    }

    // ↕️ sort
    const copy = [...arr];
    copy.sort((a, b) => {
      if (sortKey === "newest") return b.createdAt - a.createdAt;
      if (sortKey === "oldest") return a.createdAt - b.createdAt;

      if (sortKey === "ratingDesc") {
        const ra = a.rating ?? 0;
        const rb = b.rating ?? 0;
        if (rb !== ra) return rb - ra;
        return b.createdAt - a.createdAt; // eşitse yeni öne
      }

      // az
      return (a.title ?? "").localeCompare(b.title ?? "", "tr");
    });

    return copy;
  }, [books, query, sortKey]);

  /**
   * ✅ Durum değiştirirken "yan alanları" temizleyelim:
   * - Okuyorum -> progress açık, rating/note gereksiz
   * - Okudum   -> rating/note açık, progress gereksiz
   * - İstiyorum-> hepsi gereksiz (sade)
   */
  const setStatusClean = (b: Book, next: BookStatus) => {
    if (next === "reading") {
      updateBook(b.id, {
        status: "reading",
        // Okuyorum'a geçince "okudum verilerini" temizlemek mantıklı
        rating: undefined,
        note: undefined,
        // pagesTotal/pagesRead kullanıcı sonra edit'ten girebilir
      });
      return;
    }

    if (next === "read") {
      updateBook(b.id, {
        status: "read",
        // Okudum'a geçince progress temizlenebilir
        pagesTotal: undefined,
        pagesRead: undefined,
      });
      return;
    }

    // want
    updateBook(b.id, {
      status: "want",
      // İstiyorum'a geçince hepsini temizleyelim
      rating: undefined,
      note: undefined,
      pagesTotal: undefined,
      pagesRead: undefined,
    });
  };

  /**
   * Uzun basınca çıkan aksiyon menüsü
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
      { text: "—", style: "cancel" },

      {
        text: `Durum → Okuyorum`,
        onPress: () => setStatusClean(b, "reading"),
      },
      {
        text: `Durum → Okudum`,
        onPress: () => setStatusClean(b, "read"),
      },
      {
        text: `Durum → İstiyorum`,
        onPress: () => setStatusClean(b, "want"),
      },

      { text: "Sil", style: "destructive", onPress: () => removeBook(b.id) },
      { text: "Vazgeç", style: "cancel" },
    ]);
  };

  return (
    <View style={{ gap: 10, marginTop: 12 }}>
      {/* ------------------------------------------------ */}
      {/* 🔎 Arama */}
      {/* ------------------------------------------------ */}
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Ara (kitap / yazar)"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: "#fff",
        }}
      />

      {/* ------------------------------------------------ */}
      {/* ↕️ Sıralama */}
      {/* ------------------------------------------------ */}
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

      {/* ------------------------------------------------ */}
      {/* Liste */}
      {/* ------------------------------------------------ */}
      {filteredSorted.length === 0 ? (
        <Text style={{ marginTop: 8, color: "#666" }}>
          {books.length === 0 ? "Henüz burada kitap yok." : "Sonuç bulunamadı."}
        </Text>
      ) : (
        filteredSorted.map((b) => (
          <Pressable
            key={b.id}
            // Normal tık -> detay
            onPress={() =>
              router.push({
                pathname: "/book/[id]" as const,
                params: { id: b.id },
              })
            }
            // Uzun bas -> aksiyon menüsü
            onLongPress={() => openActions(b)}
            delayLongPress={250}
            style={{
              borderWidth: 1,
              borderColor: "#eee",
              borderRadius: 14,
              padding: 12,
              backgroundColor: "#fff",
              gap: 8,
            }}
          >
            {/* title + status chip */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "800", flex: 1 }}>
                {b.title}
              </Text>

              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "#ddd",
                }}
              >
                <Text
                  style={{ fontSize: 12, fontWeight: "700", color: "#444" }}
                >
                  {statusLabel[b.status]}
                </Text>
              </View>
            </View>

            {/* author */}
            <Text style={{ color: "#666" }}>{b.author}</Text>

            {/* ------------------------------------------------ */}
            {/* ✅ Okuyorum -> Progress bar */}
            {/* ------------------------------------------------ */}
            {b.status === "reading" && (
              <ProgressBar pagesRead={b.pagesRead} pagesTotal={b.pagesTotal} />
            )}

            {/* ------------------------------------------------ */}
            {/* ✅ Okudum -> Rating + Note */}
            {/* ------------------------------------------------ */}
            {b.status === "read" && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: "#666" }}>
                  {b.rating ? "★".repeat(b.rating) : "☆"}
                </Text>

                <Text style={{ color: "#aaa" }}> • </Text>

                <Text style={{ color: "#666", flex: 1 }} numberOfLines={1}>
                  {b.note?.trim()?.length ? b.note : "Not yok"}
                </Text>
              </View>
            )}

            {/* ------------------------------------------------ */}
            {/* ✅ İstiyorum -> Sade satır */}
            {/* ------------------------------------------------ */}
            {b.status === "want" && (
              <Text style={{ color: "#888", fontSize: 12 }}>
                (Okumak istediğin kitap)
              </Text>
            )}

            {/* ipucu */}
            <Text style={{ color: "#aaa", fontSize: 12 }}>
              (Uzun bas: düzenle / sil / durum değiştir)
            </Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

/**
 * Sıralama chip component'i
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
