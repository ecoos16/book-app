// app/ai-recommendations.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import { useBooks } from "../context/BooksContext";
import type { AIRecommendedBook, BookRecommendationSeed } from "../types/book";

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
  dangerText: "#a22b2b",
};

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

function localRecommendationFallback(
  seeds: BookRecommendationSeed[],
): AIRecommendedBook[] {
  const topAuthors = Array.from(
    new Set(seeds.map((seed) => seed.author).filter(Boolean)),
  ).slice(0, 3);

  const topCategories = Array.from(
    new Set(seeds.flatMap((seed) => seed.categories ?? [])),
  ).slice(0, 4);

  const authorText =
    topAuthors.length > 0 ? topAuthors.join(", ") : "sevdiğin yazarlar";
  const categoryText =
    topCategories.length > 0 ? topCategories.join(", ") : "benzer türler";

  return [
    {
      id: "local-1",
      title: "Benzer Atmosferde Bir Roman",
      author: authorText,
      reason: `Puanladığın kitaplarda ${categoryText} çizgisi öne çıkıyor. Bu nedenle aynı atmosferi taşıyan kitapları sevebilirsin.`,
      matchScore: 86,
      suggestedStatus: "want",
    },
    {
      id: "local-2",
      title: "Duygusal Derinliği Yüksek Bir Kitap",
      author: "AI öneri taslağı",
      reason:
        "Yüksek puan verdiğin kitaplarda karakter gelişimi ve duygusal yoğunluk öne çıkıyor.",
      matchScore: 82,
      suggestedStatus: "want",
    },
    {
      id: "local-3",
      title: "Akıcı ve Sürükleyici Bir Okuma",
      author: "AI öneri taslağı",
      reason:
        "Okuma geçmişine göre akıcı anlatımı olan, hızlı ilerleyen kitaplar sana uygun görünüyor.",
      matchScore: 78,
      suggestedStatus: "want",
    },
  ];
}

export default function AIRecommendationsScreen() {
  const { books } = useBooks();

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendedBook[]>(
    [],
  );
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

      const { data, error: functionError } = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/book-recommendations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ books: seeds }),
        },
      ).then(async (res) => {
        const json = await res.json().catch(() => ({}));
        return { data: json, error: !res.ok ? json : null };
      });

      if (functionError) {
        console.log("AI RECOMMENDATION FUNCTION ERROR:", functionError);
        setRecommendations(localRecommendationFallback(seeds));
        setError(
          "AI servisine ulaşılamadı, geçici olarak yerel öneri taslağı gösteriliyor.",
        );
        return;
      }

      const nextRecommendations = Array.isArray(data?.recommendations)
        ? data.recommendations
        : [];

      if (nextRecommendations.length === 0) {
        setRecommendations(localRecommendationFallback(seeds));
        return;
      }

      setRecommendations(nextRecommendations);
    } catch (err) {
      console.log("AI RECOMMENDATION ERROR:", err);
      setRecommendations(localRecommendationFallback(seeds));
      setError(
        "AI servisine ulaşılamadı, geçici olarak yerel öneri taslağı gösteriliyor.",
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
          Özellikle 4 ve 5 yıldız verdiğin kitaplar öneride daha etkili olur.
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
