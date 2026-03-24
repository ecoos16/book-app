// lib/googleBooks.ts

import { GoogleBook } from "../types/googleBooks";

/**
 * ===============================
 * 🔹 API ENDPOINT'LER
 * ===============================
 */
const GOOGLE_BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const OPENLIBRARY_BASE_URL = "https://openlibrary.org/search.json";

/**
 * ===============================
 * 🔹 API KEY YÖNETİMİ
 * ===============================
 *
 * Birden fazla key kullanıyoruz:
 * - rate limit'e takılmamak için
 * - paralel deneme yapabilmek için
 */
const GOOGLE_KEYS = [
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_1,
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_2,
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_3,
].filter(Boolean) as string[];

/**
 * ===============================
 * 🔹 CACHE MEKANİZMASI
 * ===============================
 *
 * Aynı arama kısa sürede tekrar yapılırsa
 * API'ye gitmeyip cache kullanılır
 */
const cache = new Map<string, { at: number; data: GoogleBook[] }>();

/**
 * Cache süresi: 5 dakika
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * ===============================
 * 🔹 HELPER FONKSİYONLAR
 * ===============================
 */

/**
 * Güvenli string normalize etme
 */
function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/**
 * Google imageLinks içinden en uygun thumbnail seç
 */
function pickGoogleThumbnail(images?: Record<string, string>) {
  if (!images) return undefined;

  const url =
    images.thumbnail ||
    images.smallThumbnail ||
    images.small ||
    images.medium ||
    images.large ||
    images.extraLarge;

  // http → https fix
  return url ? url.replace("http://", "https://") : undefined;
}

/**
 * ===============================
 * 🔹 MAPPING (API → APP MODEL)
 * ===============================
 */

/**
 * Google Books item → GoogleBook
 */
function mapGoogleVolume(item: any): GoogleBook {
  const v = item?.volumeInfo ?? {};

  return {
    id: normalizeText(item?.id, `google-${Date.now()}`),
    title: normalizeText(v.title, "Bilinmeyen Kitap"),
    authors: Array.isArray(v.authors) ? v.authors.filter(Boolean) : [],
    description: typeof v.description === "string" ? v.description : undefined,
    categories: Array.isArray(v.categories)
      ? v.categories.filter(Boolean)
      : undefined,
    pageCount: typeof v.pageCount === "number" ? v.pageCount : undefined,
    thumbnail: pickGoogleThumbnail(v.imageLinks),
    publishedDate:
      typeof v.publishedDate === "string" ? v.publishedDate : undefined,
    language: typeof v.language === "string" ? v.language : undefined,
    source: "google",
  };
}

/**
 * OpenLibrary item → GoogleBook (ortak model)
 */
function mapOpenLibraryDoc(doc: any): GoogleBook {
  const coverId = doc?.cover_i;

  const thumbnail = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
    : undefined;

  return {
    id: doc?.key ? `openlib-${doc.key}` : `openlib-${Date.now()}`,
    title: normalizeText(doc?.title, "Bilinmeyen Kitap"),
    authors: Array.isArray(doc?.author_name)
      ? doc.author_name.filter(Boolean)
      : [],
    description: undefined,
    categories: Array.isArray(doc?.subject)
      ? doc.subject.filter(Boolean).slice(0, 5)
      : undefined,
    pageCount:
      typeof doc?.number_of_pages_median === "number"
        ? doc.number_of_pages_median
        : undefined,
    thumbnail,
    publishedDate: doc?.first_publish_year
      ? String(doc.first_publish_year)
      : undefined,
    language: Array.isArray(doc?.language) ? doc.language[0] : undefined,
    source: "openlibrary",
  };
}

/**
 * ===============================
 * 🔹 GOOGLE SEARCH (TEK KEY)
 * ===============================
 */
async function searchGoogleWithKey(
  query: string,
  key: string,
  maxResults = 10,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  const url =
    `${GOOGLE_BASE_URL}?q=${encodeURIComponent(query)}` +
    `&maxResults=${Math.min(Math.max(maxResults, 1), 20)}` +
    `&printType=books&orderBy=relevance` +
    `&key=${encodeURIComponent(key)}`;

  const res = await fetch(url, { signal });

  /**
   * Rate limit
   */
  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }

  /**
   * Diğer hatalar
   */
  if (!res.ok) {
    throw new Error(`GOOGLE_${res.status}`);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  return items.map(mapGoogleVolume);
}

/**
 * ===============================
 * 🔹 GOOGLE SEARCH (PARALEL KEY)
 * ===============================
 */
async function searchGoogleParallel(
  query: string,
  maxResults = 10,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  if (GOOGLE_KEYS.length === 0) return [];

  const wrapped = GOOGLE_KEYS.map((key) =>
    searchGoogleWithKey(query, key, maxResults, signal).then((results) => {
      // boş sonuçları başarısız say
      if (!results.length) throw new Error("EMPTY_RESULTS");
      return results;
    }),
  );

  try {
    return await Promise.any(wrapped);
  } catch (error) {
    console.log("❌ Google başarısız:", error);
    return [];
  }
}

/**
 * ===============================
 * 🔹 OPENLIBRARY FALLBACK
 * ===============================
 */
async function searchOpenLibraryBooks(
  query: string,
  maxResults = 10,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  const url =
    `${OPENLIBRARY_BASE_URL}?q=${encodeURIComponent(query)}` +
    `&limit=${Math.min(Math.max(maxResults, 1), 20)}`;

  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw new Error(`OPENLIB_${res.status}`);
  }

  const data = await res.json();
  const docs = Array.isArray(data.docs) ? data.docs : [];

  return docs.map(mapOpenLibraryDoc);
}

/**
 * ===============================
 * 🔹 ANA SEARCH FONKSİYONU
 * ===============================
 *
 * Özellikler:
 * - min karakter kontrolü
 * - cache
 * - abort desteği
 * - google → fallback openlibrary
 */
export async function searchGoogleBooks(
  query: string,
  maxResults = 10,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  const q = query.trim();

  /**
   * Çok kısa sorgu → boş
   */
  if (q.length < 2) return [];

  /**
   * Cache kontrol
   */
  const cacheKey = `${q.toLowerCase()}__${maxResults}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }

  /**
   * Abort check
   */
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  /**
   * 1️⃣ Google dene
   */
  const googleResults = await searchGoogleParallel(q, maxResults, signal);

  if (googleResults.length > 0) {
    cache.set(cacheKey, { at: Date.now(), data: googleResults });
    return googleResults;
  }

  /**
   * 2️⃣ Fallback → OpenLibrary
   */
  try {
    const openResults = await searchOpenLibraryBooks(q, maxResults, signal);
    cache.set(cacheKey, { at: Date.now(), data: openResults });
    return openResults;
  } catch (error: any) {
    if (error?.name === "AbortError") throw error;

    console.log("❌ OpenLibrary başarısız:", error?.message || error);
    return [];
  }
}
