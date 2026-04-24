// app/share/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../../context/AuthContext";
import { useBooks } from "../../context/BooksContext";
import { useChat } from "../../context/ChatContext";
import { usePosts } from "../../context/PostsContext";
import { useUser } from "../../context/UserContext";

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
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: disabled ? 0.6 : 1,
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
  const params = useLocalSearchParams<{
    id?: string | string[];
    postId?: string | string[];
  }>();

  const safeBookId = Array.isArray(params.id) ? params.id[0] : params.id;
  const safePostId = Array.isArray(params.postId)
    ? params.postId[0]
    : params.postId;

  const { user: authUser } = useAuth();
  const { user: appUser } = useUser();

  const { getById } = useBooks();
  const { getOrCreateConversationByParticipant, fetchConversationById } =
    useChat();
  const { addPost, getByBookId, getById: getPostById, updatePost } = usePosts();

  const book = safeBookId ? getById(safeBookId) : undefined;
  const editingPost = safePostId ? getPostById(safePostId) : undefined;

  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messagingUserId, setMessagingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (editingPost) {
      setText(editingPost.shareText ?? "");
    }
  }, [editingPost]);

  const existingPosts = useMemo(() => {
    if (!book) return [];
    return getByBookId(book.id);
  }, [book, getByBookId]);

  const handleMessageUser = async ({
    userId,
    userName,
    userAvatar,
  }: {
    userId: string;
    userName: string;
    userAvatar?: string;
  }) => {
    if (!authUser?.id) {
      Alert.alert("Hata", "Önce giriş yapmalısın.");
      return;
    }

    if (!userId) {
      Alert.alert("Hata", "Geçersiz kullanıcı.");
      return;
    }

    if (userId === authUser.id) {
      Alert.alert("Bilgi", "Kendi paylaşımına mesaj gönderemezsin.");
      return;
    }

    try {
      setMessagingUserId(userId);

      const conversationId = await getOrCreateConversationByParticipant({
        id: userId,
        name: userName || "Kullanıcı",
        avatar: userAvatar,
      });

      if (!conversationId) {
        Alert.alert("Hata", "Sohbet oluşturulamadı.");
        return;
      }

      await fetchConversationById(conversationId);

      const prefillText = book
        ? `"${book.title}" kitabı hakkında paylaştığını gördüm. `
        : "Paylaşımını gördüm. ";

      router.push({
        pathname: "/chat/[id]",
        params: {
          id: String(conversationId),
          prefill: prefillText,
        },
      });
    } catch (error: any) {
      console.log("MESSAGE USER FROM SHARE ERROR:", error);
      Alert.alert(
        "Hata",
        error?.message || "Sohbet açılırken bir sorun oluştu.",
      );
    } finally {
      setMessagingUserId(null);
    }
  };

  async function handleSubmit() {
    Keyboard.dismiss();

    if (isSubmitting) return;

    const trimmed = text.trim();

    if (!trimmed) {
      Alert.alert("Eksik bilgi", "Lütfen paylaşım metni yaz.");
      return;
    }

    if (trimmed.length > 700) {
      Alert.alert("Çok uzun", "Paylaşım metni en fazla 700 karakter olabilir.");
      return;
    }

    if (!authUser?.id) {
      Alert.alert(
        "Oturum hatası",
        "Paylaşım yapabilmek için tekrar giriş yap.",
      );
      return;
    }

    if (!book) {
      Alert.alert("Hata", "Kitap bilgisi bulunamadı.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingPost) {
        await updatePost(editingPost.id, {
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
      const createdPostId = await addPost({
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookThumbnail: book.thumbnail,
        userId: authUser.id,
        userName: appUser.name || authUser.email || "ReadSphere Kullanıcısı",
        userAvatar: appUser.avatar,
        shareText: trimmed,
        sourceType: "book-share",
      });
      if (!createdPostId) {
        Alert.alert("Hata", "Paylaşım oluşturulamadı.");
        return;
      }

      setText("");

      Alert.alert("Paylaşıldı", "Paylaşımın topluluk akışına eklendi.", [
        {
          text: "Tamam",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.log("SHARE SUBMIT ERROR:", error);
      Alert.alert(
        "Hata",
        error?.message || "Paylaşım sırasında bir sorun oluştu.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
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
          {book.thumbnail ? (
            <Image
              source={{ uri: book.thumbnail }}
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
            {book.title}
          </Text>

          <Text style={{ color: COLORS.muted }} numberOfLines={1}>
            {book.author}
          </Text>

          <Text style={{ color: COLORS.muted, fontSize: 12 }}>
            {editingPost
              ? "Paylaşımını düzenliyorsun"
              : "Bu kitap hakkında düşüncelerini paylaş"}
          </Text>
        </View>
      </View>

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
          onChangeText={(value) => {
            if (value.length <= 700) {
              setText(value);
            }
          }}
          placeholder="Bu kitap hakkında ne düşünüyorsun?"
          placeholderTextColor="#9a9389"
          multiline
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={() => Keyboard.dismiss()}
          style={{
            minHeight: 160,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 16,
            padding: 14,
            backgroundColor: COLORS.graySoft,
            color: COLORS.text,
            textAlignVertical: "top",
            lineHeight: 22,
          }}
        />

        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
          {text.trim().length}/700 karakter
        </Text>
      </View>

      <SoftButton
        label={
          isSubmitting
            ? editingPost
              ? "Güncelleniyor..."
              : "Paylaşılıyor..."
            : editingPost
              ? "Güncelle"
              : "Paylaş"
        }
        icon={editingPost ? "create-outline" : "share-social-outline"}
        onPress={handleSubmit}
        variant="primary"
        disabled={isSubmitting}
      />

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
            existingPosts.map((post) => {
              const canMessage =
                !!authUser?.id && !!post.userId && post.userId !== authUser.id;
              const isMessaging = messagingUserId === post.userId;

              return (
                <View
                  key={post.id}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: COLORS.graySoft,
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <Text style={{ fontWeight: "800", color: COLORS.text }}>
                      {post.userName}
                    </Text>

                    {canMessage ? (
                      <Pressable
                        disabled={isMessaging}
                        onPress={() =>
                          handleMessageUser({
                            userId: post.userId,
                            userName: post.userName,
                            userAvatar: post.userAvatar,
                          })
                        }
                        style={({ pressed }) => ({
                          opacity: isMessaging ? 0.7 : pressed ? 0.85 : 1,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                          backgroundColor: COLORS.card,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        })}
                      >
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={14}
                          color={COLORS.text}
                        />
                        <Text
                          style={{
                            color: COLORS.text,
                            fontWeight: "800",
                            fontSize: 12,
                          }}
                        >
                          {isMessaging ? "Açılıyor..." : "Mesaj Gönder"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <Text style={{ color: COLORS.muted, lineHeight: 20 }}>
                    {post.shareText}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      )}

      <SoftButton
        label="Geri"
        icon="arrow-back-outline"
        onPress={() => router.back()}
        disabled={isSubmitting || !!messagingUserId}
      />
    </ScrollView>
  );
}
