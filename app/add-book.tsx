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
import type { BookStatus } from "../types/book";
import type { GoogleBook } from "../types/googleBooks";

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
};

/**
 * Durum etiketleri
 * UI'da kullanıcıya Türkçe olarak gösterilecek karşılıklar
 */
const statusLabel: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

/**
 * Ortak section kartı
 */
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

/**
 * Etiketli input alanı
 */
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

/**
 * Ortak buton
 */
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

export default function AddBook() {
  /**
   * Global context içinden yeni kitap ekleme fonksiyonu
   */
  const { addBook } = useBooks();
  const authorRef = useRef<TextInput>(null);
  const pagesTotalRef = useRef<TextInput>(null);
  const pagesReadRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);
  /**
   * Route parametreleri
   * Liste ekranlarından veya search ekranından bilgi gelebilir
   */
  const params = useLocalSearchParams<{
    title?: string;
    author?: string;
    pagesTotal?: string;
    thumbnail?: string;
    googleId?: string;
    status?: BookStatus;
  }>();

  /**
   * API'den seçilen son kitabı tutuyoruz
   * Önizleme kartında kullanıyoruz
   */
  const [selectedGoogleBook, setSelectedGoogleBook] =
    useState<GoogleBook | null>(null);

  /**
   * Temel form state'leri
   */
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  /**
   * Kitabın listede hangi durumda olacağı
   */
  const [status, setStatus] = useState<BookStatus>("reading");

  /**
   * "Okudum" durumuna özel alanlar
   */
  const [rating, setRating] = useState<number>(0);
  const [note, setNote] = useState("");

  /**
   * Sayfa bilgileri
   * TextInput kullandığımız için string tutuyoruz
   */
  const [pagesTotalText, setPagesTotalText] = useState("");
  const [pagesReadText, setPagesReadText] = useState("");

  /**
   * API'den gelen kapak ve benzersiz id
   */
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [googleId, setGoogleId] = useState<string | undefined>(undefined);

  /**
   * Parametrelerden gelen verinin formu sadece 1 kez doldurması için ref
   */
  const didHydrate = useRef(false);

  /**
   * Ekran ilk açıldığında route'tan gelen verileri forma bas
   */
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

    /**
     * Eğer route'tan gelen durum "read" ise ve toplam sayfa da geldiyse
     * kitabı tamamlanmış gibi işaretleyebiliriz
     */
    if (incomingStatus === "read" && incomingPagesTotal) {
      setPagesReadText(incomingPagesTotal);
    }

    didHydrate.current = true;
  }, [
    params.title,
    params.author,
    params.pagesTotal,
    params.thumbnail,
    params.googleId,
    params.status,
  ]);

  /**
   * Kaydet butonu aktif mi?
   * Kitap adı ve yazar zorunlu
   */
  const canSave = useMemo(() => {
    return title.trim().length > 0 && author.trim().length > 0;
  }, [title, author]);

  /**
   * String numeric inputu güvenli sayıya çevir
   */
  const toSafeNumber = (t: string) => {
    const onlyDigits = t.replace(/[^\d]/g, "");

    if (!onlyDigits) return undefined;

    const n = Number(onlyDigits);

    if (!Number.isFinite(n)) return undefined;

    return Math.max(0, Math.floor(n));
  };

  /**
   * Kullanıcı durum değiştirince ilgili alanları temizle / ayarla
   */
  const onChangeStatus = (next: BookStatus) => {
    setStatus(next);

    // "Okudum" dışındaki durumlarda puan ve not gereksiz
    if (next !== "read") {
      setRating(0);
      setNote("");
    }

    // "Okudum" seçildiyse ve toplam sayfa bilgisi varsa
    if (next === "read" && pagesTotalText) {
      setPagesReadText(pagesTotalText);
    }

    // "İstiyorum" seçildiyse okunan sayfa gereksiz
    if (next === "want") {
      setPagesReadText("");
    }
  };

  /**
   * API'den kitap seçilince formu doldur
   */
  const handleSelectGoogleBook = (item: GoogleBook) => {
    setSelectedGoogleBook(item);

    const nextTitle = item.title?.trim() || "";

    const nextAuthor =
      Array.isArray(item.authors) && item.authors.length > 0
        ? item.authors.join(", ")
        : "";

    const nextPagesTotal =
      typeof item.pageCount === "number" && item.pageCount > 0
        ? String(item.pageCount)
        : "";

    // Temel bilgiler
    setTitle(nextTitle);
    setAuthor(nextAuthor);
    setPagesTotalText(nextPagesTotal);

    // Metadata
    setThumbnail(item.thumbnail || undefined);
    setGoogleId(item.id || undefined);

    /**
     * Eğer kullanıcı "Okudum" durumundaysa
     * ve sayfa sayısı geldiyse kitabı tamamlanmış kabul et
     */
    if (status === "read" && nextPagesTotal) {
      setPagesReadText(nextPagesTotal);
    }

    /**
     * Eğer durum "İstiyorum" ise okunan sayfa gereksiz
     */
    if (status === "want") {
      setPagesReadText("");
    }
  };

  /**
   * Form gönderme
   */
  const onSubmit = () => {
    Keyboard.dismiss();
    if (!canSave) {
      Alert.alert("Eksik bilgi", "Kitap adı ve yazar zorunlu.");
      return;
    }

    const pagesTotal = toSafeNumber(pagesTotalText);

    const pagesRead =
      status === "reading" || status === "read"
        ? toSafeNumber(pagesReadText)
        : undefined;

    const fixedPagesRead =
      typeof pagesTotal === "number" && typeof pagesRead === "number"
        ? Math.min(pagesRead, pagesTotal)
        : pagesRead;

    /**
     * Yeni kitabı context'e ekle
     */
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

    router.back();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Başlık alanı */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: COLORS.text }}>
          Kitap Ekle
        </Text>
        <Text style={{ color: COLORS.muted, lineHeight: 21 }}>
          Kitabı ara, bilgileri otomatik doldur ve listene ekle.
        </Text>
      </View>
      {/* Arama kartı */}
      <SectionCard title="Kitap Ara">
        <BookSearchPicker onSelect={handleSelectGoogleBook} />
      </SectionCard>
      {/* Seçilen kitap önizleme kartı */}
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
          {/* Kapak görseli */}
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

          {/* Kitap özeti */}
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
          </View>
        </View>
      )}
      {/* Temel bilgi kartı */}
      <SectionCard title="Temel Bilgiler">
        <LabeledInput
          label="Kitap Adı"
          value={title}
          onChangeText={setTitle}
          placeholder="Örn: Kürk Mantolu Madonna"
          inputRef={undefined}
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
              onSubmit();
            }
          }}
        />
      </SectionCard>
      {/* Durum kartı */}
      <SectionCard title="Durum">
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {(["reading", "read", "want"] as BookStatus[]).map((s) => {
            const active = s === status;

            return (
              <Pressable
                key={s}
                onPress={() => onChangeStatus(s)}
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
                  {statusLabel[s]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>
      {/* Reading / Read için okunan sayfa kartı */}
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
                onSubmit();
              }
            }}
          />

          <Text style={{ color: COLORS.muted, fontSize: 12 }}>
            Okunan sayfa toplamdan büyükse otomatik düzeltilir.
          </Text>
        </SectionCard>
      )}
      {/* Sadece read için değerlendirme kartı */}
      {status === "read" && (
        <SectionCard title="Değerlendirme">
          {/* Yıldız puanı */}
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

          {/* Not alanı */}
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
      Keyboard.dismiss();
      {/* Ana aksiyonlar */}
      <SoftButton
        label="Kaydet"
        icon="save-outline"
        onPress={onSubmit}
        variant="primary"
        disabled={!canSave}
      />
      <SoftButton
        label="Vazgeç"
        icon="arrow-back-outline"
        onPress={() => router.back()}
      />
    </ScrollView>
  );
}
