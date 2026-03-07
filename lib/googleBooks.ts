import { GoogleBook } from "../types/googleBooks";

const GOOGLE_BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const OPENLIBRARY_BASE_URL = "https://openlibrary.org/search.json";

const GOOGLE_KEYS = [
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_1,
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_2,
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_3,
].filter(Boolean) as string[];

const cache = new Map<string, { at: number; data: GoogleBook[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

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
    id: item?.id ?? `google-${Date.now()}`,
    title: v.title ?? "Bilinmeyen Kitap",
    authors: Array.isArray(v.authors) ? v.authors : [],
    description: typeof v.description === "string" ? v.description : undefined,
    categories: Array.isArray(v.categories) ? v.categories : undefined,
    pageCount: typeof v.pageCount === "number" ? v.pageCount : undefined,
    thumbnail: pickGoogleThumbnail(v.imageLinks),
    publishedDate:
      typeof v.publishedDate === "string" ? v.publishedDate : undefined,
    language: typeof v.language === "string" ? v.language : undefined,
    source: "google",
  };
}

function mapOpenLibraryDoc(doc: any): GoogleBook {
  const coverId = doc?.cover_i;
  const thumbnail = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
    : undefined;

  return {
    id: doc?.key ? `openlib-${doc.key}` : `openlib-${Date.now()}`,
    title: doc?.title ?? "Bilinmeyen Kitap",
    authors: Array.isArray(doc?.author_name) ? doc.author_name : [],
    description: undefined,
    categories: Array.isArray(doc?.subject)
      ? doc.subject.slice(0, 5)
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

  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }

  if (!res.ok) {
    throw new Error(`GOOGLE_${res.status}`);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map(mapGoogleVolume);
}

async function searchGoogleParallel(
  query: string,
  maxResults = 10,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  if (GOOGLE_KEYS.length === 0) return [];

  const wrappedPromises = GOOGLE_KEYS.map((key) =>
    searchGoogleWithKey(query, key, maxResults, signal).then((results) => {
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
    return cached.data;
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const googleResults = await searchGoogleParallel(q, maxResults, signal);

  if (googleResults.length > 0) {
    cache.set(cacheKey, { at: Date.now(), data: googleResults });
    return googleResults;
  }

  try {
    const openResults = await searchOpenLibraryBooks(q, maxResults, signal);
    cache.set(cacheKey, { at: Date.now(), data: openResults });
    return openResults;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw error;
    }

    console.log("OpenLibrary de başarısız:", error?.message || error);
    return [];
  }
}
