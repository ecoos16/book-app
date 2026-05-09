// lib/googleBooks.ts
import type { GoogleBook } from "../types/googleBooks";

const GOOGLE_BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const CACHE_TTL_MS = 5 * 60 * 1000;

const GOOGLE_KEYS = [
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_1,
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_2,
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY_3,
].filter(
  (key): key is string => typeof key === "string" && key.trim().length > 0,
);

const cache = new Map<string, { at: number; data: GoogleBook[] }>();

type GoogleBooksApiResponse = {
  items?: GoogleVolume[];
};

type GoogleVolume = {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    categories?: string[];
    pageCount?: number;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    publishedDate?: string;
    language?: string;
  };
};

type SearchGoogleBooksErrorCode =
  | "NO_GOOGLE_KEYS"
  | "RATE_LIMIT"
  | "GOOGLE_400"
  | "GOOGLE_403"
  | "GOOGLE_UNKNOWN";

class SearchGoogleBooksError extends Error {
  code: SearchGoogleBooksErrorCode;

  constructor(code: SearchGoogleBooksErrorCode, message?: string) {
    super(message ?? code);
    this.name = "SearchGoogleBooksError";
    this.code = code;
  }
}

function normalizeText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function pickGoogleThumbnail(
  images?: GoogleVolume["volumeInfo"] extends infer V
    ? V extends { imageLinks?: infer I }
      ? I
      : never
    : never,
): string | undefined {
  if (!images) return undefined;

  const url =
    images.thumbnail ||
    images.smallThumbnail ||
    images.small ||
    images.medium ||
    images.large ||
    images.extraLarge;

  return typeof url === "string"
    ? url.replace("http://", "https://")
    : undefined;
}

function mapGoogleVolume(item: GoogleVolume, index: number): GoogleBook {
  const volumeInfo = item.volumeInfo ?? {};

  const safeAuthors = Array.isArray(volumeInfo.authors)
    ? volumeInfo.authors.filter(
        (author): author is string =>
          typeof author === "string" && author.trim().length > 0,
      )
    : [];

  const safeCategories = Array.isArray(volumeInfo.categories)
    ? volumeInfo.categories.filter(
        (category): category is string =>
          typeof category === "string" && category.trim().length > 0,
      )
    : undefined;

  const fallbackId =
    normalizeText(volumeInfo.title, "unknown-book")
      .toLocaleLowerCase("tr")
      .replace(/\s+/g, "-") + `-${index}`;

  return {
    id: normalizeText(item.id, fallbackId),
    title: normalizeText(volumeInfo.title, "Bilinmeyen Kitap"),
    authors: safeAuthors,
    description:
      typeof volumeInfo.description === "string"
        ? volumeInfo.description
        : undefined,
    categories: safeCategories,
    pageCount:
      typeof volumeInfo.pageCount === "number" && volumeInfo.pageCount > 0
        ? volumeInfo.pageCount
        : undefined,
    thumbnail: pickGoogleThumbnail(volumeInfo.imageLinks),
    publishedDate:
      typeof volumeInfo.publishedDate === "string"
        ? volumeInfo.publishedDate
        : undefined,
    language:
      typeof volumeInfo.language === "string" ? volumeInfo.language : undefined,
    source: "google",
  };
}

function buildSearchUrl(
  query: string,
  key: string,
  maxResults: number,
): string {
  const safeMaxResults = Math.min(Math.max(maxResults, 1), 40);

  return (
    `${GOOGLE_BASE_URL}?q=${encodeURIComponent(query)}` +
    `&maxResults=${safeMaxResults}` +
    `&printType=books` +
    `&orderBy=relevance` +
    `&langRestrict=tr` +
    `&country=TR` +
    `&key=${encodeURIComponent(key)}`
  );
}
async function searchGoogleWithKey(
  query: string,
  key: string,
  maxResults = 10,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  const url = buildSearchUrl(query, key, maxResults);
  const response = await fetch(url, { signal });

  if (response.status === 429) {
    throw new SearchGoogleBooksError("RATE_LIMIT");
  }

  if (response.status === 403) {
    throw new SearchGoogleBooksError("GOOGLE_403");
  }

  if (response.status === 400) {
    throw new SearchGoogleBooksError("GOOGLE_400");
  }

  if (!response.ok) {
    throw new SearchGoogleBooksError(
      "GOOGLE_UNKNOWN",
      `HTTP_${response.status}`,
    );
  }

  const data = (await response.json()) as GoogleBooksApiResponse;
  const items = Array.isArray(data.items) ? data.items : [];

  return items.map((item, index) => mapGoogleVolume(item, index));
}

async function searchGoogleSequential(
  query: string,
  maxResults = 10,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  if (GOOGLE_KEYS.length === 0) {
    throw new SearchGoogleBooksError(
      "NO_GOOGLE_KEYS",
      "Google Books API key bulunamadı.",
    );
  }

  let lastError: unknown = null;

  for (const key of GOOGLE_KEYS) {
    try {
      const results = await searchGoogleWithKey(query, key, maxResults, signal);
      return results;
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      lastError = error;
    }
  }

  throw lastError ?? new SearchGoogleBooksError("GOOGLE_UNKNOWN");
}

function mapSearchError(error: unknown): Error {
  if (error instanceof SearchGoogleBooksError) {
    switch (error.code) {
      case "NO_GOOGLE_KEYS":
        return new Error("Google Books API key bulunamadı.");
      case "RATE_LIMIT":
        return new Error("Arama limiti doldu. Lütfen biraz sonra tekrar dene.");
      case "GOOGLE_403":
        return new Error(
          "Google Books erişimi reddedildi. API key yanlış ya da kısıtlı olabilir.",
        );
      case "GOOGLE_400":
        return new Error("Google Books isteği hatalı gönderildi.");
      default:
        return new Error("Google Books üzerinde beklenmeyen bir hata oluştu.");
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Bilinmeyen bir arama hatası oluştu.");
}

export function clearGoogleBooksCache() {
  cache.clear();
}

export async function searchGoogleBooks(
  query: string,
  maxResults = 10,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return [];
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const safeMaxResults = Math.min(Math.max(maxResults, 1), 40);
  const cacheKey = `${trimmedQuery.toLocaleLowerCase("tr")}__${safeMaxResults}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const queries = [
      trimmedQuery,
      `intitle:${trimmedQuery}`,
      `inauthor:${trimmedQuery}`,
      `${trimmedQuery} kitapları`,
      `popüler ${trimmedQuery} kitapları`,
      `çok satan ${trimmedQuery} kitapları`,
    ];

    const collected: GoogleBook[] = [];
    const seen = new Set<string>();

    for (const q of queries) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const results = await searchGoogleSequential(q, safeMaxResults, signal);

      for (const book of results) {
        const title = book.title?.toLocaleLowerCase("tr").trim() ?? "";
        const author = Array.isArray(book.authors)
          ? book.authors.join(", ").toLocaleLowerCase("tr").trim()
          : "";

        const duplicateKey = book.id || `${title}-${author}`;

        if (!seen.has(duplicateKey)) {
          seen.add(duplicateKey);
          collected.push(book);
        }
      }

      if (collected.length >= safeMaxResults) {
        break;
      }
    }

    const finalResults = collected.slice(0, safeMaxResults);

    cache.set(cacheKey, {
      at: Date.now(),
      data: finalResults,
    });

    return finalResults;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw mapSearchError(error);
  }
}