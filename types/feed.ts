// lib/feed.ts

import { Book } from "../types/book";

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

export function buildFeed(books: Book[], mockPosts: any[] = []): FeedItem[] {
  // 1️⃣ Paylaşılmış kitapları al
  const bookPosts: FeedItem[] = books
    .filter((b) => typeof b.sharedAt === "number")
    .map((b) => ({
      type: "book",
      id: b.id,
      sharedAt: b.sharedAt!,
      data: b,
    }));

  // 2️⃣ Mock postları aynı formata getir
  const mockFeed: FeedItem[] = mockPosts.map((m) => ({
    type: "mock",
    id: m.id,
    sharedAt: m.sharedAt,
    data: m,
  }));

  // 3️⃣ Birleştir ve zamana göre sırala
  return [...bookPosts, ...mockFeed].sort((a, b) => b.sharedAt - a.sharedAt);
}
