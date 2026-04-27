// context/ChatContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { sendPushNotification } from "../lib/notifications";
import { supabase } from "../lib/supabase";
import type { ChatParticipant, Conversation, Message } from "../types/chat";
import { useAuth } from "./AuthContext";
import { useUser } from "./UserContext";

type ChatContextType = {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;
  typingByConversation: Record<string, boolean>;
  totalUnreadCount: number;
  unreadByConversation: Record<string, number>;

  createConversation: (participant: ChatParticipant) => Promise<string>;
  getOrCreateConversationByParticipant: (
    participant: ChatParticipant,
  ) => Promise<string>;

  sendMessage: (conversationId: string, text: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  leaveGroupConversation: (conversationId: string) => Promise<void>;

  getConversationById: (conversationId: string) => Conversation | undefined;
  getMessagesByConversationId: (conversationId: string) => Message[];

  markConversationAsRead: (conversationId: string) => Promise<void>;
  clearAllChats: () => void;

  fetchMessagesForConversation: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  fetchConversationById: (
    conversationId: string,
  ) => Promise<Conversation | null>;
  subscribeToConversation: (conversationId: string) => void;
  unsubscribeFromConversation: () => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

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

function sortConversations(items: Conversation[]) {
  return [...items].sort((a, b) => {
    const aTime = a.lastMessageAt ?? a.updatedAt ?? a.createdAt;
    const bTime = b.lastMessageAt ?? b.updatedAt ?? b.createdAt;
    return bTime - aTime;
  });
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
  const [unreadByConversation, setUnreadByConversation] = useState<
    Record<string, number>
  >({});

  const activeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null,
  );

  const globalChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null,
  );

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadByConversation).reduce(
      (total, count) => total + count,
      0,
    );
  }, [unreadByConversation]);

  const me: ChatParticipant = useMemo(
    () => ({
      id: authUser?.id || "guest",
      name: appUser?.name || authUser?.email || "Kullanıcı",
      avatar: appUser?.avatar,
    }),
    [authUser?.email, authUser?.id, appUser?.avatar, appUser?.name],
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

  const fetchConversationById = useCallback(
    async (conversationId: string): Promise<Conversation | null> => {
      if (!conversationId) return null;

      const { data: conversationRow, error: conversationError } = await supabase
        .from("conversations")
        .select("id, created_at, updated_at, title, is_group")
        .eq("id", conversationId)
        .maybeSingle();

      if (conversationError || !conversationRow) {
        console.log("FETCH CONVERSATION BY ID ERROR:", conversationError);
        return null;
      }

      const { data: participantRows, error: participantsError } = await supabase
        .from("conversation_participants")
        .select(
          `
          conversation_id,
          user_id,
          last_read_at,
          profiles:user_id (
            id,
            full_name,
            username,
            avatar_url
          )
        `,
        )
        .eq("conversation_id", conversationId);

      if (participantsError) {
        console.log(
          "FETCH CONVERSATION PARTICIPANTS ERROR:",
          participantsError,
        );
        return null;
      }

      const { data: latestMessageRows } = await supabase
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
        .order("created_at", { ascending: false })
        .limit(1);

      const conv = conversationRow as DbConversationRow;
      const typedParticipants = (participantRows ?? []) as DbParticipantRow[];
      const lastMsg = ((latestMessageRows ?? []) as DbMessageRow[])[0];

      const builtConversation: Conversation = {
        id: conv.id,
        participants: typedParticipants.map((row) =>
          mapParticipant(row.profiles, row.user_id),
        ),
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at).getTime(),
        lastMessageText: lastMsg?.content,
        lastMessageAt: lastMsg
          ? new Date(lastMsg.created_at).getTime()
          : undefined,
        lastSenderId: lastMsg?.sender_id,
        title: conv.title ?? undefined,
        isGroup: conv.is_group,
      };

      setConversations((prev) => {
        const filtered = prev.filter(
          (item) => item.id !== builtConversation.id,
        );
        return sortConversations([builtConversation, ...filtered]);
      });

      return builtConversation;
    },
    [mapParticipant],
  );

  const fetchConversations = useCallback(async () => {
    if (!authUser?.id) {
      setConversations([]);
      setUnreadByConversation({});
      return;
    }

    const { data: myParticipantRows, error: myParticipantsError } =
      await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", authUser.id);

    if (myParticipantsError) {
      console.log("FETCH MY PARTICIPANTS ERROR:", myParticipantsError);
      return;
    }

    const myConversationIds = (myParticipantRows ?? []).map(
      (row: { conversation_id: string }) => row.conversation_id,
    );

    if (myConversationIds.length === 0) {
      setConversations([]);
      setUnreadByConversation({});
      return;
    }

    const { data: allParticipantRows } = await supabase
      .from("conversation_participants")
      .select(
        `
        conversation_id,
        user_id,
        last_read_at,
        profiles:user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `,
      )
      .in("conversation_id", myConversationIds);

    const { data: conversationRows } = await supabase
      .from("conversations")
      .select("id, created_at, updated_at, title, is_group")
      .in("id", myConversationIds);

    const { data: latestMessages } = await supabase
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

    const typedParticipantRows = (allParticipantRows ??
      []) as DbParticipantRow[];
    const typedConversationRows = (conversationRows ??
      []) as DbConversationRow[];
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

    const nextUnread: Record<string, number> = {};

    for (const conv of typedConversationRows) {
      const lastMsg = latestByConversation.get(conv.id);

      const myParticipant = typedParticipantRows.find(
        (row) => row.conversation_id === conv.id && row.user_id === authUser.id,
      );

      const lastReadAt = myParticipant?.last_read_at
        ? new Date(myParticipant.last_read_at).getTime()
        : 0;

      const lastMessageAt = lastMsg?.created_at
        ? new Date(lastMsg.created_at).getTime()
        : 0;

      const isUnread =
        !!lastMsg &&
        lastMsg.sender_id !== authUser.id &&
        lastMessageAt > lastReadAt;

      nextUnread[conv.id] = isUnread ? 1 : 0;
    }

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
          title: conv.title ?? undefined,
          isGroup: conv.is_group,
        };
      },
    );

    setUnreadByConversation(nextUnread);
    setConversations(sortConversations(nextConversations));
  }, [authUser?.id, mapParticipant]);

  const refreshConversations = useCallback(async () => {
    await fetchConversations();
  }, [fetchConversations]);

  const fetchMessagesForConversation = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;

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
        throw new Error(error.message);
      }

      const typedRows = (data ?? []) as DbMessageRow[];
      const mapped = typedRows.map((row) => mapMessage(row));

      setMessages((prev) => {
        const others = prev.filter((m) => m.conversationId !== conversationId);
        return [...others, ...mapped];
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
        setUnreadByConversation({});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await fetchConversations();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [authUser?.id, fetchConversations]);

  useEffect(() => {
    if (!authUser?.id) return;

    if (globalChannelRef.current) {
      supabase.removeChannel(globalChannelRef.current);
      globalChannelRef.current = null;
    }

    const channel = supabase
      .channel(`global-messages:${authUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const inserted = payload.new as {
            conversation_id: string;
            sender_id: string;
          };

          if (inserted.sender_id === authUser.id) return;

          const { data: participantRow } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("conversation_id", inserted.conversation_id)
            .eq("user_id", authUser.id)
            .maybeSingle();

          if (!participantRow) return;

          await fetchConversations();
        },
      )
      .subscribe();

    globalChannelRef.current = channel;

    return () => {
      if (globalChannelRef.current) {
        supabase.removeChannel(globalChannelRef.current);
        globalChannelRef.current = null;
      }
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
      if (!conversationId) return;

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
              .maybeSingle();

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

            if (incoming.senderId !== me.id) {
              setUnreadByConversation((prev) => ({
                ...prev,
                [conversationId]: 1,
              }));
            }
          },
        )
        .subscribe();

      activeChannelRef.current = channel;
    },
    [me.id, unsubscribeFromConversation],
  );

  const getOrCreateConversationByParticipant = useCallback(
    async (participant: ChatParticipant) => {
      if (!participant?.id || participant.id === me.id) {
        throw new Error("Kendinle sohbet başlatılamaz.");
      }

      const { data, error } = await supabase.rpc(
        "find_or_create_direct_conversation",
        {
          other_user_id: participant.id,
        },
      );

      if (error || !data) {
        console.log("RPC FIND OR CREATE CONVERSATION ERROR:", error);
        throw new Error(error?.message || "Sohbet oluşturulamadı.");
      }

      const conversationId = String(data);
      await fetchConversationById(conversationId);

      return conversationId;
    },
    [fetchConversationById, me.id],
  );

  const createConversation = useCallback(
    async (participant: ChatParticipant) => {
      return getOrCreateConversationByParticipant(participant);
    },
    [getOrCreateConversationByParticipant],
  );
  const sendMessage = useCallback(
    async (conversationId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !authUser?.id) return;

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: authUser.id,
        content: trimmed,
      });

      if (error) {
        throw new Error(error.message);
      }

      const nowIso = new Date().toISOString();
      const nowTs = new Date(nowIso).getTime();

      await supabase
        .from("conversations")
        .update({ updated_at: nowIso })
        .eq("id", conversationId);

      setConversations((prev) =>
        sortConversations(
          prev.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  updatedAt: nowTs,
                  lastMessageText: trimmed,
                  lastMessageAt: nowTs,
                  lastSenderId: authUser.id,
                }
              : conversation,
          ),
        ),
      );

      const { data: participantRows } = await supabase
        .from("conversation_participants")
        .select(
          `
        user_id,
        profiles:user_id (
          id,
          full_name,
          username,
          expo_push_token
        )
      `,
        )
        .eq("conversation_id", conversationId)
        .neq("user_id", authUser.id);

      const senderName =
        appUser?.name || authUser.email || "ReadSphere Kullanıcısı";

      for (const row of participantRows ?? []) {
        const profileRaw = row.profiles;
        const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;

        const token = profile?.expo_push_token;

        if (token) {
          await sendPushNotification(
            token,
            senderName,
            trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed,
          );
        }
      }
    },
    [authUser?.id, authUser?.email, appUser?.name],
  );
  const removeConversationLocally = useCallback((conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setMessages((prev) =>
      prev.filter((m) => m.conversationId !== conversationId),
    );
    setUnreadByConversation((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  }, []);

  const leaveGroupConversation = useCallback(
    async (conversationId: string) => {
      removeConversationLocally(conversationId);

      const { error } = await supabase.rpc("leave_conversation", {
        p_conversation_id: conversationId,
      });

      if (error) {
        console.log("RPC LEAVE CONVERSATION ERROR:", error);
        throw error;
      }

      await refreshConversations();
    },
    [refreshConversations, removeConversationLocally],
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      removeConversationLocally(conversationId);

      const { error } = await supabase.rpc("leave_conversation", {
        p_conversation_id: conversationId,
      });

      if (error) {
        console.log("RPC DELETE CONVERSATION ERROR:", error);
        throw error;
      }

      await refreshConversations();
    },
    [refreshConversations, removeConversationLocally],
  );

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

      setUnreadByConversation((prev) => ({
        ...prev,
        [conversationId]: 0,
      }));
    },
    [authUser?.id, me.id],
  );

  const clearAllChats = useCallback(() => {
    setConversations([]);
    setMessages([]);
    setTypingByConversation({});
    setUnreadByConversation({});
    unsubscribeFromConversation();
  }, [unsubscribeFromConversation]);

  const value = useMemo<ChatContextType>(
    () => ({
      conversations,
      messages,
      loading,
      typingByConversation,
      totalUnreadCount,
      unreadByConversation,
      createConversation,
      getOrCreateConversationByParticipant,
      sendMessage,
      deleteConversation,
      leaveGroupConversation,
      getConversationById,
      getMessagesByConversationId,
      markConversationAsRead,
      clearAllChats,
      fetchMessagesForConversation,
      refreshConversations,
      fetchConversationById,
      subscribeToConversation,
      unsubscribeFromConversation,
    }),
    [
      conversations,
      messages,
      loading,
      typingByConversation,
      totalUnreadCount,
      unreadByConversation,
      createConversation,
      getOrCreateConversationByParticipant,
      sendMessage,
      deleteConversation,
      leaveGroupConversation,
      getConversationById,
      getMessagesByConversationId,
      markConversationAsRead,
      clearAllChats,
      fetchMessagesForConversation,
      refreshConversations,
      fetchConversationById,
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
