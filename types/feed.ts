// types/feed.ts

import { Book } from "../types/book";

/**
 * Feed içinde gösterilecek item tipleri
 *
 * Şu an iki kaynak olabilir:
 * - book : kitapların eski share alanından gelen içerik
 * - mock : mock veya dışarıdan gelen örnek post yapıları
 *
 * Not:
 * Yeni yapıda ana sosyal kaynak Post modeli olsa da
 * bu helper eski akışlarla uyumluluk için tutuluyor.
 */
export type FeedItem =
  | {
      type: "book";
      id: string;
      sharedAt: number;
      data: Book;
    }
  | {
      type: "mock";
      id: string;
      sharedAt: number;
      data: any;
    };

/**
 * Kitaplardan ve mock postlardan birleşik feed oluşturur
 *
 * Mantık:
 * 1) sharedAt alanı olan kitapları al
 * 2) mock postları aynı feed formatına dönüştür
 * 3) hepsini sharedAt'e göre yeni -> eski sırala
 */
export function buildFeed(books: Book[], mockPosts: any[] = []): FeedItem[] {
  /**
   * Eski kitap paylaşım akışından gelen feed item'ları
   */
  const bookPosts: FeedItem[] = books
    .filter((b) => typeof b.sharedAt === "number")
    .map((b) => ({
      type: "book",
      id: b.id,
      sharedAt: b.sharedAt as number,
      data: b,
    }));

  /**
   * Mock postları aynı formata dönüştür
   */
  const mockFeed: FeedItem[] = mockPosts
    .filter((m) => typeof m?.sharedAt === "number")
    .map((m) => ({
      type: "mock",
      id: String(m.id),
      sharedAt: m.sharedAt,
      data: m,
    }));

  /**
   * Birleştir ve zamana göre sırala
   */
  return [...bookPosts, ...mockFeed].sort((a, b) => b.sharedAt - a.sharedAt);
}
