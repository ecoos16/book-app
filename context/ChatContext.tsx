// context/ChatContext.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
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
 * Basit benzersiz id üretici
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

/**
 * Chat context dışına açılacak yapı
 */
type ChatContextType = {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;
  typingByConversation: Record<string, boolean>;

  createConversation: (participant: ChatParticipant) => string;
  getOrCreateConversationByParticipant: (
    participant: ChatParticipant,
  ) => string;

  sendMessage: (conversationId: string, text: string) => void;
  deleteConversation: (conversationId: string) => void;

  getConversationById: (conversationId: string) => Conversation | undefined;
  getMessagesByConversationId: (conversationId: string) => Message[];

  markConversationAsRead: (conversationId: string) => void;
  clearAllChats: () => void;
};

/**
 * Context oluştur
 */
const ChatContext = createContext<ChatContextType | undefined>(undefined);

/**
 * Kullanıcının yazdığı mesaja göre otomatik cevap üret
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
 * Seed data üret
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

/**
 * Konuşmaları yeni -> eski sıralar
 */
function sortConversations(items: Conversation[]) {
  return [...items].sort((a, b) => b.updatedAt - a.updatedAt);
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
   * İlk yükleme tamamlandı mı?
   */
  const [loading, setLoading] = useState(true);

  /**
   * Karşı tarafın yazıyor bilgisini tutar
   */
  const [typingByConversation, setTypingByConversation] = useState<
    Record<string, boolean>
  >({});

  /**
   * İlk açılışta verileri yükle
   */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [storedConversations, storedMessages] = await Promise.all([
          AsyncStorage.getItem(CHAT_CONVERSATIONS_KEY),
          AsyncStorage.getItem(CHAT_MESSAGES_KEY),
        ]);

        if (!mounted) return;

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
          setConversations(sortConversations(parsedConversations));
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.log("❌ Chat verileri yüklenemedi:", error);

        const seed = createSeedData();
        setConversations(seed.conversations);
        setMessages(seed.messages);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Konuşmaları kaydet
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
   * Mesajları kaydet
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
   * Aynı kullanıcıyla var olan konuşmayı bul
   */
  const findConversationByParticipant = useCallback(
    (participantId: string) => {
      return conversations.find((conversation) => {
        const ids = conversation.participants.map((p) => p.id).sort();
        const expected = [CURRENT_USER.id, participantId].sort();

        return (
          ids.length === 2 && ids[0] === expected[0] && ids[1] === expected[1]
        );
      });
    },
    [conversations],
  );

  /**
   * Yeni konuşma oluştur
   */
  const createConversation = useCallback(
    (participant: ChatParticipant) => {
      const existingConversation = findConversationByParticipant(
        participant.id,
      );

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
    },
    [findConversationByParticipant],
  );

  /**
   * Konuşmayı bul ya da oluştur
   */
  const getOrCreateConversationByParticipant = useCallback(
    (participant: ChatParticipant) => {
      const existingConversation = findConversationByParticipant(
        participant.id,
      );

      if (existingConversation) {
        return existingConversation.id;
      }

      return createConversation(participant);
    },
    [findConversationByParticipant, createConversation],
  );

  /**
   * Mesaj gönder
   */
  const sendMessage = useCallback(
    (conversationId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const activeConversation = conversations.find(
        (conversation) => conversation.id === conversationId,
      );

      const otherUser = activeConversation?.participants.find(
        (participant) => participant.id !== CURRENT_USER.id,
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

      setMessages((prev) => [...prev, newMessage]);

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

      if (!otherUser) return;

      setTypingByConversation((prev) => ({
        ...prev,
        [conversationId]: true,
      }));

      const autoReply = pickAutoReply(trimmed);

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

          setTypingByConversation((prev) => ({
            ...prev,
            [conversationId]: false,
          }));

          setMessages((prev) => [...prev, replyMessage]);

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
    },
    [conversations],
  );

  /**
   * ID ile konuşma getir
   */
  const getConversationById = useCallback(
    (conversationId: string) => {
      return conversations.find(
        (conversation) => conversation.id === conversationId,
      );
    },
    [conversations],
  );

  /**
   * Konuşma mesajlarını getir
   */
  const getMessagesByConversationId = useCallback(
    (conversationId: string) => {
      return messages
        .filter((message) => message.conversationId === conversationId)
        .sort((a, b) => a.createdAt - b.createdAt);
    },
    [messages],
  );

  /**
   * Konuşmayı sil
   */
  const deleteConversation = useCallback((conversationId: string) => {
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
  }, []);

  /**
   * Karşı taraftan gelen mesajları okundu işaretle
   *
   * Önemli:
   * Eğer hiçbir şey değişmiyorsa aynı prev referansı döndürülür.
   * Böylece gereksiz render ve sonsuz update loop önlenir.
   */
  const markConversationAsRead = useCallback((conversationId: string) => {
    setMessages((prev) => {
      let changed = false;

      const next = prev.map((message) => {
        if (
          message.conversationId === conversationId &&
          message.senderId !== CURRENT_USER.id &&
          !message.isRead
        ) {
          changed = true;

          return {
            ...message,
            isRead: true,
          };
        }

        return message;
      });

      return changed ? next : prev;
    });
  }, []);

  /**
   * Tüm chat verilerini temizle
   */
  const clearAllChats = useCallback(() => {
    setConversations([]);
    setMessages([]);
    setTypingByConversation({});
  }, []);

  /**
   * Context değeri
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
    [
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
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Context hook
 */
export function useChat() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }

  return context;
}
