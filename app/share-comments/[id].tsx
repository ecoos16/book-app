// app/share-comments/[id].tsx

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
 * Basit yorum id üretici
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
  variant?: "secondary" | "primary";
}) {
  const backgroundColor = variant === "primary" ? COLORS.primary : COLORS.card;

  const borderColor = variant === "primary" ? COLORS.primary : COLORS.border;

  const textColor = variant === "primary" ? COLORS.whiteSoft : COLORS.text;

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

export default function ShareComments() {
  /**
   * Route parametresi
   */
  const { id } = useLocalSearchParams<{ id: string }>();

  /**
   * Context verileri
   */
  const { getById, updateBook } = useBooks();

  /**
   * İlgili kitap
   */
  const book = id ? getById(id) : undefined;

  /**
   * Yeni yorum input state
   */
  const [text, setText] = useState("");

  /**
   * Yorumları güvenli al
   */
  const comments = useMemo(() => book?.comments ?? [], [book?.comments]);

  /**
   * Kitap yoksa fallback
   */
  if (!book) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 16 }}
      >
        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 22,
            paddingVertical: 30,
            paddingHorizontal: 20,
            backgroundColor: COLORS.card,
            alignItems: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
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
            Paylaşım bulunamadı
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Bu içerik silinmiş olabilir veya geçersiz bir bağlantı açılmış
            olabilir.
          </Text>

          <View style={{ marginTop: 6, minWidth: 140 }}>
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
   * Yeni yorum ekle
   */
  const onAdd = () => {
    const trimmed = text.trim();

    if (!trimmed.length) {
      Alert.alert("Eksik bilgi", "Yorum yazmalısın.");
      return;
    }

    const next = [
      ...comments,
      {
        id: makeId(),
        text: trimmed,
        createdAt: Date.now(),
      },
    ];

    updateBook(book.id, { comments: next });
    setText("");
  };

  /**
   * Yorumu sil
   */
  const onRemove = (commentId: string) => {
    Alert.alert("Yorum silinsin mi?", "Bu yorum kaldırılacak.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          const next = comments.filter((c) => c.id !== commentId);
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
      {/* Başlık */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: COLORS.text }}>
          Yorumlar
        </Text>

        <Text style={{ color: COLORS.muted }}>
          {book.title} • {comments.length} yorum
        </Text>
      </View>

      {/* Hangi paylaşıma ait */}
      <View
        style={{
          padding: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
          gap: 8,
        }}
      >
        <Text style={{ fontWeight: "900", color: COLORS.text, fontSize: 17 }}>
          {book.title}
        </Text>

        <Text style={{ color: COLORS.muted, lineHeight: 20 }} numberOfLines={3}>
          “{book.shareText ?? "Paylaşım metni yok"}”
        </Text>
      </View>

      {/* Yorum yazma alanı */}
      <View
        style={{
          padding: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
          gap: 10,
        }}
      >
        <Text style={{ fontWeight: "900", color: COLORS.text }}>
          Yorum Ekle
        </Text>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Yorum yaz…"
          placeholderTextColor="#9a9389"
          multiline
          style={{
            minHeight: 110,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 14,
            padding: 12,
            backgroundColor: COLORS.graySoft,
            color: COLORS.text,
            textAlignVertical: "top",
          }}
        />

        <SoftButton
          label="Yorum Ekle"
          icon="add-outline"
          onPress={onAdd}
          variant="primary"
        />
      </View>

      {/* Yorum listesi */}
      {comments.length === 0 ? (
        <View
          style={{
            padding: 18,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.card,
            gap: 10,
          }}
        >
          <Text style={{ fontWeight: "900", color: COLORS.text }}>
            Henüz yorum yok
          </Text>
          <Text style={{ color: COLORS.muted, lineHeight: 21 }}>
            Bu paylaşım için ilk yorumu sen yapabilirsin.
          </Text>
        </View>
      ) : (
        comments.map((c) => (
          <Pressable
            key={c.id}
            onLongPress={() => onRemove(c.id)}
            delayLongPress={250}
            style={{
              padding: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.card,
              gap: 8,
            }}
          >
            <Text style={{ color: COLORS.text, lineHeight: 21 }}>{c.text}</Text>

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
