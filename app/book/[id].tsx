import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { ProgressBar } from "../../components/ProgressBar";
import { useBooks } from "../../context/BooksContext";
import type { BookStatus } from "../../types/book";

/**
 * Status label map (UI gösterim)
 */
const statusLabel: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

export default function BookDetail() {
  /**
   * Route param
   * /book/[id]
   */
  const { id } = useLocalSearchParams<{ id: string }>();

  /**
   * Global store fonksiyonları
   */
  const { getById, removeBook, updateBook } = useBooks();

  const book = id ? getById(id) : undefined;

  /**
   * Kitap yoksa safe screen
   */
  if (!book) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>
          Kitap bulunamadı
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 12,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#ddd",
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "700" }}>Geri</Text>
        </Pressable>
      </ScrollView>
    );
  }

  /**
   * -----------------------------
   * DELETE
   * -----------------------------
   */
  const confirmDelete = () => {
    Alert.alert("Silinsin mi?", `"${book.title}" silinecek.`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          removeBook(book.id);
          router.back();
        },
      },
    ]);
  };

  /**
   * -----------------------------
   * STATUS CHANGE
   * reading → read → want → reading
   * UX gereği bazı alanları temizler
   * -----------------------------
   */
  const cycleStatus = () => {
    const next: BookStatus =
      book.status === "reading"
        ? "read"
        : book.status === "read"
          ? "want"
          : "reading";

    if (next === "reading") {
      updateBook(book.id, {
        status: "reading",
        rating: undefined,
        note: undefined,
      });
      return;
    }

    if (next === "read") {
      updateBook(book.id, {
        status: "read",
        pagesTotal: undefined,
        pagesRead: undefined,
      });
      return;
    }

    updateBook(book.id, {
      status: "want",
      rating: undefined,
      note: undefined,
      pagesTotal: undefined,
      pagesRead: undefined,
    });
  };

  /**
   * -----------------------------
   * PROGRESS +10 PAGE
   * -----------------------------
   */
  const add10Pages = () => {
    if (!book.pagesTotal) return;

    const current = book.pagesRead ?? 0;
    const next = Math.min(current + 10, book.pagesTotal);

    updateBook(book.id, { pagesRead: next });

    /**
     * ⭐ İSTEĞE BAĞLI
     * Kitap bitince otomatik "okudum"
     *
     * if (next >= book.pagesTotal) {
     *   updateBook(book.id, { status: "read" });
     * }
     */
  };

  /**
   * Progress hesaplama
   */
  const progressPercent =
    book.pagesTotal && book.pagesTotal > 0
      ? Math.round(((book.pagesRead ?? 0) / book.pagesTotal) * 100)
      : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* -------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------- */}
      <Text style={{ fontSize: 24, fontWeight: "800" }}>{book.title}</Text>
      <Text style={{ color: "#666", fontSize: 16 }}>{book.author}</Text>

      {/* -------------------------------- */}
      {/* STATUS */}
      {/* -------------------------------- */}
      <View
        style={{
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#eee",
        }}
      >
        <Text style={{ fontWeight: "700" }}>Durum</Text>
        <Text style={{ marginTop: 6 }}>{statusLabel[book.status]}</Text>
      </View>

      {/* -------------------------------- */}
      {/* READING PROGRESS */}
      {/* -------------------------------- */}
      {book.status === "reading" && (
        <>
          <ProgressBar
            pagesRead={book.pagesRead}
            pagesTotal={book.pagesTotal}
          />

          <Text style={{ textAlign: "center", color: "#666" }}>
            %{progressPercent} tamamlandı
          </Text>

          <Pressable
            onPress={add10Pages}
            disabled={!book.pagesTotal}
            style={{
              backgroundColor: book.pagesTotal ? "#111" : "#999",
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              +10 Sayfa Okudum
            </Text>
          </Pressable>
        </>
      )}

      {/* -------------------------------- */}
      {/* READ → RATING + NOTE */}
      {/* -------------------------------- */}
      {book.status === "read" && (
        <>
          <View
            style={{
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Text style={{ fontWeight: "700" }}>Puan</Text>
            <Text style={{ marginTop: 6, color: "#666" }}>
              {book.rating ? "★".repeat(book.rating) : "Puan yok"}
            </Text>
          </View>

          <View
            style={{
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Text style={{ fontWeight: "700" }}>Not</Text>
            <Text style={{ marginTop: 6, color: "#666" }}>
              {book.note?.trim()?.length ? book.note : "Not yok"}
            </Text>
          </View>
        </>
      )}

      {/* -------------------------------- */}
      {/* ACTIONS */}
      {/* -------------------------------- */}

      {/* EDIT */}
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/edit-book/[id]" as const,
            params: { id: book.id },
          })
        }
        style={{
          backgroundColor: "#fff",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <Text style={{ fontWeight: "800" }}>Düzenle</Text>
      </Pressable>

      {/* STATUS CHANGE */}
      <Pressable
        onPress={cycleStatus}
        style={{
          backgroundColor: "#111",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          Durumu Değiştir
        </Text>
      </Pressable>

      {/* SHARE */}
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/share/[id]" as const,
            params: { id: book.id },
          })
        }
        style={{
          backgroundColor: "#111",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>Paylaş</Text>
      </Pressable>

      {/* DELETE */}
      <Pressable
        onPress={confirmDelete}
        style={{
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ffdddd",
        }}
      >
        <Text style={{ fontWeight: "700", color: "#c00" }}>Kitabı Sil</Text>
      </Pressable>

      {/* BACK */}
      <Pressable
        onPress={() => router.back()}
        style={{
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <Text style={{ fontWeight: "700" }}>Geri</Text>
      </Pressable>
    </ScrollView>
  );
}
