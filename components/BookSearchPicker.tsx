// components/BookSearchPicker.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { getAIDiscoveryRecommendations } from "../lib/aiDiscovery";
import { searchGoogleBooks } from "../lib/googleBooks";
import { supabase } from "../lib/supabase";
import type { GoogleBook } from "../types/googleBooks";

const COLORS = {
  bg: "#fbf9f5",
  card: "#fffdf9",
  border: "#ece7df",
  text: "#2f2a24",
  muted: "#7a7268",
  primary: "#7d5739",
  primarySoft: "#f3e2d2",
  graySoft: "#f3efe8",
  whiteSoft: "#fff7f4",
  errorSoft: "#fff4f4",
  errorBorder: "#ffd8d8",
  errorText: "#a22b2b",
};

type Props = {
  onSelect: (item: GoogleBook) => void;
  initialQuery?: string;
};

type SearchBookSource = GoogleBook["source"] | "database" | "ai";
type SearchBook = Omit<GoogleBook, "source"> & {
  source?: SearchBookSource;
  dbBookId?: string;
  publisher?: string;
  isbn?: string;
};

type ProfileSearchRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type SupabaseBookRow = {
  id: string;
  title: string | null;
  author: string | null;
  thumbnail: string | null;
  description: string | null;
  page_count: number | null;
  categories?: string[] | null;
  language?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  source_type?: string | null;
  created_at?: string | null;
};

type StateMessage = {
  title: string;
  description: string;
  variant: "empty" | "error";
};

function getDisplayName(user: ProfileSearchRow) {
  return (
    user.full_name?.trim() ||
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
    user.username ||
    "Kullanıcı"
  );
}

function getInitials(name?: string) {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLocaleLowerCase("tr").replace(/\s+/g, " ");
}

function makeDuplicateKey(book: SearchBook) {
  const title = normalizeText(book.title);
  const authors = Array.isArray(book.authors)
    ? normalizeText(book.authors.join(", "))
    : "";

  return `${title}__${authors}`;
}
function removeDuplicateBooks(books: SearchBook[]) {
  const seen = new Set<string>();

  return books.filter((book) => {
    const key = makeDuplicateKey(book);

    if (!key.replace(/_/g, "").trim()) return false;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

async function searchBooksAuthorFirst(
  query: string,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  const trimmed = query.trim();

  const authorResults = await searchGoogleBooks(
    `inauthor:${trimmed}`,
    20,
    signal,
  );

  const cleanedAuthorResults = authorResults.filter((book) => {
    const title = normalizeText(book.title);

    const bannedWords = [
      "üzerine",
      "inceleme",
      "biyografi",
      "yazan",
      "anlatıyor",
      "romanları",
      "hayatı",
      "armağan",
      "sempozyumu",
    ];

    return !bannedWords.some((word) => title.includes(word));
  });

  if (cleanedAuthorResults.length >= 5) {
    return cleanedAuthorResults;
  }

  const normalResults = await searchGoogleBooks(trimmed, 10, signal);

  const merged = removeDuplicateBooks([
    ...cleanedAuthorResults.map(mapGoogleBookToSearchBook),
    ...normalResults.map(mapGoogleBookToSearchBook),
  ]);

  return merged.map((item) => item as GoogleBook);
}

function isDiscoveryQuery(query: string) {
  const q = normalizeText(query);

  const keywords = [
    "bilim kurgu",
    "roman",
    "fantazi",
    "psikoloji",
    "felsefe",
    "distopya",
    "korku",
    "polisiye",
    "tarih",
    "macera",
    "romantik",
    "çok satan",
    "popüler",
    "ödüllü",
    "klasik",
    "gençlik",
  ];

  return keywords.some((keyword) => q.includes(keyword));
}

function mapDbBookToSearchBook(book: SupabaseBookRow): SearchBook {
  return {
    id: `db-${book.id}`,
    title: book.title || "Başlıksız",
    authors: book.author ? [book.author] : [],
    thumbnail: book.thumbnail || undefined,
    description: book.description || undefined,
    pageCount:
      typeof book.page_count === "number" && book.page_count > 0
        ? book.page_count
        : undefined,
    categories: Array.isArray(book.categories) ? book.categories : undefined,
    language: book.language || undefined,
    source: "database",
    dbBookId: book.id,
    publisher: book.publisher || undefined,
    isbn: book.isbn || undefined,
  };
}

function mapGoogleBookToSearchBook(book: GoogleBook): SearchBook {
  return {
    ...book,
    source: book.source ?? "google",
  };
}

async function searchDatabaseBooks(query: string): Promise<SearchBook[]> {
  const safeQuery = query.trim();

  if (safeQuery.length < 2) return [];

  const { data, error } = await supabase
    .from("books")
    .select(
      `
      id,
      title,
      author,
      thumbnail,
      description,
      page_count,
      categories,
      language,
      isbn,
      publisher,
      source_type,
      created_at
    `,
    )
    .or(
      `title.ilike.%${safeQuery}%,author.ilike.%${safeQuery}%,publisher.ilike.%${safeQuery}%,isbn.ilike.%${safeQuery}%`,
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.log("SUPABASE BOOK SEARCH ERROR:", error);
    return [];
  }

  return ((data ?? []) as SupabaseBookRow[]).map(mapDbBookToSearchBook);
}

function UserResultCard({
  user,
  isMe,
  onPress,
}: {
  user: ProfileSearchRow;
  isMe: boolean;
  onPress: () => void;
}) {
  const displayName = getDisplayName(user);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 18,
        backgroundColor: pressed ? "#f5efe7" : COLORS.graySoft,
      })}
    >
      {user.avatar_url ? (
        <Image
          source={{ uri: user.avatar_url }}
          style={{ width: 46, height: 46, borderRadius: 23 }}
          resizeMode="cover"
        />
      ) : (
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
          <Text style={{ color: COLORS.primary, fontWeight: "900" }}>
            {getInitials(displayName)}
          </Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{ color: COLORS.text, fontWeight: "900", fontSize: 15 }}
        >
          {displayName}
        </Text>

        <Text numberOfLines={1} style={{ color: COLORS.muted, fontSize: 13 }}>
          {user.username ? `@${user.username}` : isMe ? "Sen" : "Okur"}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
    </Pressable>
  );
}

function BookCover({ thumbnail }: { thumbnail?: string }) {
  if (thumbnail) {
    return (
      <Image
        source={{ uri: thumbnail }}
        style={{ width: 56, height: 82, borderRadius: 10 }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: 56,
        height: 82,
        borderRadius: 10,
        backgroundColor: COLORS.primarySoft,
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
      }}
    >
      <Ionicons name="book-outline" size={24} color={COLORS.primary} />
      <Text style={{ fontSize: 10, color: COLORS.muted }}>Kapak yok</Text>
    </View>
  );
}

function SourceBadge({ source }: { source?: SearchBookSource }) {
  if (!source) return null;

  const isDatabase = source === "database";
  const isAI = source === "ai";

  return (
    <View
      style={{
        alignSelf: "flex-start",
        marginTop: 7,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: isDatabase ? COLORS.primarySoft : COLORS.graySoft,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "900",
          color: isDatabase ? COLORS.primary : COLORS.muted,
        }}
      >
        {isAI
          ? "AI önerisi"
          : isDatabase
            ? "ReadSphere veritabanı"
            : "Google Books"}{" "}
      </Text>
    </View>
  );
}

function SearchResultCard({
  item,
  onPress,
}: {
  item: SearchBook;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        gap: 12,
        padding: 12,
        borderWidth: 1,
        borderColor:
          item.source === "database" ? COLORS.primarySoft : COLORS.border,
        borderRadius: 18,
        backgroundColor: pressed ? "#f5efe7" : COLORS.card,
        alignItems: "center",
      })}
    >
      <BookCover thumbnail={item.thumbnail} />

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "900",
            flex: 1,
            color: COLORS.text,
          }}
          numberOfLines={2}
        >
          {item.title || "Başlıksız"}
        </Text>

        <Text
          style={{ color: COLORS.muted, marginTop: 4, fontSize: 13 }}
          numberOfLines={1}
        >
          {item.authors?.join(", ") || "Yazar bilinmiyor"}
        </Text>

        <Text style={{ color: COLORS.muted, marginTop: 4, fontSize: 12 }}>
          {item.pageCount ? `${item.pageCount} sayfa` : "Sayfa bilgisi yok"}
        </Text>

        <SourceBadge source={item.source} />
      </View>
    </Pressable>
  );
}

function SearchStateBox({ message }: { message: StateMessage }) {
  const isEmpty = message.variant === "empty";

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: isEmpty ? COLORS.border : COLORS.errorBorder,
        borderRadius: 18,
        paddingVertical: 22,
        paddingHorizontal: 16,
        backgroundColor: isEmpty ? COLORS.card : COLORS.errorSoft,
        alignItems: "center",
        gap: 8,
      }}
    >
      <Ionicons
        name={isEmpty ? "search-outline" : "alert-circle-outline"}
        size={24}
        color={COLORS.primary}
      />

      <Text
        style={{
          fontWeight: "900",
          color: isEmpty ? COLORS.text : COLORS.errorText,
        }}
      >
        {message.title}
      </Text>

      <Text
        style={{
          color: isEmpty ? COLORS.muted : COLORS.errorText,
          textAlign: "center",
        }}
      >
        {message.description}
      </Text>
    </View>
  );
}

export default function BookSearchPicker({ onSelect, initialQuery }: Props) {
  const { user: authUser } = useAuth();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [bookResults, setBookResults] = useState<SearchBook[]>([]);
  const [userResults, setUserResults] = useState<ProfileSearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<StateMessage | null>(null);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const q = debouncedQuery.trim();

    if (q.length < 2) {
      setBookResults([]);
      setUserResults([]);
      setMessage(null);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }

    const runSearch = async () => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        setMessage(null);

        let googleBooksData: GoogleBook[] = [];

        const discoveryMode = isDiscoveryQuery(q);
        if (discoveryMode) {
          const aiBooks = await getAIDiscoveryRecommendations({
            genre: q,
            limit: 8,
          });

          const aiResults: SearchBook[] = [];

          for (let index = 0; index < aiBooks.length; index++) {
            const book = aiBooks[index];

            const title = book.title?.trim() || "";
            const author = book.author?.trim() || "";

            let matchedBook: GoogleBook | null = null;

            try {
              const query = author
                ? `intitle:${title} inauthor:${author}`
                : title;

              const results = await searchGoogleBooks(
                query,
                3,
                controller.signal,
              );

              matchedBook = results[0] ?? null;
            } catch (error) {
              console.log("AI PREVIEW MATCH ERROR:", error);
            }

            aiResults.push({
              id: matchedBook?.id || `ai-${normalizeText(title)}-${index}`,
              title: matchedBook?.title || title,
              authors:
                matchedBook?.authors && matchedBook.authors.length > 0
                  ? matchedBook.authors
                  : author
                    ? [author]
                    : [],
              thumbnail: matchedBook?.thumbnail,
              pageCount: matchedBook?.pageCount,
              description: matchedBook?.description || book.reason,
              categories: matchedBook?.categories,
              publishedDate: matchedBook?.publishedDate,
              language: matchedBook?.language,
              source: "ai",
            });
          }

          setBookResults(aiResults);
          setUserResults([]);

          setMessage(
            aiResults.length === 0
              ? {
                  title: "AI öneri bulamadı",
                  description: "Farklı bir tür veya arama kelimesi dene.",
                  variant: "empty",
                }
              : null,
          );

          return;
        } else {
          googleBooksData = await searchBooksAuthorFirst(q, controller.signal);
        }

        const [dbBooksData, usersResponse] = await Promise.all([
          searchDatabaseBooks(q),

          supabase
            .from("profiles")
            .select(
              "id, username, full_name, first_name, last_name, avatar_url",
            )
            .or(
              `username.ilike.%${q}%,full_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`,
            )
            .limit(10),
        ]);

        if (controller.signal.aborted) return;

        if (usersResponse.error) {
          console.log("USER SEARCH ERROR:", usersResponse.error);
        }

        const users = (usersResponse.data ?? []) as ProfileSearchRow[];

        const googleBooks = googleBooksData.map(mapGoogleBookToSearchBook);
        console.log(
          "FINAL GOOGLE BOOKS:",
          googleBooks.map((b) => b.title),
        );
        const combinedBooks = removeDuplicateBooks([
          ...dbBooksData,
          ...googleBooks,
        ]).slice(0, 30);

        setBookResults(combinedBooks);
        setUserResults(users);

        if (combinedBooks.length === 0 && users.length === 0) {
          setMessage({
            title: "Sonuç bulunamadı",
            description:
              "Farklı bir kitap, yazar veya kullanıcı adı dene. AI ile eklenen kitaplar da burada aranır.",
            variant: "empty",
          });
        }
      } catch (error: any) {
        if (error?.name === "AbortError") return;

        setBookResults([]);
        setUserResults([]);
        setMessage({
          title: "Arama hatası",
          description:
            typeof error?.message === "string"
              ? error.message
              : "Arama sırasında bir hata oluştu.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    runSearch();
  }, [debouncedQuery]);

  const handleClear = () => {
    abortRef.current?.abort();
    setQuery("");
    setDebouncedQuery("");
    setBookResults([]);
    setUserResults([]);
    setMessage(null);
    setLoading(false);
  };

  const handleSelectBook = async (item: SearchBook) => {
    // AI önerisine tıklanınca önce Google Books'ta gerçek kitap detayını ara
    if (item.source === "ai") {
      try {
        setLoading(true);

        const title = item.title?.trim() || "";
        const author = Array.isArray(item.authors)
          ? item.authors.join(" ").trim()
          : "";

        const query = author ? `intitle:${title} inauthor:${author}` : title;

        const results = await searchGoogleBooks(query, 5);

        const bestMatch = results[0];

        if (bestMatch) {
          onSelect(bestMatch);
        } else {
          // Google Books eşleşmesi bulunamazsa AI verisiyle formu doldur
          onSelect(item as GoogleBook);
        }
      } catch (error) {
        console.log("AI BOOK DETAIL MATCH ERROR:", error);

        // Hata olursa yine AI verisiyle formu doldur
        onSelect(item as GoogleBook);
      } finally {
        setLoading(false);
        setBookResults([]);
        setUserResults([]);
        setMessage(null);
      }

      return;
    }

    // Normal Google Books / database sonucunda mevcut davranış
    onSelect(item as GoogleBook);
    setBookResults([]);
    setUserResults([]);
    setMessage(null);
  };

  const handleSelectUser = (userId: string) => {
    handleClear();

    if (userId === authUser?.id) {
      router.push("/profile");
      return;
    }

    router.push({
      pathname: "/user/[id]",
      params: { id: userId },
    });
  };

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: COLORS.card,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Ionicons name="search-outline" size={18} color={COLORS.muted} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Kitap, yazar veya kullanıcı ara"
          placeholderTextColor="#9a9389"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={{
            flex: 1,
            fontSize: 15,
            color: COLORS.text,
          }}
        />

        {!!query.trim() && (
          <Pressable onPress={handleClear}>
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </Pressable>
        )}
      </View>

      {query.trim().length > 0 && query.trim().length < 2 && (
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
          Aramak için en az 2 karakter yaz.
        </Text>
      )}

      {loading && (
        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 18,
            paddingVertical: 18,
            paddingHorizontal: 14,
            backgroundColor: COLORS.card,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ActivityIndicator color={COLORS.primary} />
          <Text style={{ color: COLORS.muted }}>Aranıyor...</Text>
        </View>
      )}

      {!loading && !!message && <SearchStateBox message={message} />}

      {!loading && userResults.length > 0 && (
        <View
          style={{
            gap: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 20,
            padding: 10,
            backgroundColor: COLORS.card,
          }}
        >
          <Text
            style={{
              fontWeight: "900",
              color: COLORS.text,
              marginBottom: 4,
              fontSize: 15,
            }}
          >
            Kullanıcılar
          </Text>

          {userResults.map((user) => (
            <UserResultCard
              key={user.id}
              user={user}
              isMe={user.id === authUser?.id}
              onPress={() => handleSelectUser(user.id)}
            />
          ))}
        </View>
      )}

      {!loading && bookResults.length > 0 && (
        <View
          style={{
            gap: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 20,
            padding: 10,
            backgroundColor: COLORS.card,
          }}
        >
          <Text
            style={{
              fontWeight: "900",
              color: COLORS.text,
              marginBottom: 4,
              fontSize: 15,
            }}
          >
            Kitaplar
          </Text>

          {bookResults.map((item) => (
            <SearchResultCard
              key={item.id}
              item={item}
              onPress={() => handleSelectBook(item)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
