// types/book.ts

/**
 * Kitabın kullanıcı kitaplığındaki durumu
 *
 * reading  -> şu an okunuyor
 * read     -> bitirildi
 * want     -> daha sonra okunacak
 */
export type BookStatus = "reading" | "read" | "want";

/**
 * Kitap altında tutulacak yorum modeli
 */
export type BookComment = {
  /**
   * Yoruma ait benzersiz id
   */
  id: string;

  /**
   * Yorum metni
   */
  text: string;

  /**
   * Yorum oluşturulma zamanı
   */
  createdAt: number;

  /**
   * Yorumu yazan kullanıcı bilgileri
   */
  userId?: string;
  userName?: string;
  userAvatar?: string;
};

/**
 * Uygulamadaki temel kitap modeli
 */
export type Book = {
  /**
   * Kitabın uygulama içindeki benzersiz id'si
   */
  id: string;

  /**
   * Temel bilgiler
   */
  title: string;
  author: string;

  /**
   * Kapak ve dış veri kaynağı bilgileri
   */
  thumbnail?: string;
  googleId?: string;

  /**
   * Kitabın kullanıcı kitaplığındaki durumu
   */
  status: BookStatus;

  /**
   * Okuma ilerleme alanları
   */
  pagesTotal?: number;
  pagesRead?: number;

  /**
   * Kitap bitirildiyse değerlendirme alanları
   */
  rating?: number;
  note?: string;

  /**
   * Paylaşım alanları
   * Eski akışlarla uyumluluk için tutuluyor
   */
  sharedAt?: number;
  shareText?: string;

  /**
   * Sosyal alanlar
   */
  likes?: number;
  isLiked?: boolean;
  comments?: BookComment[];

  /**
   * Kayıt oluşturulma zamanı
   */
  createdAt: number;
};
