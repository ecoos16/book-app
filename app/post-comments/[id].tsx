//app/post-comments/[id].tsx
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

import { useAuth } from "../../context/AuthContext";
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
  dangerSoft: "#fff4f4",
  dangerBorder: "#ffd8d8",
  dangerText: "#a22b2b",
};

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name?: string) {
  if (!name?.trim()) return "U";

  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function SoftButton({
  label,
  icon,
  onPress,
  variant = "secondary",
  disabled = false,
  iconColor,
  textColor,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "secondary" | "primary" | "danger";
  disabled?: boolean;
  iconColor?: string;
  textColor?: string;
}) {
  const backgroundColor =
    variant === "primary"
      ? COLORS.primary
      : variant === "danger"
        ? COLORS.dangerSoft
        : COLORS.card;

  const borderColor =
    variant === "primary"
      ? COLORS.primary
      : variant === "danger"
        ? COLORS.dangerBorder
        : COLORS.border;

  const defaultTextColor =
    variant === "primary"
      ? COLORS.whiteSoft
      : variant === "danger"
        ? COLORS.dangerText
        : COLORS.text;

  const resolvedTextColor = textColor ?? defaultTextColor;
  const resolvedIconColor = iconColor ?? resolvedTextColor;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: disabled ? 0.6 : 1,
        paddingVertical: 12,
        paddingHorizontal: 14,
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
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {!!icon && <Ionicons name={icon} size={16} color={resolvedIconColor} />}
      <Text
        style={{
          color: resolvedTextColor,
          fontWeight: "900",
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function PostCommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { user: authUser } = useAuth();
  const { user: appUser } = useUser();

  const { getById, addComment, removeComment, removePost, toggleLike } =
    usePosts();
  const { getOrCreateConversationByParticipant } = useChat();

  const post = id ? getById(id) : undefined;

  const currentUserId = authUser?.id ?? "";
  const currentUserName =
    appUser?.name?.trim() || authUser?.email || "Kullanıcı";

  const [text, setText] = useState("");
  const [confirmDeletePost, setConfirmDeletePost] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [busyLike, setBusyLike] = useState(false);
  const [busyDeletePost, setBusyDeletePost] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );

  if (!post) {
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
          <Text
            style={{
              marginTop: 8,
              fontSize: 20,
              fontWeight: "900",
              color: COLORS.text,
            }}
          >
            Paylaşım bulunamadı
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

  const safePost = post;
  const isMine = safePost.userId === currentUserId;

  const sortedComments = useMemo(() => {
    return [...(safePost.comments ?? [])].sort(
      (a, b) => a.createdAt - b.createdAt,
    );
  }, [safePost.comments]);

  async function handleAddComment() {
    const trimmed = text.trim();

    if (!trimmed) {
      Alert.alert("Eksik bilgi", "Yorum yazmalısın.");
      return;
    }

    if (!currentUserId) {
      Alert.alert("Hata", "Yorum yapmak için giriş yapmalısın.");
      return;
    }

    try {
      setSubmittingComment(true);
      await addComment(safePost.id, trimmed);
      setText("");
    } catch (error) {
      console.log("ADD COMMENT SCREEN ERROR:", error);
      Alert.alert("Hata", "Yorum eklenirken bir sorun oluştu.");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      setDeletingCommentId(commentId);
      console.log("COMMENT DELETE BUTTON PRESSED:", commentId);

      await removeComment(safePost.id, commentId);
    } catch (error) {
      console.log("REMOVE COMMENT SCREEN ERROR:", error);
    } finally {
      setDeletingCommentId(null);
    }
  }

  async function handleDeletePost() {
    try {
      setBusyDeletePost(true);
      await removePost(safePost.id);
      router.back();
    } catch (error) {
      console.log("REMOVE POST SCREEN ERROR:", error);
      Alert.alert("Hata", "Paylaşım silinirken bir sorun oluştu.");
    } finally {
      setBusyDeletePost(false);
    }
  }

  async function handleToggleLike() {
    try {
      setBusyLike(true);
      await toggleLike(safePost.id);
    } catch (error) {
      console.log("TOGGLE LIKE SCREEN ERROR:", error);
      Alert.alert("Hata", "Beğeni işlemi sırasında bir sorun oluştu.");
    } finally {
      setBusyLike(false);
    }
  }

  async function handleMessagePostOwner() {
    if (!currentUserId) {
      Alert.alert("Hata", "Mesaj göndermek için giriş yapmalısın.");
      return;
    }

    if (safePost.userId === currentUserId) return;

    try {
      const conversationId = await getOrCreateConversationByParticipant({
        id: safePost.userId,
        name: safePost.userName,
        avatar: safePost.userAvatar,
      });

      const prefillText = `${
        safePost.bookTitle || "Paylaşımın"
      } hakkında yazdığını gördüm, yorumun ilgimi çekti.`;

      router.push({
        pathname: "/chat/[id]",
        params: {
          id: String(conversationId),
          prefill: prefillText,
        },
      });
    } catch (error) {
      console.log("POST COMMENT MESSAGE OWNER ERROR:", error);
      Alert.alert("Hata", "Sohbet açılırken bir sorun oluştu.");
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 4 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "900",
            color: COLORS.text,
          }}
        >
          Paylaşım Detayı
        </Text>

        <Text style={{ color: COLORS.muted }}>
          {sortedComments.length} yorum
        </Text>
      </View>

      <View
        style={{
          padding: 16,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            alignItems: "center",
          }}
        >
          {safePost.userAvatar ? (
            <Image
              source={{ uri: safePost.userAvatar }}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: COLORS.primarySoft,
              }}
            />
          ) : (
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: COLORS.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontWeight: "900", color: COLORS.primary }}>
                {getInitials(safePost.userName)}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontWeight: "900",
                fontSize: 15,
                color: COLORS.text,
              }}
            >
              {safePost.userName}
            </Text>

            <Text
              style={{
                color: COLORS.muted,
                fontSize: 12,
              }}
            >
              {formatDate(safePost.createdAt)}
            </Text>
          </View>
        </View>

        <Text style={{ color: COLORS.text, lineHeight: 22 }}>
          {safePost.shareText || "Paylaşım metni yok"}
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <SoftButton
            label={String(safePost.likes ?? 0)}
            icon={safePost.isLiked ? "heart" : "heart-outline"}
            iconColor={safePost.isLiked ? "red" : COLORS.text}
            textColor={COLORS.text}
            onPress={handleToggleLike}
          />

          <SoftButton
            label={`💬 ${sortedComments.length}`}
            onPress={() => {}}
          />

          {!isMine && (
            <SoftButton
              label="Mesaj"
              icon="mail-outline"
              onPress={handleMessagePostOwner}
            />
          )}

          {isMine && (
            <SoftButton
              label="Sil"
              icon="trash-outline"
              variant="danger"
              onPress={() => setConfirmDeletePost((prev) => !prev)}
              disabled={busyDeletePost}
            />
          )}
        </View>

        {isMine && confirmDeletePost && (
          <View
            style={{
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: COLORS.dangerBorder,
              backgroundColor: COLORS.dangerSoft,
              gap: 10,
            }}
          >
            <Text
              style={{
                color: COLORS.dangerText,
                fontWeight: "800",
              }}
            >
              Bu paylaşım silinsin mi?
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <SoftButton
                  label="Vazgeç"
                  onPress={() => setConfirmDeletePost(false)}
                />
              </View>

              <View style={{ flex: 1 }}>
                <SoftButton
                  label="Evet, Sil"
                  variant="primary"
                  onPress={handleDeletePost}
                  disabled={busyDeletePost}
                />
              </View>
            </View>
          </View>
        )}
      </View>

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
          placeholder="Bu paylaşım hakkında düşünceni yaz..."
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
          label={submittingComment ? "Ekleniyor..." : "Yorumu Ekle"}
          icon="add-outline"
          onPress={handleAddComment}
          variant="primary"
          disabled={submittingComment}
        />
      </View>

      {sortedComments.length === 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 22,
            paddingVertical: 30,
            paddingHorizontal: 22,
            backgroundColor: COLORS.card,
            alignItems: "center",
            gap: 10,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "900",
              color: COLORS.text,
            }}
          >
            Henüz yorum yok
          </Text>
        </View>
      ) : (
        sortedComments.map((comment) => {
          const commentIsMine = comment.userId === currentUserId;
          const isDeletingThisComment = deletingCommentId === comment.id;

          return (
            <Pressable
              key={comment.id}
              onLongPress={() =>
                commentIsMine ? handleDeleteComment(comment.id) : undefined
              }
              delayLongPress={250}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 18,
                padding: 14,
                backgroundColor: COLORS.card,
                gap: 8,
                opacity: isDeletingThisComment ? 0.6 : 1,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    flex: 1,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "900", color: COLORS.text }}>
                      {comment.userName || currentUserName}
                    </Text>

                    <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                      {formatDate(comment.createdAt)}
                    </Text>
                  </View>
                </View>

                {commentIsMine && (
                  <Pressable
                    onPress={() => {
                      Alert.alert("TEST", "Yorum sil butonuna basıldı");
                      handleDeleteComment(comment.id);
                    }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={COLORS.dangerText}
                    />
                  </Pressable>
                )}
              </View>

              <Text style={{ color: COLORS.text, lineHeight: 21 }}>
                {comment.text}
              </Text>
            </Pressable>
          );
        })
      )}

      <SoftButton
        label="Geri"
        icon="arrow-back-outline"
        onPress={() => router.back()}
      />
    </ScrollView>
  );
}
