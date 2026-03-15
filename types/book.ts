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
   * timestamp (number)
   */
  createdAt: number;

  /**
   * Yorumu yazan kullanıcı bilgileri
   * Şimdilik opsiyonel, ileride auth sistemi gelirse kullanılabilir
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
   * Kitap bitirildiyse kullanılacak değerlendirme alanları
   */
  rating?: number;
  note?: string;

  /**
   * Paylaşım alanları
   * Kitap feed ya da paylaşım akışında gösterilecekse kullanılabilir
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
