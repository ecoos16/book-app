// app/post-comments/[id].tsx

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
import { supabase } from "../../lib/supabase";
import type { BookComment } from "../../types/book";

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

type MentionUser = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
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
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getMentionName(user: MentionUser) {
  return user.username?.trim() || user.full_name?.trim() || "kullanici";
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
        style={{ color: resolvedTextColor, fontWeight: "900", fontSize: 14 }}
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
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [showMention, setShowMention] = useState(false);
  const [confirmDeletePost, setConfirmDeletePost] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [busyLike, setBusyLike] = useState(false);
  const [busyDeletePost, setBusyDeletePost] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const [replyTo, setReplyTo] = useState<BookComment | null>(null);

  const sortedComments = useMemo(() => {
    return [...(post?.comments ?? [])].sort(
      (a, b) => a.createdAt - b.createdAt,
    );
  }, [post?.comments]);

  async function handleChangeText(value: string) {
    setText(value);

    const mentionMatch = value.match(/@([A-Za-z0-9_ğüşöçıİĞÜŞÖÇ]*)$/);

    if (!mentionMatch) {
      setShowMention(false);
      setMentionUsers([]);
      return;
    }

    const query = mentionMatch[1] ?? "";

    setShowMention(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(6);

    if (error) {
      console.log("MENTION USER SEARCH ERROR:", error);
      setMentionUsers([]);
      return;
    }

    setMentionUsers((data ?? []) as MentionUser[]);
  }

  function handleSelectMention(user: MentionUser) {
    const mentionName = getMentionName(user).replace(/\s+/g, "");
    const nextText = text.replace(
      /@([A-Za-z0-9_ğüşöçıİĞÜŞÖÇ]*)$/,
      `@${mentionName} `,
    );

    setText(nextText);
    setShowMention(false);
    setMentionUsers([]);
  }

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

    if (!post) return;

    try {
      setSubmittingComment(true);

      await addComment(post.id, trimmed, {
        parentId: replyTo?.id,
        replyToUserName: replyTo?.userName,
      });

      setText("");
      setReplyTo(null);
      setShowMention(false);
      setMentionUsers([]);
    } catch (error) {
      console.log("ADD COMMENT SCREEN ERROR:", error);
      Alert.alert("Hata", "Yorum eklenirken bir sorun oluştu.");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!post) return;

    try {
      setDeletingCommentId(commentId);
      await removeComment(post.id, commentId);
    } catch (error) {
      console.log("REMOVE COMMENT SCREEN ERROR:", error);
    } finally {
      setDeletingCommentId(null);
    }
  }

  async function handleDeletePost() {
    if (!post) return;

    try {
      setBusyDeletePost(true);
      await removePost(post.id);
      router.back();
    } catch (error) {
      console.log("REMOVE POST SCREEN ERROR:", error);
      Alert.alert("Hata", "Blog silinirken bir sorun oluştu.");
    } finally {
      setBusyDeletePost(false);
    }
  }

  async function handleToggleLike() {
    if (!post) return;

    try {
      setBusyLike(true);
      await toggleLike(post.id);
    } catch (error) {
      console.log("TOGGLE LIKE SCREEN ERROR:", error);
      Alert.alert("Hata", "Beğeni işlemi sırasında bir sorun oluştu.");
    } finally {
      setBusyLike(false);
    }
  }

  async function handleMessagePostOwner() {
    if (!post) return;

    if (!currentUserId) {
      Alert.alert("Hata", "Mesaj göndermek için giriş yapmalısın.");
      return;
    }

    if (post.userId === currentUserId) return;

    try {
      const conversationId = await getOrCreateConversationByParticipant({
        id: post.userId,
        name: post.userName,
        avatar: post.userAvatar,
      });

      const prefillText = `${
        post.bookTitle || "Bu kitap"
      } hakkındaki blog yazını gördüm, yorumun ilgimi çekti.`;

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

  function openUserProfile(userId?: string) {
    if (!userId) return;

    if (userId === currentUserId) {
      router.push("/profile");
      return;
    }

    router.push({
      pathname: "/user/[id]",
      params: { id: String(userId) },
    });
  }

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
            Kitap blogu bulunamadı
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

  const isMine = post.userId === currentUserId;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: COLORS.text }}>
          {post.bookTitle || "Kitap Blogu"}
        </Text>

        <Text style={{ color: COLORS.muted }}>
          Kitap blogu · {sortedComments.length} yorum
        </Text>
      </View>

      <View
        style={{
          padding: 16,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
          gap: 14,
        }}
      >
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          {post.bookThumbnail ? (
            <Image
              source={{ uri: post.bookThumbnail }}
              style={{
                width: 58,
                height: 82,
                borderRadius: 12,
                backgroundColor: COLORS.primarySoft,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 58,
                height: 82,
                borderRadius: 12,
                backgroundColor: COLORS.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="book-outline" size={25} color={COLORS.primary} />
            </View>
          )}

          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{ fontWeight: "900", fontSize: 19, color: COLORS.text }}
            >
              {post.bookTitle || "Kitap Tartışması"}
            </Text>

            <Text
              style={{ color: COLORS.muted, fontSize: 13, fontWeight: "700" }}
            >
              {post.bookAuthor || "Yazar bilinmiyor"}
            </Text>

            <Text style={{ color: COLORS.muted, fontSize: 12 }}>
              {formatDate(post.createdAt)}
            </Text>
          </View>
        </View>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingTop: 12,
            gap: 6,
          }}
        >
          <Pressable onPress={() => openUserProfile(post.userId)}>
            <Text
              style={{ color: COLORS.primary, fontSize: 13, fontWeight: "900" }}
            >
              {post.userName}
            </Text>
          </Pressable>

          <Text style={{ color: COLORS.text, lineHeight: 22, fontSize: 15 }}>
            {post.shareText || "Bu kitap hakkında henüz yorum yok."}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <SoftButton
            label={String(post.likes ?? 0)}
            icon={post.isLiked ? "heart" : "heart-outline"}
            iconColor={post.isLiked ? "red" : COLORS.text}
            textColor={COLORS.text}
            onPress={handleToggleLike}
            disabled={busyLike}
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
              label="Blogu Sil"
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
            <Text style={{ color: COLORS.dangerText, fontWeight: "800" }}>
              Bu kitap blogu silinsin mi?
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
        <Text style={{ fontWeight: "900", fontSize: 17, color: COLORS.text }}>
          Yorum Ekle
        </Text>

        {replyTo && (
          <View
            style={{
              padding: 10,
              borderRadius: 14,
              backgroundColor: COLORS.primarySoft,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <Text style={{ color: COLORS.primary, fontWeight: "800", flex: 1 }}>
              @{replyTo.userName || "Kullanıcı"} kullanıcısına yanıt veriliyor
            </Text>

            <Pressable onPress={() => setReplyTo(null)}>
              <Ionicons name="close" size={18} color={COLORS.primary} />
            </Pressable>
          </View>
        )}

        <TextInput
          value={text}
          onChangeText={handleChangeText}
          placeholder={
            replyTo
              ? `@${replyTo.userName || "Kullanıcı"} için yanıt yaz...`
              : "Bu kitap hakkında düşünceni yaz... @kullanıcı"
          }
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

        {showMention && mentionUsers.length > 0 && (
          <View
            style={{
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 16,
              padding: 8,
              backgroundColor: COLORS.card,
              gap: 6,
            }}
          >
            {mentionUsers.map((user) => {
              const name = getMentionName(user);

              return (
                <Pressable
                  key={user.id}
                  onPress={() => handleSelectMention(user)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 10,
                    borderRadius: 14,
                    backgroundColor: pressed ? "#f5efe7" : COLORS.graySoft,
                  })}
                >
                  {user.avatar_url ? (
                    <Image
                      source={{ uri: user.avatar_url }}
                      style={{ width: 34, height: 34, borderRadius: 17 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: COLORS.primarySoft,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{ color: COLORS.primary, fontWeight: "900" }}
                      >
                        {getInitials(name)}
                      </Text>
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.text, fontWeight: "900" }}>
                      @{name}
                    </Text>

                    {!!user.full_name && (
                      <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                        {user.full_name}
                      </Text>
                    )}
                  </View>

                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

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
          <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.text }}>
            Henüz yorum yok
          </Text>
          <Text style={{ color: COLORS.muted, textAlign: "center" }}>
            Bu kitap bloguna ilk yorumu sen yap.
          </Text>
        </View>
      ) : (
        sortedComments.map((comment) => {
          const commentIsMine = comment.userId === currentUserId;
          const isDeletingThisComment = deletingCommentId === comment.id;

          return (
            <View
              key={comment.id}
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
                <View style={{ flex: 1 }}>
                  <Pressable onPress={() => openUserProfile(comment.userId)}>
                    <Text style={{ fontWeight: "900", color: COLORS.text }}>
                      {comment.userName || currentUserName}
                    </Text>
                  </Pressable>

                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                    {formatDate(comment.createdAt)}
                  </Text>
                </View>

                {commentIsMine && (
                  <Pressable onPress={() => handleDeleteComment(comment.id)}>
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={COLORS.dangerText}
                    />
                  </Pressable>
                )}
              </View>

              <Text style={{ color: COLORS.text, lineHeight: 21 }}>
                {comment.replyToUserName ? (
                  <Text style={{ color: COLORS.primary, fontWeight: "900" }}>
                    @{comment.replyToUserName}{" "}
                  </Text>
                ) : null}
                {comment.text}
              </Text>

              <Pressable onPress={() => setReplyTo(comment as BookComment)}>
                <Text
                  style={{
                    color: COLORS.primary,
                    fontWeight: "900",
                    fontSize: 13,
                  }}
                >
                  Yanıtla
                </Text>
              </Pressable>
            </View>
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
