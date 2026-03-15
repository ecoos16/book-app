// lib/googleBooks.ts

import { GoogleBook } from "../types/googleBooks";

/**
 * Google Books ana endpoint
 */
const GOOGLE_BASE_URL = "https://www.googleapis.com/books/v1/volumes";

/**
 * Google başarısız olursa fallback olarak OpenLibrary
 */
const OPENLIBRARY_BASE_URL = "https://openlibrary.org/search.json";

/**
 * Ortam değişkenlerinden alınan Google Books API key'leri
 * Boş olanları filter(Boolean) ile çıkarıyoruz
 */
const GOOGLE_KEYS = [
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_1,
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_2,
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_3,
].filter(Boolean) as string[];

/**
 * Basit in-memory cache
 * Aynı arama kısa süre içinde tekrar yapılırsa API'ye yeniden gitmeyiz
 */
const cache = new Map<string, { at: number; data: GoogleBook[] }>();

/**
 * Cache süresi: 5 dakika
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Güvenli string temizleme yardımcı fonksiyonu
 * Gelen değer string değilse fallback döner
 */
function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/**
 * Google Books imageLinks içinden en uygun thumbnail'i seçer
 * http gelirse https'e çevirir
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

  return url ? url.replace("http://", "https://") : undefined;
}

/**
 * Google Books API'den gelen tek bir item'ı
 * uygulamanın kullandığı GoogleBook tipine dönüştürür
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
 * OpenLibrary'den gelen tek bir kaydı
 * ortak GoogleBook tipine dönüştürür
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
 * Belirli bir Google API key ile arama yapar
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
   * Google rate limit verirse özel hata fırlat
   */
  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }

  /**
   * Başka başarısız durumlar
   */
  if (!res.ok) {
    throw new Error(`GOOGLE_${res.status}`);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  return items.map(mapGoogleVolume);
}

/**
 * Elimizde birden fazla API key varsa
 * paralel deneyip ilk başarılı sonucu alır
 */
async function searchGoogleParallel(
  query: string,
  maxResults = 10,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  if (GOOGLE_KEYS.length === 0) return [];

  const wrappedPromises = GOOGLE_KEYS.map((key) =>
    searchGoogleWithKey(query, key, maxResults, signal).then((results) => {
      /**
       * Boş sonuç da başarısız kabul edilsin ki
       * diğer key'ler denenebilsin
       */
      if (!results.length) {
        throw new Error("EMPTY_RESULTS");
      }

      return results;
    }),
  );

  try {
    const results = await Promise.any(wrappedPromises);
    return results;
  } catch (error) {
    console.log("Google tarafı başarısız:", error);
    return [];
  }
}

/**
 * Google Books sonuç vermezse
 * OpenLibrary üzerinden arama yap
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
 * Uygulamanın dışarı açtığı ana kitap arama fonksiyonu
 *
 * Özellikler:
 * - min karakter kontrolü
 * - cache
 * - abort desteği
 * - önce Google, olmazsa OpenLibrary fallback
 */
export async function searchGoogleBooks(
  query: string,
  maxResults = 10,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  const q = query.trim();

  /**
   * Çok kısa sorgularda boş dön
   */
  if (q.length < 2) return [];

  /**
   * Cache key oluştur
   */
  const cacheKey = `${q.toLowerCase()}__${maxResults}`;
  const cached = cache.get(cacheKey);

  /**
   * Cache süresi dolmadıysa direkt cache dön
   */
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }

  /**
   * İstek başlamadan abort olduysa hata fırlat
   */
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  /**
   * Önce Google Books tarafını dene
   */
  const googleResults = await searchGoogleParallel(q, maxResults, signal);

  if (googleResults.length > 0) {
    cache.set(cacheKey, { at: Date.now(), data: googleResults });
    return googleResults;
  }

  /**
   * Google sonuç vermezse OpenLibrary dene
   */
  try {
    const openResults = await searchOpenLibraryBooks(q, maxResults, signal);
    cache.set(cacheKey, { at: Date.now(), data: openResults });
    return openResults;
  } catch (error: any) {
    /**
     * Abort hatasıysa aynen yukarı fırlat
     */
    if (error?.name === "AbortError") {
      throw error;
    }

    console.log("OpenLibrary de başarısız:", error?.message || error);
    return [];
  }
}
