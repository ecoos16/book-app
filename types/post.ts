// types/post.ts

/**
 * Topluluk paylaşımı altındaki yorum modeli
 */
export type PostComment = {
  /**
   * Yorum benzersiz id'si
   */
  id: string;

  /**
   * Yorum içeriği
   */
  text: string;

  /**
   * Oluşturulma zamanı
   */
  createdAt: number;

  /**
   * Yorumu yazan kullanıcı bilgileri
   */
  userId: string;
  userName: string;
  userAvatar?: string;
};

/**
 * Topluluk paylaşım modeli
 *
 * Bu model sosyal feed'in ana veri kaynağıdır.
 */
export type Post = {
  /**
   * Post benzersiz id'si
   */
  id: string;

  /**
   * Paylaşımın bağlı olduğu kitap
   */
  bookId: string;

  /**
   * Feed içinde doğrudan gösterebilmek için
   * kitap snapshot bilgileri tutulur
   */
  bookTitle: string;
  bookAuthor: string;
  bookThumbnail?: string;

  /**
   * Paylaşımı yapan kullanıcı
   */
  userId: string;
  userName: string;
  userAvatar?: string;

  /**
   * Paylaşım metni
   */
  shareText: string;

  /**
   * Oluşturulma zamanı
   */
  createdAt: number;

  /**
   * Etkileşim alanları
   */
  likes: number;
  isLiked?: boolean;
  comments: PostComment[];

  /**
   * İleride paylaşımın nereden üretildiğini anlamak için
   * opsiyonel kaynak alanı
   *
   * manual    -> kullanıcı manuel paylaşım oluşturdu
   * book-share -> kitap paylaşımı akışından üretildi
   */
  sourceType?: "manual" | "book-share";
};
