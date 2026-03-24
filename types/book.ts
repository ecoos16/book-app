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
 * Kitap altındaki eski yorum modeli
 *
 * Not:
 * Projede artık sosyal yorumlar çoğunlukla Post modeli üzerinden gidiyor.
 * Ama bu yapı eski akışlarla uyumluluk için hâlâ tutuluyor.
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
   * Unix timestamp (number)
   */
  createdAt: number;

  /**
   * Yorumu yazan kullanıcı bilgileri
   * Eski kayıtlarla uyumluluk için opsiyonel tutuluyor
   */
  userId?: string;
  userName?: string;
  userAvatar?: string;
};

/**
 * Uygulamadaki temel kitap modeli
 *
 * Bu model:
 * - kitaplık
 * - kitap detay
 * - okuma ilerlemesi
 * - değerlendirme
 * - eski paylaşım/comment uyumluluğu
 * alanlarını taşır
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
   * Kitabın kitaplıktaki mevcut durumu
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
   * Eski paylaşım akışıyla uyumluluk alanları
   *
   * Not:
   * Yeni sosyal sistem Post modeli üzerinden ilerliyor.
   */
  sharedAt?: number;
  shareText?: string;

  /**
   * Eski sosyal alanlar
   * Yeni sistemde ana kaynak Post modeli olsa da
   * geriye dönük uyumluluk için tutuluyor.
   */
  likes?: number;
  isLiked?: boolean;
  comments?: BookComment[];

  /**
   * Kitabın kayıt oluşturulma zamanı
   */
  createdAt: number;
};
