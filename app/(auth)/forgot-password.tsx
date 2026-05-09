import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";

import { supabase } from "../../lib/supabase";

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

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleResetPassword = async () => {
    const safeEmail = email.trim();

    if (!safeEmail) {
      Alert.alert("Eksik bilgi", "Lütfen e-posta adresini gir.");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.auth.resetPasswordForEmail(safeEmail, {
        redirectTo: "http://localhost:8081/reset-password",
      });

      if (error) {
        Alert.alert("Hata", error.message);
        return;
      }

      Alert.alert(
        "Mail gönderildi",
        "Şifre yenileme bağlantısı e-posta adresine gönderildi.",
      );
    } catch {
      Alert.alert("Hata", "Şifre yenileme maili gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
    >
      <View style={{ alignItems: "center", marginBottom: 32 }}>
        {" "}
        <View
          style={{
            width: 82,
            height: 82,
            borderRadius: 41,
            backgroundColor: COLORS.primarySoft,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Ionicons name="key-outline" size={34} color={COLORS.primary} />
        </View>
        <Text style={{ fontSize: 30, fontWeight: "900", color: COLORS.text }}>
          Hesabını Bul
        </Text>
        <Text
          style={{
            marginTop: 10,
            color: COLORS.muted,
            textAlign: "center",
            lineHeight: 22,
            fontSize: 15,
            maxWidth: 320,
          }}
        >
          E-posta adresini gir. Sana şifre yenileme bağlantısı gönderelim.
        </Text>
      </View>

      <View
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 28,
          padding: 22,
          gap: 16,
        }}
      >
        <TextInput
          placeholder="E-posta adresi"
          placeholderTextColor="#9a9389"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          returnKeyType="send"
          onSubmitEditing={handleResetPassword}
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 18,
            padding: 14,
            backgroundColor: "#fff",
          }}
        />

        <Pressable
          onPress={handleResetPassword}
          disabled={submitting}
          style={{
            backgroundColor: COLORS.primary,
            padding: 16,
            borderRadius: 18,
            alignItems: "center",
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "900" }}>İleri</Text>
          )}
        </Pressable>

        <View style={{ alignItems: "center" }}>
          <Link
            href="/(auth)/login"
            style={{ color: COLORS.primary, fontWeight: "800" }}
          >
            Geri Dön
          </Link>
        </View>
      </View>
    </View>
  );
}
