// types/googleBooks.ts

/**
 * Google Books / OpenLibrary arama sonucunda
 * uygulama içinde kullanacağımız ortak kitap tipi
 */
export type GoogleBook = {
  /**
   * Kitabın benzersiz id'si
   * - Google Books için volume id
   * - OpenLibrary için türetilmiş id
   */
  id: string;

  /**
   * Kitap başlığı
   */
  title: string;

  /**
   * Yazar listesi
   * Bazı kitaplarda birden fazla yazar olabilir
   */
  authors: string[];

  /**
   * Açıklama / özet bilgisi
   * Her zaman gelmeyebilir
   */
  description?: string;

  /**
   * Tür / kategori bilgileri
   */
  categories?: string[];

  /**
   * Sayfa sayısı
   */
  pageCount?: number;

  /**
   * Kapak görseli URL'i
   */
  thumbnail?: string;

  /**
   * Yayın tarihi
   * Bazen sadece yıl, bazen tam tarih olabilir
   */
  publishedDate?: string;

  /**
   * Dil bilgisi
   * Örn: "en", "tr"
   */
  language?: string;

  /**
   * Verinin hangi kaynaktan geldiği
   */
  source?: "google" | "openlibrary";
};
