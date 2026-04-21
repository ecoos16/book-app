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

  createdAt: number;
};
