// app/(auth)/register.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

/**
 * ReadSphere ortak renk paleti
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
  whiteSoft: "#fff7f4",
};

/**
 * Register ekranı
 *
 * Şu an backend / gerçek kayıt formu olmadığı için
 * bu ekran bir geçiş / placeholder ekranı gibi davranıyor.
 * Ama artık görsel olarak uygulamanın tasarım diliyle uyumlu.
 */
export default function Register() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 32,
      }}
    >
      {/* Üst logo alanı */}
      <View
        style={{
          alignItems: "center",
          marginBottom: 34,
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: COLORS.primarySoft,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <Ionicons
            name="person-add-outline"
            size={34}
            color={COLORS.primary}
          />
        </View>

        <Text
          style={{
            fontSize: 32,
            fontWeight: "900",
            color: COLORS.primary,
            marginBottom: 8,
          }}
        >
          ReadSphere
        </Text>

        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: COLORS.text,
            marginBottom: 8,
          }}
        >
          Kayıt
        </Text>

        <Text
          style={{
            color: COLORS.muted,
            textAlign: "center",
            lineHeight: 22,
            fontSize: 15,
            maxWidth: 300,
          }}
        >
          Yakında tam kayıt akışı burada olacak. Şimdilik giriş ekranına geri
          dönebilirsin.
        </Text>
      </View>

      {/* Orta bilgi kartı */}
      <View
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 28,
          padding: 22,
          gap: 16,
          shadowColor: "#2f2a24",
          shadowOpacity: 0.06,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 2,
        }}
      >
        <View
          style={{
            backgroundColor: COLORS.primarySoft,
            borderRadius: 18,
            padding: 14,
            gap: 6,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: COLORS.text,
            }}
          >
            Yakında aktif olacak
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              lineHeight: 20,
              fontSize: 14,
            }}
          >
            Gerçek kullanıcı kayıt sistemi eklendiğinde bu ekranı form yapısına
            dönüştürebilirsin.
          </Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed, hovered }) => ({
            backgroundColor: pressed
              ? COLORS.primaryDark
              : hovered
                ? "#8b6240"
                : COLORS.primary,
            paddingVertical: 16,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          })}
        >
          <Ionicons
            name="arrow-back-outline"
            size={18}
            color={COLORS.whiteSoft}
          />
          <Text
            style={{
              color: COLORS.whiteSoft,
              textAlign: "center",
              fontWeight: "900",
              fontSize: 15,
            }}
          >
            Geri Dön
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
