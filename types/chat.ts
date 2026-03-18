// types/chat.ts

/**
 * Sohbet katılımcısı
 * Kullanıcıların chat içindeki hafif özeti
 */
export type ChatParticipant = {
  id: string;
  name: string;
  avatar?: string;
};

/**
 * Tek bir mesaj
 */
export type Message = {
  id: string;
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
   */
  createdAt: number;

  /**
   * Okunma bilgisi
   * Şimdilik özellikle karşı taraftan gelen mesajlarda kullanılıyor
   */
  isRead?: boolean;
};

/**
 * Konuşma / sohbet kaydı
 * Liste ekranında hızlı göstermek için son mesaj özeti de tutulur
 */
export type Conversation = {
  id: string;

  /**
   * Konuşmaya dahil olan kişiler
   */
  participants: ChatParticipant[];

  /**
   * Son mesaj özeti
   */
  lastMessageText?: string;
  lastMessageAt?: number;
  lastSenderId?: string;

  /**
   * İleride posttan / kitaptan başlatılan sohbetler için
   * küçük bağlam alanı bırakıyoruz
   * Şu an opsiyonel, sonra kullanacağız
   */
  sourceType?: "direct" | "post" | "book";
  sourceId?: string;

  /**
   * Oluşturulma ve güncellenme zamanı
   */
  createdAt: number;
  updatedAt: number;
};
