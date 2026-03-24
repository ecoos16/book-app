// app/(tabs)/chat/[id].tsx

import { Ionicons } from "@expo/vector-icons";
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
 * Ortak renk paleti
 */
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
   */
  const { id, prefill } = useLocalSearchParams<{
    id: string;
    prefill?: string;
  }>();

  /**
   * Chat context
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
   * Liste referansı
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
   * Mesajlar
   */
  const messages = useMemo(() => {
    if (!id) return [];
    return getMessagesByConversationId(id);
  }, [id, getMessagesByConversationId]);

  /**
   * Karşı taraf
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
   * Gönder butonu aktif mi?
   */
  const isSendDisabled = useMemo(() => {
    return text.trim().length === 0;
  }, [text]);

  /**
   * Son mesaj
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
   * Benim son mesajım için küçük durum metni
   */
  const lastOwnMessageStatus = useMemo(() => {
    if (!lastMessage || !isLastMessageMine) return null;
    if (isTyping) return "Yanıt yazıyor...";
    return "Gönderildi";
  }, [lastMessage, isLastMessageMine, isTyping]);

  /**
   * Prefill input'a bir kez yerleştir
   */
  useEffect(() => {
    if (prefillAppliedRef.current) return;

    if (typeof prefill === "string" && prefill.trim()) {
      setText(prefill);
      prefillAppliedRef.current = true;
    }
  }, [prefill]);

  /**
   * Sohbet ekranı açılınca sadece ilgili konuşmadaki
   * karşı taraf mesajlarını okundu say
   *
   * Dikkat:
   * markConversationAsRead dependency array'e eklenirse
   * context her render'da yeni referans üretebildiği için
   * sonsuz döngü oluşabilir.
   */
  useEffect(() => {
    if (!id) return;
    markConversationAsRead(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /**
   * Mesaj değişince aşağı kaydır
   */
  useEffect(() => {
    if (!messages.length) return;

    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages.length]);

  /**
   * Typing görünürken de aşağı kaydır
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
   * Konuşma yoksa fallback
   */
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
      {/* ================= HEADER ================= */}
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
           * Son benim mesajım mı?
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
          placeholderTextColor="#9a9389"
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
            Gönder
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  /**
   * Ana kapsayıcı
   */
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  /**
   * Header
   */
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

  /**
   * Mesaj listesi
   */
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

  /**
   * Balonlar
   */
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

  /**
   * Son durum
   */
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

  /**
   * Mesaj metni / saat
   */
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

  /**
   * Boş durum
   */
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

  /**
   * Alt input bar
   */
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

  /**
   * Basma efekti
   */
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  /**
   * Not found
   */
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
