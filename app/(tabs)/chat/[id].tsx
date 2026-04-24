// app/(tabs)/chat/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { useChat } from "../../../context/ChatContext";
import type { ChatParticipant, Message } from "../../../types/chat";

const COLORS = {
  bg: "#fbf9f5",
  card: "#fffdf9",
  border: "#ece7df",
  text: "#2f2a24",
  muted: "#7a7268",
  primary: "#7d5739",
  primarySoft: "#f3e2d2",
  graySoft: "#f3efe8",
  whiteSoft: "#fff7f4",
  danger: "#b64646",
};

function formatMessageTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ChatDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    prefill?: string | string[];
  }>();

  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const prefill = Array.isArray(params.prefill)
    ? params.prefill[0]
    : params.prefill;

  const { user: authUser } = useAuth();

  const {
    loading,
    getConversationById,
    getMessagesByConversationId,
    sendMessage,
    markConversationAsRead,
    typingByConversation,
    fetchMessagesForConversation,
    fetchConversationById,
    subscribeToConversation,
    unsubscribeFromConversation,
    deleteConversation,
    leaveGroupConversation,
  } = useChat();

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [resolvedConversation, setResolvedConversation] = useState(
    conversationId ? getConversationById(conversationId) : undefined,
  );

  const prefillAppliedRef = useRef(false);
  const listRef = useRef<FlatList<Message>>(null);

  const currentUserId = authUser?.id ?? "";

  useEffect(() => {
    let active = true;

    const resolveConversation = async () => {
      if (!conversationId) {
        if (active) setLocalLoading(false);
        return;
      }

      try {
        if (active) setLocalLoading(true);

        const existing = getConversationById(conversationId);
        if (existing) {
          if (active) {
            setResolvedConversation(existing);
            setLocalLoading(false);
          }
          return;
        }

        let fetched = await fetchConversationById(conversationId);

        if (!fetched) {
          await sleep(250);
          fetched = await fetchConversationById(conversationId);
        }

        if (!fetched) {
          await sleep(500);
          fetched = await fetchConversationById(conversationId);
        }

        if (active) {
          setResolvedConversation(fetched ?? undefined);
        }
      } catch (error) {
        console.log("CHAT DETAIL RESOLVE CONVERSATION ERROR:", error);
      } finally {
        if (active) {
          setLocalLoading(false);
        }
      }
    };

    resolveConversation();

    return () => {
      active = false;
    };
  }, [conversationId, fetchConversationById, getConversationById]);

  const conversation = useMemo(() => {
    if (!conversationId) return undefined;

    const existing = getConversationById(conversationId);
    if (existing) return existing;

    return resolvedConversation;
  }, [conversationId, getConversationById, resolvedConversation]);

  const messages = useMemo(() => {
    if (!conversationId) return [];
    return getMessagesByConversationId(conversationId);
  }, [conversationId, getMessagesByConversationId]);

  const otherUser = useMemo(() => {
    return conversation?.participants.find(
      (participant: ChatParticipant) => participant.id !== currentUserId,
    );
  }, [conversation, currentUserId]);

  const otherParticipants = useMemo(() => {
    return (
      conversation?.participants.filter(
        (participant: ChatParticipant) => participant.id !== currentUserId,
      ) ?? []
    );
  }, [conversation, currentUserId]);

  const isGroupChat = Boolean(conversation?.isGroup);

  const headerTitle = useMemo(() => {
    if (!conversation) return "Sohbet";
    if (isGroupChat) return conversation.title?.trim() || "Grup Sohbeti";
    return otherUser?.name || "Sohbet";
  }, [conversation, isGroupChat, otherUser]);

  const isTyping = useMemo(() => {
    if (!conversationId) return false;
    return Boolean(typingByConversation[conversationId]);
  }, [conversationId, typingByConversation]);

  const headerSubtitle = useMemo(() => {
    if (isGroupChat) {
      return `${conversation?.participants?.length ?? 0} katılımcı`;
    }
    return isTyping ? "yazıyor..." : "Doğrudan mesaj";
  }, [conversation, isGroupChat, isTyping]);

  const isSendDisabled = !conversationId || text.trim().length === 0 || sending;

  const lastMessage = messages.length
    ? messages[messages.length - 1]
    : undefined;
  const isLastMessageMine = lastMessage?.senderId === currentUserId;

  const lastOwnMessageStatus = useMemo(() => {
    if (!lastMessage || !isLastMessageMine) return null;
    if (isTyping && !isGroupChat) return "Yanıt yazıyor...";
    return "Gönderildi";
  }, [isGroupChat, isLastMessageMine, isTyping, lastMessage]);

  useEffect(() => {
    if (prefillAppliedRef.current) return;

    if (typeof prefill === "string" && prefill.trim()) {
      setText(prefill);
      prefillAppliedRef.current = true;
    }
  }, [prefill]);

  useEffect(() => {
    if (!conversationId) return;

    fetchMessagesForConversation(conversationId).catch((error) => {
      console.log("CHAT DETAIL FETCH MESSAGES ERROR:", error);
    });

    subscribeToConversation(conversationId);

    return () => {
      unsubscribeFromConversation();
    };
  }, [
    conversationId,
    fetchMessagesForConversation,
    subscribeToConversation,
    unsubscribeFromConversation,
  ]);

  useEffect(() => {
    if (!conversationId) return;
    markConversationAsRead(conversationId);
  }, [conversationId, markConversationAsRead]);

  useEffect(() => {
    if (!messages.length) return;

    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [messages.length]);

  const handleSend = async () => {
    if (!conversationId || isSendDisabled) return;

    const currentText = text.trim();
    if (!currentText) return;

    Keyboard.dismiss();

    try {
      setSending(true);
      setText("");
      await sendMessage(conversationId, currentText);
    } catch (error) {
      console.log("SEND MESSAGE SCREEN ERROR:", error);
      setText(currentText);
      Alert.alert("Hata", "Mesaj gönderilirken bir sorun oluştu.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteOrLeave = () => {
    if (!conversation || !conversationId) return;

    Alert.alert(
      isGroupChat ? "Gruptan ayrıl" : "Sohbeti sil",
      isGroupChat
        ? `"${headerTitle}" grubundan ayrılmak istiyor musun?`
        : `"${headerTitle}" sohbeti silinsin mi?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: isGroupChat ? "Ayrıl" : "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);

              if (isGroupChat) {
                await leaveGroupConversation(conversationId);
              } else {
                await deleteConversation(conversationId);
              }

              router.replace("/chat");
            } catch (error: any) {
              console.log("CHAT DETAIL DELETE OR LEAVE ERROR:", error);
              Alert.alert(
                "Hata",
                error?.message || "İşlem sırasında bir sorun oluştu.",
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  if (!conversationId) {
    return (
      <View style={styles.notFoundContainer}>
        <View style={styles.notFoundIconWrap}>
          <Ionicons
            name="chatbox-ellipses-outline"
            size={32}
            color={COLORS.primary}
          />
        </View>
        <Text style={styles.notFoundTitle}>Geçersiz sohbet</Text>
        <Text style={styles.notFoundText}>
          Açılmaya çalışılan sohbet kimliği bulunamadı.
        </Text>
        <Pressable
          onPress={() => router.replace("/chat")}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.backButtonText}>Sohbetlere Dön</Text>
        </Pressable>
      </View>
    );
  }

  if ((loading || localLoading) && !conversation) {
    return (
      <View style={styles.notFoundContainer}>
        <View style={styles.notFoundIconWrap}>
          <Ionicons
            name="chatbox-ellipses-outline"
            size={32}
            color={COLORS.primary}
          />
        </View>
        <Text style={styles.notFoundTitle}>Sohbet yükleniyor</Text>
        <Text style={styles.notFoundText}>
          Konuşma bilgileri hazırlanıyor...
        </Text>
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={styles.notFoundContainer}>
        <View style={styles.notFoundIconWrap}>
          <Ionicons
            name="chatbox-ellipses-outline"
            size={32}
            color={COLORS.primary}
          />
        </View>
        <Text style={styles.notFoundTitle}>Sohbet bulunamadı</Text>
        <Text style={styles.notFoundText}>
          Bu konuşma erişilemiyor olabilir. Büyük ihtimalle Supabase policy
          tarafı engelliyor.
        </Text>
        <Pressable
          onPress={() => router.replace("/chat")}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.backButtonText}>Sohbetlere Dön</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace("/chat")}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        </Pressable>

        {isGroupChat ? (
          <View style={styles.headerAvatarFallback}>
            <Ionicons name="people-outline" size={22} color={COLORS.primary} />
          </View>
        ) : otherUser?.avatar ? (
          <Image
            source={{ uri: otherUser.avatar }}
            style={styles.headerAvatar}
          />
        ) : (
          <View style={styles.headerAvatarFallback}>
            <Text style={styles.headerAvatarFallbackText}>
              {getInitials(otherUser?.name || "U")}
            </Text>
          </View>
        )}

        <View style={styles.headerTextArea}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
        </View>

        <Pressable
          onPress={handleDeleteOrLeave}
          disabled={actionLoading}
          style={({ pressed }) => [
            styles.headerActionButton,
            pressed && !actionLoading && styles.buttonPressed,
            actionLoading && styles.headerActionButtonDisabled,
          ]}
        >
          <Ionicons
            name={isGroupChat ? "exit-outline" : "trash-outline"}
            size={18}
            color={isGroupChat ? COLORS.text : COLORS.danger}
          />
        </Pressable>
      </View>

      {isGroupChat && (
        <View style={styles.groupInfoBar}>
          <Text style={styles.groupInfoText} numberOfLines={2}>
            {otherParticipants.map((p) => p.name).join(", ")}
          </Text>
        </View>
      )}

      <FlatList<Message>
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item, index }) => {
          const isMine = item.senderId === currentUserId;

          const isLastOwnBubble =
            isMine &&
            index === messages.length - 1 &&
            Boolean(lastOwnMessageStatus);

          return (
            <View>
              <View
                style={[
                  styles.messageRow,
                  isMine ? styles.messageRowMine : styles.messageRowOther,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isMine
                      ? styles.messageBubbleMine
                      : styles.messageBubbleOther,
                  ]}
                >
                  {!isMine && isGroupChat ? (
                    <Text style={styles.groupSenderName}>
                      {item.senderName}
                    </Text>
                  ) : null}

                  <Text
                    style={[
                      styles.messageText,
                      isMine ? styles.messageTextMine : styles.messageTextOther,
                    ]}
                  >
                    {item.text}
                  </Text>

                  <Text
                    style={[
                      styles.messageTime,
                      isMine ? styles.messageTimeMine : styles.messageTimeOther,
                    ]}
                  >
                    {formatMessageTime(item.createdAt)}
                  </Text>
                </View>
              </View>

              {isLastOwnBubble && (
                <View style={styles.lastStatusRow}>
                  <Text style={styles.lastStatusText}>
                    {lastOwnMessageStatus}
                  </Text>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
            <Text style={styles.emptyText}>
              İlk mesajı göndererek bu sohbeti başlatabilirsin.
            </Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Mesaj yaz..."
          placeholderTextColor="#9a9389"
          style={styles.input}
          multiline={false}
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={() => {
            if (text.trim()) {
              handleSend();
            }
          }}
        />

        <Pressable
          onPress={handleSend}
          disabled={isSendDisabled}
          style={({ pressed }) => [
            styles.sendButton,
            isSendDisabled && styles.sendButtonDisabled,
            pressed && !isSendDisabled && styles.buttonPressed,
          ]}
        >
          <Ionicons
            name="send"
            size={16}
            color={isSendDisabled ? "#8d877e" : COLORS.whiteSoft}
          />
          <Text
            style={[
              styles.sendButtonText,
              isSendDisabled && styles.sendButtonTextDisabled,
            ]}
          >
            {sending ? "..." : "Gönder"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.graySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.graySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerActionButtonDisabled: { opacity: 0.7 },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.graySoft,
  },
  headerAvatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarFallbackText: { fontWeight: "900", color: COLORS.primary },
  headerTextArea: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  headerSubtitle: { marginTop: 2, fontSize: 13, color: COLORS.muted },
  groupInfoBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  groupInfoText: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  messagesContent: { padding: 16, paddingBottom: 28 },
  messageRow: { flexDirection: "row", marginBottom: 10 },
  messageRowMine: { justifyContent: "flex-end" },
  messageRowOther: { justifyContent: "flex-start" },
  messageBubble: {
    maxWidth: "78%",
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 18,
    borderWidth: 1,
  },
  messageBubbleMine: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderBottomRightRadius: 7,
  },
  messageBubbleOther: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 7,
  },
  groupSenderName: {
    color: COLORS.primary,
    fontWeight: "900",
    marginBottom: 6,
    fontSize: 12,
  },
  lastStatusRow: {
    alignItems: "flex-end",
    marginTop: -4,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  lastStatusText: { fontSize: 11, color: COLORS.muted },
  messageText: { fontSize: 15, lineHeight: 21 },
  messageTextMine: { color: COLORS.whiteSoft },
  messageTextOther: { color: COLORS.text },
  messageTime: { marginTop: 6, fontSize: 11 },
  messageTimeMine: { color: "#f3e7dc", textAlign: "right" },
  messageTimeOther: { color: COLORS.muted, textAlign: "left" },
  emptyCard: {
    marginTop: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 21,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sendButtonDisabled: { backgroundColor: "#ddd6cb" },
  sendButtonText: { color: COLORS.whiteSoft, fontWeight: "900", fontSize: 14 },
  sendButtonTextDisabled: { color: "#8d877e" },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  notFoundContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  notFoundIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  notFoundTitle: { fontSize: 21, fontWeight: "900", color: COLORS.text },
  notFoundText: {
    marginTop: 8,
    textAlign: "center",
    color: COLORS.muted,
    lineHeight: 21,
    fontSize: 14,
  },
  backButton: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  backButtonText: { color: COLORS.whiteSoft, fontWeight: "900", fontSize: 14 },
});
