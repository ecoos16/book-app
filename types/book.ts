// types/book.ts

/**
 * Kitabın kullanıcının kitaplığındaki durumu
 *
 * reading -> şu anda okunuyor
 * read    -> bitirildi
 * want    -> daha sonra okunacak
 */
export type BookStatus = "reading" | "read" | "want";

/**
 * Eski yorum modeli
 * Yeni sosyal akış Post modeli üzerinden ilerlese de
 * geriye dönük uyumluluk için tutuluyor.
 */
export type BookComment = {
  id: string;
  text: string;
  createdAt: number;
  userId?: string;
  userName?: string;
  userAvatar?: string;
};

/**
 * AI öneri sistemi için kullanılacak hafif kitap özeti
 */
export type BookRecommendationSeed = {
  id: string;
  title: string;
  author: string;
  rating?: number;
  note?: string;
  categories?: string[];
  description?: string;
};

/**
 * AI tarafından önerilecek kitap modeli
 */
export type AIRecommendedBook = {
  id: string;
  title: string;
  author: string;
  reason: string;
  matchScore?: number;
  suggestedStatus?: BookStatus;
};

/**
 * Uygulamadaki temel kitap modeli
 */
export type Book = {
  id: string;

  title: string;
  author: string;

  thumbnail?: string;
  googleId?: string;

  /**
   * Google Books / API metadata
   */
  description?: string;
  categories?: string[];
  publishedDate?: string;
  language?: string;

  status: BookStatus;

  pagesTotal?: number;
  pagesRead?: number;

  rating?: number;
  note?: string;

  sharedAt?: number;
  shareText?: string;

  likes?: number;
  isLiked?: boolean;
  comments?: BookComment[];

  /**
   * İleride AI öneri sistemi için kullanılabilir.
   * Varsayılan olarak opsiyonel bırakıldı, mevcut kodları bozmaz.
   */
  recommendationTags?: string[];
  lastRecommendedAt?: number;

  createdAt: number;
};
