import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useChat } from "../../../context/ChatContext";
import { CURRENT_USER, MOCK_USERS } from "../../../data/mockUsers";
import type { ChatParticipant } from "../../../types/chat";

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

export default function NewChatScreen() {
  /**
   * Chat context
   */
  const { getOrCreateConversationByParticipant } = useChat();

  /**
   * Aktif kullanıcı dışındaki kullanıcıları listele
   */
  const availableUsers = MOCK_USERS.filter(
    (user: ChatParticipant) => user.id !== CURRENT_USER.id,
  );

  /**
   * Kullanıcı seçilince konuşma aç
   */
  const handleStartChat = (participant: ChatParticipant) => {
    const conversationId = getOrCreateConversationByParticipant(participant);

    router.replace({
      pathname: "/chat/[id]",
      params: { id: conversationId },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
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

        <View style={styles.headerTextArea}>
          <Text style={styles.title}>Yeni Sohbet</Text>
          <Text style={styles.subtitle}>
            Mesajlaşmak istediğin kullanıcıyı seç.
          </Text>
        </View>
      </View>

      {/* ================= KULLANICI LİSTESİ ================= */}
      <FlatList<ChatParticipant>
        data={availableUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Kullanıcı bulunamadı</Text>
            <Text style={styles.emptyText}>
              Şu anda sohbet başlatabileceğin başka kullanıcı görünmüyor.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.leftSide}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {getInitials(item.name)}
                  </Text>
                </View>
              )}

              <View style={styles.userInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>ReadSphere kullanıcısı</Text>
              </View>
            </View>

            <Pressable
              onPress={() => handleStartChat(item)}
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.startButtonText}>Başlat</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  headerTextArea: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  userCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  leftSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  userInfo: {
    flex: 1,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f3f4f6",
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },
  startButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
    lineHeight: 21,
    color: "#6b7280",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
