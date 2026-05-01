// app/book/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";

import { ProgressBar } from "../../components/ProgressBar";
import { useAuth } from "../../context/AuthContext";
import { useBooks } from "../../context/BooksContext";
import { useChat } from "../../context/ChatContext";
import { usePosts } from "../../context/PostsContext";
import { useReadingGoal } from "../../context/ReadingGoalContext";
import { useReadingLog } from "../../context/ReadingLogContext";
import { supabase } from "../../lib/supabase";
import type { Book, BookStatus } from "../../types/book";

const STORAGE_KEY = "BOOKS_V1";
const AI_BACKEND_URL = "http://localhost:3001/api/ai-books/insight";
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
  greenSoft: "#dfe7cf",
  peachSoft: "#f7dfcc",
  whiteSoft: "#fff7f4",
  dangerSoft: "#fff4f4",
  dangerBorder: "#ffd8d8",
  dangerText: "#a22b2b",
};

const statusLabel: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

type SameReader = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  book_id: string;
  google_book_id: string;
  title: string;
  author: string;
  status: string;
  pages_read: number | null;
  updated_at: string | null;
};

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLocaleLowerCase("tr").replace(/\s+/g, " ");
}

function getInitial(name?: string | null) {
  if (!name?.trim()) return "U";
  return name.trim().charAt(0).toUpperCase();
}

function normalizeBook(b: any): Book {
  const safePagesTotal =
    typeof b?.pagesTotal === "number" && b.pagesTotal > 0
      ? b.pagesTotal
      : undefined;

  const safePagesRead =
    typeof b?.pagesRead === "number" && b.pagesRead >= 0
      ? b.pagesRead
      : undefined;

  return {
    id: typeof b?.id === "string" ? b.id : String(Date.now()),
    title: typeof b?.title === "string" ? b.title : "",
    author: typeof b?.author === "string" ? b.author : "",
    thumbnail:
      typeof b?.thumbnail === "string" && b.thumbnail.length > 0
        ? b.thumbnail
        : undefined,
    googleId:
      typeof b?.googleId === "string" && b.googleId.length > 0
        ? b.googleId
        : undefined,
    description:
      typeof b?.description === "string" && b.description.trim().length > 0
        ? b.description.trim()
        : undefined,
    categories: Array.isArray(b?.categories)
      ? b.categories.filter(
          (x: unknown): x is string =>
            typeof x === "string" && x.trim().length > 0,
        )
      : undefined,
    publishedDate:
      typeof b?.publishedDate === "string" && b.publishedDate.trim().length > 0
        ? b.publishedDate.trim()
        : undefined,
    language:
      typeof b?.language === "string" && b.language.trim().length > 0
        ? b.language.trim()
        : undefined,
    status:
      b?.status === "reading" || b?.status === "read" || b?.status === "want"
        ? b.status
        : "reading",
    createdAt:
      typeof b?.createdAt === "number"
        ? b.createdAt
        : typeof b?.createdAt === "string"
          ? new Date(b.createdAt).getTime() || Date.now()
          : Date.now(),
    pagesTotal: safePagesTotal,
    pagesRead:
      typeof safePagesRead === "number"
        ? typeof safePagesTotal === "number"
          ? Math.min(safePagesRead, safePagesTotal)
          : safePagesRead
        : undefined,
    rating:
      typeof b?.rating === "number" && b.rating >= 1 && b.rating <= 5
        ? b.rating
        : undefined,
    note:
      typeof b?.note === "string" && b.note.trim().length > 0
        ? b.note.trim()
        : undefined,
    shareText:
      typeof b?.shareText === "string" && b.shareText.trim().length > 0
        ? b.shareText.trim()
        : undefined,
    sharedAt:
      typeof b?.sharedAt === "number"
        ? b.sharedAt
        : typeof b?.sharedAt === "string"
          ? new Date(b.sharedAt).getTime() || undefined
          : undefined,
    likes: typeof b?.likes === "number" ? b.likes : 0,
    isLiked: typeof b?.isLiked === "boolean" ? b.isLiked : false,
    comments: Array.isArray(b?.comments) ? b.comments : [],
  };
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
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
      <Text style={{ fontWeight: "900", color: COLORS.text, fontSize: 17 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function SoftPillButton({
  label,
  icon,
  onPress,
  variant = "secondary",
  disabled = false,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "secondary" | "primary" | "danger";
  disabled?: boolean;
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
      ? COLORS.whiteSoft
      : variant === "danger"
        ? COLORS.dangerText
        : COLORS.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: disabled ? 0.55 : 1,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 999,
        borderWidth: 1,
        borderColor,
        backgroundColor: pressed
          ? variant === "primary"
            ? COLORS.primaryDark
            : "#ece6dc"
          : backgroundColor,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      })}
    >
      {!!icon && <Ionicons name={icon} size={16} color={textColor} />}
      <Text style={{ color: textColor, fontWeight: "900", fontSize: 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function findBookInList(
  list: Book[],
  id: string,
  googleId: string,
  title: string,
  author: string,
) {
  if (id) {
    const byId = list.find((b) => b.id === id);
    if (byId) return byId;
  }

  if (googleId) {
    const byGoogleId = list.find((b) => b.googleId === googleId);
    if (byGoogleId) return byGoogleId;
  }

  const normalizedTitle = normalizeText(title);
  const normalizedAuthor = normalizeText(author);

  if (normalizedTitle && normalizedAuthor) {
    const byTitleAuthor = list.find(
      (b) =>
        normalizeText(b.title) === normalizedTitle &&
        normalizeText(b.author) === normalizedAuthor,
    );
    if (byTitleAuthor) return byTitleAuthor;
  }

  return undefined;
}

export default function BookDetail() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    googleId?: string | string[];
    title?: string | string[];
    author?: string | string[];
    bookJson?: string | string[];
  }>();

  const { user: authUser } = useAuth();
  const { books, removeBook, updateBook } = useBooks();
  const { posts } = usePosts();
  const { getOrCreateConversationByParticipant } = useChat();
  const { step } = useReadingGoal();
  const { addLog } = useReadingLog();

  const currentUserId = authUser?.id ?? "";

  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const routeGoogleId = Array.isArray(params.googleId)
    ? params.googleId[0]
    : params.googleId;
  const routeTitle = Array.isArray(params.title)
    ? params.title[0]
    : params.title;
  const routeAuthor = Array.isArray(params.author)
    ? params.author[0]
    : params.author;
  const routeBookJson = Array.isArray(params.bookJson)
    ? params.bookJson[0]
    : params.bookJson;

  const safeId = typeof routeId === "string" ? routeId : "";
  const safeGoogleId = typeof routeGoogleId === "string" ? routeGoogleId : "";
  const safeTitle = typeof routeTitle === "string" ? routeTitle : "";
  const safeAuthor = typeof routeAuthor === "string" ? routeAuthor : "";

  const fallbackBookFromRoute = useMemo(() => {
    if (!routeBookJson || typeof routeBookJson !== "string") return undefined;
    try {
      return normalizeBook(JSON.parse(routeBookJson));
    } catch {
      return undefined;
    }
  }, [routeBookJson]);

  const [storageBook, setStorageBook] = useState<Book | undefined>(undefined);
  const [loadingFallback, setLoadingFallback] = useState(true);
  const [deletingBook, setDeletingBook] = useState(false);
  const [notice, setNotice] = useState("");

  const [sameReaders, setSameReaders] = useState<SameReader[]>([]);
  const [loadingReaders, setLoadingReaders] = useState(true);
  const [creatingGroupChat, setCreatingGroupChat] = useState(false);

  const [aiInsight, setAiInsight] = useState<any>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [generatingInsight, setGeneratingInsight] = useState(false);

  const [alsoReadBooks, setAlsoReadBooks] = useState<any[]>([]);
  const [loadingAlsoRead, setLoadingAlsoRead] = useState(false);

  const contextBook = useMemo(
    () => findBookInList(books, safeId, safeGoogleId, safeTitle, safeAuthor),
    [books, safeId, safeGoogleId, safeTitle, safeAuthor],
  );

  useEffect(() => {
    let mounted = true;
    let attempts = 0;

    async function pollStorage() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;

        const parsed = raw ? (JSON.parse(raw) as unknown) : [];
        const safeBooks = Array.isArray(parsed)
          ? parsed.map(normalizeBook)
          : [];
        const found = findBookInList(
          safeBooks,
          safeId,
          safeGoogleId,
          safeTitle,
          safeAuthor,
        );

        if (found) {
          setStorageBook(found);
          setLoadingFallback(false);
          return;
        }

        attempts += 1;

        if (attempts < 10) {
          setTimeout(pollStorage, 250);
          return;
        }

        setStorageBook(undefined);
        setLoadingFallback(false);
      } catch {
        attempts += 1;

        if (attempts < 10) {
          setTimeout(pollStorage, 250);
          return;
        }

        if (mounted) {
          setStorageBook(undefined);
          setLoadingFallback(false);
        }
      }
    }

    pollStorage();

    return () => {
      mounted = false;
    };
  }, [safeId, safeGoogleId, safeTitle, safeAuthor]);

  const book = contextBook ?? storageBook ?? fallbackBookFromRoute;

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3000);
  };

  const loadCachedAIInsight = async () => {
    if (!book || !authUser?.id) return;

    try {
      setLoadingInsight(true);

      const { data, error } = await supabase
        .from("book_ai_insights")
        .select("*")
        .eq("user_id", authUser.id)
        .eq("book_id", book.id)
        .maybeSingle();

      if (error) {
        console.log("AI INSIGHT CACHE ERROR:", error);
        return;
      }

      if (data) {
        setAiInsight({
          summary: data.summary || "",
          themes: data.themes || [],
          who_should_read: data.who_should_read || "",
          similar: data.similar_books || [],
        });
      }
    } catch (error) {
      console.log("AI INSIGHT CACHE LOAD ERROR:", error);
    } finally {
      setLoadingInsight(false);
    }
  };

  const generateAIInsight = async () => {
    if (!book || !authUser?.id) return;

    try {
      setGeneratingInsight(true);

      const res = await fetch(AI_BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          description: book.description || book.note || "",
        }),
      });

      const json = await res.json();

      if (!json.success) {
        console.log("AI INSIGHT RESPONSE ERROR:", json);
        Alert.alert("Hata", "AI analiz oluşturulamadı.");
        return;
      }

      const insight = json.data;
      setAiInsight(insight);

      const { error } = await supabase.from("book_ai_insights").insert({
        user_id: authUser.id,
        book_id: book.id,
        title: book.title,
        author: book.author,
        summary: insight.summary || "",
        themes: insight.themes || [],
        who_should_read: insight.who_should_read || "",
        similar_books: insight.similar || [],
      });

      if (error) {
        console.log("AI INSIGHT INSERT ERROR:", error);
      }
    } catch (error) {
      console.log("AI INSIGHT GENERATE ERROR:", error);
      Alert.alert("Hata", "AI analiz oluşturulurken bir sorun oluştu.");
    } finally {
      setGeneratingInsight(false);
    }
  };

  const fetchAlsoReadBooks = async () => {
    if (!book || !authUser?.id) return;

    try {
      setLoadingAlsoRead(true);

      const { data, error } = await supabase.rpc("get_also_read_books", {
        p_title: book.title,
        p_author: book.author,
        p_current_user_id: authUser.id,
        p_limit: 5,
      });

      if (error) {
        console.log("ALSO READ BOOKS ERROR:", error);
        setAlsoReadBooks([]);
        return;
      }

      setAlsoReadBooks(data || []);
    } catch (error) {
      console.log("ALSO READ BOOKS FETCH ERROR:", error);
      setAlsoReadBooks([]);
    } finally {
      setLoadingAlsoRead(false);
    }
  };

  useEffect(() => {
    if (book?.id && authUser?.id) {
      loadCachedAIInsight();
    }
  }, [book?.id, authUser?.id]);

  useEffect(() => {
    if (book?.id && authUser?.id) {
      fetchAlsoReadBooks();
    }
  }, [book?.id, authUser?.id]);

  useEffect(() => {
    async function fetchReaders() {
      if (!authUser?.id) {
        setSameReaders([]);
        setLoadingReaders(false);
        return;
      }

      if (!book || book.status !== "reading") {
        setSameReaders([]);
        setLoadingReaders(false);
        return;
      }

      if (!book.googleId) {
        console.log("❌ GOOGLE ID YOK → eşleşme çıkmaz");
        setSameReaders([]);
        setLoadingReaders(false);
        return;
      }

      setLoadingReaders(true);

      const { data, error } = await supabase.rpc(
        "get_same_book_readers_by_google_id",
        {
          p_google_book_id: book.googleId,
          p_current_user_id: authUser.id,
          p_limit: 20,
        },
      );

      if (error) {
        console.log("READERS ERROR:", error);
        setSameReaders([]);
      } else {
        setSameReaders((data ?? []) as SameReader[]);
      }

      setLoadingReaders(false);
    }

    fetchReaders();
  }, [book, authUser?.id]);
  const readersCount = useMemo(() => {
    if (!sameReaders) return 0;
    return sameReaders.filter((r) => r.user_id !== currentUserId).length;
  }, [sameReaders, currentUserId]);

  const topReader = useMemo(() => {
    if (!sameReaders || sameReaders.length === 0) return null;

    const filtered = sameReaders.filter((r) => r.user_id !== currentUserId);

    if (filtered.length === 0) return null;

    return filtered.sort(
      (a, b) => (b.pages_read ?? 0) - (a.pages_read ?? 0),
    )[0];
  }, [sameReaders, currentUserId]);

  const readersBadgeText =
    book?.status === "reading"
      ? readersCount > 0
        ? `Bu kitabı seninle birlikte ${readersCount} kişi okuyor`
        : "Şu an bu kitabı tek başına okuyorsun"
      : null;

  const normalizedBookTitle = useMemo(
    () => normalizeText(book?.title),
    [book?.title],
  );
  const normalizedBookAuthor = useMemo(
    () => normalizeText(book?.author),
    [book?.author],
  );

  const relatedPeople = useMemo(() => {
    if (!book) return [];

    const matchingPosts = posts.filter((post) => {
      const sameBookId = post.bookId === book.id;

      const normalizedPostTitle = normalizeText(post.bookTitle);
      const normalizedPostAuthor = normalizeText(post.bookAuthor);

      const sameTitle =
        normalizedPostTitle === normalizedBookTitle ||
        normalizedPostTitle.includes(normalizedBookTitle) ||
        normalizedBookTitle.includes(normalizedPostTitle);

      const sameAuthor =
        normalizedPostAuthor === normalizedBookAuthor ||
        normalizedPostAuthor.includes(normalizedBookAuthor) ||
        normalizedBookAuthor.includes(normalizedPostAuthor);

      return sameBookId || (sameTitle && sameAuthor);
    });

    const uniqueUsersMap = new Map<
      string,
      {
        userId: string;
        userName: string;
        userAvatar?: string;
        latestPostId: string;
        latestShareText: string;
        latestCreatedAt: number;
      }
    >();

    matchingPosts.forEach((post) => {
      const existing = uniqueUsersMap.get(post.userId);

      if (!existing || post.createdAt > existing.latestCreatedAt) {
        uniqueUsersMap.set(post.userId, {
          userId: post.userId,
          userName: post.userName,
          userAvatar: post.userAvatar,
          latestPostId: post.id,
          latestShareText: post.shareText,
          latestCreatedAt: post.createdAt,
        });
      }
    });

    return Array.from(uniqueUsersMap.values()).sort(
      (a, b) => b.latestCreatedAt - a.latestCreatedAt,
    );
  }, [book, normalizedBookTitle, normalizedBookAuthor, posts]);

  const otherReaders = useMemo(
    () => relatedPeople.filter((person) => person.userId !== currentUserId),
    [relatedPeople, currentUserId],
  );

  const confirmDelete = async () => {
    if (!book) return;

    const deletedTitle = book.title;
    const deletedId = book.id;

    try {
      setDeletingBook(true);
      showNotice(`${deletedTitle} kitabı silindi.`);

      setTimeout(async () => {
        try {
          await removeBook(deletedId);
          router.replace("/(tabs)/library");
        } catch (error) {
          console.log("BOOK DELETE ERROR:", error);
          showNotice("Kitap silinirken bir sorun oluştu.");
        } finally {
          setDeletingBook(false);
        }
      }, 900);
    } catch (error) {
      console.log("BOOK DELETE ERROR:", error);
      setDeletingBook(false);
    }
  };

  const cycleStatus = () => {
    if (!book) return;

    const next: BookStatus =
      book.status === "reading"
        ? "read"
        : book.status === "read"
          ? "want"
          : "reading";

    if (next === "reading") {
      updateBook(book.id, {
        status: "reading",
        rating: undefined,
        note: undefined,
        pagesRead: book.pagesRead ?? 0,
      });
      return;
    }

    if (next === "read") {
      updateBook(book.id, {
        status: "read",
        pagesRead:
          typeof book.pagesTotal === "number" && book.pagesTotal > 0
            ? book.pagesTotal
            : book.pagesRead,
      });
      return;
    }

    updateBook(book.id, {
      status: "want",
      rating: undefined,
      note: undefined,
      pagesRead: undefined,
    });
  };

  const addPages = () => {
    if (!book) return;
    if (book.status !== "reading") return;
    if (!book.pagesTotal || book.pagesTotal <= 0) return;

    const current = book.pagesRead ?? 0;

    if (current >= book.pagesTotal) {
      Alert.alert(
        "Tamamlandı",
        "Bu kitap için tüm sayfalar zaten işaretlenmiş.",
      );
      return;
    }

    const next = Math.min(current + step, book.pagesTotal);
    const diff = next - current;

    if (diff <= 0) return;

    updateBook(book.id, { pagesRead: next });
    addLog(diff);
  };

  const handleMessageReader = async (person: {
    userId: string;
    userName: string;
    userAvatar?: string | null;
  }) => {
    if (!currentUserId) {
      Alert.alert("Hata", "Önce giriş yapmalısın.");
      return;
    }

    try {
      const conversationId = await getOrCreateConversationByParticipant({
        id: person.userId,
        name: person.userName,
        avatar: person.userAvatar ?? undefined,
      });

      const prefillText = `Merhaba 👋
"${book?.title}" hakkında seni gördüm.

Bu kitap hakkında ne düşünüyorsun?`;

      router.push({
        pathname: "/chat/[id]",
        params: {
          id: String(conversationId),
          prefill: prefillText,
        },
      });
    } catch (error) {
      console.log("BOOK DETAIL MESSAGE READER ERROR:", error);
      Alert.alert("Hata", "Sohbet açılırken bir sorun oluştu.");
    }
  };
  // ...existing code...

  // Assuming these functions are used in JSX, e.g., onPress handlers
  // If not, remove them to fix unused variable warnings

  const openUserProfile = (userId: string) => {
    if (userId === currentUserId) {
      router.push("/profile");
      return;
    }

    router.push({
      pathname: "/user/[id]",
      params: { id: String(userId) },
    });
  };

  const openBookCommunity = () => {
    if (!book) return;

    // If "/book-community/[id]" is invalid, replace with a valid path, e.g., "/book/[id]"
    router.push({
      pathname: "/book-community/[id]", // Ensure this route is defined in your app
      params: {
        id: String(book.id),
        title: book.title,
        author: book.author,
        thumbnail: book.thumbnail ?? "",
        googleId: book.googleId ?? "",
      },
    });
  };

  // ...existing code...

  const handleOpenRelatedPost = (postId: string) => {
    router.push({
      pathname: "/post-comments/[id]" as const,
      params: { id: postId },
    });
  };

  const handleCreateGroupChat = async () => {
    if (!book) return;
    if (!authUser?.id) {
      Alert.alert("Hata", "Önce giriş yapmalısın.");
      return;
    }
    if (sameReaders.length === 0) {
      Alert.alert(
        "Kimse yok",
        "Bu kitap için şu an grup sohbeti başlatılabilecek başka okuyucu yok.",
      );
      return;
    }

    try {
      setCreatingGroupChat(true);

      const title = `${book.title} • Okuyanlar`;

      const { data: conversationData, error: conversationError } =
        await supabase
          .from("conversations")
          .insert({
            is_group: true,
            title,
            created_by: authUser.id,
          })
          .select("id")
          .single();

      if (conversationError || !conversationData) {
        throw new Error(conversationError?.message || "Grup oluşturulamadı.");
      }

      const participantIds = [
        authUser.id,
        ...sameReaders.map((reader) => reader.user_id),
      ];

      const uniqueParticipantIds = [...new Set(participantIds)];

      const participantRows = uniqueParticipantIds.map((userId) => ({
        conversation_id: conversationData.id,
        user_id: userId,
      }));

      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .upsert(participantRows, {
          onConflict: "conversation_id,user_id",
          ignoreDuplicates: true,
        });

      if (participantsError) {
        throw new Error(participantsError.message);
      }

      router.push({
        pathname: "/chat/[id]",
        params: {
          id: String(conversationData.id),
        },
      });
    } catch (error: any) {
      console.log("GROUP CHAT ERROR:", error);
      Alert.alert(
        "Grup sohbeti açılamadı",
        error?.message || "Bir hata oluştu.",
      );
    } finally {
      setCreatingGroupChat(false);
    }
  };

  const progressPercent =
    book?.pagesTotal && book.pagesTotal > 0
      ? Math.round(((book.pagesRead ?? 0) / book.pagesTotal) * 100)
      : 0;

  if (!book && loadingFallback) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 16 }}
      >
        <View
          style={{
            marginTop: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 24,
            paddingVertical: 32,
            paddingHorizontal: 22,
            backgroundColor: COLORS.card,
            alignItems: "center",
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "900", color: COLORS.text }}>
            Kitap yükleniyor
          </Text>
          <Text
            style={{
              color: COLORS.muted,
              textAlign: "center",
              lineHeight: 21,
            }}
          >
            Kitap bilgileri hazırlanıyor...
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (!book) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 16 }}
      >
        <View
          style={{
            marginTop: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 24,
            paddingVertical: 32,
            paddingHorizontal: 22,
            backgroundColor: COLORS.card,
            alignItems: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: COLORS.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="book-outline" size={28} color={COLORS.primary} />
          </View>

          <Text style={{ fontSize: 20, fontWeight: "900", color: COLORS.text }}>
            Kitap bulunamadı
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              textAlign: "center",
              lineHeight: 21,
            }}
          >
            Bu kitap henüz kitaplıkta bulunamadı.
          </Text>

          <View style={{ marginTop: 8, minWidth: 140 }}>
            <SoftPillButton
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
    >
      <View
        style={{
          flexDirection: "row",
          gap: 14,
          padding: 16,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
        }}
      >
        <View
          style={{
            width: 102,
            height: 148,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: COLORS.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {book.thumbnail ? (
            <Image
              source={{ uri: book.thumbnail }}
              style={{ width: 102, height: 148 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name="book-outline" size={28} color={COLORS.primary} />
              <Text style={{ fontSize: 11, color: COLORS.muted }}>
                Kapak yok
              </Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1, gap: 8 }}>
          <Text
            style={{ fontSize: 24, fontWeight: "900", color: COLORS.text }}
            numberOfLines={3}
          >
            {book.title}
          </Text>

          <Text
            style={{ color: COLORS.muted, fontSize: 15, fontWeight: "700" }}
            numberOfLines={2}
          >
            {book.author}
          </Text>

          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.graySoft,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: COLORS.primary,
              }}
            >
              {statusLabel[book.status]}
            </Text>
          </View>

          {book.status === "reading" && (
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                flexWrap: "wrap",
                marginTop: 4,
              }}
            >
              {readersBadgeText ? (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: COLORS.peachSoft,
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
                    {readersBadgeText}
                  </Text>
                </View>
              ) : null}

              {topReader ? (
                <View
                  style={{
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
                    En aktif: {topReader.full_name || topReader.username}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {typeof book.pagesTotal === "number" && book.pagesTotal > 0 ? (
            <Text style={{ color: COLORS.muted, fontSize: 12 }}>
              Toplam sayfa: {book.pagesTotal}
            </Text>
          ) : null}

          {book.googleId ? (
            <Text
              style={{ color: COLORS.primary, fontSize: 11, fontWeight: "800" }}
            >
              Google Books verisi
            </Text>
          ) : null}
        </View>
      </View>

      <SectionCard title="Kitap Bilgisi">
        <Text style={{ color: COLORS.text }}>
          Durum:{" "}
          <Text style={{ fontWeight: "900" }}>{statusLabel[book.status]}</Text>
        </Text>

        {typeof book.pagesTotal === "number" && book.pagesTotal > 0 ? (
          <Text style={{ color: COLORS.muted }}>
            Sayfa: {book.pagesRead ?? 0} / {book.pagesTotal}
          </Text>
        ) : (
          <Text style={{ color: COLORS.muted }}>Sayfa bilgisi eklenmemiş.</Text>
        )}
      </SectionCard>

      {book.description ? (
        <SectionCard title="Kitap Açıklaması">
          <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
            {book.description}
          </Text>

          {book.categories?.length ? (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 8,
              }}
            >
              {book.categories.map((cat) => (
                <View
                  key={cat}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: COLORS.primarySoft,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: COLORS.primary,
                      fontWeight: "700",
                    }}
                  >
                    {cat}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </SectionCard>
      ) : null}
      <SectionCard title="AI Kitap Analizi 🤖">
        {loadingInsight ? (
          <Text style={{ color: COLORS.muted }}>
            Kayıtlı AI analiz kontrol ediliyor...
          </Text>
        ) : !aiInsight ? (
          <>
            <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
              Bu kitap için henüz AI analiz oluşturulmadı. İstersen yapay zeka
              ile özet, tema ve benzer kitap önerisi üretebilirsin.
            </Text>

            <SoftPillButton
              label={
                generatingInsight
                  ? "AI analiz hazırlanıyor..."
                  : "AI Analiz Yap"
              }
              icon="sparkles-outline"
              variant="primary"
              disabled={generatingInsight}
              onPress={generateAIInsight}
            />
          </>
        ) : (
          <>
            <Text style={{ fontWeight: "900", color: COLORS.text }}>
              Geliştirilmiş Özet
            </Text>
            <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
              {aiInsight.summary || "Özet bulunamadı."}
            </Text>

            <Text
              style={{ marginTop: 10, fontWeight: "900", color: COLORS.text }}
            >
              Temalar
            </Text>
            <Text style={{ color: COLORS.muted }}>
              {aiInsight.themes?.length
                ? aiInsight.themes.join(", ")
                : "Tema bulunamadı."}
            </Text>

            <Text
              style={{ marginTop: 10, fontWeight: "900", color: COLORS.text }}
            >
              Kimler Okumalı?
            </Text>
            <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
              {aiInsight.who_should_read || "Okuyucu önerisi bulunamadı."}
            </Text>

            <Text
              style={{ marginTop: 10, fontWeight: "900", color: COLORS.text }}
            >
              Benzer Kitaplar
            </Text>
            <Text style={{ color: COLORS.muted }}>
              {aiInsight.similar?.length
                ? aiInsight.similar.join(", ")
                : "Benzer kitap bulunamadı."}
            </Text>
          </>
        )}
      </SectionCard>

      <SectionCard title="Bunu Okuyanlar Şunları da Okudu 📚">
        {loadingAlsoRead ? (
          <Text style={{ color: COLORS.muted }}>Öneriler hazırlanıyor...</Text>
        ) : alsoReadBooks.length === 0 ? (
          <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
            Bu kitap için henüz yeterli ortak okuma verisi yok. Daha fazla
            kullanıcı bu kitabı kitaplığına ekledikçe öneriler güçlenecek.
          </Text>
        ) : (
          alsoReadBooks.map((item, index) => (
            <View
              key={`${item.title}-${item.author}-${index}`}
              style={{
                flexDirection: "row",
                gap: 12,
                padding: 12,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.graySoft,
              }}
            >
              {item.thumbnail ? (
                <Image
                  source={{ uri: item.thumbnail }}
                  style={{
                    width: 48,
                    height: 72,
                    borderRadius: 10,
                    backgroundColor: COLORS.primarySoft,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 48,
                    height: 72,
                    borderRadius: 10,
                    backgroundColor: COLORS.primarySoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="book-outline"
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontWeight: "900" }}>
                  {item.title}
                </Text>

                <Text style={{ color: COLORS.muted, marginTop: 3 }}>
                  {item.author || "Yazar bilinmiyor"}
                </Text>

                <Text
                  style={{
                    color: COLORS.primary,
                    fontWeight: "800",
                    marginTop: 6,
                  }}
                >
                  {item.reader_count} ortak okuyucu
                </Text>
              </View>
            </View>
          ))
        )}
      </SectionCard>

      {book.status === "reading" && (
        <SectionCard title="Okuma İlerlemesi">
          <ProgressBar
            pagesRead={book.pagesRead}
            pagesTotal={book.pagesTotal}
          />

          <View style={{ alignItems: "center", gap: 6 }}>
            <Text
              style={{ fontSize: 18, fontWeight: "900", color: COLORS.text }}
            >
              %{progressPercent}
            </Text>

            <Text style={{ color: COLORS.muted, fontSize: 12 }}>
              {book.pagesRead ?? 0} / {book.pagesTotal} sayfa
            </Text>
          </View>

          <SoftPillButton
            label={`+${step} Sayfa Okudum`}
            icon="add-outline"
            onPress={addPages}
            variant="primary"
          />
        </SectionCard>
      )}

      {book.status === "read" && (
        <>
          <SectionCard title="Puan">
            <Text style={{ color: COLORS.text, fontSize: 16 }}>
              {book.rating && book.rating > 0
                ? "★".repeat(book.rating)
                : "Puan verilmemiş"}
            </Text>
          </SectionCard>

          <SectionCard title="Not">
            <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
              {book.note?.trim()?.length ? book.note : "Henüz not eklenmemiş."}
            </Text>
          </SectionCard>
        </>
      )}

      {book.status === "want" && (
        <SectionCard title="Okuma Listesi">
          <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
            Bu kitap daha sonra okunmak üzere listene eklendi.
          </Text>
        </SectionCard>
      )}

      <SectionCard title="Bu Kitabı Paylaşanlar">
        {relatedPeople.length === 0 ? (
          <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
            Bu kitapla ilgili henüz topluluk paylaşımı bulunamadı.
          </Text>
        ) : (
          <>
            <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
              Toplulukta bu kitapla ilgili {relatedPeople.length} kullanıcı
              paylaşım yapmış.
            </Text>

            {otherReaders.length === 0 ? (
              <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
                Şu an yalnızca senin paylaşımın görünüyor.
              </Text>
            ) : (
              otherReaders.map((person) => (
                <View
                  key={person.userId}
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.graySoft,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    {person.userAvatar ? (
                      <Image
                        source={{ uri: person.userAvatar }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: COLORS.primarySoft,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: COLORS.primarySoft,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{ fontWeight: "900", color: COLORS.primary }}
                        >
                          {getInitial(person.userName)}
                        </Text>
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "900", color: COLORS.text }}>
                        {person.userName}
                      </Text>

                      <Text style={{ color: COLORS.primary, fontSize: 12 }}>
                        Bu kitabı paylaştı
                      </Text>

                      <Text
                        style={{
                          color: COLORS.muted,
                          fontSize: 13,
                          lineHeight: 18,
                          marginTop: 4,
                        }}
                        numberOfLines={2}
                      >
                        “{person.latestShareText || "Paylaşım metni yok"}”
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <SoftPillButton
                      label="Mesaj Gönder"
                      icon="mail-outline"
                      onPress={() => handleMessageReader(person)}
                    />

                    <SoftPillButton
                      label="Paylaşımı Aç"
                      icon="chatbubble-ellipses-outline"
                      onPress={() => handleOpenRelatedPost(person.latestPostId)}
                    />
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </SectionCard>

      {book.status === "reading" && (
        <SectionCard title="Bu Kitabı Okuyanlar">
          {loadingReaders ? (
            <Text style={{ color: COLORS.muted }}>Yükleniyor...</Text>
          ) : sameReaders.length === 0 ? (
            <Text style={{ color: COLORS.muted }}>
              Bu kitabı okuyan başka kullanıcı bulunamadı.
            </Text>
          ) : (
            <>
              <Text style={{ color: COLORS.muted }}>
                Seninle birlikte {readersCount} kişi bu kitabı okuyor 📚
              </Text>

              {topReader ? (
                <View
                  style={{
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: COLORS.greenSoft,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text style={{ color: COLORS.text, fontWeight: "900" }}>
                    En aktif okuyucu:{" "}
                    {topReader.full_name || topReader.username}
                  </Text>
                  <Text style={{ color: COLORS.muted, marginTop: 4 }}>
                    {topReader.pages_read || 0} sayfa ile önde
                  </Text>
                </View>
              ) : null}

              <SoftPillButton
                label="Aynı kitabı okuyanlarla grup chat"
                icon="people-outline"
                variant="primary"
                onPress={handleCreateGroupChat}
                disabled={creatingGroupChat || sameReaders.length === 0}
              />

              {sameReaders
                .filter((person) => person.user_id !== currentUserId)
                .map((person) => (
                  <View
                    key={person.user_id}
                    style={{
                      padding: 14,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      backgroundColor: COLORS.graySoft,
                      gap: 12,
                    }}
                  >
                    <Pressable
                      onPress={() => openUserProfile(person.user_id)}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "center",
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      {person.avatar_url ? (
                        <Image
                          source={{ uri: person.avatar_url }}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                          }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: COLORS.primarySoft,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{ fontWeight: "900", color: COLORS.primary }}
                          >
                            {getInitial(person.full_name || person.username)}
                          </Text>
                        </View>
                      )}

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "900", color: COLORS.text }}>
                          {person.full_name || person.username}
                        </Text>

                        <Text style={{ color: COLORS.primary, fontSize: 12 }}>
                          Bu kitabı okuyor
                        </Text>

                        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                          {person.pages_read || 0} sayfa okudu
                        </Text>
                      </View>
                    </Pressable>

                    <SoftPillButton
                      label="Mesaj Gönder"
                      icon="mail-outline"
                      onPress={() =>
                        handleMessageReader({
                          userId: person.user_id,
                          userName:
                            person.full_name || person.username || "Kullanıcı",
                          userAvatar: person.avatar_url,
                        })
                      }
                    />
                  </View>
                ))}
            </>
          )}
        </SectionCard>
      )}

      {!!notice && (
        <View
          style={{
            backgroundColor: COLORS.text,
            paddingVertical: 13,
            paddingHorizontal: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              color: COLORS.whiteSoft,
              textAlign: "center",
              fontWeight: "900",
            }}
          >
            {notice}
          </Text>
        </View>
      )}

      <SoftPillButton
        label="Düzenle"
        icon="create-outline"
        onPress={() => router.push(`/edit-book/${book.id}` as const)}
      />

      <SoftPillButton
        label={
          book.status === "reading"
            ? "Okudum olarak işaretle"
            : book.status === "read"
              ? "İstiyorum listesine al"
              : "Okumaya başla"
        }
        icon="swap-horizontal-outline"
        onPress={cycleStatus}
        variant="primary"
      />
      <SoftPillButton
        label="Kitap Topluluğuna Git"
        icon="chatbubbles-outline"
        onPress={openBookCommunity}
        variant="primary"
      />

      <SoftPillButton
        label="Paylaş"
        icon="share-social-outline"
        onPress={() => router.push(`/share/${book.id}` as const)}
        variant="primary"
      />
      <SoftPillButton
        label={deletingBook ? "Siliniyor..." : "Kitabı Sil"}
        icon="trash-outline"
        variant="danger"
        disabled={deletingBook}
        onPress={confirmDelete}
      />
      <SoftPillButton
        label="Geri"
        icon="arrow-back-outline"
        onPress={() => router.back()}
      />
    </ScrollView>
  );
}
