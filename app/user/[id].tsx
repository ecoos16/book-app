// app/user/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { usePosts } from "../../context/PostsContext";
import { supabase } from "../../lib/supabase";

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

type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorite_book: string | null;
  favorite_genres: string[] | null;
  favorite_authors: string[] | null;
  reader_type: string | string[] | null;
  reading_mood: string | string[] | null;
  book_value: string | string[] | null;
  yearly_goal: number | null;
};

type BookRow = {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  thumbnail: string | null;
  status: "reading" | "read" | "want";
  pages_read: number | null;
  page_count: number | null;
  rating: number | null;
};

function getInitials(name?: string) {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatProfileField(value: string | string[] | null | undefined) {
  if (!value) return "";

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  return value.trim();
}

function BookMiniCard({ book }: { book: BookRow }) {
  const pagesRead = book.pages_read ?? 0;
  const pageCount = book.page_count ?? 0;
  const progress =
    pageCount > 0
      ? Math.min(100, Math.round((pagesRead / pageCount) * 100))
      : 0;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/book/[id]",
          params: { id: book.id },
        })
      }
      style={({ pressed }) => ({
        flexDirection: "row",
        gap: 12,
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: pressed ? "#f6f1ea" : COLORS.graySoft,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {book.thumbnail ? (
        <Image
          source={{ uri: book.thumbnail }}
          style={{
            width: 54,
            height: 78,
            borderRadius: 10,
            backgroundColor: COLORS.primarySoft,
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 54,
            height: 78,
            borderRadius: 10,
            backgroundColor: COLORS.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="book-outline" size={24} color={COLORS.primary} />
        </View>
      )}

      <View style={{ flex: 1, gap: 6 }}>
        <Text
          numberOfLines={2}
          style={{
            color: COLORS.text,
            fontWeight: "900",
            fontSize: 15,
            lineHeight: 20,
          }}
        >
          {book.title}
        </Text>

        {!!book.author && (
          <Text numberOfLines={1} style={{ color: COLORS.muted, fontSize: 13 }}>
            {book.author}
          </Text>
        )}

        {book.status === "reading" && pageCount > 0 && (
          <View style={{ gap: 5 }}>
            <View
              style={{
                height: 7,
                borderRadius: 999,
                backgroundColor: "#e6ded3",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  borderRadius: 999,
                  backgroundColor: COLORS.primary,
                }}
              />
            </View>

            <Text style={{ color: COLORS.muted, fontSize: 12 }}>
              {pagesRead}/{pageCount} sayfa · %{progress}
            </Text>
          </View>
        )}

        {book.status === "read" && !!book.rating && (
          <Text
            style={{ color: COLORS.primary, fontWeight: "800", fontSize: 12 }}
          >
            {"⭐".repeat(book.rating)} {book.rating}/5
          </Text>
        )}

        {book.status === "want" && (
          <Text style={{ color: COLORS.muted, fontSize: 12 }}>
            Okuma listesinde
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
    </Pressable>
  );
}
function BookSection({
  title,
  icon,
  books,
}: {
  title: string;
  icon: string;
  books: BookRow[];
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontWeight: "900", color: COLORS.primary }}>
        {icon} {title} ({books.length})
      </Text>

      {books.length === 0 ? (
        <Text style={{ color: COLORS.muted, fontSize: 13 }}>
          Bu kategoride kitap yok.
        </Text>
      ) : (
        books.map((book) => <BookMiniCard key={book.id} book={book} />)
      )}
    </View>
  );
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: authUser } = useAuth();
  const { posts } = usePosts();
  const { getOrCreateConversationByParticipant, fetchConversationById } =
    useChat();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingChat, setOpeningChat] = useState(false);

  const userId = String(id ?? "");
  const isMe = authUser?.id === userId;

  useEffect(() => {
    let mounted = true;

    async function fetchProfileAndBooks() {
      if (!userId) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("profiles")
          .select(
            `
            id,
            email,
            username,
            full_name,
            first_name,
            last_name,
            avatar_url,
            bio,
            favorite_book,
            favorite_genres,
            favorite_authors,
            reader_type,
            reading_mood,
            book_value,
            yearly_goal
          `,
          )
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.log("USER PROFILE FETCH ERROR:", error);
        }

        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select(
            "id, user_id, title, author, thumbnail, status, pages_read, page_count, rating",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (booksError) {
          console.log("USER BOOKS FETCH ERROR:", booksError);
        }

        if (mounted) {
          setProfile(data as ProfileRow | null);
          setBooks((booksData ?? []) as BookRow[]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProfileAndBooks();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const displayName = useMemo(() => {
    if (!profile) return "Kullanıcı";
    return (
      profile.full_name?.trim() ||
      `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
      profile.username ||
      profile.email ||
      "Kullanıcı"
    );
  }, [profile]);

  const readingBooks = useMemo(
    () => books.filter((book) => book.status === "reading"),
    [books],
  );

  const readBooks = useMemo(
    () => books.filter((book) => book.status === "read"),
    [books],
  );

  const wantBooks = useMemo(
    () => books.filter((book) => book.status === "want"),
    [books],
  );

  const userPosts = useMemo(() => {
    return posts
      .filter((post) => post.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, userId]);

  async function handleMessage() {
    if (!profile || isMe) return;

    try {
      setOpeningChat(true);

      const conversationId = await getOrCreateConversationByParticipant({
        id: profile.id,
        name: displayName,
        avatar: profile.avatar_url ?? undefined,
      });

      await fetchConversationById(conversationId);

      router.push({
        pathname: "/chat/[id]",
        params: {
          id: String(conversationId),
        },
      });
    } catch (error) {
      console.log("USER PROFILE MESSAGE ERROR:", error);
    } finally {
      setOpeningChat(false);
    }
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 18 }}
      >
        <View
          style={{
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 24,
            padding: 24,
            alignItems: "center",
            gap: 12,
          }}
        >
          <Ionicons name="person-outline" size={34} color={COLORS.primary} />
          <Text style={{ fontSize: 20, fontWeight: "900", color: COLORS.text }}>
            Kullanıcı bulunamadı
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 18,
              borderRadius: 999,
              backgroundColor: COLORS.graySoft,
            }}
          >
            <Text style={{ color: COLORS.text, fontWeight: "900" }}>Geri</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

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
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </Pressable>

        <Text style={{ fontSize: 26, fontWeight: "900", color: COLORS.text }}>
          Profil
        </Text>
      </View>

      <View
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 28,
          padding: 18,
          gap: 14,
        }}
      >
        <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
          <View
            style={{
              width: 82,
              height: 82,
              borderRadius: 41,
              backgroundColor: COLORS.primarySoft,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {profile.avatar_url?.trim() ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: 82, height: 82, borderRadius: 41 }}
                resizeMode="cover"
              />
            ) : (
              <Text
                style={{
                  color: COLORS.primary,
                  fontWeight: "900",
                  fontSize: 22,
                }}
              >
                {getInitials(displayName)}
              </Text>
            )}
          </View>

          <View style={{ flex: 1, gap: 5 }}>
            <Text
              style={{ fontSize: 22, fontWeight: "900", color: COLORS.text }}
            >
              {displayName}
            </Text>

            {!!profile.username && (
              <Text style={{ color: COLORS.primary, fontWeight: "800" }}>
                @{profile.username}
              </Text>
            )}

            {!!profile.bio && (
              <Text style={{ color: COLORS.muted, lineHeight: 20 }}>
                {profile.bio}
              </Text>
            )}
          </View>
        </View>

        {!isMe && (
          <Pressable
            onPress={handleMessage}
            disabled={openingChat}
            style={({ pressed }) => ({
              backgroundColor: pressed ? COLORS.primaryDark : COLORS.primary,
              paddingVertical: 14,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: openingChat ? 0.7 : 1,
            })}
          >
            <Ionicons name="mail-outline" size={18} color={COLORS.whiteSoft} />
            <Text style={{ color: COLORS.whiteSoft, fontWeight: "900" }}>
              {openingChat ? "Açılıyor..." : "Mesaj Gönder"}
            </Text>
          </Pressable>
        )}

        {isMe && (
          <Pressable
            onPress={() => router.push("/edit-profile")}
            style={{
              backgroundColor: COLORS.graySoft,
              paddingVertical: 14,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
            }}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.text} />
            <Text style={{ color: COLORS.text, fontWeight: "900" }}>
              Profili Düzenle
            </Text>
          </Pressable>
        )}
      </View>

      <View
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 24,
          padding: 16,
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.text }}>
          Okur Bilgileri
        </Text>

        {!!formatProfileField(profile.reader_type) && (
          <Text style={{ color: COLORS.text }}>
            📚 {formatProfileField(profile.reader_type)}
          </Text>
        )}

        {!!formatProfileField(profile.reading_mood) && (
          <Text style={{ color: COLORS.text }}>
            ✨ {formatProfileField(profile.reading_mood)}
          </Text>
        )}

        {!!formatProfileField(profile.book_value) && (
          <Text style={{ color: COLORS.text }}>
            💭 {formatProfileField(profile.book_value)}
          </Text>
        )}

        {!!profile.favorite_book && (
          <Text style={{ color: COLORS.text }}>
            ⭐ Favori kitap: {profile.favorite_book}
          </Text>
        )}

        {!!profile.yearly_goal && (
          <Text style={{ color: COLORS.text }}>
            🎯 Yıllık hedef: {profile.yearly_goal} kitap
          </Text>
        )}
      </View>

      <View
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 24,
          padding: 16,
          gap: 16,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.text }}>
          Kitapları
        </Text>

        <BookSection title="Okuyor" icon="📖" books={readingBooks} />
        <BookSection title="Okudu" icon="✅" books={readBooks} />
        <BookSection title="İstiyor" icon="⭐" books={wantBooks} />
      </View>

      <View
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 24,
          padding: 16,
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.text }}>
          Paylaşımları
        </Text>

        {userPosts.length === 0 ? (
          <Text style={{ color: COLORS.muted }}>
            Bu kullanıcı henüz paylaşım yapmamış.
          </Text>
        ) : (
          userPosts.map((post) => (
            <Pressable
              key={post.id}
              onPress={() =>
                router.push({
                  pathname: "/post-comments/[id]",
                  params: { id: post.id },
                })
              }
              style={({ pressed }) => ({
                padding: 14,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: pressed ? "#f6f1ea" : COLORS.graySoft,
                gap: 6,
              })}
            >
              <Text
                style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}
              >
                {post.bookTitle || "Kitap"}
              </Text>

              {!!post.shareText && (
                <Text numberOfLines={2} style={{ color: COLORS.text }}>
                  {post.shareText}
                </Text>
              )}

              <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                ❤️ {post.likes ?? 0} · 💬 {post.comments?.length ?? 0}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}
