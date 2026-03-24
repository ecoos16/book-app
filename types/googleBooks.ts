// types/googleBooks.ts

/**
 * Google Books / OpenLibrary arama sonucunda
 * uygulama içinde kullanacağımız ortak kitap tipi
 *
 * Amaç:
 * farklı API kaynaklarından gelen veriyi
 * tek biçimde kullanabilmek
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
   * Bir kitapta birden fazla yazar olabilir
   */
  authors: string[];

  /**
   * Açıklama / özet
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
   * Bazen tam tarih, bazen sadece yıl olabilir
   */
  publishedDate?: string;

  /**
   * Dil kodu
   * Örn: "tr", "en"
   */
  language?: string;

  /**
   * Verinin hangi kaynaktan geldiği
   */
  source?: "google" | "openlibrary";
};
