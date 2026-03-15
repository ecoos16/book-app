import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { usePosts } from "../../context/PostsContext";
import { CURRENT_USER } from "../../data/mockUsers";
import { buttonStyle, pillButtonStyle } from "../../utils/pressableStyles";

/**
 * Tarihi Türkçe formatta göstermek için yardımcı fonksiyon
 */
function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PostCommentsScreen() {
  /**
   * Route parametresinden post id al
   */
  const { id } = useLocalSearchParams<{ id: string }>();

  /**
   * Post işlemleri
   */
  const { getById, addComment, removeComment, removePost } = usePosts();

  /**
   * İlgili paylaşımı bul
   */
  const post = id ? getById(id) : undefined;

  /**
   * Yeni yorum input state
   */
  const [text, setText] = useState("");

  /**
   * Post silme onayı
   */
  const [confirmDeletePost, setConfirmDeletePost] = useState(false);

  /**
   * Post yoksa boş durum ekranı
   */
  if (!post) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 18,
            paddingVertical: 30,
            paddingHorizontal: 20,
            backgroundColor: "#fff",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 40 }}>💬</Text>

          <Text
            style={{
              marginTop: 10,
              fontSize: 18,
              fontWeight: "800",
              color: "#222",
            }}
          >
            Paylaşım bulunamadı
          </Text>

          <Text
            style={{
              marginTop: 6,
              color: "#666",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Bu paylaşım silinmiş olabilir veya geçersiz bir bağlantı açılmış
            olabilir.
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={buttonStyle("secondary", { marginTop: 16, minWidth: 120 })}
          >
            <Text style={{ fontWeight: "800" }}>Geri</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  /**
   * Bu noktadan sonra post kesin var
   */
  const safePost = post;
  const isMine = safePost.userId === CURRENT_USER.id;

  /**
   * Yorumları tarihe göre sırala
   */
  const sortedComments = useMemo(() => {
    return [...safePost.comments].sort((a, b) => a.createdAt - b.createdAt);
  }, [safePost.comments]);

  /**
   * Yeni yorum ekle
   */
  function handleAddComment() {
    const trimmed = text.trim();

    if (!trimmed) return;

    addComment({
      postId: safePost.id,
      text: trimmed,
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      userAvatar: CURRENT_USER.avatar,
    });

    setText("");
  }

  /**
   * Yorumu sil
   */
  function handleDeleteComment(commentId: string) {
    removeComment(safePost.id, commentId);
  }

  /**
   * Post sil
   */
  function handleDeletePost() {
    removePost(safePost.id);
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      {/* ================= PAYLAŞIM KARTI ================= */}
      <View
        style={{
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View
            style={{
              width: 56,
              height: 80,
              borderRadius: 10,
              overflow: "hidden",
              backgroundColor: "#f3f3f3",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {safePost.bookThumbnail ? (
              <Image
                source={{ uri: safePost.bookThumbnail }}
                style={{ width: 56, height: 80 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ fontSize: 22 }}>📚</Text>
            )}
          </View>

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontWeight: "900", fontSize: 16 }} numberOfLines={2}>
              {safePost.bookTitle}
            </Text>

            <Text style={{ color: "#666" }} numberOfLines={1}>
              {safePost.bookAuthor}
            </Text>

            <Text style={{ color: "#444", fontWeight: "800" }}>
              {safePost.userName}
            </Text>
          </View>
        </View>

        <Text style={{ color: "#555", lineHeight: 20 }}>
          {safePost.shareText}
        </Text>

        {/* Post aksiyonları */}
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#ddd",
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontWeight: "900" }}>
              💬 {safePost.comments.length}
            </Text>
          </View>

          {isMine && (
            <>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/share/[id]" as const,
                    params: {
                      id: safePost.bookId,
                      postId: safePost.id,
                    },
                  })
                }
                style={pillButtonStyle("secondary")}
              >
                <Text style={{ fontWeight: "800", color: "#333" }}>
                  Düzenle
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setConfirmDeletePost((prev) => !prev)}
                style={pillButtonStyle("danger")}
              >
                <Text style={{ fontWeight: "800", color: "#c00" }}>Sil</Text>
              </Pressable>
            </>
          )}
        </View>

        {isMine && confirmDeletePost && (
          <View
            style={{
              marginTop: 6,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#ffd6d6",
              backgroundColor: "#fff7f7",
              gap: 10,
            }}
          >
            <Text style={{ color: "#8b0000", fontWeight: "800" }}>
              Bu paylaşım silinsin mi?
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setConfirmDeletePost(false)}
                style={buttonStyle("secondary", { flex: 1 })}
              >
                <Text style={{ fontWeight: "800", color: "#333" }}>Vazgeç</Text>
              </Pressable>

              <Pressable
                onPress={handleDeletePost}
                style={buttonStyle("primary", { flex: 1 })}
              >
                <Text style={{ fontWeight: "800", color: "#fff" }}>
                  Evet, Sil
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* ================= YORUM EKLE ================= */}
      <View
        style={{
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
          gap: 10,
        }}
      >
        <Text style={{ fontWeight: "800", color: "#222" }}>Yorum Ekle</Text>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Bu paylaşım hakkında bir şey yaz..."
          multiline
          textAlignVertical="top"
          style={{
            minHeight: 110,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#fff",
          }}
        />

        <Pressable onPress={handleAddComment} style={buttonStyle("primary")}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>Yorum Yap</Text>
        </Pressable>
      </View>

      {/* ================= YORUMLAR ================= */}
      <View
        style={{
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
          gap: 10,
        }}
      >
        <Text style={{ fontWeight: "800", color: "#222" }}>
          Yorumlar ({safePost.comments.length})
        </Text>

        {sortedComments.length === 0 ? (
          <Text style={{ color: "#666" }}>Henüz yorum yok.</Text>
        ) : (
          sortedComments.map((comment) => (
            <View
              key={comment.id}
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: "#fafafa",
                gap: 6,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
                  <Image
                    source={{
                      uri:
                        comment.userAvatar ??
                        "https://ui-avatars.com/api/?name=User",
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#f1f1f1",
                    }}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "800", color: "#222" }}>
                      {comment.userName}
                    </Text>

                    <Text style={{ color: "#888", fontSize: 12 }}>
                      {formatDate(comment.createdAt)}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => handleDeleteComment(comment.id)}
                  style={pillButtonStyle("danger")}
                >
                  <Text style={{ color: "#c00", fontWeight: "800" }}>Sil</Text>
                </Pressable>
              </View>

              <Text style={{ color: "#555", lineHeight: 20 }}>
                {comment.text}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* ================= GERİ ================= */}
      <Pressable onPress={() => router.back()} style={buttonStyle("secondary")}>
        <Text style={{ fontWeight: "900" }}>Geri</Text>
      </Pressable>
    </ScrollView>
  );
}
