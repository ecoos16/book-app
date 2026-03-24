// app/comments/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useBooks } from "../../context/BooksContext";
import type { BookComment } from "../../types/book";

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
  dangerSoft: "#fff4f4",
  dangerBorder: "#ffd8d8",
  dangerText: "#a22b2b",
};

/**
 * Basit benzersiz id üretici
 */
function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Ortak buton
 */
function SoftButton({
  label,
  icon,
  onPress,
  variant = "secondary",
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "secondary" | "primary" | "danger";
}) {
  const backgroundColor =
    variant === "primary"
      ? COLORS.primary
      : variant === "danger"
        ? COLORS.dangerSoft
        : COLORS.graySoft;

  const borderColor =
    variant === "primary"
      ? COLORS.primary
      : variant === "danger"
        ? COLORS.dangerBorder
        : COLORS.border;

  const textColor =
    variant === "primary"
      ? COLORS.whiteSoft
      : variant === "danger"
        ? COLORS.dangerText
        : COLORS.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor,
        backgroundColor: pressed
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

export default function CommentsScreen() {
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
   * Yeni yorum input state
   */
  const [text, setText] = useState("");

  /**
   * Kitap yoksa güvenli boş durum
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
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={28}
              color={COLORS.primary}
            />
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
            Bu kayıt silinmiş olabilir veya geçersiz bir yorum bağlantısı
            açılmış olabilir.
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
   * Kitabın yorum listesi
   */
  const comments = useMemo<BookComment[]>(
    () => book.comments ?? [],
    [book.comments],
  );

  /**
   * Yeni yorum ekle
   */
  const addComment = () => {
    const t = text.trim();

    if (!t.length) {
      Alert.alert("Boş olmaz", "Yorum yazmalısın.");
      return;
    }

    const next: BookComment[] = [
      ...comments,
      {
        id: makeId(),
        text: t,
        createdAt: Date.now(),
      },
    ];

    updateBook(book.id, { comments: next });
    setText("");
  };

  /**
   * Yorum sil
   */
  const removeComment = (index: number) => {
    Alert.alert("Yorum silinsin mi?", "Bu yorum kaldırılacak.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          const next = comments.filter((_, i) => i !== index);
          updateBook(book.id, { comments: next });
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}
    >
      {/* Sayfa başlığı */}
      <View style={{ gap: 4 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "900",
            color: COLORS.text,
          }}
        >
          Yorumlar
        </Text>

        <Text style={{ color: COLORS.muted }}>
          {book.title} • {comments.length} yorum
        </Text>
      </View>

      {/* Yorum yazma kartı */}
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
          Yorum Yaz
        </Text>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Bu kitap hakkında düşünceni yaz..."
          placeholderTextColor="#9a9389"
          multiline
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 16,
            padding: 14,
            minHeight: 110,
            textAlignVertical: "top",
            backgroundColor: COLORS.graySoft,
            color: COLORS.text,
          }}
        />

        <SoftButton
          label="Yorumu Ekle"
          icon="add-outline"
          onPress={addComment}
          variant="primary"
        />
      </View>

      {/* Yorum listesi */}
      {comments.length === 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 24,
            paddingVertical: 30,
            paddingHorizontal: 22,
            backgroundColor: COLORS.card,
            alignItems: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: COLORS.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="chatbubble-outline"
              size={26}
              color={COLORS.primary}
            />
          </View>

          <Text
            style={{
              fontSize: 18,
              fontWeight: "900",
              color: COLORS.text,
            }}
          >
            Henüz yorum yok
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              textAlign: "center",
              lineHeight: 21,
            }}
          >
            Bu kitap için ilk yorumu sen yazabilirsin.
          </Text>
        </View>
      ) : (
        comments.map((c, index) => (
          <Pressable
            key={c.id}
            onLongPress={() => removeComment(index)}
            delayLongPress={250}
            style={{
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 18,
              padding: 14,
              backgroundColor: COLORS.card,
              gap: 8,
            }}
          >
            {/* Yorum üst alanı */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Text style={{ fontWeight: "900", color: COLORS.text }}>
                Yorum
              </Text>

              <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                {new Date(c.createdAt).toLocaleDateString("tr-TR")}
              </Text>
            </View>

            {/* Yorum metni */}
            <Text style={{ color: COLORS.text, lineHeight: 21 }}>{c.text}</Text>

            {/* Yardım metni */}
            <Text style={{ color: COLORS.muted, fontSize: 12 }}>
              Uzun bas: yorumu sil
            </Text>
          </Pressable>
        ))
      )}

      {/* Geri */}
      <SoftButton
        label="Geri"
        icon="arrow-back-outline"
        onPress={() => router.back()}
      />
    </ScrollView>
  );
}
