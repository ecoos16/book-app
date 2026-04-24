// types/chat.ts

/**
 * Sohbet katılımcısı
 *
 * Chat listesinde, mesaj ekranında ve paylaşım üzerinden
 * sohbet başlatma akışında kullanıcıyı hafif özetle temsil eder.
 */
export type ChatParticipant = {
  /**
   * Kullanıcının benzersiz kimliği
   */
  id: string;

  /**
   * Ekranda gösterilecek adı
   */
  name: string;

  /**
   * Profil fotoğrafı
   */
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
   * Gönderen kullanıcı bilgisi
   */
  senderId: string;
  senderName: string;
  senderAvatar?: string;

  /**
   * Mesaj içeriği
   */
  text: string;

  /**
   * Oluşturulma zamanı (Unix timestamp - ms)
   */
  createdAt: number;

  /**
   * Okunma bilgisi
   */
  isRead?: boolean;
};

/**
 * Konuşma / sohbet kaydı
 *
 * Chat liste ekranında hızlı göstermek için
 * son mesaj özeti ve bağlam alanları da tutulur.
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
   * Son mesaj bilgileri
   */
  lastMessageText?: string;
  lastMessageAt?: number;
  lastSenderId?: string;

  /**
   * Grup mu birebir mi?
   */
  isGroup: boolean;

  /**
   * Grup ise başlık
   */
  title?: string;

  /**
   * Sohbetin başlatıldığı bağlam
   */
  sourceType?: "direct" | "post" | "book";
  sourceId?: string;

  /**
   * Zaman bilgileri
   */
  createdAt: number;
  updatedAt: number;
};
