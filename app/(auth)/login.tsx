// app/(auth)/login.tsx

import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";
import { signInWithGoogle } from "../../lib/googleAuth";

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

export default function Login() {
  const { signIn } = useAuth();

  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Eksik bilgi", "Lütfen email ve şifre gir.");
      return;
    }

    setSubmitting(true);

    const { error } = await signIn(email, password);

    setSubmitting(false);

    if (error) {
      Alert.alert("Giriş başarısız", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert("Google giriş hatası", error?.message || "Hata oluştu");
    } finally {
      setGoogleLoading(false);
    }
  };

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
      {/* LOGO */}
      <View style={{ alignItems: "center", marginBottom: 36 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: COLORS.primary,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <Ionicons name="book-outline" size={36} color="#fff" />
        </View>

        <Text
          style={{ fontSize: 34, fontWeight: "900", color: COLORS.primary }}
        >
          ReadSphere
        </Text>

        <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.text }}>
          Giriş
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
        {/* EMAIL */}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#9a9389"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 18,
            padding: 14,
            backgroundColor: "#fff",
          }}
        />

        {/* PASSWORD */}
        <TextInput
          ref={passwordRef}
          placeholder="Şifre"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 18,
            padding: 14,
            backgroundColor: "#fff",
          }}
        />

        {/* NORMAL LOGIN */}
        <Pressable
          onPress={handleLogin}
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
            <Text style={{ color: "#fff", fontWeight: "900" }}>Giriş Yap</Text>
          )}
        </Pressable>

        {/* 🔥 GOOGLE LOGIN */}
        <Pressable
          onPress={handleGoogleLogin}
          disabled={googleLoading}
          style={{
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 16,
            borderRadius: 18,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {googleLoading ? (
            <ActivityIndicator />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color="#DB4437" />
              <Text style={{ fontWeight: "800" }}>Google ile giriş yap</Text>
            </>
          )}
        </Pressable>

        {/* REGISTER */}
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <Text style={{ color: COLORS.muted }}>Hesabın yok mu?</Text>

          <Link
            href="/(auth)/register"
            style={{
              marginTop: 6,
              color: COLORS.primary,
              fontWeight: "800",
            }}
          >
            Kayıt ol
          </Link>
        </View>
      </View>
    </View>
  );
}
