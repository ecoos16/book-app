import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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
  primaryDark: "#6b4a2f",
  primarySoft: "#f3e2d2",
  graySoft: "#f3efe8",
  whiteSoft: "#fff7f4",
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
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ChatDetailScreen() {
  const { id, prefill } = useLocalSearchParams<{
    id: string;
    prefill?: string;
  }>();

  const { user: authUser } = useAuth();

  const {
    getConversationById,
    getMessagesByConversationId,
    sendMessage,
    markConversationAsRead,
    typingByConversation,
    fetchMessagesForConversation,
    subscribeToConversation,
    unsubscribeFromConversation,
  } = useChat();

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const prefillAppliedRef = useRef(false);
  const listRef = useRef<FlatList<Message>>(null);

  const conversation = useMemo(() => {
    if (!id) return undefined;
    return getConversationById(id);
  }, [id, getConversationById]);

  const messages = useMemo(() => {
    if (!id) return [];
    return getMessagesByConversationId(id);
  }, [id, getMessagesByConversationId]);

  const currentUserId = authUser?.id ?? "";

  const otherUser = useMemo(() => {
    return conversation?.participants.find(
      (participant: ChatParticipant) => participant.id !== currentUserId,
    );
  }, [conversation, currentUserId]);

  const isTyping = useMemo(() => {
    if (!id) return false;
    return Boolean(typingByConversation[id]);
  }, [id, typingByConversation]);

  const isSendDisabled = useMemo(() => {
    return text.trim().length === 0 || sending;
  }, [text, sending]);

  const lastMessage = useMemo(() => {
    if (!messages.length) return undefined;
    return messages[messages.length - 1];
  }, [messages]);

  const isLastMessageMine = useMemo(() => {
    return lastMessage?.senderId === currentUserId;
  }, [lastMessage, currentUserId]);

  const lastOwnMessageStatus = useMemo(() => {
    if (!lastMessage || !isLastMessageMine) return null;
    if (isTyping) return "Yanıt yazıyor...";
    return "Gönderildi";
  }, [lastMessage, isLastMessageMine, isTyping]);

  useEffect(() => {
    if (prefillAppliedRef.current) return;

    if (typeof prefill === "string" && prefill.trim()) {
      setText(prefill);
      prefillAppliedRef.current = true;
    }
  }, [prefill]);

  useEffect(() => {
    if (!id) return;

    fetchMessagesForConversation(id);
    subscribeToConversation(id);

    return () => {
      unsubscribeFromConversation();
    };
  }, [
    id,
    fetchMessagesForConversation,
    subscribeToConversation,
    unsubscribeFromConversation,
  ]);

  useEffect(() => {
    if (!id) return;
    markConversationAsRead(id);
  }, [id, markConversationAsRead]);

  useEffect(() => {
    if (!messages.length) return;

    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages.length]);

  useEffect(() => {
    if (!isTyping) return;

    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 60);

    return () => clearTimeout(timer);
  }, [isTyping]);

  const handleSend = async () => {
    if (!id || isSendDisabled) return;

    const currentText = text.trim();
    if (!currentText) return;

    Keyboard.dismiss(); // 👈 BUNU EKLE

    try {
      setSending(true);
      setText("");
      await sendMessage(id, currentText);
    } catch (error) {
      console.log("SEND MESSAGE SCREEN ERROR:", error);
      setText(currentText);
    } finally {
      setSending(false);
    }
  };

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

        <Text style={styles.notFoundTitle}>Konuşma bulunamadı</Text>
        <Text style={styles.notFoundText}>
          Bu sohbet silinmiş olabilir ya da geçersiz bir bağlantı açılmış
          olabilir.
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.backButtonText}>Geri Dön</Text>
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
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        </Pressable>

        {otherUser?.avatar ? (
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
          <Text style={styles.headerTitle}>{otherUser?.name || "Sohbet"}</Text>
          <Text style={styles.headerSubtitle}>
            {isTyping ? "yazıyor..." : "Doğrudan mesaj"}
          </Text>
        </View>
      </View>

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
        ListFooterComponent={
          isTyping ? (
            <View style={[styles.messageRow, styles.messageRowOther]}>
              <View style={[styles.messageBubble, styles.typingBubble]}>
                <Text style={styles.typingText}>
                  {otherUser?.name || "Biri"} yazıyor...
                </Text>
              </View>
            </View>
          ) : null
        }
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
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
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
  headerAvatarFallbackText: {
    fontWeight: "900",
    color: COLORS.primary,
  },
  headerTextArea: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.muted,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 28,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
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
  typingBubble: {
    backgroundColor: COLORS.graySoft,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 7,
  },
  typingText: {
    color: COLORS.muted,
    fontSize: 14,
    fontStyle: "italic",
  },
  lastStatusRow: {
    alignItems: "flex-end",
    marginTop: -4,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  lastStatusText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageTextMine: {
    color: COLORS.whiteSoft,
  },
  messageTextOther: {
    color: COLORS.text,
  },
  messageTime: {
    marginTop: 6,
    fontSize: 11,
  },
  messageTimeMine: {
    color: "#f3e7dc",
    textAlign: "right",
  },
  messageTimeOther: {
    color: COLORS.muted,
    textAlign: "left",
  },
  emptyCard: {
    marginTop: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },
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
  sendButtonDisabled: {
    backgroundColor: "#ddd6cb",
  },
  sendButtonText: {
    color: COLORS.whiteSoft,
    fontWeight: "900",
    fontSize: 14,
  },
  sendButtonTextDisabled: {
    color: "#8d877e",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
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
  notFoundTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.text,
  },
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
  backButtonText: {
    color: COLORS.whiteSoft,
    fontWeight: "900",
    fontSize: 14,
  },
});
