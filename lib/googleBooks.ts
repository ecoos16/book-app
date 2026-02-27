import { GoogleBook } from "../types/googleBooks";

const BASE_URL = "https://www.googleapis.com/books/v1/volumes";

function pickThumbnail(images?: Record<string, string>) {
  if (!images) return undefined;
  return (
    images.thumbnail ||
    images.smallThumbnail ||
    images.small ||
    images.medium ||
    images.large ||
    images.extraLarge
  );
}

function mapVolumeToGoogleBook(item: any): GoogleBook {
  const v = item?.volumeInfo ?? {};
  return {
    id: item.id,
    title: v.title ?? "Bilinmeyen Kitap",
    authors: Array.isArray(v.authors) ? v.authors : [],
    description: v.description,
    categories: Array.isArray(v.categories) ? v.categories : undefined,
    pageCount: typeof v.pageCount === "number" ? v.pageCount : undefined,
    thumbnail: pickThumbnail(v.imageLinks),
    publishedDate: v.publishedDate,
    language: v.language,
  };
}

export async function searchGoogleBooks(
  query: string,
  maxResults = 20,
): Promise<GoogleBook[]> {
  const q = query.trim();
  if (!q) return [];

  const url =
    `${BASE_URL}?q=${encodeURIComponent(q)}` +
    `&maxResults=${Math.min(Math.max(maxResults, 1), 40)}` +
    `&printType=books&orderBy=relevance`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Books error: ${res.status}`);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map(mapVolumeToGoogleBook);
}
