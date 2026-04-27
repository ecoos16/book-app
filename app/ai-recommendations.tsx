// app/ai-recommendations.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useBooks } from "../context/BooksContext";
import type { AIRecommendedBook, BookRecommendationSeed } from "../types/book";

type RecommendedBookWithThumbnail = AIRecommendedBook & {
  thumbnail?: string;
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
  peachSoft: "#f7dfcc",
  graySoft: "#f3efe8",
  dangerText: "#a22b2b",
};

const recommendationCache = new Map<string, RecommendedBookWithThumbnail[]>();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const GOOGLE_BOOKS_API_KEYS = [
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_1,
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_2,
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_3,
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_4,
].filter((key): key is string => Boolean(key && key.trim()));

let googleBooksKeyIndex = 0;

function getNextGoogleBooksKey() {
  if (GOOGLE_BOOKS_API_KEYS.length === 0) return "";

  const key =
    GOOGLE_BOOKS_API_KEYS[googleBooksKeyIndex % GOOGLE_BOOKS_API_KEYS.length];
  googleBooksKeyIndex += 1;

  return key;
}

async function fetchGoogleBooksWithKeyRotation(query: string) {
  const attempts = Math.max(GOOGLE_BOOKS_API_KEYS.length, 1);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const apiKey = getNextGoogleBooksKey();

    const url =
      `https://www.googleapis.com/books/v1/volumes` +
      `?q=${encodeURIComponent(query)}` +
      `&printType=books` +
      `&maxResults=5` +
      `&orderBy=relevance` +
      (apiKey ? `&key=${apiKey}` : "");

    const response = await fetch(url);

    if (response.status === 429) {
      console.log(
        `GOOGLE BOOKS 429 - key değiştiriliyor (${attempt + 1}/${attempts})`,
      );
      await wait(350);
      continue;
    }

    return response;
  }

  return null;
}

function buildSeeds(books: ReturnType<typeof useBooks>["books"]) {
  const ratedReadBooks = books
    .filter((book) => book.status === "read" && typeof book.rating === "number")
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const favoriteBooks = ratedReadBooks.filter(
    (book) => (book.rating ?? 0) >= 4,
  );

  const fallbackBooks = ratedReadBooks.length > 0 ? ratedReadBooks : books;
  const source = favoriteBooks.length > 0 ? favoriteBooks : fallbackBooks;

  const seeds: BookRecommendationSeed[] = source.slice(0, 10).map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    rating: book.rating,
    note: book.note,
    categories: book.categories,
    description: book.description,
  }));

  return seeds;
}

export default function AIRecommendationsScreen() {
  const { books } = useBooks();

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<
    RecommendedBookWithThumbnail[]
  >([]);
  const [error, setError] = useState("");

  const seeds = useMemo(() => buildSeeds(books), [books]);
  const canRecommend = seeds.length > 0;

  async function getRecommendations() {
    setError("");

    if (!canRecommend) {
      setError(
        "Öneri oluşturmak için önce birkaç kitabı okudum olarak işaretleyip puan vermelisin.",
      );
      return;
    }

    try {
      setLoading(true);

      const topCategories = Array.from(
        new Set(seeds.flatMap((book) => book.categories ?? [])),
      ).slice(0, 3);

      const topAuthors = Array.from(
        new Set(seeds.map((book) => book.author).filter(Boolean)),
      ).slice(0, 3);

      const readTitles = new Set(
        books.map((book) => book.title.trim().toLowerCase()),
      );

      const queries = [
        ...topCategories.map((category) => `subject:${category}`),
        ...topAuthors.map((author) => `inauthor:${author}`),
        "fiction",
        "novel",
      ];

      const results: RecommendedBookWithThumbnail[] = [];

      const limitedQueries = queries.slice(0, 3);

      for (const query of limitedQueries) {
        const cached = recommendationCache.get(query);

        if (cached) {
          results.push(...cached);
          if (results.length >= 5) break;
          continue;
        }

        await wait(500);

        const response = await fetchGoogleBooksWithKeyRotation(query);

        if (!response) {
          setError("Google Books limiti doldu. Biraz bekleyip tekrar dene.");
          break;
        }

        if (!response.ok) {
          console.log("GOOGLE BOOKS RESPONSE ERROR:", response.status);
          continue;
        }

        const json = await response.json();
        const items = Array.isArray(json.items) ? json.items : [];
        const queryResults: RecommendedBookWithThumbnail[] = [];

        for (const item of items) {
          const info = item.volumeInfo ?? {};
          const title = String(info.title ?? "").trim();
          const author = Array.isArray(info.authors)
            ? info.authors.join(", ")
            : "Yazar bilinmiyor";

          if (!title) continue;
          if (readTitles.has(title.toLowerCase())) continue;

          if (
            results.some(
              (book) => book.title.toLowerCase() === title.toLowerCase(),
            ) ||
            queryResults.some(
              (book) => book.title.toLowerCase() === title.toLowerCase(),
            )
          ) {
            continue;
          }

          const categories = Array.isArray(info.categories)
            ? info.categories
            : [];

          const categoryMatch = categories.some((cat: string) =>
            topCategories.some((top) =>
              cat.toLowerCase().includes(top.toLowerCase()),
            ),
          );

          const authorMatch = topAuthors.some((topAuthor) =>
            author.toLowerCase().includes(topAuthor.toLowerCase()),
          );

          const matchScore = Math.min(
            96,
            72 + (categoryMatch ? 12 : 0) + (authorMatch ? 10 : 0),
          );

          queryResults.push({
            id: String(item.id ?? `${title}-${author}`),
            title,
            author,
            reason: categoryMatch
              ? `Okuduğun ve yüksek puan verdiğin kitaplarda ${topCategories.join(
                  ", ",
                )} türleri öne çıkıyor. Bu kitap benzer türlerde olduğu için sana uygun olabilir.`
              : authorMatch
                ? "Daha önce sevdiğin yazarlara yakın bir çizgide olduğu için önerildi."
                : "Okuma geçmişindeki tür ve yazar tercihlerine yakın olduğu için önerildi.",
            matchScore,
            suggestedStatus: "want",
            thumbnail:
              info.imageLinks?.thumbnail?.replace("http://", "https://") ??
              info.imageLinks?.smallThumbnail?.replace("http://", "https://"),
          });
        }

        recommendationCache.set(query, queryResults);
        results.push(...queryResults);

        if (results.length >= 5) break;
      }

      if (results.length === 0) {
        setRecommendations([
          {
            id: "fallback-1",
            title: "Benzer Atmosferde Bir Roman",
            author: "Google Books öneri taslağı",
            reason:
              "Okuma geçmişine göre benzer türlerde kitaplar sana uygun olabilir.",
            matchScore: 80,
            suggestedStatus: "want",
          },
        ]);
        return;
      }

      setRecommendations(
        results
          .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
          .slice(0, 5),
      );
    } catch (err) {
      console.log("GOOGLE BOOKS RECOMMENDATION ERROR:", err);
      setRecommendations([
        {
          id: "fallback-1",
          title: "Benzer Atmosferde Bir Roman",
          author: "Öneri sistemi",
          reason:
            "Okuma geçmişine göre akıcı, karakter odaklı ve benzer atmosferli kitaplar sana uygun olabilir.",
          matchScore: 82,
          suggestedStatus: "want",
        },
      ]);
      setError(
        "Google Books önerileri alınamadı, geçici öneriler gösteriliyor.",
      );
    } finally {
      setLoading(false);
    }
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

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 27, fontWeight: "900", color: COLORS.text }}>
            AI Kitap Önerileri
          </Text>
          <Text style={{ color: COLORS.muted, marginTop: 4 }}>
            Puanladığın kitaplara göre sana özel öneriler.
          </Text>
        </View>
      </View>

      <View
        style={{
          borderRadius: 24,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
          padding: 16,
          gap: 10,
        }}
      >
        <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 18 }}>
          Nasıl çalışır?
        </Text>

        <Text style={{ color: COLORS.muted, lineHeight: 21 }}>
          Okudum olarak işaretlediğin ve yıldız verdiğin kitaplar analiz edilir.
          Tür, yazar ve yıldız bilgilerine göre Google Books üzerinden gerçek
          kitap önerileri çıkarılır.
        </Text>

        <Text style={{ color: COLORS.primary, fontWeight: "800" }}>
          Analiz edilen kitap sayısı: {seeds.length}
        </Text>
      </View>

      {!canRecommend && (
        <View
          style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.peachSoft,
            padding: 16,
            gap: 8,
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: "900" }}>
            Henüz yeterli veri yok
          </Text>
          <Text style={{ color: COLORS.muted, lineHeight: 21 }}>
            Birkaç kitabı “Okudum” yapıp yıldız verirsen daha doğru öneriler
            çıkarabiliriz.
          </Text>
        </View>
      )}

      <Pressable
        onPress={getRecommendations}
        disabled={loading || !canRecommend}
        style={({ pressed }) => ({
          backgroundColor:
            loading || !canRecommend
              ? COLORS.graySoft
              : pressed
                ? COLORS.primaryDark
                : COLORS.primary,
          paddingVertical: 16,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 10,
          opacity: loading || !canRecommend ? 0.7 : 1,
        })}
      >
        {loading ? (
          <ActivityIndicator color="#fff7f4" />
        ) : (
          <Ionicons
            name="sparkles-outline"
            size={20}
            color={canRecommend ? "#fff7f4" : COLORS.muted}
          />
        )}

        <Text
          style={{
            color: canRecommend ? "#fff7f4" : COLORS.muted,
            fontWeight: "900",
            fontSize: 15,
          }}
        >
          {loading ? "Öneriler hazırlanıyor..." : "Bana Kitap Öner"}
        </Text>
      </Pressable>

      {!!error && (
        <Text style={{ color: COLORS.dangerText, lineHeight: 21 }}>
          {error}
        </Text>
      )}

      {recommendations.map((item, index) => (
        <View
          key={item.id || `${item.title}-${index}`}
          style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.card,
            padding: 16,
            gap: 10,
          }}
        >
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: COLORS.primarySoft,
            }}
          >
            <Text style={{ color: COLORS.primary, fontWeight: "900" }}>
              %{item.matchScore ?? 80} uyum
            </Text>
          </View>

          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail }}
              style={{
                width: 72,
                height: 108,
                borderRadius: 12,
                backgroundColor: COLORS.primarySoft,
              }}
              resizeMode="cover"
            />
          ) : null}

          <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 20 }}>
            {item.title}
          </Text>

          <Text style={{ color: COLORS.muted, fontWeight: "700" }}>
            {item.author}
          </Text>

          <Text style={{ color: COLORS.text, lineHeight: 22 }}>
            {item.reason}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
