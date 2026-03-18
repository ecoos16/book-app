// types/post.ts

/**
 * Post altındaki yorum modeli
 */
export type PostComment = {
  id: string;
  text: string;
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
 */
export type Post = {
  id: string;

  /**
   * Paylaşımın bağlı olduğu kitap id
   * Kullanıcının kendi kitabıyla eşleşebilir
   */
  bookId: string;

  /**
   * Kitap snapshot bilgisi
   * Feed içinde doğrudan göstermek için tutulur
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
   * İleride posttan başlatılmış sohbet bağlamı için alan bırakıyoruz
   * Şimdilik opsiyonel
   */
  sourceType?: "manual" | "book-share";
};
