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
import { buttonStyle } from "../../utils/pressableStyles";

export default function ShareBookScreen() {
  const { id, postId } = useLocalSearchParams<{
    id: string;
    postId?: string;
  }>();

  const { getById } = useBooks();
  const { addPost, getByBookId, getById: getPostById, updatePost } = usePosts();

  const book = id ? getById(id) : undefined;
  const editingPost = postId ? getPostById(postId) : undefined;

  const [text, setText] = useState("");

  useEffect(() => {
    if (editingPost) {
      setText(editingPost.shareText ?? "");
    }
  }, [editingPost]);

  if (!book) {
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
          <Text style={{ fontSize: 40 }}>📚</Text>

          <Text
            style={{
              marginTop: 10,
              fontSize: 18,
              fontWeight: "800",
              color: "#222",
            }}
          >
            Kitap bulunamadı
          </Text>

          <Text
            style={{
              marginTop: 6,
              color: "#666",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Bu kitap silinmiş olabilir veya geçersiz bir bağlantı açılmış
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

  const safeBook = book;

  const existingPosts = useMemo(() => {
    return getByBookId(safeBook.id);
  }, [safeBook.id, getByBookId]);

  function handleSubmit() {
    const trimmed = text.trim();

    if (!trimmed) {
      Alert.alert("Eksik bilgi", "Lütfen paylaşım metni yaz.");
      return;
    }

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
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 60,
            height: 88,
            borderRadius: 10,
            overflow: "hidden",
            backgroundColor: "#f3f3f3",
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
            <Text style={{ fontSize: 22 }}>📚</Text>
          )}
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontWeight: "900", fontSize: 16 }} numberOfLines={2}>
            {safeBook.title}
          </Text>

          <Text style={{ color: "#666" }} numberOfLines={1}>
            {safeBook.author}
          </Text>

          <Text style={{ color: "#888", fontSize: 12 }}>
            {editingPost
              ? "Paylaşımını düzenliyorsun"
              : "Bu kitap hakkında düşüncelerini paylaş"}
          </Text>
        </View>
      </View>

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
          {editingPost ? "Paylaşımı Düzenle" : "Paylaşım Metni"}
        </Text>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Bu kitap sende nasıl bir etki bıraktı?"
          multiline
          textAlignVertical="top"
          style={{
            minHeight: 140,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#fff",
          }}
        />
      </View>

      <Pressable onPress={handleSubmit} style={buttonStyle("primary")}>
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          {editingPost ? "Güncelle" : "Paylaş"}
        </Text>
      </Pressable>

      {!editingPost && (
        <View
          style={{
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#eee",
            backgroundColor: "#fff",
            gap: 8,
          }}
        >
          <Text style={{ fontWeight: "800", color: "#222" }}>
            Bu kitaba ait önceki paylaşımlar
          </Text>

          {existingPosts.length === 0 ? (
            <Text style={{ color: "#666" }}>Henüz paylaşım yok.</Text>
          ) : (
            existingPosts.map((post) => (
              <View
                key={post.id}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: "#fafafa",
                  gap: 4,
                }}
              >
                <Text style={{ fontWeight: "800", color: "#222" }}>
                  {post.userName}
                </Text>
                <Text style={{ color: "#555", lineHeight: 20 }}>
                  {post.shareText}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      <Pressable onPress={() => router.back()} style={buttonStyle("secondary")}>
        <Text style={{ fontWeight: "900" }}>Geri</Text>
      </Pressable>
    </ScrollView>
  );
}
