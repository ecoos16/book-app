// app/edit-book/[id].tsx

import { Ionicons } from "@expo/vector-icons";
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

/**
 * Ortak renk paleti
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
  graySoft: "#f3efe8",
  whiteSoft: "#fff7f4",
};

/**
 * Durum etiketleri
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
 * Ortak input alanı
 */
function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad";
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "800", color: COLORS.text }}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9a9389"
        multiline={multiline}
        keyboardType={keyboardType}
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
  const backgroundColor =
    variant === "primary" ? COLORS.primary : COLORS.graySoft;
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
          ? "#c9c2b8"
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

export default function EditBook() {
  /**
   * Route parametresi
   */
  const { id } = useLocalSearchParams<{ id: string }>();

  /**
   * Context içinden kitabı getir ve güncelle
   */
  const { getById, updateBook } = useBooks();

  /**
   * İlgili kitabı bul
   */
  const book = id ? getById(id) : undefined;

  /**
   * Form state'leri
   */
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [status, setStatus] = useState<BookStatus>(book?.status ?? "reading");
  const [note, setNote] = useState(book?.note ?? "");
  const [rating, setRating] = useState<number>(book?.rating ?? 0);

  /**
   * Sayfa alanları string tutulur
   * Çünkü TextInput string çalışır
   */
  const [pagesTotalText, setPagesTotalText] = useState(
    typeof book?.pagesTotal === "number" ? String(book.pagesTotal) : "",
  );

  const [pagesReadText, setPagesReadText] = useState(
    typeof book?.pagesRead === "number" ? String(book.pagesRead) : "",
  );

  /**
   * Kaydet butonu aktif mi?
   */
  const canSave = useMemo(() => {
    return title.trim().length > 0 && author.trim().length > 0;
  }, [title, author]);

  /**
   * Kitap bulunamazsa güvenli boş durum
   */
  if (!book) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 16 }}
      >
        <View
          style={{
            marginTop: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 24,
            paddingVertical: 32,
            paddingHorizontal: 22,
            backgroundColor: COLORS.card,
            alignItems: "center",
            gap: 10,
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
            <Ionicons name="book-outline" size={28} color={COLORS.primary} />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: COLORS.text,
            }}
          >
            Kitap bulunamadı
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              textAlign: "center",
              lineHeight: 21,
            }}
          >
            Bu kayıt silinmiş olabilir veya geçersiz bir bağlantı açılmış
            olabilir.
          </Text>

          <View style={{ marginTop: 8, minWidth: 140 }}>
            <SoftButton
              label="Geri"
              icon="arrow-back-outline"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  /**
   * Input'tan gelen metni güvenli sayıya çevir
   */
  const toSafeNumber = (t: string) => {
    const onlyDigits = t.replace(/[^\d]/g, "");

    if (!onlyDigits) return undefined;

    const n = Number(onlyDigits);

    if (!Number.isFinite(n)) return undefined;

    return Math.max(0, Math.floor(n));
  };

  /**
   * Durum değişince ilgili alanları güncelle
   */
  const onChangeStatus = (next: BookStatus) => {
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

  /**
   * Kaydet işlemi
   */
  const onSave = () => {
    if (!canSave) {
      Alert.alert("Eksik bilgi", "Kitap adı ve yazar zorunlu.");
      return;
    }

    const safePagesTotal = toSafeNumber(pagesTotalText);

    const safePagesRead =
      status === "reading" || status === "read"
        ? toSafeNumber(pagesReadText)
        : undefined;

    /**
     * Okunan sayfa toplamı aşmasın
     */
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
    >
      {/* Başlık */}
      <View style={{ gap: 4 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "900",
            color: COLORS.text,
          }}
        >
          Kitabı Düzenle
        </Text>

        <Text style={{ color: COLORS.muted }}>
          Kitap bilgilerini güncelle ve durumunu düzenle.
        </Text>
      </View>

      {/* Üst özet kartı */}
      <View
        style={{
          flexDirection: "row",
          gap: 14,
          padding: 16,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
        }}
      >
        {/* Kapak */}
        <View
          style={{
            width: 92,
            height: 132,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: COLORS.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {book.thumbnail ? (
            <Image
              source={{ uri: book.thumbnail }}
              style={{ width: 92, height: 132 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name="book-outline" size={28} color={COLORS.primary} />
              <Text style={{ fontSize: 10, color: COLORS.muted }}>
                Kapak yok
              </Text>
            </View>
          )}
        </View>

        {/* Sağ özet */}
        <View style={{ flex: 1, gap: 8 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: COLORS.text,
            }}
            numberOfLines={3}
          >
            {title || "Kitap adı"}
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              fontSize: 14,
              fontWeight: "700",
            }}
            numberOfLines={2}
          >
            {author || "Yazar"}
          </Text>

          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.graySoft,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: COLORS.primary,
              }}
            >
              {statusLabel[status]}
            </Text>
          </View>

          {pagesTotalText ? (
            <Text style={{ color: COLORS.muted, fontSize: 12 }}>
              Toplam sayfa: {pagesTotalText}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Temel bilgiler */}
      <SectionCard title="Temel Bilgiler">
        <LabeledInput
          label="Kitap Adı"
          value={title}
          onChangeText={setTitle}
          placeholder="Kitap adı"
        />

        <LabeledInput
          label="Yazar"
          value={author}
          onChangeText={setAuthor}
          placeholder="Yazar"
        />

        <LabeledInput
          label="Toplam Sayfa"
          value={pagesTotalText}
          onChangeText={setPagesTotalText}
          placeholder="Örn: 320"
          keyboardType="number-pad"
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

      {/* Reading / Read için sayfa bilgisi */}
      {(status === "reading" || status === "read") && (
        <SectionCard
          title={status === "reading" ? "Okuma İlerlemesi" : "Okuma Bilgisi"}
        >
          <LabeledInput
            label="Okunan Sayfa"
            value={pagesReadText}
            onChangeText={setPagesReadText}
            placeholder="Örn: 45"
            keyboardType="number-pad"
          />

          <Text style={{ color: COLORS.muted, fontSize: 12 }}>
            Okunan sayfa toplamdan büyükse otomatik düzeltilir.
          </Text>
        </SectionCard>
      )}

      {/* Sadece read için değerlendirme */}
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
            placeholder="Bu kitapla ilgili notun..."
            multiline
          />
        </SectionCard>
      )}

      {/* Want için açıklama */}
      {status === "want" && (
        <SectionCard title="Okuma Listesi Notu">
          <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
            Bu kitap daha sonra okumak üzere kaydedilecek. Toplam sayfa bilgisi
            korunabilir.
          </Text>
        </SectionCard>
      )}

      {/* Alt aksiyonlar */}
      <SoftButton
        label="Kaydet"
        icon="save-outline"
        onPress={onSave}
        variant="primary"
        disabled={!canSave}
      />

      <SoftButton
        label="Geri"
        icon="arrow-back-outline"
        onPress={() => router.back()}
      />
    </ScrollView>
  );
}
