// types/book.ts

/**
 * ✅ Kitabın statüsü
 */
export type BookStatus = "reading" | "read" | "want";

/**
 * ✅ Yorum modeli (local dummy)
 */
export type BookComment = {
  id: string; // uniq id
  text: string;
  createdAt: number; // Date.now()
};

/**
 * ✅ Ana Book modeli
 * (Home / Share / Comments / Detail / Edit hepsi bunun üstünden gider)
 */
export type Book = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;

  createdAt: number;

  // Okuma takibi
  pagesTotal?: number;
  pagesRead?: number;

  // Okudum alanları
  rating?: number; // 1-5
  note?: string;

  // Paylaşım
  sharedAt?: number; // paylaşıldıysa timestamp
  shareText?: string;

  // Sosyal (local)
  likes?: number; // like sayısı
  isLiked?: boolean; // kullanıcı beğendi mi
  comments?: BookComment[]; // yorumlar (local)
};
