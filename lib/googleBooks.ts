import { GoogleBook } from "../types/googleBooks";

const GOOGLE_BASE_URL = "https://www.googleapis.com/books/v1/volumes";

const GOOGLE_KEYS = [
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_1,
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_2,
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_3,
].filter(Boolean) as string[];

console.log("🔑 GOOGLE KEYS LOADED:", GOOGLE_KEYS);
const cache = new Map<string, { at: number; data: GoogleBook[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

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

  console.log("📚 GOOGLE REQUEST:", url);

  const res = await fetch(url, { signal });

  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }

  if (res.status === 403) {
    throw new Error("GOOGLE_403");
  }

  if (res.status === 400) {
    throw new Error("GOOGLE_400");
  }

  if (!res.ok) {
    throw new Error(`GOOGLE_${res.status}`);
  }

  const data = await res.json();
  console.log("📚 GOOGLE RESPONSE:", data);

  const items = Array.isArray(data.items) ? data.items : [];
  return items.map(mapGoogleVolume);
}

async function searchGoogleSequential(
  query: string,
  maxResults = 10,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  if (GOOGLE_KEYS.length === 0) {
    throw new Error("NO_GOOGLE_KEYS");
  }

  let lastError: unknown = null;

  for (const key of GOOGLE_KEYS) {
    try {
      const results = await searchGoogleWithKey(query, key, maxResults, signal);

      if (results.length > 0) {
        return results;
      }

      lastError = new Error("EMPTY_RESULTS");
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;

      console.log("❌ GOOGLE KEY FAILED:", error?.message || error);
      lastError = error;
    }
  }

  throw lastError ?? new Error("GOOGLE_UNKNOWN");
}

export async function searchGoogleBooks(
  query: string,
  maxResults = 10,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  const q = query.trim();

  if (q.length < 2) return [];

  const cacheKey = `${q.toLowerCase()}__${maxResults}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    console.log("📦 CACHE HIT:", q);
    return cached.data;
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  try {
    const googleResults = await searchGoogleSequential(q, maxResults, signal);

    cache.set(cacheKey, {
      at: Date.now(),
      data: googleResults,
    });

    return googleResults;
  } catch (error: any) {
    if (error?.name === "AbortError") throw error;

    const message = error?.message || "GOOGLE_UNKNOWN";
    console.log("❌ GOOGLE FINAL ERROR:", message);

    if (message === "RATE_LIMIT") {
      throw new Error("RATE_LIMIT");
    }

    if (message === "NO_GOOGLE_KEYS") {
      throw new Error("Google Books API key bulunamadı.");
    }

    if (message === "GOOGLE_403") {
      throw new Error(
        "Google Books erişimi reddedildi. API key yanlış olabilir ya da kısıtlı olabilir.",
      );
    }

    if (message === "GOOGLE_400") {
      throw new Error("Google Books isteği hatalı gönderildi.");
    }

    if (message === "EMPTY_RESULTS") {
      return [];
    }

    throw new Error(`Google Books hatası: ${message}`);
  }
}
