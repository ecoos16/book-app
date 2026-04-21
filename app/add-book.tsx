// app/add-book.tsx

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import BookSearchPicker from "../components/BookSearchPicker";
import { StarRating } from "../components/StarRating";
import { useBooks } from "../context/BooksContext";
import type { Book, BookStatus } from "../types/book";
import type { GoogleBook } from "../types/googleBooks";

const COLORS = {
  bg: "#fbf9f5",
  card: "#fffdf9",
  border: "#ece7df",
  text: "#2f2a24",
  muted: "#7a7268",
  primary: "#7d5739",
  primaryDark: "#6b4a2f",
  primarySoft: "#f3e2d2",
  graySoft: "#f3efe8",
  whiteSoft: "#fff7f4",
};

const STATUS_LABEL: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

type AddBookParams = {
  title?: string;
  author?: string;
  pagesTotal?: string;
  thumbnail?: string;
  googleId?: string;
  status?: BookStatus;
};

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 22,
        padding: 16,
        backgroundColor: COLORS.card,
        gap: 12,
      }}
    >
      <Text
        style={{
          fontWeight: "900",
          fontSize: 17,
          color: COLORS.text,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
  inputRef,
  returnKeyType,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad";
  inputRef?: React.RefObject<TextInput | null>;
  returnKeyType?: "next" | "done" | "default";
  onSubmitEditing?: () => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "800", color: COLORS.text }}>{label}</Text>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9a9389"
        multiline={multiline}
        keyboardType={keyboardType}
        returnKeyType={multiline ? "default" : returnKeyType}
        onSubmitEditing={multiline ? undefined : onSubmitEditing}
        style={{
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 16,
          padding: 13,
          backgroundColor: COLORS.graySoft,
          color: COLORS.text,
          minHeight: multiline ? 110 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

function SoftButton({
  label,
  icon,
  onPress,
  variant = "secondary",
  disabled = false,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "secondary" | "primary";
  disabled?: boolean;
}) {
  const backgroundColor = variant === "primary" ? COLORS.primary : COLORS.card;
  const borderColor = variant === "primary" ? COLORS.primary : COLORS.border;
  const textColor = variant === "primary" ? COLORS.whiteSoft : COLORS.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor,
        backgroundColor: disabled
          ? "#cfc6bb"
          : pressed
            ? variant === "primary"
              ? COLORS.primaryDark
              : "#ece6dc"
            : backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
      })}
    >
      {!!icon && <Ionicons name={icon} size={16} color={textColor} />}
      <Text style={{ color: textColor, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function toSafeNumber(value: string): number | undefined {
  const onlyDigits = value.replace(/[^\d]/g, "");
  if (!onlyDigits) return undefined;

  const numberValue = Number(onlyDigits);
  if (!Number.isFinite(numberValue)) return undefined;

  return Math.max(0, Math.floor(numberValue));
}

function getSafeStatus(value: unknown): BookStatus | undefined {
  return value === "reading" || value === "read" || value === "want"
    ? value
    : undefined;
}

function mapGoogleBookToForm(item: GoogleBook) {
  return {
    title: item.title?.trim() || "",
    author:
      Array.isArray(item.authors) && item.authors.length > 0
        ? item.authors.join(", ")
        : "",
    pagesTotalText:
      typeof item.pageCount === "number" && item.pageCount > 0
        ? String(item.pageCount)
        : "",
    thumbnail: item.thumbnail || undefined,
    googleId: item.id || undefined,
  };
}

function getIncomingParams(params: AddBookParams) {
  const title = typeof params.title === "string" ? params.title : "";
  const author = typeof params.author === "string" ? params.author : "";
  const pagesTotalText =
    typeof params.pagesTotal === "string" ? params.pagesTotal : "";
  const thumbnail =
    typeof params.thumbnail === "string" ? params.thumbnail : undefined;
  const googleId =
    typeof params.googleId === "string" ? params.googleId : undefined;
  const status = getSafeStatus(params.status);

  return {
    title,
    author,
    pagesTotalText,
    thumbnail,
    googleId,
    status,
    hasIncoming:
      !!title ||
      !!author ||
      !!pagesTotalText ||
      !!thumbnail ||
      !!googleId ||
      !!status,
  };
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("tr").replace(/\s+/g, " ");
}

export default function AddBook() {
  const { addBook, books } = useBooks();

  const params = useLocalSearchParams<AddBookParams>();
  const didHydrate = useRef(false);

  const authorRef = useRef<TextInput>(null);
  const pagesTotalRef = useRef<TextInput>(null);
  const pagesReadRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);

  const [selectedGoogleBook, setSelectedGoogleBook] =
    useState<GoogleBook | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<BookStatus>("reading");

  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");

  const [pagesTotalText, setPagesTotalText] = useState("");
  const [pagesReadText, setPagesReadText] = useState("");

  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [googleId, setGoogleId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (didHydrate.current) return;

    const incoming = getIncomingParams(params);
    if (!incoming.hasIncoming) return;

    setTitle(incoming.title);
    setAuthor(incoming.author);
    setPagesTotalText(incoming.pagesTotalText);
    setThumbnail(incoming.thumbnail);
    setGoogleId(incoming.googleId);

    if (incoming.status) {
      setStatus(incoming.status);

      if (incoming.status === "read" && incoming.pagesTotalText) {
        setPagesReadText(incoming.pagesTotalText);
      }

      if (incoming.status === "want") {
        setPagesReadText("");
      }
    }

    didHydrate.current = true;
  }, [params]);

  const canSave = useMemo(() => {
    return title.trim().length > 0 && author.trim().length > 0;
  }, [title, author]);

  const existingMatch = useMemo(() => {
    const normalizedTitle = normalizeText(title);
    const normalizedAuthor = normalizeText(author);

    if (!normalizedTitle || !normalizedAuthor) return undefined;

    return books.find((book) => {
      if (googleId && book.googleId && book.googleId === googleId) {
        return true;
      }

      return (
        normalizeText(book.title) === normalizedTitle &&
        normalizeText(book.author) === normalizedAuthor
      );
    });
  }, [books, title, author, googleId]);

  const handleChangeStatus = (next: BookStatus) => {
    setStatus(next);

    if (next !== "read") {
      setRating(0);
      setNote("");
    }

    if (next === "read" && pagesTotalText) {
      setPagesReadText(pagesTotalText);
    }

    if (next === "want") {
      setPagesReadText("");
    }
  };

  const handleSelectGoogleBook = (item: GoogleBook) => {
    setSelectedGoogleBook(item);

    const mapped = mapGoogleBookToForm(item);

    setTitle(mapped.title);
    setAuthor(mapped.author);
    setPagesTotalText(mapped.pagesTotalText);
    setThumbnail(mapped.thumbnail);
    setGoogleId(mapped.googleId);

    if (status === "read" && mapped.pagesTotalText) {
      setPagesReadText(mapped.pagesTotalText);
    }

    if (status === "want") {
      setPagesReadText("");
    }
  };

  const goToBookDetail = (book: Book) => {
    router.replace({
      pathname: "/book/[id]",
      params: {
        id: book.id,
        googleId: book.googleId ?? "",
        title: book.title,
        author: book.author,
        bookJson: JSON.stringify(book),
      },
    });
  };

  const handleSubmit = () => {
    Keyboard.dismiss();

    if (!canSave) {
      Alert.alert("Eksik bilgi", "Kitap adı ve yazar zorunlu.");
      return;
    }

    const pagesTotal = toSafeNumber(pagesTotalText);

    const rawPagesRead =
      status === "reading" || status === "read"
        ? toSafeNumber(pagesReadText)
        : undefined;

    const fixedPagesRead =
      typeof pagesTotal === "number" && typeof rawPagesRead === "number"
        ? Math.min(rawPagesRead, pagesTotal)
        : rawPagesRead;

    const result = addBook({
      title: title.trim(),
      author: author.trim(),
      status,
      thumbnail,
      googleId,

      description: selectedGoogleBook?.description,
      categories: selectedGoogleBook?.categories,
      publishedDate: selectedGoogleBook?.publishedDate,
      language: selectedGoogleBook?.language,

      rating: status === "read" && rating > 0 ? rating : undefined,
      note:
        status === "read" && note.trim().length > 0 ? note.trim() : undefined,
      pagesTotal:
        typeof pagesTotal === "number" && pagesTotal > 0
          ? pagesTotal
          : undefined,
      pagesRead:
        (status === "reading" || status === "read") &&
        typeof fixedPagesRead === "number" &&
        fixedPagesRead > 0
          ? fixedPagesRead
          : undefined,
    });

    if (!result.created) {
      Alert.alert(
        "Bu kitap zaten var",
        "Aynı kitap daha önce kitaplığına eklenmiş. Mevcut kayıt açılacak.",
        [{ text: "Tamam", onPress: () => goToBookDetail(result.book) }],
      );
      return;
    }

    Alert.alert("Başarılı", "Kitap listene eklendi.", [
      { text: "Tamam", onPress: () => goToBookDetail(result.book) },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: COLORS.text }}>
          Kitap Ekle
        </Text>
        <Text style={{ color: COLORS.muted, lineHeight: 21 }}>
          Kitabı ara, bilgileri otomatik doldur ve listene ekle.
        </Text>
      </View>

      <SectionCard title="Kitap Ara">
        <BookSearchPicker onSelect={handleSelectGoogleBook} />
      </SectionCard>

      {(selectedGoogleBook || thumbnail || title || author) && (
        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 22,
            padding: 14,
            backgroundColor: COLORS.card,
            flexDirection: "row",
            gap: 12,
          }}
        >
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              style={{ width: 72, height: 106, borderRadius: 12 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 72,
                height: 106,
                borderRadius: 12,
                backgroundColor: COLORS.primarySoft,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <Ionicons name="book-outline" size={28} color={COLORS.primary} />
              <Text style={{ fontSize: 10, color: COLORS.muted }}>
                Kapak yok
              </Text>
            </View>
          )}

          <View style={{ flex: 1, justifyContent: "center", gap: 4 }}>
            <Text
              style={{ fontWeight: "900", fontSize: 17, color: COLORS.text }}
              numberOfLines={2}
            >
              {title || "Kitap seçilmedi"}
            </Text>

            <Text style={{ color: COLORS.muted }} numberOfLines={1}>
              {author || "Yazar bilgisi yok"}
            </Text>

            {pagesTotalText ? (
              <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                {pagesTotalText} sayfa
              </Text>
            ) : null}

            {googleId ? (
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 12,
                  fontWeight: "800",
                }}
              >
                API ile seçildi
              </Text>
            ) : null}

            {existingMatch ? (
              <Text
                style={{
                  color: "#9b5d00",
                  fontSize: 12,
                  fontWeight: "800",
                }}
              >
                Bu kitap zaten kitaplığında var
              </Text>
            ) : null}
          </View>
        </View>
      )}

      <SectionCard title="Temel Bilgiler">
        <LabeledInput
          label="Kitap Adı"
          value={title}
          onChangeText={setTitle}
          placeholder="Örn: Kürk Mantolu Madonna"
          returnKeyType="next"
          onSubmitEditing={() => authorRef.current?.focus()}
        />

        <LabeledInput
          label="Yazar"
          value={author}
          onChangeText={setAuthor}
          placeholder="Örn: Sabahattin Ali"
          inputRef={authorRef}
          returnKeyType="next"
          onSubmitEditing={() => pagesTotalRef.current?.focus()}
        />

        <LabeledInput
          label="Toplam Sayfa"
          value={pagesTotalText}
          onChangeText={setPagesTotalText}
          placeholder="Örn: 160"
          keyboardType="number-pad"
          inputRef={pagesTotalRef}
          returnKeyType="next"
          onSubmitEditing={() => {
            if (status === "reading" || status === "read") {
              pagesReadRef.current?.focus();
            } else {
              handleSubmit();
            }
          }}
        />
      </SectionCard>

      <SectionCard title="Durum">
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {(["reading", "read", "want"] as BookStatus[]).map((itemStatus) => {
            const active = itemStatus === status;

            return (
              <Pressable
                key={itemStatus}
                onPress={() => handleChangeStatus(itemStatus)}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
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
                  {STATUS_LABEL[itemStatus]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      {(status === "reading" || status === "read") && (
        <SectionCard
          title={status === "reading" ? "Okuma İlerlemesi" : "Okuma Bilgisi"}
        >
          <LabeledInput
            label="Okunan Sayfa"
            value={pagesReadText}
            onChangeText={setPagesReadText}
            placeholder="Örn: 40"
            keyboardType="number-pad"
            inputRef={pagesReadRef}
            returnKeyType={status === "read" ? "next" : "done"}
            onSubmitEditing={() => {
              if (status === "read") {
                noteRef.current?.focus();
              } else {
                handleSubmit();
              }
            }}
          />

          <Text style={{ color: COLORS.muted, fontSize: 12 }}>
            Okunan sayfa toplamdan büyükse otomatik düzeltilir.
          </Text>
        </SectionCard>
      )}

      {status === "read" && (
        <SectionCard title="Değerlendirme">
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "800", color: COLORS.text }}>Puan</Text>
            <StarRating value={rating} onChange={setRating} />

            <Pressable
              onPress={() => setRating(0)}
              style={{ alignSelf: "flex-start" }}
            >
              <Text style={{ color: COLORS.primary, fontWeight: "800" }}>
                Puanı temizle
              </Text>
            </Pressable>
          </View>

          <LabeledInput
            label="Not"
            value={note}
            onChangeText={setNote}
            placeholder="Kitap hakkında kısa notun..."
            multiline
            inputRef={noteRef}
          />
        </SectionCard>
      )}

      <SoftButton
        label="Kaydet"
        icon="save-outline"
        onPress={handleSubmit}
        variant="primary"
        disabled={!canSave}
      />

      <SoftButton
        label="Vazgeç"
        icon="arrow-back-outline"
        onPress={() => {
          Keyboard.dismiss();
          router.back();
        }}
      />
    </ScrollView>
  );
}
