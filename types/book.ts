// types/book.ts

/**
 * ✅ Kitap statüleri
 */
export type BookStatus = "reading" | "read" | "want";

/**
 * ✅ Yorum modeli (local)
 */
export type BookComment = {
  id: string;
  text: string;
  createdAt: number;
};

/**
 * ✅ Ana Book modeli (tek kaynak)
 * Buradaki alanlara göre tüm app şekillenecek.
 */
export type Book = {
  id: string;

  // Temel bilgi
  title: string;
  author: string;

  // Durum
  status: BookStatus;

  // Okuma ilerleme (Okuyorum)
  pagesTotal?: number;
  pagesRead?: number;

  // Bitince (Okudum)
  rating?: number; // 1-5
  note?: string;

  // Paylaşım (feed)
  sharedAt?: number;
  shareText?: string;

  // Sosyal (local)
  likes?: number;
  isLiked?: boolean;
  comments?: BookComment[];

  // Meta
  createdAt: number;
};
