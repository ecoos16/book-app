// app/(tabs)/chat/index.tsx

import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { useAuth } from "../../../context/AuthContext";
import { useChat } from "../../../context/ChatContext";
import type { ChatParticipant, Conversation } from "../../../types/chat";

const COLORS = {
  bg: "#fbf9f5",
  card: "#fffdf9",
  border: "#ece7df",
  text: "#2f2a24",
  muted: "#7a7268",
  primary: "#7d5739",
  primarySoft: "#f3e2d2",
  danger: "#b64646",
  dangerSoft: "#f8e1e1",
  graySoft: "#f3efe8",
  whiteSoft: "#fff7f4",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatConversationTime(timestamp?: number) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();

  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function ChatListScreen() {
  const { user: authUser } = useAuth();
  const {
    conversations,
    loading,
    deleteConversation,
    leaveGroupConversation,
    refreshConversations,
    fetchConversationById,
  } = useChat();

  const [processingId, setProcessingId] = useState<string | null>(null);

  const currentUserId = authUser?.id ?? "";

  useFocusEffect(
    useCallback(() => {
      refreshConversations().catch((error) => {
        console.log("REFRESH CONVERSATIONS ERROR:", error);
      });
    }, [refreshConversations]),
  );

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aTime = a.lastMessageAt ?? a.updatedAt ?? a.createdAt;
      const bTime = b.lastMessageAt ?? b.updatedAt ?? b.createdAt;
      return bTime - aTime;
    });
  }, [conversations]);

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.title?.trim() || "Grup Sohbeti";
    }

    const otherUser = conversation.participants.find(
      (participant: ChatParticipant) => participant.id !== currentUserId,
    );

    return otherUser?.name || "Sohbet";
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return null;
    }

    const otherUser = conversation.participants.find(
      (participant: ChatParticipant) => participant.id !== currentUserId,
    );

    return otherUser?.avatar;
  };

  const getConversationFallback = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return "GR";
    }

    const otherUser = conversation.participants.find(
      (participant: ChatParticipant) => participant.id !== currentUserId,
    );

    return getInitials(otherUser?.name || "S");
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    if (conversation.lastMessageText?.trim()) {
      return conversation.lastMessageText;
    }

    return conversation.isGroup
      ? "Bu grupta henüz mesaj yok."
      : "Henüz mesaj yok.";
  };

  const handleOpenConversation = async (conversationId: string) => {
    try {
      await fetchConversationById(conversationId);

      router.push({
        pathname: "/chat/[id]",
        params: { id: conversationId },
      });
    } catch (error) {
      console.log("OPEN CONVERSATION ERROR:", error);
      Alert.alert("Hata", "Sohbet açılırken bir sorun oluştu.");
    }
  };

  const handleDeleteOrLeave = async (conversation: Conversation) => {
    try {
      setProcessingId(conversation.id);

      console.log(
        conversation.isGroup ? "LEAVE GROUP PRESSED:" : "DELETE CHAT PRESSED:",
        conversation.id,
      );

      if (conversation.isGroup) {
        await leaveGroupConversation(conversation.id);
      } else {
        await deleteConversation(conversation.id);
      }

      await refreshConversations();
    } catch (error) {
      console.log("DELETE OR LEAVE CONVERSATION ERROR:", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextArea}>
          <Text style={styles.title}>Sohbetler</Text>
          <Text style={styles.subtitle}>
            Mesajların ve grup konuşmaların burada görünür.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/chat/new")}
          style={({ pressed }) => [
            styles.newButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons name="add" size={18} color={COLORS.whiteSoft} />
          <Text style={styles.newButtonText}>Yeni</Text>
        </Pressable>
      </View>

      <FlatList<Conversation>
        data={sortedConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="chatbox-ellipses-outline"
                size={28}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              {loading ? "Sohbetler yükleniyor" : "Henüz sohbet yok"}
            </Text>

            <Text style={styles.emptyText}>
              {loading
                ? "Lütfen kısa bir süre bekle."
                : "Yeni bir sohbet başlatmak için sağ üstteki butonu kullanabilirsin."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const avatar = getConversationAvatar(item);
          const title = getConversationTitle(item);
          const subtitle = getConversationSubtitle(item);
          const time = formatConversationTime(
            item.lastMessageAt ?? item.updatedAt ?? item.createdAt,
          );
          const isProcessing = processingId === item.id;

          return (
            <Pressable
              onPress={() => handleOpenConversation(item.id)}
              style={({ pressed }) => [
                styles.chatCard,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.chatMain}>
                {item.isGroup ? (
                  <View style={styles.groupAvatar}>
                    <Ionicons
                      name="people-outline"
                      size={22}
                      color={COLORS.primary}
                    />
                  </View>
                ) : avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {getConversationFallback(item)}
                    </Text>
                  </View>
                )}

                <View style={styles.chatInfo}>
                  <View style={styles.topRow}>
                    <Text numberOfLines={1} style={styles.chatTitle}>
                      {title}
                    </Text>
                    <Text style={styles.chatTime}>{time}</Text>
                  </View>

                  <Text numberOfLines={2} style={styles.chatSubtitle}>
                    {subtitle}
                  </Text>

                  {item.isGroup ? (
                    <Text style={styles.groupBadge}>Grup sohbeti</Text>
                  ) : null}
                </View>
              </View>

              <Pressable
                onPress={(event) => {
                  event.stopPropagation?.();

                  Alert.alert(
                    item.isGroup ? "Gruptan ayrıl" : "Sohbeti sil",
                    item.isGroup
                      ? "Bu grup sohbetinden ayrılmak istediğine emin misin?"
                      : "Bu sohbeti silmek istediğine emin misin?",
                    [
                      {
                        text: "Vazgeç",
                        style: "cancel",
                      },
                      {
                        text: "Eminim",
                        style: item.isGroup ? "default" : "destructive",
                        onPress: () => handleDeleteOrLeave(item),
                      },
                    ],
                  );
                }}
                style={({ pressed }) => [
                  styles.actionButton,
                  item.isGroup ? styles.leaveButton : styles.deleteButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    item.isGroup
                      ? styles.leaveButtonText
                      : styles.deleteButtonText,
                  ]}
                >
                  {item.isGroup ? "Ayrıl" : "Sil"}
                </Text>
              </Pressable>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTextArea: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  newButtonText: {
    color: COLORS.whiteSoft,
    fontSize: 13,
    fontWeight: "900",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  chatCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 14,
    gap: 12,
    shadowColor: "#2f2a24",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  chatMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chatInfo: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  chatTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  chatSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 19,
  },
  groupBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primarySoft,
    color: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "900",
  },
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
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.primary,
  },
  groupAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  deleteButton: {
    backgroundColor: COLORS.dangerSoft,
  },
  leaveButton: {
    backgroundColor: COLORS.graySoft,
  },
  deleteButtonText: {
    color: COLORS.danger,
  },
  leaveButtonText: {
    color: COLORS.text,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "900",
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  emptyCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
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
    fontSize: 19,
    fontWeight: "900",
    color: COLORS.text,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
