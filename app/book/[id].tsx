// app/book/[id].tsx
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";

import { ProgressBar } from "../../components/ProgressBar";
import { useBooks } from "../../context/BooksContext";
import { useReadingGoal } from "../../context/ReadingGoalContext";
import { useReadingLog } from "../../context/ReadingLogContext";
import type { BookStatus } from "../../types/book";

const statusLabel: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

export default function BookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getById, removeBook, updateBook } = useBooks();
  const { step } = useReadingGoal();
  const { addLog } = useReadingLog();

  const book = id ? getById(id) : undefined;

  if (!book) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            marginTop: 20,
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 18,
            paddingVertical: 30,
            paddingHorizontal: 20,
            backgroundColor: "#fff",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 40 }}>📚</Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 18,
              fontWeight: "800",
              color: "#222",
            }}
          >
            Kitap bulunamadı
          </Text>
          <Text
            style={{
              marginTop: 6,
              color: "#666",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Bu kitap silinmiş olabilir veya geçersiz bir bağlantı açılmış
            olabilir.
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 16,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#ddd",
              alignItems: "center",
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontWeight: "800" }}>Geri</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const confirmDelete = () => {
    Alert.alert("Kitabı sil", `"${book.title}" silinecek. Emin misin?`, [
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
        pagesRead: undefined,
      });
      return;
    }

    updateBook(book.id, {
      status: "want",
      rating: undefined,
      note: undefined,
      pagesRead: undefined,
    });
  };

  const addPages = () => {
    if (book.status !== "reading") return;
    if (!book.pagesTotal || book.pagesTotal <= 0) return;

    const current = book.pagesRead ?? 0;

    if (current >= book.pagesTotal) {
      Alert.alert(
        "Tamamlandı",
        "Bu kitap için tüm sayfalar zaten işaretlenmiş.",
      );
      return;
    }

    const next = Math.min(current + step, book.pagesTotal);
    const diff = next - current;

    if (diff <= 0) return;

    updateBook(book.id, { pagesRead: next });
    addLog(diff);
  };

  const progressPercent =
    book.pagesTotal && book.pagesTotal > 0
      ? Math.round(((book.pagesRead ?? 0) / book.pagesTotal) * 100)
      : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* HEADER */}
      <View
        style={{
          flexDirection: "row",
          gap: 14,
          padding: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
        }}
      >
        <View
          style={{
            width: 96,
            height: 138,
            borderRadius: 14,
            overflow: "hidden",
            backgroundColor: "#f3f3f3",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {book.thumbnail ? (
            <Image
              source={{ uri: book.thumbnail }}
              style={{ width: 96, height: 138 }}
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
              <Text style={{ fontSize: 28 }}>📚</Text>
              <Text style={{ fontSize: 11, color: "#777", marginTop: 4 }}>
                No cover
              </Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1, gap: 8 }}>
          <Text
            style={{ fontSize: 22, fontWeight: "900", color: "#1a1a1a" }}
            numberOfLines={3}
          >
            {book.title}
          </Text>

          <Text
            style={{ color: "#666", fontSize: 15, fontWeight: "700" }}
            numberOfLines={2}
          >
            {book.author}
          </Text>

          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#ddd",
              backgroundColor: "#fafafa",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#444" }}>
              {statusLabel[book.status]}
            </Text>
          </View>

          {typeof book.pagesTotal === "number" && book.pagesTotal > 0 ? (
            <Text style={{ color: "#777", fontSize: 12 }}>
              Toplam sayfa: {book.pagesTotal}
            </Text>
          ) : null}
        </View>
      </View>

      {/* INFO */}
      <View
        style={{
          padding: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
          gap: 8,
        }}
      >
        <Text style={{ fontWeight: "800", color: "#222" }}>Kitap Bilgisi</Text>

        <Text style={{ color: "#555" }}>Durum: {statusLabel[book.status]}</Text>

        {typeof book.pagesTotal === "number" && book.pagesTotal > 0 ? (
          <Text style={{ color: "#555" }}>
            Sayfa: {book.pagesRead ?? 0} / {book.pagesTotal}
          </Text>
        ) : null}
      </View>

      {/* READING */}
      {book.status === "reading" && (
        <View
          style={{
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#eee",
            backgroundColor: "#fff",
            gap: 10,
          }}
        >
          <Text style={{ fontWeight: "800", color: "#222" }}>
            Okuma İlerlemesi
          </Text>

          <ProgressBar
            pagesRead={book.pagesRead}
            pagesTotal={book.pagesTotal}
          />

          <Text style={{ textAlign: "center", color: "#666" }}>
            %{progressPercent} tamamlandı
          </Text>

          <Pressable
            onPress={addPages}
            disabled={!book.pagesTotal}
            style={{
              backgroundColor: book.pagesTotal ? "#111" : "#999",
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              +{step} Sayfa Okudum
            </Text>
          </Pressable>
        </View>
      )}

      {/* READ */}
      {book.status === "read" && (
        <>
          <View
            style={{
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#eee",
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontWeight: "800", color: "#222" }}>Puan</Text>
            <Text style={{ marginTop: 8, color: "#666", fontSize: 16 }}>
              {book.rating && book.rating > 0
                ? "★".repeat(book.rating)
                : "Puan verilmemiş"}
            </Text>
          </View>

          <View
            style={{
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#eee",
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontWeight: "800", color: "#222" }}>Not</Text>
            <Text style={{ marginTop: 8, color: "#666", lineHeight: 21 }}>
              {book.note?.trim()?.length ? book.note : "Henüz not eklenmemiş."}
            </Text>
          </View>
        </>
      )}

      {/* WANT */}
      {book.status === "want" && (
        <View
          style={{
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#eee",
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontWeight: "800", color: "#222" }}>
            Okuma Listesi
          </Text>
          <Text style={{ marginTop: 8, color: "#666", lineHeight: 21 }}>
            Bu kitap daha sonra okunmak üzere listene eklendi.
          </Text>
        </View>
      )}

      {/* ACTIONS */}
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
        <Text style={{ fontWeight: "900" }}>Düzenle</Text>
      </Pressable>

      <Pressable
        onPress={cycleStatus}
        style={{
          backgroundColor: "#111",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          Durumu Değiştir
        </Text>
      </Pressable>

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
        <Text style={{ color: "#fff", fontWeight: "900" }}>Paylaş</Text>
      </Pressable>

      <Pressable
        onPress={confirmDelete}
        style={{
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ffdddd",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontWeight: "900", color: "#c00" }}>Kitabı Sil</Text>
      </Pressable>

      <Pressable
        onPress={() => router.back()}
        style={{
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ddd",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontWeight: "900" }}>Geri</Text>
      </Pressable>
    </ScrollView>
  );
}
