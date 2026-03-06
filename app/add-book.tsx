import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import BookSearchPicker from "../components/BookSearchPicker";
import { StarRating } from "../components/StarRating";
import { useBooks } from "../context/BooksContext";
import type { BookStatus } from "../types/book";
import type { GoogleBook } from "../types/googleBooks";

/**
 * Durum etiketleri
 */
const statusLabel: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

export default function AddBook() {
  const { addBook } = useBooks();

  const params = useLocalSearchParams<{
    title?: string;
    author?: string;
    pagesTotal?: string;
    thumbnail?: string;
    googleId?: string;
    status?: BookStatus;
  }>();

  const [selectedGoogleBook, setSelectedGoogleBook] =
    useState<GoogleBook | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  const [status, setStatus] = useState<BookStatus>("reading");

  const [rating, setRating] = useState<number>(0);
  const [note, setNote] = useState("");

  const [pagesTotalText, setPagesTotalText] = useState("");
  const [pagesReadText, setPagesReadText] = useState("");

  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [googleId, setGoogleId] = useState<string | undefined>(undefined);

  const didHydrate = useRef(false);

  useEffect(() => {
    if (didHydrate.current) return;

    const incomingTitle = typeof params.title === "string" ? params.title : "";
    const incomingAuthor =
      typeof params.author === "string" ? params.author : "";
    const incomingPagesTotal =
      typeof params.pagesTotal === "string" ? params.pagesTotal : "";
    const incomingThumbnail =
      typeof params.thumbnail === "string" ? params.thumbnail : "";
    const incomingGoogleId =
      typeof params.googleId === "string" ? params.googleId : "";
    const incomingStatus =
      params.status === "reading" ||
      params.status === "read" ||
      params.status === "want"
        ? params.status
        : undefined;

    const hasIncoming = !!(
      incomingTitle ||
      incomingAuthor ||
      incomingPagesTotal ||
      incomingThumbnail ||
      incomingGoogleId ||
      incomingStatus
    );

    if (!hasIncoming) return;

    if (incomingTitle) setTitle(incomingTitle);
    if (incomingAuthor) setAuthor(incomingAuthor);
    if (incomingPagesTotal) setPagesTotalText(incomingPagesTotal);
    if (incomingThumbnail) setThumbnail(incomingThumbnail);
    if (incomingGoogleId) setGoogleId(incomingGoogleId);
    if (incomingStatus) setStatus(incomingStatus);

    didHydrate.current = true;
  }, [
    params.title,
    params.author,
    params.pagesTotal,
    params.thumbnail,
    params.googleId,
    params.status,
  ]);

  const canSave = useMemo(() => {
    return title.trim().length > 0 && author.trim().length > 0;
  }, [title, author]);

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

  const toSafeNumber = (t: string) => {
    const onlyDigits = t.replace(/[^\d]/g, "");
    if (!onlyDigits) return undefined;

    const n = Number(onlyDigits);
    if (!Number.isFinite(n)) return undefined;

    return Math.max(0, Math.floor(n));
  };

  const handleSelectGoogleBook = (item: GoogleBook) => {
    setSelectedGoogleBook(item);
    setTitle(item.title || "");
    setAuthor(item.authors?.join(", ") || "");
    setPagesTotalText(item.pageCount ? String(item.pageCount) : "");
    setThumbnail(item.thumbnail || undefined);
    setGoogleId(item.id || undefined);
  };

  const onSubmit = () => {
    if (!canSave) {
      Alert.alert("Eksik bilgi", "Kitap adı ve yazar zorunlu.");
      return;
    }

    const pagesTotal =
      status === "reading" ? toSafeNumber(pagesTotalText) : undefined;
    const pagesRead =
      status === "reading" ? toSafeNumber(pagesReadText) : undefined;

    const fixedPagesRead =
      typeof pagesTotal === "number" && typeof pagesRead === "number"
        ? Math.min(pagesRead, pagesTotal)
        : pagesRead;

    addBook({
      title: title.trim(),
      author: author.trim(),
      status,
      thumbnail,
      googleId,
      rating: status === "read" && rating > 0 ? rating : undefined,
      note:
        status === "read" && note.trim().length > 0 ? note.trim() : undefined,
      pagesTotal:
        status === "reading" && typeof pagesTotal === "number" && pagesTotal > 0
          ? pagesTotal
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
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ fontSize: 22, fontWeight: "900" }}>Kitap Ekle</Text>

      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: "800" }}>Google Books ile Ara</Text>
        <BookSearchPicker onSelect={handleSelectGoogleBook} />
      </View>

      {(selectedGoogleBook || thumbnail || title || author) && (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#fff",
            flexDirection: "row",
            gap: 12,
          }}
        >
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              style={{ width: 60, height: 90, borderRadius: 8 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 60,
                height: 90,
                borderRadius: 8,
                backgroundColor: "#eee",
              }}
            />
          )}

          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "800", fontSize: 16 }}>
              {title || "Kitap seçilmedi"}
            </Text>
            <Text style={{ color: "#666", marginTop: 4 }}>
              {author || "Yazar bilgisi yok"}
            </Text>
            {pagesTotalText ? (
              <Text style={{ color: "#888", marginTop: 4 }}>
                {pagesTotalText} sayfa
              </Text>
            ) : null}
          </View>
        </View>
      )}

      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: "800" }}>Kitap Adı</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Örn: 1984"
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
          placeholder="Örn: George Orwell"
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
                  style={{ color: active ? "#fff" : "#111", fontWeight: "800" }}
                >
                  {statusLabel[s]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {status === "reading" && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontWeight: "900" }}>Okuma İlerlemesi</Text>

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
              placeholder="Kitap hakkında kısa notun…"
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

      <Pressable
        onPress={onSubmit}
        style={{
          marginTop: 8,
          backgroundColor: canSave ? "#111" : "#999",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>Kaydet</Text>
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
        <Text style={{ fontWeight: "900" }}>Vazgeç</Text>
      </Pressable>
    </ScrollView>
  );
}
