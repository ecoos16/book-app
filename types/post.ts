export type PostComment = {
  id: string;
  text: string;
  createdAt: number;
  userId: string;
  userName: string;
  userAvatar?: string;
};

export type Post = {
  id: string;

  /**
   * Paylaşımın bağlı olduğu kitap id
   * Kullanıcının kendi kitabıyla eşleşebilir
   */
  bookId: string;

  /**
   * Kitap snapshot bilgisi
   * Feed'de doğrudan göstermek için tutulur
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
};
