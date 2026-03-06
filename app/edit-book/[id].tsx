import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { StarRating } from "../../components/StarRating";
import { useBooks } from "../../context/BooksContext";
import type { BookStatus } from "../../types/book";

const statusLabel: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

export default function EditBook() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, updateBook } = useBooks();

  const book = id ? getById(id) : undefined;

  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [status, setStatus] = useState<BookStatus>(book?.status ?? "reading");

  const [note, setNote] = useState(book?.note ?? "");
  const [rating, setRating] = useState<number>(book?.rating ?? 0);

  const [pagesTotalText, setPagesTotalText] = useState(
    typeof book?.pagesTotal === "number" ? String(book.pagesTotal) : "",
  );
  const [pagesReadText, setPagesReadText] = useState(
    typeof book?.pagesRead === "number" ? String(book.pagesRead) : "",
  );

  const canSave = useMemo(() => {
    return title.trim().length > 0 && author.trim().length > 0;
  }, [title, author]);

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
            Bu kayıt silinmiş olabilir veya geçersiz bir bağlantı açılmış
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

  const toSafeNumber = (t: string) => {
    const onlyDigits = t.replace(/[^\d]/g, "");
    if (!onlyDigits) return undefined;

    const n = Number(onlyDigits);
    if (!Number.isFinite(n)) return undefined;

    return Math.max(0, Math.floor(n));
  };

  const onChangeStatus = (next: BookStatus) => {
    setStatus(next);

    if (next !== "read") {
      setRating(0);
      setNote("");
    }

    if (next !== "reading") {
      setPagesReadText("");
    }
  };

  const onSave = () => {
    if (!canSave) {
      Alert.alert("Eksik bilgi", "Kitap adı ve yazar zorunlu.");
      return;
    }

    const safePagesTotal = toSafeNumber(pagesTotalText);
    const safePagesRead =
      status === "reading" ? toSafeNumber(pagesReadText) : undefined;

    const fixedPagesRead =
      typeof safePagesTotal === "number" && typeof safePagesRead === "number"
        ? Math.min(safePagesRead, safePagesTotal)
        : safePagesRead;

    updateBook(book.id, {
      title: title.trim(),
      author: author.trim(),
      status,
      note:
        status === "read" && note.trim().length > 0 ? note.trim() : undefined,
      rating: status === "read" && rating > 0 ? rating : undefined,
      pagesTotal:
        typeof safePagesTotal === "number" && safePagesTotal > 0
          ? safePagesTotal
          : undefined,
      pagesRead:
        status === "reading" &&
        typeof fixedPagesRead === "number" &&
        fixedPagesRead > 0
          ? fixedPagesRead
          : undefined,
    });

    router.back();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "900" }}>Kitabı Düzenle</Text>

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
            width: 88,
            height: 128,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "#f3f3f3",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {book.thumbnail ? (
            <Image
              source={{ uri: book.thumbnail }}
              style={{ width: 88, height: 128 }}
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
              <Text style={{ fontSize: 26 }}>📚</Text>
              <Text style={{ fontSize: 10, color: "#777", marginTop: 4 }}>
                No cover
              </Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1, gap: 8 }}>
          <Text
            style={{ fontSize: 18, fontWeight: "900", color: "#1a1a1a" }}
            numberOfLines={3}
          >
            {title || "Kitap adı"}
          </Text>

          <Text
            style={{ color: "#666", fontSize: 14, fontWeight: "700" }}
            numberOfLines={2}
          >
            {author || "Yazar"}
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
              {statusLabel[status]}
            </Text>
          </View>

          {pagesTotalText ? (
            <Text style={{ color: "#777", fontSize: 12 }}>
              Toplam sayfa: {pagesTotalText}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: "800" }}>Kitap Adı</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Kitap adı"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#fff",
          }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: "800" }}>Yazar</Text>
        <TextInput
          value={author}
          onChangeText={setAuthor}
          placeholder="Yazar"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#fff",
          }}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: "800" }}>Durum</Text>

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {(["reading", "read", "want"] as BookStatus[]).map((s) => {
            const active = s === status;

            return (
              <Pressable
                key={s}
                onPress={() => onChangeStatus(s)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? "#111" : "#ddd",
                  backgroundColor: active ? "#111" : "#fff",
                }}
              >
                <Text
                  style={{
                    color: active ? "#fff" : "#111",
                    fontWeight: "800",
                  }}
                >
                  {statusLabel[s]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: "800" }}>Toplam Sayfa</Text>
        <TextInput
          value={pagesTotalText}
          onChangeText={setPagesTotalText}
          placeholder="Örn: 320"
          keyboardType="number-pad"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#fff",
          }}
        />
      </View>

      {status === "reading" && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontWeight: "900" }}>Okuma İlerlemesi</Text>

          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: "800" }}>Okunan Sayfa</Text>
            <TextInput
              value={pagesReadText}
              onChangeText={setPagesReadText}
              placeholder="Örn: 45"
              keyboardType="number-pad"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 12,
                padding: 12,
                backgroundColor: "#fff",
              }}
            />
          </View>

          <Text style={{ color: "#888", fontSize: 12 }}>
            Okunan sayfa toplamdan büyükse otomatik düzeltilir.
          </Text>
        </View>
      )}

      {status === "read" && (
        <>
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "800" }}>Puan</Text>
            <StarRating value={rating} onChange={setRating} />

            <Pressable
              onPress={() => setRating(0)}
              style={{ alignSelf: "flex-start" }}
            >
              <Text style={{ color: "#666" }}>Puanı temizle</Text>
            </Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: "800" }}>Not</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Bu kitapla ilgili notun…"
              multiline
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 12,
                padding: 12,
                minHeight: 110,
                textAlignVertical: "top",
                backgroundColor: "#fff",
              }}
            />
          </View>
        </>
      )}

      {status === "want" && (
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
            Okuma listesi notu
          </Text>
          <Text style={{ marginTop: 8, color: "#666", lineHeight: 21 }}>
            Bu kitap daha sonra okumak üzere kaydedilecek. Toplam sayfa bilgisi
            korunabilir.
          </Text>
        </View>
      )}

      <Pressable
        onPress={onSave}
        style={{
          marginTop: 8,
          backgroundColor: canSave ? "#111" : "#999",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>Kaydet</Text>
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
        <Text style={{ fontWeight: "800" }}>Geri</Text>
      </Pressable>
    </ScrollView>
  );
}
