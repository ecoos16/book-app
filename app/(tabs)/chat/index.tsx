// app/(tabs)/chat/index.tsx

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
   * Chat verileri
   */
  const { conversations, messages, deleteConversation, typingByConversation } =
    useChat();

  /**
   * En güncel konuşmalar üstte olsun
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
   * Son mesajı getirir
   * Böylece preview kısmında daha doğru bilgi gösterebiliriz
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
      {
        text: "Vazgeç",
        style: "cancel",
      },
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
          <Text style={styles.title}>Mesajlar</Text>
          <Text style={styles.subtitle}>Tüm sohbetlerin burada görünecek</Text>
        </View>

        <Pressable
          onPress={() => router.push("/chat/new")}
          style={({ pressed }) => [
            styles.newButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.newButtonText}>+ Yeni</Text>
        </Pressable>
      </View>

      {/* ================= EMPTY STATE ================= */}
      {sortedConversations.length === 0 ? (
        <View style={styles.emptyCard}>
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

            /**
             * Okunmamış mesaj sayısı
             */
            const unreadCount = getUnreadCount(item.id);

            /**
             * Son mesaj
             */
            const lastMessage = getLastMessage(item.id);

            /**
             * Yazıyor durumu
             */
            const isTyping = Boolean(typingByConversation[item.id]);

            if (!otherUser) return null;

            /**
             * Preview metni
             * 1) Yazıyor durumu varsa onu göster
             * 2) Son mesaj senden geldiyse "Sen: ..."
             * 3) Karşı tarafsa direkt mesaj metni
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

                    {unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {unreadCount}
                        </Text>
                      </View>
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
    backgroundColor: "#ffffff",
  },

  /**
   * Üst başlık alanı
   */
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
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
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },

  /**
   * Yeni sohbet butonu
   */
  newButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  newButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },

  /**
   * Liste alanı
   */
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },

  /**
   * Kart görünümü
   */
  chatCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    backgroundColor: "#fafafa",
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },

  /**
   * Avatar alanı
   */
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f3f4f6",
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },

  /**
   * Kart içi bilgi alanı
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
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  chatDate: {
    fontSize: 12,
    color: "#6b7280",
  },

  /**
   * Son mesaj / preview alanı
   */
  chatPreview: {
    marginTop: 6,
    fontSize: 14,
    color: "#4b5563",
  },
  chatPreviewTyping: {
    color: "#6b7280",
    fontStyle: "italic",
  },

  /**
   * Alt aksiyon alanı
   */
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  /**
   * Küçük butonlar
   */
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  openButton: {
    backgroundColor: "#e5e7eb",
  },
  openButtonText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#fee2e2",
  },
  deleteButtonText: {
    color: "#991b1b",
    fontSize: 13,
    fontWeight: "600",
  },

  /**
   * Okunmamış mesaj rozeti
   */
  unreadBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  /**
   * Boş durum kartı
   */
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#6b7280",
  },
  emptyActionButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  emptyActionButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },

  /**
   * Basma efekti
   */
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
