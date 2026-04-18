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
      return;
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
      <View
        style={{
          alignItems: "center",
          marginBottom: 36,
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: COLORS.primary,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
            shadowColor: COLORS.primary,
            shadowOpacity: 0.18,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 4,
          }}
        >
          <Ionicons name="book-outline" size={36} color={COLORS.whiteSoft} />
        </View>

        <Text
          style={{
            fontSize: 34,
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
          Giriş
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
          Kütüphanene geri dön, okuma ilerlemeni takip et ve toplulukla yeniden
          buluş.
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
            Hoş geldin
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              lineHeight: 20,
              fontSize: 14,
            }}
          >
            ReadSphere’da kitaplarını takip edebilir, paylaşımlar yapabilir ve
            diğer okurlarla etkileşime geçebilirsin.
          </Text>
        </View>

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
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: "#fff",
            color: COLORS.text,
            fontSize: 15,
          }}
        />

        <TextInput
          ref={passwordRef}
          placeholder="Şifre"
          placeholderTextColor="#9a9389"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: "#fff",
            color: COLORS.text,
            fontSize: 15,
          }}
        />

        <Pressable
          onPress={handleLogin}
          disabled={submitting}
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
            opacity: submitting ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          })}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.whiteSoft} />
          ) : (
            <>
              <Ionicons
                name="log-in-outline"
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
                Giriş Yap
              </Text>
            </>
          )}
        </Pressable>

        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 4,
          }}
        >
          <Text
            style={{
              color: COLORS.muted,
              fontSize: 14,
            }}
          >
            Henüz hesabın yok mu?
          </Text>

          <Link
            href="/(auth)/register"
            style={{
              marginTop: 8,
              color: COLORS.primary,
              fontWeight: "800",
              fontSize: 15,
              textAlign: "center",
            }}
          >
            Kayıt ol
          </Link>
        </View>
      </View>

      <View
        style={{
          marginTop: 28,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#9a9389",
            fontSize: 13,
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          “Okumak, başka bir zihni ziyaret etmektir.”
        </Text>
      </View>
    </View>
  );
}
