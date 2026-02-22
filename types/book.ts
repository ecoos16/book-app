export type BookStatus = "reading" | "read" | "want";
export type BookComment = {
  id: string; // benzersiz yorum id
  text: string; // yorum metni
  createdAt: number; // Date.now()
};

export type Book = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;

  // Kullanıcının kişisel notu (edit ekranında yazılıyor)
  note?: string;

  // Kullanıcının verdiği puan (1-5)
  rating?: number;

  // ✅ Paylaşım sistemi (LOCAL FEED için)
  // Paylaştıysa hangi tarihte paylaştı (Date.now())
  sharedAt?: number;

  // Paylaşımda gösterilecek metin (feed’de alıntı gibi)
  shareText?: string;

  // ✅ Sosyal alanlar (LOCAL)
  likes?: number; // like sayısı
  isLiked?: boolean; // bu cihazda like atıldı mı (tek kullanıcı simülasyonu)
  comments?: BookComment[]; // yorum listesi
  pagesTotal?: number;
  pagesRead?: number;

  // Oluşturulma zamanı (zaten var)
  createdAt: number;
};
