import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";

import { supabase } from "../lib/supabase";

const COLORS = {
  bg: "#fbf9f5",
  card: "#fffdf9",
  border: "#ece7df",
  text: "#2f2a24",
  muted: "#7a7268",
  primary: "#7d5739",
  primaryDark: "#6b4a2f",
  primarySoft: "#f3e2d2",
};

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      Alert.alert("Zayıf şifre", "Şifre en az 6 karakter olmalı.");
      return;
    }

    if (password !== passwordAgain) {
      Alert.alert("Şifreler eşleşmiyor", "Lütfen aynı şifreyi tekrar gir.");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        Alert.alert("Hata", error.message);
        return;
      }

      Alert.alert("Başarılı", "Şifren güncellendi.");
      router.replace("/(auth)/login");
    } catch {
      Alert.alert("Hata", "Şifre güncellenirken bir sorun oluştu.");
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
      <View style={{ alignItems: "center", marginBottom: 28 }}>
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
          <Ionicons
            name="lock-closed-outline"
            size={34}
            color={COLORS.primary}
          />
        </View>

        <Text style={{ fontSize: 28, fontWeight: "900", color: COLORS.text }}>
          Yeni Şifre Belirle
        </Text>

        <Text
          style={{ marginTop: 8, color: COLORS.muted, textAlign: "center" }}
        >
          Hesabın için yeni şifreni oluştur.
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
          placeholder="Yeni şifre"
          placeholderTextColor="#9a9389"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 18,
            padding: 14,
            backgroundColor: "#fff",
          }}
        />

        <TextInput
          placeholder="Yeni şifre tekrar"
          placeholderTextColor="#9a9389"
          secureTextEntry
          value={passwordAgain}
          onChangeText={setPasswordAgain}
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 18,
            padding: 14,
            backgroundColor: "#fff",
          }}
        />

        <Pressable
          onPress={handleUpdatePassword}
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
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              Şifreyi Güncelle
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
