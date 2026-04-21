// types/chat.ts

/**
 * Sohbet katılımcısı
 *
 * Chat listesinde ve konuşma ekranında
 * kullanıcıyı hafif özetle temsil eder.
 */
export type ChatParticipant = {
  id: string;
  name: string;
  avatar?: string;
};

/**
 * Tek bir mesaj modeli
 */
export type Message = {
  /**
   * Mesajın benzersiz id'si
   */
  id: string;

  /**
   * Mesajın bağlı olduğu konuşma
   */
  conversationId: string;

  /**
   * Mesajı gönderen kullanıcı bilgisi
   */
  senderId: string;
  senderName: string;
  senderAvatar?: string;

  /**
   * Mesaj içeriği
   */
  text: string;

  /**
   * Oluşturulma zamanı
   * Unix timestamp
   */
  createdAt: number;

  /**
   * Okunma bilgisi
   *
   * Şimdilik özellikle karşı taraftan gelen mesajlarda kullanılıyor.
   * Eski kayıtlarla uyumluluk için opsiyonel bırakıldı.
   */
  isRead?: boolean;
};

/**
 * Konuşma / sohbet kaydı
 *
 * Chat liste ekranında hızlı göstermek için
 * son mesaj özeti ve bağlam alanları da tutuluyor.
 */
export type Conversation = {
  /**
   * Konuşma id'si
   */
  id: string;

  /**
   * Konuşmaya dahil olan kullanıcılar
   */
  participants: ChatParticipant[];

  /**
   * Son mesaj özeti
   * Liste ekranında hızlı gösterim için kullanılabilir
   */
  lastMessageText?: string;
  lastMessageAt?: number;
  lastSenderId?: string;

  /**
   * Konuşma tipi bilgileri
   *
   * isGroup:
   * true  -> grup sohbeti
   * false -> birebir sohbet
   *
   * title:
   * Grup konuşmalarında özel başlık göstermek için kullanılır.
   */
  isGroup?: boolean;
  title?: string;

  /**
   * Sohbetin hangi bağlamdan doğduğunu belirtmek için
   * opsiyonel alan bırakıyoruz.
   *
   * direct -> direkt kullanıcılar arası
   * post   -> bir paylaşım üzerinden başlatılmış
   * book   -> bir kitap üzerinden başlatılmış
   */
  sourceType?: "direct" | "post" | "book";
  sourceId?: string;

  /**
   * Oluşturulma ve son güncellenme zamanı
   */
  createdAt: number;
  updatedAt: number;
};
