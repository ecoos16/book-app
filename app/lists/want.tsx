// app/lists/want.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BooksList } from "../../components/BooksList";
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
  graySoft: "#f3efe8",
  whiteSoft: "#fff7f4",
};

/**
 * Ortak CTA butonu
 */
function SoftButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? COLORS.primaryDark : COLORS.primary,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
      })}
    >
      {!!icon && <Ionicons name={icon} size={18} color={COLORS.whiteSoft} />}
      <Text style={{ color: COLORS.whiteSoft, fontWeight: "900" }}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Boş durum kartı
 */
function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
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
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: COLORS.graySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="star-outline" size={24} color={COLORS.primary} />
      </View>

      <Text style={{ fontWeight: "900", fontSize: 17, color: COLORS.text }}>
        {title}
      </Text>

      <Text style={{ color: COLORS.muted, lineHeight: 21 }}>{description}</Text>
    </View>
  );
}

export default function WantList() {
  const { getByStatus, isHydrated } = useBooks();

  /**
   * Daha sonra okumak istediğin kitaplar
   */
  const books = getByStatus("want");

  if (!isHydrated) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 16 }}
      >
        <Text style={{ color: COLORS.muted }}>Yükleniyor…</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}
    >
      {/* Başlık */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: COLORS.text }}>
          İstiyorum
        </Text>

        <Text style={{ color: COLORS.muted, lineHeight: 21 }}>
          Sonra okumak istediğin kitapları burada tutabilirsin.
        </Text>
      </View>

      {/* Yeni kitap ekle */}
      <SoftButton
        label="İstiyorum listesine kitap ekle"
        icon="add-outline"
        onPress={() =>
          router.push({
            pathname: "/add-book",
            params: { status: "want" },
          })
        }
      />

      {/* İçerik */}
      {books.length === 0 ? (
        <EmptyState
          title="Henüz bu listede kitap yok"
          description="Okumayı planladığın kitapları bu listeye ekleyebilir, sonra kolayca geri dönebilirsin."
        />
      ) : (
        <BooksList books={books} />
      )}
    </ScrollView>
  );
}
