// app/share/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useBooks } from "../../context/BooksContext";
import { usePosts } from "../../context/PostsContext";
import { CURRENT_USER } from "../../data/mockUsers";

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
        paddingVertical: 14,
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

export default function ShareBookScreen() {
  /**
   * Route parametreleri
   * id     -> kitap id
   * postId -> varsa düzenleme modu
   */
  const { id, postId } = useLocalSearchParams<{
    id: string;
    postId?: string;
  }>();

  /**
   * Context verileri
   */
  const { getById } = useBooks();
  const { addPost, getByBookId, getById: getPostById, updatePost } = usePosts();

  /**
   * İlgili kitap ve düzenlenecek paylaşım
   */
  const book = id ? getById(id) : undefined;
  const editingPost = postId ? getPostById(postId) : undefined;

  /**
   * Paylaşım metni
   */
  const [text, setText] = useState("");

  /**
   * Düzenleme modunda mevcut paylaşımı input'a doldur
   */
  useEffect(() => {
    if (editingPost) {
      setText(editingPost.shareText ?? "");
    }
  }, [editingPost]);

  /**
   * Kitap yoksa fallback ekranı
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
              lineHeight: 20,
            }}
          >
            Bu kitap silinmiş olabilir veya geçersiz bir bağlantı açılmış
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

  const safeBook = book;

  /**
   * Aynı kitaba ait mevcut paylaşımlar
   * Düzenleme modunda değilken kullanıcıya gösterilir.
   */
  const existingPosts = useMemo(() => {
    return getByBookId(safeBook.id);
  }, [safeBook.id, getByBookId]);

  /**
   * Yeni paylaşım veya güncelleme işlemi
   */
  function handleSubmit() {
    const trimmed = text.trim();

    if (!trimmed) {
      Alert.alert("Eksik bilgi", "Lütfen paylaşım metni yaz.");
      return;
    }

    /**
     * Düzenleme modu
     */
    if (editingPost) {
      updatePost(editingPost.id, {
        shareText: trimmed,
      });

      Alert.alert("Güncellendi", "Paylaşımın güncellendi.", [
        {
          text: "Tamam",
          onPress: () => router.back(),
        },
      ]);
      return;
    }

    /**
     * Yeni paylaşım modu
     */
    addPost({
      bookId: safeBook.id,
      bookTitle: safeBook.title,
      bookAuthor: safeBook.author,
      bookThumbnail: safeBook.thumbnail,
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      userAvatar: CURRENT_USER.avatar,
      shareText: trimmed,
    });

    setText("");

    Alert.alert("Paylaşıldı", "Paylaşımın topluluk akışına eklendi.", [
      {
        text: "Tamam",
        onPress: () => router.back(),
      },
    ]);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}
    >
      {/* Başlık */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: COLORS.text }}>
          {editingPost ? "Paylaşımı Düzenle" : "Paylaş"}
        </Text>

        <Text style={{ color: COLORS.muted, lineHeight: 21 }}>
          {editingPost
            ? "Mevcut paylaşım metnini güncelle."
            : "Bu kitap hakkında düşüncelerini toplulukla paylaş."}
        </Text>
      </View>

      {/* Kitap kartı */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          padding: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 60,
            height: 88,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: COLORS.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {safeBook.thumbnail ? (
            <Image
              source={{ uri: safeBook.thumbnail }}
              style={{ width: 60, height: 88 }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="book-outline" size={24} color={COLORS.primary} />
          )}
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={{ fontWeight: "900", fontSize: 17, color: COLORS.text }}
            numberOfLines={2}
          >
            {safeBook.title}
          </Text>

          <Text style={{ color: COLORS.muted }} numberOfLines={1}>
            {safeBook.author}
          </Text>

          <Text style={{ color: COLORS.muted, fontSize: 12 }}>
            {editingPost
              ? "Paylaşımını düzenliyorsun"
              : "Bu kitap hakkında düşüncelerini paylaş"}
          </Text>
        </View>
      </View>

      {/* Metin alanı */}
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
          {editingPost ? "Paylaşımı Düzenle" : "Paylaşım Metni"}
        </Text>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Bu kitap sende nasıl bir etki bıraktı?"
          placeholderTextColor="#9a9389"
          multiline
          textAlignVertical="top"
          maxLength={700}
          style={{
            minHeight: 140,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 14,
            padding: 12,
            backgroundColor: COLORS.graySoft,
            color: COLORS.text,
          }}
        />

        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
          {text.trim().length}/700 karakter
        </Text>
      </View>

      {/* Ana aksiyon */}
      <SoftButton
        label={editingPost ? "Güncelle" : "Paylaş"}
        icon={editingPost ? "create-outline" : "share-social-outline"}
        onPress={handleSubmit}
        variant="primary"
      />

      {/* Önceki paylaşımlar */}
      {!editingPost && (
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
          <Text style={{ fontWeight: "900", color: COLORS.text }}>
            Bu kitaba ait önceki paylaşımlar
          </Text>

          {existingPosts.length === 0 ? (
            <Text style={{ color: COLORS.muted }}>Henüz paylaşım yok.</Text>
          ) : (
            existingPosts.map((post) => (
              <View
                key={post.id}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: COLORS.graySoft,
                  gap: 4,
                }}
              >
                <Text style={{ fontWeight: "800", color: COLORS.text }}>
                  {post.userName}
                </Text>

                <Text style={{ color: COLORS.muted, lineHeight: 20 }}>
                  {post.shareText}
                </Text>
              </View>
            ))
          )}
        </View>
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
