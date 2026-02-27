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

  // İleride gerçek user sistemine hazır olsun
  userId?: string;
  userName?: string;
  userAvatar?: string;
};

/**
 * ✅ Ana Book modeli (tek kaynak)
 * Ürün seviyesinde genişletilmiş versiyon
 */
export type Book = {
  id: string;

  // 🔹 Temel bilgi
  title: string;
  author: string;

  // ✅ Ürün hissi için kapak ve kaynak bilgisi
  thumbnail?: string; // Google Books thumbnail URL
  googleId?: string; // Google Books volumeId

  // 🔹 Durum
  status: BookStatus;

  // 🔹 Okuma ilerleme (Okuyorum)
  pagesTotal?: number;
  pagesRead?: number;

  // 🔹 Bitince (Okudum)
  rating?: number; // 1-5
  note?: string;

  // 🔹 Paylaşım (feed)
  sharedAt?: number;
  shareText?: string;

  // 🔹 Sosyal (local)
  likes?: number; // default: 0
  isLiked?: boolean; // default: false
  comments?: BookComment[]; // default: []

  // 🔹 Meta
  createdAt: number;
};
