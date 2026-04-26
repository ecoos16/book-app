// app/book-community/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import { usePosts } from "../../context/PostsContext";

const COLORS = {
  bg: "#fbf9f5",
  card: "#fffdf9",
  border: "#ece7df",
  text: "#2f2a24",
  muted: "#7a7268",
  primary: "#7d5739",
  primarySoft: "#f3e2d2",
  graySoft: "#f3efe8",
};

export default function BookCommunityScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    author?: string;
    thumbnail?: string;
    googleId?: string;
  }>();

  const { posts } = usePosts();

  const bookId = String(params.id ?? "");
  const title = String(params.title ?? "Kitap Topluluğu");
  const author = String(params.author ?? "Yazar bilinmiyor");
  const thumbnail = String(params.thumbnail ?? "");

  const communityPosts = useMemo(() => {
    return posts
      .filter((post) => {
        const sameBookId = post.bookId === bookId;
        const sameTitle =
          post.bookTitle?.trim().toLowerCase() === title.trim().toLowerCase();

        return sameBookId || sameTitle;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, bookId, title]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 120 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </Pressable>

        <Text style={{ fontSize: 26, fontWeight: "900", color: COLORS.text }}>
          Kitap Topluluğu
        </Text>
      </View>

      <View
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 24,
          padding: 16,
          flexDirection: "row",
          gap: 14,
        }}
      >
        <View
          style={{
            width: 76,
            height: 108,
            borderRadius: 14,
            overflow: "hidden",
            backgroundColor: COLORS.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              style={{ width: 76, height: 108 }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="book-outline" size={28} color={COLORS.primary} />
          )}
        </View>

        <View style={{ flex: 1, justifyContent: "center", gap: 6 }}>
          <Text style={{ fontSize: 21, fontWeight: "900", color: COLORS.text }}>
            {title}
          </Text>
          <Text style={{ color: COLORS.muted, fontWeight: "700" }}>
            {author}
          </Text>
          <Text style={{ color: COLORS.primary, fontWeight: "800" }}>
            {communityPosts.length} tartışma
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/share/[id]",
            params: { id: bookId },
          })
        }
        style={{
          backgroundColor: COLORS.primary,
          paddingVertical: 15,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
        }}
      >
        <Ionicons name="create-outline" size={18} color="#fff7f4" />
        <Text style={{ color: "#fff7f4", fontWeight: "900" }}>
          Bu Kitap Hakkında Yaz
        </Text>
      </Pressable>

      {communityPosts.length === 0 ? (
        <View
          style={{
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 22,
            padding: 24,
            alignItems: "center",
            gap: 10,
          }}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={30}
            color={COLORS.primary}
          />
          <Text style={{ fontWeight: "900", fontSize: 18, color: COLORS.text }}>
            Henüz tartışma yok
          </Text>
          <Text style={{ color: COLORS.muted, textAlign: "center" }}>
            Bu kitabın ilk tartışmasını sen başlat.
          </Text>
        </View>
      ) : (
        communityPosts.map((post) => (
          <Pressable
            key={post.id}
            onPress={() =>
              router.push({
                pathname: "/post-comments/[id]",
                params: { id: post.id },
              })
            }
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#f6f1ea" : COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 22,
              padding: 16,
              gap: 8,
            })}
          >
            <Text
              style={{ color: COLORS.primary, fontWeight: "900", fontSize: 12 }}
            >
              Kitap yorumu
            </Text>

            <Text style={{ color: COLORS.muted, fontSize: 12 }}>
              {post.userName}
            </Text>
            <Text style={{ color: COLORS.text, lineHeight: 22 }}>
              {post.shareText || "Paylaşım metni yok"}
            </Text>

            <Text style={{ color: COLORS.muted, fontSize: 13 }}>
              ❤️ {post.likes ?? 0} · 💬 {post.comments?.length ?? 0}
            </Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
