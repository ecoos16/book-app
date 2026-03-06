import { GoogleBook } from "../types/googleBooks";

const BASE_URL = "https://www.googleapis.com/books/v1/volumes";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function pickThumbnail(images?: any) {
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

function mapVolume(item: any): GoogleBook {
  const v = item?.volumeInfo ?? {};

  return {
    id: item?.id ?? String(Date.now()),
    title: v.title ?? "Bilinmeyen Kitap",
    authors: Array.isArray(v.authors) ? v.authors : [],
    description: v.description,
    categories: v.categories,
    pageCount: v.pageCount,
    thumbnail: pickThumbnail(v.imageLinks),
    publishedDate: v.publishedDate,
    language: v.language,
  };
}

export async function searchGoogleBooks(
  query: string,
  maxResults = 10,
  signal?: AbortSignal,
): Promise<GoogleBook[]> {
  const q = query.trim();

  if (q.length < 3) return [];

  const url = `${BASE_URL}?q=${encodeURIComponent(q)}&maxResults=${maxResults}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      console.log("BOOK SEARCH URL:", url);

      const res = await fetch(url, { signal });

      if (res.status === 429) {
        console.log("RATE LIMITED — waiting...");
        await sleep(1500);
        continue;
      }

      if (!res.ok) {
        console.log("GOOGLE BOOKS ERROR:", res.status);
        return [];
      }

      const data = await res.json();

      const items = Array.isArray(data.items) ? data.items : [];

      return items.map(mapVolume);
    } catch (error) {
      console.log("FETCH ERROR:", error);
      return [];
    }
  }

  return [];
}
