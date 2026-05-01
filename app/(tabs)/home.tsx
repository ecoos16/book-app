// app/(tabs)/home.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import BirthdayCelebration from "../../components/BirthdayCelebration";
import BookSearchPicker from "../../components/BookSearchPicker";
import { useAuth } from "../../context/AuthContext";
import { useBooks } from "../../context/BooksContext";
import { useChat } from "../../context/ChatContext";
import { usePosts } from "../../context/PostsContext";
import { useUser } from "../../context/UserContext";
import { supabase } from "../../lib/supabase";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  favorite_genres: string[] | null;
  reader_type: string[] | null;
  reading_mood: string[] | null;
  book_value: string[] | null;
};

type PersonalizedCard = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  query: string;
};

const COLORS = {
  bg: "#fbf9f5",
  card: "#fffdf9",
  border: "#ece7df",
  text: "#2f2a24",
  muted: "#7a7268",
  primary: "#7d5739",
  primaryDark: "#6b4a2f",
  primarySoft: "#f3e2d2",
  greenSoft: "#dfe7cf",
  peachSoft: "#f7dfcc",
  graySoft: "#f3efe8",
  white: "#fff",
  dangerSoft: "#fff4f4",
  dangerBorder: "#ffd8d8",
  dangerText: "#a22b2b",
};

function formatTimeAgo(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "şimdi";
  if (minutes < 60) return `${minutes} dk önce`;
  if (hours < 24) return `${hours} sa önce`;
  return `${days} gün önce`;
}

function getInitials(name?: string) {
  if (!name?.trim()) return "U";

  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function SectionHeader({
  title,
  subtitle,
  rightText,
  onPressRight,
}: {
  title: string;
  subtitle?: string;
  rightText?: string;
  onPressRight?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 12,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            fontSize: 21,
            fontWeight: "900",
            color: COLORS.text,
          }}
        >
          {title}
        </Text>

        {!!subtitle && (
          <Text
            style={{
              color: COLORS.muted,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {!!rightText && !!onPressRight && (
        <Pressable onPress={onPressRight}>
          <Text
            style={{
              color: COLORS.primary,
              fontWeight: "800",
            }}
          >
            {rightText}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function RecentBookCard({
  title,
  author,
  thumbnail,
  statusLabel,
  matchCount = 0,
  onPress,
}: {
  title: string;
  author: string;
  thumbnail?: string;
  statusLabel: string;
  matchCount?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 180,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: pressed ? "#f7f1ea" : COLORS.card,
        padding: 14,
        gap: 12,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        shadowColor: "#2f2a24",
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
      })}
    >
      <View
        style={{
          height: 180,
          borderRadius: 18,
          backgroundColor: COLORS.primarySoft,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={{
              width: "82%",
              height: "82%",
              borderRadius: 12,
              resizeMode: "cover",
            }}
          />
        ) : (
          <Ionicons name="book-outline" size={36} color={COLORS.primary} />
        )}
      </View>

      <View style={{ gap: 5 }}>
        <Text
          numberOfLines={2}
          style={{
            fontSize: 18,
            fontWeight: "900",
            color: COLORS.text,
          }}
        >
          {title}
        </Text>

        <Text
          numberOfLines={1}
          style={{
            color: COLORS.muted,
            fontSize: 14,
          }}
        >
          {author}
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 4,
          }}
        >
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: COLORS.graySoft,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                color: COLORS.primary,
                fontWeight: "800",
                fontSize: 12,
              }}
            >
              {statusLabel}
            </Text>
          </View>

          {matchCount > 0 ? (
            <View
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: COLORS.greenSoft,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{
                  color: COLORS.text,
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                {matchCount} kişi daha okuyor
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function ActionPill({
  label,
  icon,
  onPress,
  variant = "secondary",
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "secondary" | "primary" | "danger";
}) {
  const backgroundColor =
    variant === "primary"
      ? COLORS.primary
      : variant === "danger"
        ? COLORS.dangerSoft
        : COLORS.graySoft;

  const borderColor =
    variant === "primary"
      ? COLORS.primary
      : variant === "danger"
        ? COLORS.dangerBorder
        : COLORS.border;

  const textColor =
    variant === "primary"
      ? "#fff7f4"
      : variant === "danger"
        ? COLORS.dangerText
        : COLORS.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 999,
        borderWidth: 1,
        borderColor,
        backgroundColor: pressed
          ? variant === "primary"
            ? COLORS.primaryDark
            : variant === "danger"
              ? "#8b6240"
              : "#f8f3ed"
          : backgroundColor,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {!!icon && <Ionicons name={icon} size={15} color={textColor} />}
      <Text
        style={{
          color: textColor,
          fontWeight: "800",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getPostBookMeta(post: {
  bookTitle?: string;
  bookAuthor?: string;
  bookThumbnail?: string;
}) {
  return {
    title: post.bookTitle?.trim() || "Kitap",
    author: post.bookAuthor?.trim() || "Yazar bilinmiyor",
    thumbnail: post.bookThumbnail,
  };
}

function normalizeProfileArray(value?: string[] | null) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function buildPersonalizedCards(
  profile: ProfileRow | null,
): PersonalizedCard[] {
  if (!profile) return [];

  const genres = normalizeProfileArray(profile.favorite_genres);
  const readerTypes = normalizeProfileArray(profile.reader_type);
  const moods = normalizeProfileArray(profile.reading_mood);
  const values = normalizeProfileArray(profile.book_value);

  const cards: PersonalizedCard[] = [];

  genres.slice(0, 4).forEach((genre) => {
    cards.push({
      id: `genre-${genre}`,
      emoji: "📚",
      title: `${genre} türünde yeni kitaplar keşfet`,
      subtitle: "Favori türlerinden yola çıkarak hazırlandı.",
      query: genre,
    });
  });

  readerTypes.slice(0, 3).forEach((type) => {
    cards.push({
      id: `reader-${type}`,
      emoji: "✨",
      title: `${type} ruhuna uygun öneriler`,
      subtitle: "Okur vibe’ına yakın kitapları ara.",
      query: type.replace(/[✨📚🌙✍️🪄🔍💔⚡☕🔥😅]/g, "").trim() || type,
    });
  });

  moods.slice(0, 3).forEach((mood) => {
    cards.push({
      id: `mood-${mood}`,
      emoji: "🧭",
      title: `${mood} için kitap seçimi`,
      subtitle: "Bugünkü okuma moduna göre keşif başlat.",
      query: mood,
    });
  });

  values.slice(0, 3).forEach((value) => {
    cards.push({
      id: `value-${value}`,
      emoji: "🧠",
      title: `${value} sevenlere özel`,
      subtitle: "Kitapta önemsediğin detaylara göre önerildi.",
      query: value,
    });
  });

  return cards.slice(0, 10);
}

function PersonalizedRecommendationCard({
  item,
  onPress,
}: {
  item: PersonalizedCard;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 230,
        borderRadius: 24,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: pressed ? "#f4ece3" : COLORS.card,
        shadowColor: "#2f2a24",
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: COLORS.primarySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text
          numberOfLines={2}
          style={{
            color: COLORS.text,
            fontSize: 17,
            fontWeight: "900",
            lineHeight: 22,
          }}
        >
          {item.title}
        </Text>

        <Text
          numberOfLines={2}
          style={{
            color: COLORS.muted,
            fontSize: 13,
            lineHeight: 19,
          }}
        >
          {item.subtitle}
        </Text>
      </View>

      <View
        style={{
          marginTop: 2,
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 11,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: COLORS.graySoft,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <Ionicons name="search-outline" size={14} color={COLORS.primary} />
        <Text
          style={{ color: COLORS.primary, fontSize: 12, fontWeight: "900" }}
        >
          Keşfet
        </Text>
      </View>
    </Pressable>
  );
}

export default function Home() {
  const { user: authUser } = useAuth();
  const { user: appUser } = useUser();
  const { books } = useBooks();
  const { posts, isHydrated, toggleLike, removePost } = usePosts();
  const { getOrCreateConversationByParticipant, fetchConversationById } =
    useChat();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});
  const [busyLikeIds, setBusyLikeIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, first_name, last_name, birth_date, favorite_genres, reader_type, reading_mood, book_value",
        )
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.log("PROFILE FETCH ERROR:", error);
        return;
      }

      setProfile(data);
    };

    fetchProfile();
  }, [authUser?.id]);

  const displayName =
    appUser?.name?.trim() || authUser?.email || "ReadSphere Kullanıcısı";
  const currentUserId = authUser?.id ?? "";

  const last3 = useMemo(() => books.slice(0, 3), [books]);

  const personalizedCards = useMemo(
    () => buildPersonalizedCards(profile),
    [profile],
  );

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => b.createdAt - a.createdAt);
  }, [posts]);

  const myPosts = useMemo(() => {
    return sortedPosts.filter((p) => p.userId === currentUserId);
  }, [sortedPosts, currentUserId]);

  const communityPosts = useMemo(() => {
    return sortedPosts;
  }, [sortedPosts]);

  const booksToCheckForMatches = useMemo(() => {
    const items = new Map<string, string>();

    last3.forEach((book) => {
      if (book.status === "reading" && book.googleId) {
        items.set(book.id, book.googleId);
      }
    });

    communityPosts.forEach((post) => {
      const localBook = post.bookId
        ? books.find((b) => b.id === post.bookId)
        : undefined;

      if (localBook?.status === "reading" && localBook.googleId) {
        items.set(localBook.id, localBook.googleId);
      }
    });

    return Array.from(items.entries()).map(([localId, googleId]) => ({
      localId,
      googleId,
    }));
  }, [last3, communityPosts, books]);

  useEffect(() => {
    async function fetchMatchCounts() {
      if (!authUser?.id || booksToCheckForMatches.length === 0) {
        setMatchCounts({});
        return;
      }

      const results = await Promise.all(
        booksToCheckForMatches.map(async ({ localId, googleId }) => {
          const { data, error } = await supabase.rpc(
            "get_same_book_readers_count_by_google_id",
            {
              p_google_book_id: googleId,
              p_current_user_id: authUser.id,
            },
          );

          if (error) {
            console.log("MATCH COUNT ERROR:", googleId, error);
            return [localId, 0] as const;
          }

          return [localId, Number(data ?? 0)] as const;
        }),
      );

      setMatchCounts(Object.fromEntries(results));
    }

    fetchMatchCounts();
  }, [booksToCheckForMatches, authUser?.id]);

  function getLocalBook(bookId?: string) {
    if (!bookId) return undefined;
    return books.find((b) => b.id === bookId);
  }

  async function handleDeletePost(postId: string) {
    try {
      await removePost(postId);
      setConfirmDeleteId(null);
    } catch (error) {
      console.log("HOME DELETE POST ERROR:", error);
    }
  }
  async function handleToggleLike(postId: string) {
    if (busyLikeIds[postId]) return;

    try {
      setBusyLikeIds((prev) => ({ ...prev, [postId]: true }));
      await toggleLike(postId);
    } catch (error) {
      console.log("HOME TOGGLE LIKE ERROR:", error);
    } finally {
      setBusyLikeIds((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }
  }

  async function handleMessagePostOwner(post: {
    userId: string;
    userName: string;
    userAvatar?: string;
    bookTitle?: string;
  }) {
    if (post.userId === currentUserId) return;

    try {
      const conversationId = await getOrCreateConversationByParticipant({
        id: post.userId,
        name: post.userName,
        avatar: post.userAvatar,
      });

      await fetchConversationById(conversationId);

      const prefillText = `${
        post.bookTitle || "Paylaşımın"
      } hakkında yazdığını gördüm, yorumun ilgimi çekti.`;

      router.push({
        pathname: "/chat/[id]",
        params: {
          id: conversationId,
          prefill: prefillText,
        },
      });
    } catch (error) {
      console.log("HOME START CHAT ERROR:", error);
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
      params: { id: userId },
    });
  }
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: 18,
          gap: 22,
          paddingBottom: 130,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            borderRadius: 26,
            padding: 20,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            gap: 8,
            shadowColor: "#2f2a24",
            shadowOpacity: 0.06,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: COLORS.primarySoft,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {appUser?.avatar?.trim() ? (
                <Image
                  source={{ uri: appUser.avatar }}
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                  resizeMode="cover"
                />
              ) : (
                <Text
                  style={{
                    color: COLORS.primary,
                    fontWeight: "900",
                    fontSize: 14,
                  }}
                >
                  {getInitials(displayName)}
                </Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "900",
                  color: COLORS.primary,
                }}
              >
                ReadSphere
              </Text>

              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 14,
                  lineHeight: 20,
                  marginTop: 2,
                }}
              >
                Kitaplarını keşfet, takip et ve paylaşımlarınla kendi küçük
                okuma dünyanı oluştur.
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <BookSearchPicker
              onSelect={(book) => {
                const author = Array.isArray(book.authors)
                  ? book.authors.join(", ")
                  : "";

                router.push({
                  pathname: "/add-book",
                  params: {
                    title: book.title ?? "",
                    author,
                    pagesTotal:
                      typeof book.pageCount === "number"
                        ? String(book.pageCount)
                        : "",
                    thumbnail: book.thumbnail ?? "",
                    googleId: book.id ?? "",
                    status: "want",
                  },
                });
              }}
            />
          </View>

          {/* 🔥 AI ADD BUTTON */}
          <Pressable
            onPress={() => router.push("/ai-add-book")}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: pressed ? COLORS.primaryDark : COLORS.primary,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
          >
            <Ionicons name="sparkles" size={22} color="#fff" />
          </Pressable>
        </View>

        {personalizedCards.length > 0 && (
          <View style={{ gap: 14 }}>
            <SectionHeader
              title="Sana Özel"
              subtitle="Onboarding seçimlerine göre AI hissi veren keşif kartları."
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingRight: 8 }}
            >
              {personalizedCards.map((item) => (
                <PersonalizedRecommendationCard
                  key={item.id}
                  item={item}
                  onPress={() =>
                    router.push({
                      pathname: "/add-book",
                      params: {
                        query: item.query,
                        status: "want",
                      },
                    })
                  }
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ gap: 14 }}>
          <SectionHeader
            title="Son Eklenenler"
            subtitle="Kitaplığındaki en yeni eklemeler."
            rightText={books.length > 0 ? "Kitaplığa Git" : undefined}
            onPressRight={
              books.length > 0 ? () => router.push("/library") : undefined
            }
          />

          {last3.length === 0 ? (
            <View
              style={{
                borderRadius: 22,
                padding: 24,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.card,
                alignItems: "center",
                gap: 10,
              }}
            >
              <Ionicons
                name="library-outline"
                size={30}
                color={COLORS.primary}
              />
              <Text
                style={{
                  fontWeight: "900",
                  fontSize: 17,
                  color: COLORS.text,
                }}
              >
                Henüz kitap eklenmedi
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  color: COLORS.muted,
                  lineHeight: 20,
                }}
              >
                İlk kitabını ekleyerek okuma yolculuğunu başlat.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingRight: 8 }}
            >
              {last3.map((book) => {
                const statusLabel =
                  book.status === "reading"
                    ? "Okuyorum"
                    : book.status === "read"
                      ? "Okudum"
                      : "İstiyorum";

                return (
                  <RecentBookCard
                    key={book.id}
                    title={book.title}
                    author={book.author}
                    thumbnail={book.thumbnail}
                    statusLabel={statusLabel}
                    matchCount={
                      book.status === "reading"
                        ? (matchCounts[book.id] ?? 0)
                        : 0
                    }
                    onPress={() =>
                      router.push({
                        pathname: "/book/[id]",
                        params: {
                          id: book.id,
                          googleId: book.googleId ?? "",
                          title: book.title,
                          author: book.author,
                          bookJson: JSON.stringify(book),
                        },
                      })
                    }
                  />
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={{ gap: 14 }}>
          <SectionHeader
            title="Topluluk"
            subtitle="Okurların paylaşımlarını keşfet."
          />

          {!isHydrated ? (
            <View
              style={{
                borderRadius: 20,
                padding: 20,
                backgroundColor: COLORS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ color: COLORS.muted }}>Yükleniyor…</Text>
            </View>
          ) : communityPosts.length === 0 ? (
            <View
              style={{
                borderRadius: 22,
                padding: 24,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.card,
                alignItems: "center",
                gap: 10,
              }}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={30}
                color={COLORS.primary}
              />
              <Text
                style={{
                  fontWeight: "900",
                  fontSize: 17,
                  color: COLORS.text,
                }}
              >
                Toplulukta henüz paylaşım yok
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  color: COLORS.muted,
                  lineHeight: 20,
                }}
              >
                İlk paylaşımı sen yap ve okuma deneyimini anlat.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {communityPosts.map((post) => {
                const localBook = getLocalBook(post.bookId);
                const bookMeta = {
                  title: post.bookTitle?.trim() || localBook?.title || "Kitap",
                  author:
                    post.bookAuthor?.trim() ||
                    localBook?.author ||
                    "Yazar bilinmiyor",
                  thumbnail: post.bookThumbnail || localBook?.thumbnail,
                };

                const isMine = post.userId === currentUserId;

                const postMatchCount =
                  localBook?.status === "reading"
                    ? (matchCounts[localBook.id] ?? 0)
                    : 0;

                return (
                  <View
                    key={post.id}
                    style={{
                      borderRadius: 24,
                      padding: 16,
                      backgroundColor: COLORS.card,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      gap: 14,
                      shadowColor: "#2f2a24",
                      shadowOpacity: 0.05,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 2,
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        router.push({
                          pathname: "/book/[id]",
                          params: {
                            id: post.bookId || post.id,
                            title: bookMeta.title,
                            author: bookMeta.author,
                            thumbnail: bookMeta.thumbnail ?? "",
                            googleId: localBook?.googleId ?? "",
                            bookJson: JSON.stringify({
                              id: post.bookId || post.id,
                              title: bookMeta.title,
                              author: bookMeta.author,
                              thumbnail: bookMeta.thumbnail,
                              googleId: localBook?.googleId,
                              status: localBook?.status ?? "want",
                              pagesTotal: localBook?.pagesTotal,
                              pagesRead: localBook?.pagesRead,
                              rating: localBook?.rating,
                              note: localBook?.note,
                              createdAt: Date.now(),
                            }),
                          },
                        });
                      }}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        gap: 14,
                        borderRadius: 18,
                        backgroundColor: pressed ? "#f5efe7" : "#f8f4ee",
                        padding: 12,
                      })}
                    >
                      <View
                        style={{
                          width: 72,
                          height: 98,
                          borderRadius: 14,
                          overflow: "hidden",
                          backgroundColor: COLORS.primarySoft,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {bookMeta.thumbnail ? (
                          <Image
                            source={{ uri: bookMeta.thumbnail }}
                            style={{
                              width: "100%",
                              height: "100%",
                              resizeMode: "cover",
                            }}
                          />
                        ) : (
                          <Ionicons
                            name="book-outline"
                            size={26}
                            color={COLORS.primary}
                          />
                        )}
                      </View>

                      <View
                        style={{ flex: 1, justifyContent: "center", gap: 5 }}
                      >
                        <Text
                          numberOfLines={2}
                          style={{
                            fontSize: 18,
                            fontWeight: "900",
                            color: COLORS.text,
                          }}
                        >
                          {bookMeta.title}
                        </Text>

                        <Text
                          numberOfLines={1}
                          style={{
                            color: COLORS.muted,
                            fontSize: 14,
                          }}
                        >
                          {bookMeta.author}
                        </Text>

                        {postMatchCount > 0 ? (
                          <View
                            style={{
                              alignSelf: "flex-start",
                              marginTop: 4,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 999,
                              backgroundColor: COLORS.greenSoft,
                              borderWidth: 1,
                              borderColor: COLORS.border,
                            }}
                          >
                            <Text
                              style={{
                                color: COLORS.text,
                                fontWeight: "800",
                                fontSize: 12,
                              }}
                            >
                              {postMatchCount} kişi daha okuyor
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>

                    <View style={{ gap: 6 }}>
                      <Pressable onPress={() => openUserProfile(post.userId)}>
                        <Text
                          style={{
                            color: COLORS.primary,
                            fontWeight: "900",
                            fontSize: 13,
                          }}
                        >
                          {post.userName}
                        </Text>
                      </Pressable>

                      {!!post.shareText && (
                        <Text
                          style={{
                            color: COLORS.text,
                            fontSize: 15,
                            lineHeight: 23,
                          }}
                        >
                          {post.shareText}
                        </Text>
                      )}

                      <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                        {formatTimeAgo(post.createdAt)}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <Pressable
                        onPress={() => handleToggleLike(post.id)}
                        disabled={busyLikeIds[post.id]}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 9,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                          backgroundColor: pressed
                            ? "#ede7de"
                            : COLORS.graySoft,
                          opacity: busyLikeIds[post.id] ? 0.6 : 1,
                        })}
                      >
                        <Ionicons
                          name={post.isLiked ? "heart" : "heart-outline"}
                          size={16}
                          color={post.isLiked ? "red" : COLORS.text}
                        />

                        <Text
                          style={{
                            color: COLORS.text,
                            fontWeight: "800",
                            fontSize: 13,
                          }}
                        >
                          {post.likes ?? 0}
                        </Text>
                      </Pressable>

                      <ActionPill
                        icon="chatbubble-ellipses-outline"
                        label={String(post.comments?.length ?? 0)}
                        onPress={() =>
                          router.push({
                            pathname: "/post-comments/[id]",
                            params: { id: post.id },
                          })
                        }
                      />

                      {!isMine && (
                        <ActionPill
                          icon="mail-outline"
                          label="Mesaj"
                          onPress={() =>
                            handleMessagePostOwner({
                              userId: post.userId,
                              userName: post.userName,
                              userAvatar: post.userAvatar,
                              bookTitle: bookMeta.title,
                            })
                          }
                        />
                      )}

                      {isMine && (
                        <>
                          <ActionPill
                            icon="create-outline"
                            label="Düzenle"
                            onPress={() => {
                              if (!post.bookId) return;

                              router.push({
                                pathname: "/share/[id]",
                                params: {
                                  id: post.bookId,
                                  postId: post.id,
                                },
                              });
                            }}
                          />

                          <ActionPill
                            icon="trash-outline"
                            label="Sil"
                            variant="danger"
                            onPress={() =>
                              setConfirmDeleteId((prev) =>
                                prev === post.id ? null : post.id,
                              )
                            }
                          />
                        </>
                      )}
                    </View>

                    {isMine && confirmDeleteId === post.id && (
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
                            <ActionPill
                              label="Vazgeç"
                              onPress={() => setConfirmDeleteId(null)}
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <ActionPill
                              label="Evet, Sil"
                              variant="primary"
                              onPress={() => handleDeletePost(post.id)}
                            />
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {isHydrated && (
          <View style={{ gap: 14 }}>
            <SectionHeader
              title="Senin Paylaşımların"
              subtitle="Kendi yazdığın paylaşımları buradan hızlıca görebilirsin."
            />

            {myPosts.length === 0 ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 22,
                  paddingVertical: 28,
                  paddingHorizontal: 20,
                  backgroundColor: COLORS.card,
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={28}
                  color={COLORS.primary}
                />
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "900",
                    color: COLORS.text,
                  }}
                >
                  Henüz paylaşım yapmadın
                </Text>
                <Text
                  style={{
                    color: COLORS.muted,
                    textAlign: "center",
                    lineHeight: 20,
                  }}
                >
                  Bir kitap hakkında düşüncelerini paylaşarak topluluğa katıl.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {myPosts.map((post) => {
                  const localBook = getLocalBook(post.bookId);
                  const displayTitle =
                    post.bookTitle?.trim() || localBook?.title || "Kitap";
                  const displayAuthor =
                    post.bookAuthor?.trim() ||
                    localBook?.author ||
                    "Yazar bilinmiyor";

                  const myPostMatchCount =
                    localBook?.status === "reading"
                      ? (matchCounts[localBook.id] ?? 0)
                      : 0;

                  return (
                    <Pressable
                      key={post.id}
                      onPress={() =>
                        router.push({
                          pathname: "/post-comments/[id]",
                          params: { id: post.id },
                        })
                      }
                      style={({ pressed }) => ({
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: 22,
                        padding: 16,
                        backgroundColor: pressed ? "#f6f1ea" : COLORS.card,
                        gap: 8,
                        transform: [{ scale: pressed ? 0.99 : 1 }],
                      })}
                    >
                      <Text
                        style={{
                          fontWeight: "900",
                          fontSize: 17,
                          color: COLORS.text,
                        }}
                      >
                        {displayTitle}
                      </Text>

                      <Text style={{ color: COLORS.muted }}>
                        {displayAuthor}
                      </Text>

                      {myPostMatchCount > 0 ? (
                        <View
                          style={{
                            alignSelf: "flex-start",
                            marginTop: 2,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 999,
                            backgroundColor: COLORS.greenSoft,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                          }}
                        >
                          <Text
                            style={{
                              color: COLORS.text,
                              fontWeight: "800",
                              fontSize: 12,
                            }}
                          >
                            {myPostMatchCount} kişi daha okuyor
                          </Text>
                        </View>
                      ) : null}

                      {!!post.shareText && (
                        <Text
                          numberOfLines={2}
                          style={{
                            color: COLORS.text,
                            lineHeight: 22,
                          }}
                        >
                          {post.shareText}
                        </Text>
                      )}

                      <View
                        style={{
                          marginTop: 4,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                          ❤️ {post.likes ?? 0} · 💬 {post.comments?.length ?? 0}
                        </Text>

                        <Text
                          style={{
                            color: COLORS.primary,
                            fontWeight: "800",
                            fontSize: 13,
                          }}
                        >
                          Aç
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push("/add-book")}
        style={({ pressed }) => ({
          position: "absolute",
          right: 18,
          bottom: 22,
          width: 62,
          height: 62,
          borderRadius: 31,
          backgroundColor: pressed ? COLORS.primaryDark : COLORS.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: COLORS.primary,
          shadowOpacity: 0.24,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        <Ionicons name="add" size={28} color="#fff7f4" />
      </Pressable>

      <BirthdayCelebration
        birthDate={profile?.birth_date}
        firstName={profile?.first_name}
      />
    </View>
  );
}
