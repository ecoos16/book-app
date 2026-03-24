// app/(tabs)/chat/new.tsx

import { Ionicons } from "@expo/vector-icons";
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
   * Aktif kullanıcı dışındaki kullanıcılar
   */
  const availableUsers = MOCK_USERS.filter(
    (user: ChatParticipant) => user.id !== CURRENT_USER.id,
  );

  /**
   * Kullanıcı seçince sohbet aç
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
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
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
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="people-outline"
                size={28}
                color={COLORS.primary}
              />
            </View>
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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

  /**
   * Liste içeriği
   */
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },

  /**
   * Kullanıcı kartı
   */
  userCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    shadowColor: "#2f2a24",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
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

  /**
   * Avatar
   */
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.graySoft,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.primary,
  },

  /**
   * Metin alanı
   */
  name: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,
  },

  /**
   * Başlat butonu
   */
  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  startButtonText: {
    color: COLORS.whiteSoft,
    fontSize: 13,
    fontWeight: "900",
  },

  /**
   * Boş durum
   */
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

  /**
   * Basma efekti
   */
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
