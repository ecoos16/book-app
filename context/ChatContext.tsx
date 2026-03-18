import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CURRENT_USER, MOCK_USERS } from "../data/mockUsers";
import type { ChatParticipant, Conversation, Message } from "../types/chat";

/**
 * AsyncStorage key'leri
 */
const CHAT_CONVERSATIONS_KEY = "CHAT_CONVERSATIONS_V1";
const CHAT_MESSAGES_KEY = "CHAT_MESSAGES_V1";

/**
 * Basit unique id üretici
 */
function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Rastgele eleman seçici
 */
function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

type ChatContextType = {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;

  /**
   * Şu anda karşı taraf yazıyor mu?
   * Key = conversationId
   */
  typingByConversation: Record<string, boolean>;

  /**
   * Yeni konuşma oluşturur
   */
  createConversation: (participant: ChatParticipant) => string;

  /**
   * Konuşma varsa getirir, yoksa oluşturur
   */
  getOrCreateConversationByParticipant: (
    participant: ChatParticipant,
  ) => string;

  /**
   * Mesaj gönderir
   */
  sendMessage: (conversationId: string, text: string) => void;

  /**
   * Konuşmayı siler
   */
  deleteConversation: (conversationId: string) => void;

  /**
   * ID ile konuşma getirir
   */
  getConversationById: (conversationId: string) => Conversation | undefined;

  /**
   * Konuşmanın mesajlarını getirir
   */
  getMessagesByConversationId: (conversationId: string) => Message[];

  /**
   * Konuşmadaki karşı taraftan gelen mesajları okundu işaretler
   */
  markConversationAsRead: (conversationId: string) => void;

  /**
   * Tüm chat verilerini temizler
   */
  clearAllChats: () => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

/**
 * Kullanıcının yazdığı mesaja göre daha alakalı otomatik cevap üret
 */
function pickAutoReply(userText: string) {
  const text = userText.toLocaleLowerCase("tr-TR").trim();

  const containsAny = (words: string[]) =>
    words.some((word) => text.includes(word));

  if (!text) {
    return "Tam olarak ne demek istediğini anlayamadım ama merak ettim 🙂";
  }

  if (containsAny(["merhaba", "selam", "selammm", "slm", "hey", "hi"])) {
    return pickRandom([
      "Selammm 👋",
      "Merhaba, nasılsın?",
      "Selam, ne okuyorsun şu sıralar?",
    ]);
  }

  if (containsAny(["nasılsın", "naber", "iyi misin"])) {
    return pickRandom([
      "İyiyim, sen nasılsın? 🙂",
      "İyiyim ya, sen ne yapıyorsun?",
      "Fena değilim, bugün biraz okuma yaptım.",
    ]);
  }

  if (containsAny(["teşekkür", "sağ ol", "sağol", "thanks", "teşekkürler"])) {
    return pickRandom(["Ne demek 💛", "Rica ederim 🙂", "Her zaman"]);
  }

  if (
    containsAny(["kitap", "roman", "hikaye", "yazar", "okuyorum", "okudum"])
  ) {
    return pickRandom([
      "Kitap konusu açılınca ben direkt ilgileniyorum 😄",
      "Onu ben de merak ediyorum aslında.",
      "Yorumunu okuyunca benim de okuyasım geldi.",
      "Bu aralar güzel kitap önerisi arıyordum ben de.",
    ]);
  }

  if (containsAny(["çok iyi", "mükemmel", "bayıldım", "harika", "efsane"])) {
    return pickRandom([
      "Aynı hissi ben de yaşamıştım.",
      "Gerçekten o kadar iyi miydi? Daha da merak ettim.",
      "Harika dediysen kesin bakacağım buna.",
    ]);
  }

  if (containsAny(["sevmedim", "beğenmedim", "kötü", "sıkıcı", "yavaş"])) {
    return pickRandom([
      "Aaa cidden mi, ben daha farklı bekliyordum.",
      "O hissi ben de bazı kitaplarda yaşıyorum.",
      "Demek sana çok geçmedi, anladım.",
    ]);
  }

  if (containsAny(["bitirdim", "bitti", "final", "sonu"])) {
    return pickRandom([
      "Finali nasıl buldun peki?",
      "Bitirdiysen net yorumunu merak ediyorum.",
      "Sonu güçlü müydü bari?",
    ]);
  }

  if (containsAny(["spoiler", "spoiler verme", "spoiler vermee"])) {
    return pickRandom([
      "Tamam tamam spoiler yok 😄",
      "Merak etme, ağzımı sıkı tutuyorum.",
      "Spoiler vermem söz ✋",
    ]);
  }

  if (containsAny(["öner", "öneri", "önersene", "ne okuyayım"])) {
    return pickRandom([
      "Tarzını bilirsem daha iyi öneri yaparım 🙂",
      "Ne tür sevdiğine göre güzel öneriler çıkar aslında.",
      "İstersen türüne göre birkaç kitap önerebilirim.",
    ]);
  }

  if (containsAny(["sence", "?"])) {
    return pickRandom([
      "Bence şans verilebilir ya.",
      "Bence konusu ilgini çekiyorsa okunur.",
      "Ben olsam denerdim açıkçası.",
    ]);
  }

  if (containsAny(["şu an", "şuan", "şimdi", "bugün"])) {
    return pickRandom([
      "Bugün ben de biraz okuma modundayım.",
      "Şu an konuşmak iyi geldi açıkçası.",
      "Bugün kitap konuşmak ayrı iyi gidiyor 😄",
    ]);
  }

  return pickRandom([
    "Aynen ya, dediğini anladım.",
    "Bunu söylemen iyi oldu, merak ettim şimdi.",
    "Haklı olabilirsin aslında.",
    "Ben de benzer düşünmüştüm.",
    "Devamını anlatsana 🙂",
  ]);
}

/**
 * İlk kullanım için örnek konuşmalar üret
 */
function createSeedData(): {
  conversations: Conversation[];
  messages: Message[];
} {
  const now = Date.now();

  const eylul = MOCK_USERS.find((user) => user.id === "u1");
  const mert = MOCK_USERS.find((user) => user.id === "u2");
  const zeynep = MOCK_USERS.find((user) => user.id === "u3");

  const seedUsers = [eylul, mert, zeynep].filter(Boolean) as ChatParticipant[];

  const conversations: Conversation[] = [];
  const messages: Message[] = [];

  seedUsers.forEach((participant, index) => {
    const conversationId = `seed_conv_${participant.id}`;
    const baseTime = now - (index + 1) * 1000 * 60 * 60 * 5;

    const firstMessage: Message = {
      id: `seed_msg_${participant.id}_1`,
      conversationId,
      senderId: participant.id,
      senderName: participant.name,
      senderAvatar: participant.avatar,
      text:
        participant.id === "u1"
          ? "Yeni başladığın kitabı merak ettim 👀"
          : participant.id === "u2"
            ? "1984 nasıl gidiyor?"
            : "Bir ara favori kitaplarını konuşalım mı?",
      createdAt: baseTime,
      isRead: false,
    };

    const secondMessage: Message = {
      id: `seed_msg_${participant.id}_2`,
      conversationId,
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.name,
      senderAvatar: CURRENT_USER.avatar,
      text:
        participant.id === "u1"
          ? "Daha başındayım ama şimdiden sardı."
          : participant.id === "u2"
            ? "Şu an ortalarındayım, baya karanlık gidiyor."
            : "Olur, ben de konuşmak istiyordum.",
      createdAt: baseTime + 1000 * 60 * 6,
      isRead: true,
    };

    const thirdMessage: Message = {
      id: `seed_msg_${participant.id}_3`,
      conversationId,
      senderId: participant.id,
      senderName: participant.name,
      senderAvatar: participant.avatar,
      text:
        participant.id === "u1"
          ? "Bitirince mutlaka yaz bana 😄"
          : participant.id === "u2"
            ? "Spoiler vermem ama final çok iyi."
            : "Tamam, akşam yazarım ✨",
      createdAt: baseTime + 1000 * 60 * 13,
      isRead: false,
    };

    const conversation: Conversation = {
      id: conversationId,
      participants: [CURRENT_USER, participant],
      createdAt: baseTime,
      updatedAt: thirdMessage.createdAt,
      lastMessageText: thirdMessage.text,
      lastMessageAt: thirdMessage.createdAt,
      lastSenderId: thirdMessage.senderId,
    };

    conversations.push(conversation);
    messages.push(firstMessage, secondMessage, thirdMessage);
  });

  return { conversations, messages };
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  /**
   * Tüm konuşmalar
   */
  const [conversations, setConversations] = useState<Conversation[]>([]);

  /**
   * Tüm mesajlar
   */
  const [messages, setMessages] = useState<Message[]>([]);

  /**
   * İlk yükleme durumu
   */
  const [loading, setLoading] = useState(true);

  /**
   * Karşı tarafın "yazıyor..." durumunu takip eder
   */
  const [typingByConversation, setTypingByConversation] = useState<
    Record<string, boolean>
  >({});

  /**
   * Storage'dan verileri yükle
   * Veri yoksa örnek veri oluştur
   */
  useEffect(() => {
    (async () => {
      try {
        const [storedConversations, storedMessages] = await Promise.all([
          AsyncStorage.getItem(CHAT_CONVERSATIONS_KEY),
          AsyncStorage.getItem(CHAT_MESSAGES_KEY),
        ]);

        const parsedConversations: Conversation[] = storedConversations
          ? JSON.parse(storedConversations)
          : [];

        const parsedMessages: Message[] = storedMessages
          ? JSON.parse(storedMessages)
          : [];

        if (parsedConversations.length === 0 && parsedMessages.length === 0) {
          const seed = createSeedData();
          setConversations(seed.conversations);
          setMessages(seed.messages);
        } else {
          setConversations(parsedConversations);
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.log("❌ Chat verileri yüklenemedi:", error);

        /**
         * Hata olsa da uygulama boş kalmasın
         */
        const seed = createSeedData();
        setConversations(seed.conversations);
        setMessages(seed.messages);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /**
   * Konuşmaları storage'a kaydet
   */
  useEffect(() => {
    if (loading) return;

    AsyncStorage.setItem(
      CHAT_CONVERSATIONS_KEY,
      JSON.stringify(conversations),
    ).catch((error) => {
      console.log("❌ Chat conversations kaydedilemedi:", error);
    });
  }, [conversations, loading]);

  /**
   * Mesajları storage'a kaydet
   */
  useEffect(() => {
    if (loading) return;

    AsyncStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages)).catch(
      (error) => {
        console.log("❌ Chat messages kaydedilemedi:", error);
      },
    );
  }, [messages, loading]);

  /**
   * Konuşmaları güncelliğe göre sıralar
   */
  const sortConversations = (items: Conversation[]) => {
    return [...items].sort((a, b) => b.updatedAt - a.updatedAt);
  };

  /**
   * Belirli bir kullanıcı ile mevcut konuşma var mı?
   */
  const findConversationByParticipant = (participantId: string) => {
    return conversations.find((conversation) => {
      const ids = conversation.participants.map((p) => p.id).sort();
      const expected = [CURRENT_USER.id, participantId].sort();

      return (
        ids.length === 2 && ids[0] === expected[0] && ids[1] === expected[1]
      );
    });
  };

  /**
   * Yeni konuşma oluştur
   * Aynı kullanıcıyla konuşma varsa onu döndür
   */
  const createConversation = (participant: ChatParticipant) => {
    const existingConversation = findConversationByParticipant(participant.id);

    if (existingConversation) {
      return existingConversation.id;
    }

    const now = Date.now();

    const newConversation: Conversation = {
      id: makeId(),
      participants: [CURRENT_USER, participant],
      createdAt: now,
      updatedAt: now,
      lastMessageText: undefined,
      lastMessageAt: undefined,
      lastSenderId: undefined,
    };

    setConversations((prev) => sortConversations([newConversation, ...prev]));

    return newConversation.id;
  };

  /**
   * Konuşmayı bul ya da oluştur
   */
  const getOrCreateConversationByParticipant = (
    participant: ChatParticipant,
  ) => {
    const existingConversation = findConversationByParticipant(participant.id);

    if (existingConversation) {
      /**
       * Mevcut konuşma varsa yine de listeyi düzenli tut
       */
      setConversations((prev) => sortConversations(prev));
      return existingConversation.id;
    }

    return createConversation(participant);
  };

  /**
   * Mesaj gönder
   * Kullanıcının mesajından sonra typing açılır
   * Sonra otomatik cevap gelir
   */
  const sendMessage = (conversationId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    /**
     * Bu konuşmanın karşı tarafını bul
     */
    const activeConversation = conversations.find(
      (c) => c.id === conversationId,
    );

    const otherUser = activeConversation?.participants.find(
      (p) => p.id !== CURRENT_USER.id,
    );

    const now = Date.now();

    const newMessage: Message = {
      id: makeId(),
      conversationId,
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.name,
      senderAvatar: CURRENT_USER.avatar,
      text: trimmed,
      createdAt: now,
      isRead: true,
    };

    /**
     * Önce kullanıcının mesajını ekle
     */
    setMessages((prev) => [...prev, newMessage]);

    /**
     * Konuşma son bilgisini güncelle ve üste taşı
     */
    setConversations((prev) =>
      sortConversations(
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                updatedAt: now,
                lastMessageText: trimmed,
                lastMessageAt: now,
                lastSenderId: CURRENT_USER.id,
              }
            : conversation,
        ),
      ),
    );

    /**
     * Karşı kullanıcı yoksa otomatik cevap üretme
     */
    if (!otherUser) return;

    /**
     * Yazıyor durumunu aç
     */
    setTypingByConversation((prev) => ({
      ...prev,
      [conversationId]: true,
    }));

    const autoReply = pickAutoReply(trimmed);

    /**
     * Kısa süre sonra otomatik cevap üret
     */
    setTimeout(
      () => {
        const replyTime = Date.now();

        const replyMessage: Message = {
          id: makeId(),
          conversationId,
          senderId: otherUser.id,
          senderName: otherUser.name,
          senderAvatar: otherUser.avatar,
          text: autoReply,
          createdAt: replyTime,
          isRead: false,
        };

        /**
         * Yazıyor durumunu kapat
         */
        setTypingByConversation((prev) => ({
          ...prev,
          [conversationId]: false,
        }));

        /**
         * Otomatik cevabı ekle
         */
        setMessages((prev) => [...prev, replyMessage]);

        /**
         * Konuşmanın son bilgisini tekrar güncelle
         */
        setConversations((prev) =>
          sortConversations(
            prev.map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    updatedAt: replyTime,
                    lastMessageText: autoReply,
                    lastMessageAt: replyTime,
                    lastSenderId: otherUser.id,
                  }
                : conversation,
            ),
          ),
        );
      },
      1200 + Math.random() * 1000,
    );
  };

  /**
   * ID ile konuşma getir
   */
  const getConversationById = (conversationId: string) => {
    return conversations.find(
      (conversation) => conversation.id === conversationId,
    );
  };

  /**
   * Bir konuşmanın mesajlarını getir
   * Eski -> yeni sıralı
   */
  const getMessagesByConversationId = (conversationId: string) => {
    return messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt - b.createdAt);
  };

  /**
   * Konuşmayı sil
   * Mesajları da temizle
   */
  const deleteConversation = (conversationId: string) => {
    setConversations((prev) =>
      prev.filter((conversation) => conversation.id !== conversationId),
    );

    setMessages((prev) =>
      prev.filter((message) => message.conversationId !== conversationId),
    );

    setTypingByConversation((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  };

  /**
   * Karşı taraftan gelen mesajları okundu işaretle
   */
  const markConversationAsRead = (conversationId: string) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (
          message.conversationId === conversationId &&
          message.senderId !== CURRENT_USER.id &&
          !message.isRead
        ) {
          return {
            ...message,
            isRead: true,
          };
        }

        return message;
      }),
    );
  };

  /**
   * Tüm chat verilerini temizle
   */
  const clearAllChats = () => {
    setConversations([]);
    setMessages([]);
    setTypingByConversation({});
  };

  /**
   * Context dışa açılan değer
   */
  const value = useMemo<ChatContextType>(
    () => ({
      conversations,
      messages,
      loading,
      typingByConversation,
      createConversation,
      getOrCreateConversationByParticipant,
      sendMessage,
      deleteConversation,
      getConversationById,
      getMessagesByConversationId,
      markConversationAsRead,
      clearAllChats,
    }),
    [conversations, messages, loading, typingByConversation],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }

  return context;
}
