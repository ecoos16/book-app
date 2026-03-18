import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useChat } from "../../../context/ChatContext";
import { CURRENT_USER } from "../../../data/mockUsers";
import type { ChatParticipant, Message } from "../../../types/chat";

/**
 * Mesaj saatini HH:mm formatında gösterir
 */
function formatMessageTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Avatar yoksa isimden baş harf üretir
 */
function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ChatDetailScreen() {
  /**
   * Route parametreleri
   * id -> konuşma id
   * prefill -> dışarıdan hazır mesaj metni
   */
  const { id, prefill } = useLocalSearchParams<{
    id: string;
    prefill?: string;
  }>();

  /**
   * Chat context verileri
   */
  const {
    getConversationById,
    getMessagesByConversationId,
    sendMessage,
    markConversationAsRead,
    typingByConversation,
  } = useChat();

  /**
   * Input state
   */
  const [text, setText] = useState("");

  /**
   * Prefill sadece bir kez uygulansın
   */
  const prefillAppliedRef = useRef(false);

  /**
   * Mesaj listesi referansı
   */
  const listRef = useRef<FlatList<Message>>(null);

  /**
   * Aktif konuşma
   */
  const conversation = useMemo(() => {
    if (!id) return undefined;
    return getConversationById(id);
  }, [id, getConversationById]);

  /**
   * Bu konuşmanın mesajları
   */
  const messages = useMemo(() => {
    if (!id) return [];
    return getMessagesByConversationId(id);
  }, [id, getMessagesByConversationId]);

  /**
   * Karşı tarafı bul
   */
  const otherUser = useMemo(() => {
    return conversation?.participants.find(
      (participant: ChatParticipant) => participant.id !== CURRENT_USER.id,
    );
  }, [conversation]);

  /**
   * Karşı taraf yazıyor mu?
   */
  const isTyping = useMemo(() => {
    if (!id) return false;
    return Boolean(typingByConversation[id]);
  }, [id, typingByConversation]);

  /**
   * Input boşsa gönder butonunu pasif yap
   */
  const isSendDisabled = useMemo(() => {
    return text.trim().length === 0;
  }, [text]);

  /**
   * Son mesajı bul
   */
  const lastMessage = useMemo(() => {
    if (!messages.length) return undefined;
    return messages[messages.length - 1];
  }, [messages]);

  /**
   * Son mesaj bana mı ait?
   */
  const isLastMessageMine = useMemo(() => {
    return lastMessage?.senderId === CURRENT_USER.id;
  }, [lastMessage]);

  /**
   * Son benim mesajım için küçük durum metni
   */
  const lastOwnMessageStatus = useMemo(() => {
    if (!lastMessage || !isLastMessageMine) return null;

    if (isTyping) return "Yanıt yazıyor...";

    return "Gönderildi";
  }, [lastMessage, isLastMessageMine, isTyping]);

  /**
   * Dışarıdan prefill geldiyse input'a yalnızca bir kez yerleştir
   */
  useEffect(() => {
    if (prefillAppliedRef.current) return;

    if (typeof prefill === "string" && prefill.trim()) {
      setText(prefill);
      prefillAppliedRef.current = true;
    }
  }, [prefill]);

  /**
   * Sohbet açılınca karşı taraftan gelen mesajları okundu say
   */
  useEffect(() => {
    if (!id) return;
    markConversationAsRead(id);
  }, [id, markConversationAsRead]);

  /**
   * Mesaj sayısı değiştikçe aşağı kaydır
   */
  useEffect(() => {
    if (!messages.length) return;

    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages.length]);

  /**
   * Typing durumu açıldığında da en alta kaydır
   */
  useEffect(() => {
    if (!isTyping) return;

    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 60);

    return () => clearTimeout(timer);
  }, [isTyping]);

  /**
   * Mesaj gönder
   */
  const handleSend = () => {
    if (!id) return;
    if (isSendDisabled) return;

    sendMessage(id, text);
    setText("");
  };

  /**
   * Konuşma bulunamadıysa fallback ekranı
   */
  if (!conversation) {
    return (
      <View style={styles.notFoundContainer}>
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
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.iconButtonText}>←</Text>
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

      {/* ================= MESAJ LİSTESİ ================= */}
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
          const isMine = item.senderId === CURRENT_USER.id;

          /**
           * Bu mesaj listedeki son benim mesajım mı?
           */
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

      {/* ================= INPUT ALANI ================= */}
      <View style={styles.inputBar}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Mesaj yaz..."
          placeholderTextColor="#9ca3af"
          style={styles.input}
          multiline
          maxLength={500}
          textAlignVertical="top"
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
          <Text
            style={[
              styles.sendButtonText,
              isSendDisabled && styles.sendButtonTextDisabled,
            ]}
          >
            Gönder
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  header: {
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
  },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
  },
  headerAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarFallbackText: {
    fontWeight: "700",
    color: "#374151",
  },

  headerTextArea: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#6b7280",
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  messageBubbleMine: {
    backgroundColor: "#111827",
    borderBottomRightRadius: 6,
  },
  messageBubbleOther: {
    backgroundColor: "#f3f4f6",
    borderBottomLeftRadius: 6,
  },

  typingBubble: {
    backgroundColor: "#f3f4f6",
    borderBottomLeftRadius: 6,
  },
  typingText: {
    color: "#6b7280",
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
    color: "#6b7280",
  },

  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMine: {
    color: "#ffffff",
  },
  messageTextOther: {
    color: "#111827",
  },

  messageTime: {
    marginTop: 6,
    fontSize: 11,
  },
  messageTimeMine: {
    color: "#d1d5db",
    textAlign: "right",
  },
  messageTimeOther: {
    color: "#6b7280",
    textAlign: "left",
  },

  emptyCard: {
    marginTop: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    backgroundColor: "#f9fafb",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
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
    borderTopColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },

  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#ffffff",
  },

  sendButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  sendButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  sendButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  sendButtonTextDisabled: {
    color: "#6b7280",
  },

  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  notFoundContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  notFoundText: {
    marginTop: 8,
    textAlign: "center",
    color: "#6b7280",
    lineHeight: 21,
    fontSize: 14,
  },

  backButton: {
    marginTop: 18,
    backgroundColor: "#111827",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
});
