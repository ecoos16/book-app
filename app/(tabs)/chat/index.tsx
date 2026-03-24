// app/(tabs)/chat/index.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useChat } from "../../../context/ChatContext";
import { CURRENT_USER } from "../../../data/mockUsers";
import type {
  ChatParticipant,
  Conversation,
  Message,
} from "../../../types/chat";

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
  greenSoft: "#dfe7cf",
  graySoft: "#f3efe8",
  whiteSoft: "#fff7f4",
  dangerSoft: "#fff4f4",
  dangerBorder: "#ffd8d8",
  dangerText: "#a22b2b",
};

/**
 * Tarih alanını kısa formatta gösterir
 */
function formatChatDate(timestamp?: number) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Avatar yoksa isim baş harfi üretir
 */
function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ChatListScreen() {
  /**
   * Chat context verileri
   */
  const { conversations, messages, deleteConversation, typingByConversation } =
    useChat();

  /**
   * En güncel konuşmalar üstte olacak şekilde sırala
   */
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [conversations]);

  /**
   * Bir konuşmadaki okunmamış mesaj sayısını hesaplar
   */
  function getUnreadCount(conversationId: string) {
    return messages.filter(
      (message: Message) =>
        message.conversationId === conversationId &&
        message.senderId !== CURRENT_USER.id &&
        !message.isRead,
    ).length;
  }

  /**
   * Son mesajı getir
   */
  function getLastMessage(conversationId: string) {
    const conversationMessages = messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => b.createdAt - a.createdAt);

    return conversationMessages[0];
  }

  /**
   * Konuşmayı aç
   */
  const handleOpenChat = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  /**
   * Konuşmayı sil
   */
  const handleDeleteChat = (conversationId: string) => {
    Alert.alert("Sohbeti Sil", "Bu konuşmayı silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => deleteConversation(conversationId),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <View style={styles.headerTextArea}>
          <Text style={styles.title}>Sohbet</Text>
          <Text style={styles.subtitle}>
            Okurlar arasındaki konuşmaların burada görünür.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/chat/new")}
          style={({ pressed }) => [
            styles.newButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons name="add" size={16} color={COLORS.whiteSoft} />
          <Text style={styles.newButtonText}>Yeni</Text>
        </Pressable>
      </View>

      {/* ================= EMPTY STATE ================= */}
      {sortedConversations.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={28}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>Henüz sohbet yok</Text>
          <Text style={styles.emptyText}>
            Yeni sohbet başlat ekranından bir kullanıcı seçip mesajlaşmaya
            başlayabilirsin.
          </Text>

          <Pressable
            onPress={() => router.push("/chat/new")}
            style={({ pressed }) => [
              styles.emptyActionButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.emptyActionButtonText}>Yeni Sohbet Başlat</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList<Conversation>
          data={sortedConversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            /**
             * Karşı tarafı bul
             */
            const otherUser = item.participants.find(
              (participant: ChatParticipant) =>
                participant.id !== CURRENT_USER.id,
            );

            const unreadCount = getUnreadCount(item.id);
            const lastMessage = getLastMessage(item.id);
            const isTyping = Boolean(typingByConversation[item.id]);

            if (!otherUser) return null;

            /**
             * Preview metni
             */
            let previewText = "Henüz mesaj yok";

            if (isTyping) {
              previewText = `${otherUser.name} yazıyor...`;
            } else if (lastMessage) {
              previewText =
                lastMessage.senderId === CURRENT_USER.id
                  ? `Sen: ${lastMessage.text}`
                  : lastMessage.text;
            }

            return (
              <Pressable
                onPress={() => handleOpenChat(item.id)}
                style={({ pressed }) => [
                  styles.chatCard,
                  pressed && styles.cardPressed,
                ]}
              >
                {otherUser.avatar ? (
                  <Image
                    source={{ uri: otherUser.avatar }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {getInitials(otherUser.name)}
                    </Text>
                  </View>
                )}

                <View style={styles.chatInfo}>
                  <View style={styles.chatTopRow}>
                    <Text style={styles.chatName} numberOfLines={1}>
                      {otherUser.name}
                    </Text>

                    <Text style={styles.chatDate}>
                      {formatChatDate(item.lastMessageAt || item.updatedAt)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.chatPreview,
                      isTyping && styles.chatPreviewTyping,
                    ]}
                    numberOfLines={1}
                  >
                    {previewText}
                  </Text>

                  <View style={styles.bottomRow}>
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() => handleOpenChat(item.id)}
                        style={({ pressed }) => [
                          styles.smallButton,
                          styles.openButton,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.openButtonText}>Aç</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleDeleteChat(item.id)}
                        style={({ pressed }) => [
                          styles.smallButton,
                          styles.deleteButton,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.deleteButtonText}>Sil</Text>
                      </Pressable>
                    </View>

                    {unreadCount > 0 ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {unreadCount}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.readDot} />
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /**
   * Sayfa kapsayıcı
   */
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  /**
   * Header
   */
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerTextArea: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },

  /**
   * Yeni sohbet butonu
   */
  newButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  newButtonText: {
    color: COLORS.whiteSoft,
    fontWeight: "800",
    fontSize: 14,
  },

  /**
   * Liste alanı
   */
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    gap: 12,
  },

  /**
   * Sohbet kartı
   */
  chatCard: {
    flexDirection: "row",
    gap: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    shadowColor: "#2f2a24",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },

  /**
   * Avatar
   */
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.graySoft,
  },
  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },

  /**
   * Kart bilgi alanı
   */
  chatInfo: {
    flex: 1,
    justifyContent: "center",
  },
  chatTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  chatName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
  },
  chatDate: {
    fontSize: 12,
    color: COLORS.muted,
  },

  /**
   * Son mesaj preview
   */
  chatPreview: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.muted,
  },
  chatPreviewTyping: {
    color: COLORS.primary,
    fontStyle: "italic",
  },

  /**
   * Alt aksiyon satırı
   */
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  /**
   * Butonlar
   */
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  openButton: {
    backgroundColor: COLORS.graySoft,
    borderColor: COLORS.border,
  },
  openButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  deleteButton: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: COLORS.dangerBorder,
  },
  deleteButtonText: {
    color: COLORS.dangerText,
    fontSize: 13,
    fontWeight: "800",
  },

  /**
   * Okunmamış rozet
   */
  unreadBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    color: COLORS.whiteSoft,
    fontSize: 12,
    fontWeight: "900",
  },
  readDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#d8d2c7",
  },

  /**
   * Boş durum
   */
  emptyCard: {
    marginHorizontal: 18,
    marginTop: 24,
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "flex-start",
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
  },
  emptyActionButton: {
    marginTop: 18,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
  },
  emptyActionButtonText: {
    color: COLORS.whiteSoft,
    fontWeight: "900",
  },

  /**
   * Basma efekti
   */
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
