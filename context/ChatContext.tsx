import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import type { ChatParticipant, Conversation, Message } from "../types/chat";
import { useAuth } from "./AuthContext";
import { useUser } from "./UserContext";

type ChatContextType = {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;
  typingByConversation: Record<string, boolean>;

  createConversation: (participant: ChatParticipant) => Promise<string>;
  getOrCreateConversationByParticipant: (
    participant: ChatParticipant,
  ) => Promise<string>;

  sendMessage: (conversationId: string, text: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;

  getConversationById: (conversationId: string) => Conversation | undefined;
  getMessagesByConversationId: (conversationId: string) => Message[];

  markConversationAsRead: (conversationId: string) => Promise<void>;
  clearAllChats: () => void;

  fetchMessagesForConversation: (conversationId: string) => Promise<void>;
  subscribeToConversation: (conversationId: string) => void;
  unsubscribeFromConversation: () => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function sortConversations(items: Conversation[]) {
  return [...items].sort((a, b) => b.updatedAt - a.updatedAt);
}

type DbProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type DbConversationRow = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string | null;
  is_group: boolean;
};

type DbParticipantRow = {
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
  profiles: DbProfile | DbProfile[] | null;
};

type DbMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: DbProfile | DbProfile[] | null;
};

function pickSingleProfile(
  profile: DbProfile | DbProfile[] | null,
): DbProfile | null {
  if (!profile) return null;
  if (Array.isArray(profile)) return profile[0] ?? null;
  return profile;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const { user: appUser } = useUser();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingByConversation, setTypingByConversation] = useState<
    Record<string, boolean>
  >({});

  const activeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null,
  );

  const me: ChatParticipant = useMemo(
    () => ({
      id: authUser?.id || "guest",
      name: appUser.name || authUser?.email || "Kullanıcı",
      avatar: appUser.avatar,
    }),
    [authUser?.id, authUser?.email, appUser.name, appUser.avatar],
  );

  const mapParticipant = useCallback(
    (
      rawProfile: DbProfile | DbProfile[] | null,
      fallbackId: string,
    ): ChatParticipant => {
      const profile = pickSingleProfile(rawProfile);

      return {
        id: profile?.id ?? fallbackId,
        name:
          profile?.full_name?.trim() ||
          profile?.username?.trim() ||
          "Kullanıcı",
        avatar: profile?.avatar_url ?? undefined,
      };
    },
    [],
  );

  const mapMessage = useCallback(
    (row: DbMessageRow): Message => {
      const sender = mapParticipant(row.profiles, row.sender_id);

      return {
        id: row.id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        senderName: sender.name,
        senderAvatar: sender.avatar,
        text: row.content,
        createdAt: new Date(row.created_at).getTime(),
        isRead: row.sender_id === me.id,
      };
    },
    [mapParticipant, me.id],
  );

  const fetchConversations = useCallback(async () => {
    if (!authUser?.id) {
      setConversations([]);
      return;
    }

    const { data: participantRows, error: participantsError } =
      await supabase.from("conversation_participants").select(`
        conversation_id,
        user_id,
        last_read_at,
        profiles:user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `);

    if (participantsError) {
      console.log("FETCH PARTICIPANTS ERROR:", participantsError);
      return;
    }

    const typedParticipantRows = (participantRows ?? []) as DbParticipantRow[];

    const myConversationIds = typedParticipantRows
      .filter((row) => row.user_id === authUser.id)
      .map((row) => row.conversation_id);

    if (myConversationIds.length === 0) {
      setConversations([]);
      return;
    }

    const { data: conversationRows, error: conversationsError } = await supabase
      .from("conversations")
      .select("id, created_at, updated_at, title, is_group")
      .in("id", myConversationIds)
      .order("updated_at", { ascending: false });

    if (conversationsError) {
      console.log("FETCH CONVERSATIONS ERROR:", conversationsError);
      return;
    }

    const { data: latestMessages, error: latestMessagesError } = await supabase
      .from("messages")
      .select(
        `
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        profiles:sender_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `,
      )
      .in("conversation_id", myConversationIds)
      .order("created_at", { ascending: false });

    if (latestMessagesError) {
      console.log("FETCH LATEST MESSAGES ERROR:", latestMessagesError);
    }

    const typedLatestMessages = (latestMessages ?? []) as DbMessageRow[];

    const latestByConversation = new Map<string, DbMessageRow>();
    for (const row of typedLatestMessages) {
      if (!latestByConversation.has(row.conversation_id)) {
        latestByConversation.set(row.conversation_id, row);
      }
    }

    const participantsByConversation = new Map<string, ChatParticipant[]>();
    for (const row of typedParticipantRows) {
      const current = participantsByConversation.get(row.conversation_id) ?? [];
      current.push(mapParticipant(row.profiles, row.user_id));
      participantsByConversation.set(row.conversation_id, current);
    }

    const typedConversationRows = (conversationRows ??
      []) as DbConversationRow[];

    const nextConversations: Conversation[] = typedConversationRows.map(
      (conv) => {
        const lastMsg = latestByConversation.get(conv.id);

        return {
          id: conv.id,
          participants: participantsByConversation.get(conv.id) ?? [],
          createdAt: new Date(conv.created_at).getTime(),
          updatedAt: new Date(conv.updated_at).getTime(),
          lastMessageText: lastMsg?.content,
          lastMessageAt: lastMsg
            ? new Date(lastMsg.created_at).getTime()
            : undefined,
          lastSenderId: lastMsg?.sender_id,
        };
      },
    );

    setConversations(sortConversations(nextConversations));
  }, [authUser?.id, mapParticipant]);

  const fetchMessagesForConversation = useCallback(
    async (conversationId: string) => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          conversation_id,
          sender_id,
          content,
          created_at,
          profiles:sender_id (
            id,
            full_name,
            username,
            avatar_url
          )
        `,
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.log("FETCH MESSAGES ERROR:", error);
        return;
      }

      const typedRows = (data ?? []) as DbMessageRow[];
      const mapped = typedRows.map((row) => mapMessage(row));

      setMessages((prev) => {
        const otherConversations = prev.filter(
          (m) => m.conversationId !== conversationId,
        );
        return [...otherConversations, ...mapped];
      });
    },
    [mapMessage],
  );

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      if (!authUser?.id) {
        setConversations([]);
        setMessages([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      await fetchConversations();

      if (active) {
        setLoading(false);
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [authUser?.id, fetchConversations]);

  const unsubscribeFromConversation = useCallback(() => {
    if (activeChannelRef.current) {
      supabase.removeChannel(activeChannelRef.current);
      activeChannelRef.current = null;
    }
  }, []);

  const subscribeToConversation = useCallback(
    (conversationId: string) => {
      unsubscribeFromConversation();

      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload) => {
            const inserted = payload.new as {
              id: string;
              conversation_id: string;
              sender_id: string;
              content: string;
              created_at: string;
            };

            const { data: senderProfileRaw } = await supabase
              .from("profiles")
              .select("id, full_name, username, avatar_url")
              .eq("id", inserted.sender_id)
              .single();

            const senderProfile = senderProfileRaw as DbProfile | null;

            const incoming: Message = {
              id: inserted.id,
              conversationId: inserted.conversation_id,
              senderId: inserted.sender_id,
              senderName:
                senderProfile?.full_name?.trim() ||
                senderProfile?.username?.trim() ||
                "Kullanıcı",
              senderAvatar: senderProfile?.avatar_url ?? undefined,
              text: inserted.content,
              createdAt: new Date(inserted.created_at).getTime(),
              isRead: inserted.sender_id === me.id,
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming].sort(
                (a, b) => a.createdAt - b.createdAt,
              );
            });

            setConversations((prev) =>
              sortConversations(
                prev.map((conversation) =>
                  conversation.id === conversationId
                    ? {
                        ...conversation,
                        updatedAt: incoming.createdAt,
                        lastMessageText: incoming.text,
                        lastMessageAt: incoming.createdAt,
                        lastSenderId: incoming.senderId,
                      }
                    : conversation,
                ),
              ),
            );
          },
        )
        .subscribe();

      activeChannelRef.current = channel;
    },
    [me.id, unsubscribeFromConversation],
  );

  const createConversation = useCallback(
    async (participant: ChatParticipant) => {
      if (!authUser?.id) {
        throw new Error("Oturum açık değil.");
      }

      const existing = conversations.find((conversation) => {
        const ids = conversation.participants.map((p) => p.id).sort();
        const expected = [me.id, participant.id].sort();

        return (
          ids.length === 2 && ids[0] === expected[0] && ids[1] === expected[1]
        );
      });

      if (existing) {
        return existing.id;
      }

      const { data: newConversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          is_group: false,
          created_by: authUser.id,
        })
        .select("id")
        .single();

      if (conversationError || !newConversation) {
        console.log("CREATE CONVERSATION ERROR:", conversationError);
        throw new Error(
          conversationError?.message || "Konuşma oluşturulamadı.",
        );
      }

      const conversationId = newConversation.id;

      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .insert([
          {
            conversation_id: conversationId,
            user_id: authUser.id,
          },
          {
            conversation_id: conversationId,
            user_id: participant.id,
          },
        ]);

      if (participantsError) {
        console.log("CREATE PARTICIPANTS ERROR:", participantsError);

        await supabase.from("conversations").delete().eq("id", conversationId);

        throw new Error(participantsError.message);
      }

      await fetchConversations();
      return conversationId;
    },
    [authUser?.id, conversations, fetchConversations, me.id],
  );

  const getOrCreateConversationByParticipant = useCallback(
    async (participant: ChatParticipant) => {
      const existing = conversations.find((conversation) => {
        const ids = conversation.participants.map((p) => p.id).sort();
        const expected = [me.id, participant.id].sort();

        return (
          ids.length === 2 && ids[0] === expected[0] && ids[1] === expected[1]
        );
      });

      if (existing) {
        return existing.id;
      }

      return createConversation(participant);
    },
    [conversations, createConversation, me.id],
  );

  const sendMessage = useCallback(
    async (conversationId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (!authUser?.id) return;

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: authUser.id,
        content: trimmed,
      });

      if (error) {
        console.log("SEND MESSAGE ERROR:", error);
        throw new Error(error.message);
      }

      await supabase
        .from("conversations")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    },
    [authUser?.id],
  );

  const deleteConversation = useCallback(async (conversationId: string) => {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (error) {
      console.log("DELETE CONVERSATION ERROR:", error);
      return;
    }

    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setMessages((prev) =>
      prev.filter((m) => m.conversationId !== conversationId),
    );
  }, []);

  const getConversationById = useCallback(
    (conversationId: string) =>
      conversations.find((c) => c.id === conversationId),
    [conversations],
  );

  const getMessagesByConversationId = useCallback(
    (conversationId: string) =>
      messages
        .filter((message) => message.conversationId === conversationId)
        .sort((a, b) => a.createdAt - b.createdAt),
    [messages],
  );

  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      if (!authUser?.id) return;

      await supabase
        .from("conversation_participants")
        .update({
          last_read_at: new Date().toISOString(),
        })
        .eq("conversation_id", conversationId)
        .eq("user_id", authUser.id);

      setMessages((prev) =>
        prev.map((message) =>
          message.conversationId === conversationId &&
          message.senderId !== me.id &&
          !message.isRead
            ? { ...message, isRead: true }
            : message,
        ),
      );
    },
    [authUser?.id, me.id],
  );

  const clearAllChats = useCallback(() => {
    setConversations([]);
    setMessages([]);
    setTypingByConversation({});
  }, []);

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
      fetchMessagesForConversation,
      subscribeToConversation,
      unsubscribeFromConversation,
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
      fetchMessagesForConversation,
      subscribeToConversation,
      unsubscribeFromConversation,
    ],
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
