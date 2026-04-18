//app/edit-profile.tsx
import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../context/UserContext";
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
  whiteSoft: "#fff7f4",
  successSoft: "#eef6ee",
  peachSoft: "#fff1e6",
  lavenderSoft: "#f5eefc",
  blueSoft: "#edf4ff",
};

const GENRES = [
  "Roman",
  "Fantastik",
  "Bilim Kurgu",
  "Polisiye",
  "Klasik",
  "Tarih",
  "Psikoloji",
  "Kişisel Gelişim",
  "Felsefe",
  "Biyografi",
  "Romantik",
  "Gerilim",
  "Manga",
  "Distopya",
];

const READER_VIBES = [
  "Gece okuru 🌙",
  "Altını çize çize okurum ✍️",
  "Klasikçiyim 📚",
  "Fantastik dünyalara kaçarım 🪄",
  "Polisiye severim 🔍",
  "Duygusal yıkım seviyorum 💔",
  "Bir günde bitiririm ⚡",
  "Yavaş ama derin okurum ☕",
  "Popüler olanı merak ederim 🔥",
  "Yarım bırakırım ama severim 😅",
];

const READING_MOODS = [
  "Klasik modundayım",
  "Romantik şeyler sarıyor",
  "Gerilim istiyorum",
  "Bilim kurguya sardım",
  "Kişisel gelişim okuyorum",
  "Karışık gidiyorum",
  "Ne bulursam okuyorum",
];

const BOOK_VALUES = [
  "Güçlü karakterler",
  "Akıcı dil",
  "Duygusal yoğunluk",
  "Plot twist",
  "Karanlık atmosfer",
  "Felsefi derinlik",
  "Romantizm",
  "Gerçek hayata yakınlık",
];

function ChipSelect({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? COLORS.primary : COLORS.border,
        backgroundColor: selected ? COLORS.primarySoft : "#fff",
      }}
    >
      <Text
        style={{
          color: selected ? COLORS.primaryDark : COLORS.text,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getInitials(name?: string) {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function EditProfileScreen() {
  const { user: authUser } = useAuth();
  const { user, setUser } = useUser();

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [favoriteBook, setFavoriteBook] = useState(user.favoriteBook ?? "");
  const [readerType, setReaderType] = useState(user.readerType ?? "");
  const [readingMood, setReadingMood] = useState(user.readingMood ?? "");
  const [bookValue, setBookValue] = useState(user.bookValue ?? "");
  const [yearlyGoal, setYearlyGoal] = useState(
    user.yearlyGoal ? String(user.yearlyGoal) : "",
  );
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(
    user.favoriteGenres ?? [],
  );
  const [favoriteAuthorsInput, setFavoriteAuthorsInput] = useState(
    (user.favoriteAuthors ?? []).join(", "),
  );

  const [avatarUri, setAvatarUri] = useState<string | null>(
    user.avatar ?? null,
  );
  const lastNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const bioRef = useRef<TextInput>(null);
  const favoriteAuthorsRef = useRef<TextInput>(null);
  const favoriteBookRef = useRef<TextInput>(null);
  const yearlyGoalRef = useRef<TextInput>(null);

  const favoriteAuthors = useMemo(
    () =>
      favoriteAuthorsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [favoriteAuthorsInput],
  );

  const inputStyle = {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    color: COLORS.text,
    fontSize: 15 as const,
  };

  const toggleGenre = (genre: string) => {
    setFavoriteGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((item) => item !== genre)
        : [...prev, genre],
    );
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "İzin gerekli",
        "Profil fotoğrafı seçmek için galeri izni vermelisin.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarUri) return null;

    if (avatarUri.startsWith("http://") || avatarUri.startsWith("https://")) {
      return avatarUri;
    }

    const fileExt = avatarUri.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${userId}/avatar.${fileExt}`;

    const base64 = await FileSystem.readAsStringAsync(avatarUri, {
      encoding: "base64",
    });

    const arrayBuffer = decode(base64);

    const contentType =
      fileExt === "png"
        ? "image/png"
        : fileExt === "webp"
          ? "image/webp"
          : "image/jpeg";

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const onSave = async () => {
    if (!authUser?.id) {
      Alert.alert("Hata", "Oturum açık değil.");
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      Alert.alert("Eksik bilgi", "Ad, soyad ve kullanıcı adı zorunlu.");
      return;
    }

    setSaving(true);

    try {
      let finalAvatarUrl = user.avatar ?? null;

      if (avatarUri !== user.avatar) {
        setUploadingAvatar(true);
        finalAvatarUrl = await uploadAvatar(authUser.id);
        setUploadingAvatar(false);
      }

      const result = await setUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        username: username.trim().toLowerCase(),
        avatar: finalAvatarUrl ?? undefined,
        bio: bio.trim(),
        favoriteBook: favoriteBook.trim(),
        readerType,
        readingMood,
        bookValue,
        yearlyGoal: yearlyGoal ? Number(yearlyGoal) : null,
        favoriteGenres,
        favoriteAuthors,
      });

      setSaving(false);

      if (result.error) {
        Alert.alert("Kaydedilemedi", result.error);
        return;
      }

      Alert.alert("Kaydedildi", "Profilin güncellendi.");
      router.back();
    } catch (err: any) {
      setSaving(false);
      setUploadingAvatar(false);
      Alert.alert("Hata", err?.message ?? "Profil güncellenemedi.");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{
        padding: 18,
        gap: 16,
        paddingBottom: 120,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "900",
              color: COLORS.text,
            }}
          >
            Profili Düzenle
          </Text>
          <Text style={{ color: COLORS.muted }}>
            Profilini daha çok sana benzet
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 24,
          padding: 16,
          gap: 14,
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={pickAvatar}
          style={({ pressed }) => ({
            width: 104,
            height: 104,
            borderRadius: 52,
            backgroundColor: COLORS.primarySoft,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            opacity: pressed ? 0.92 : 1,
          })}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 104, height: 104 }}
            />
          ) : (
            <Text
              style={{
                color: COLORS.primary,
                fontWeight: "900",
                fontSize: 26,
              }}
            >
              {getInitials(`${firstName} ${lastName}`.trim() || user.name)}
            </Text>
          )}
        </Pressable>

        <Text style={{ color: COLORS.muted, fontSize: 14 }}>
          Profil fotoğrafını değiştir
        </Text>

        {uploadingAvatar && (
          <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
            Fotoğraf yükleniyor...
          </Text>
        )}
      </View>

      <View
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 24,
          padding: 16,
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.text }}>
          Temel Bilgiler
        </Text>

        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Ad"
          placeholderTextColor="#9a9389"
          returnKeyType="next"
          onSubmitEditing={() => lastNameRef.current?.focus()}
          style={inputStyle}
        />

        <TextInput
          ref={lastNameRef}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Soyad"
          placeholderTextColor="#9a9389"
          returnKeyType="next"
          onSubmitEditing={() => usernameRef.current?.focus()}
          style={inputStyle}
        />

        <TextInput
          ref={usernameRef}
          value={username}
          onChangeText={setUsername}
          placeholder="Kullanıcı adı"
          placeholderTextColor="#9a9389"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => bioRef.current?.focus()}
          style={inputStyle}
        />

        <TextInput
          ref={bioRef}
          value={bio}
          onChangeText={setBio}
          placeholder="Kendinden kısaca bahset"
          placeholderTextColor="#9a9389"
          multiline
          style={[
            inputStyle,
            {
              minHeight: 110,
              textAlignVertical: "top",
            },
          ]}
        />

        <TextInput
          ref={yearlyGoalRef}
          value={yearlyGoal}
          onChangeText={setYearlyGoal}
          placeholder="Yıllık kitap hedefin"
          placeholderTextColor="#9a9389"
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={onSave}
          style={inputStyle}
        />
      </View>

      <View
        style={{
          backgroundColor: COLORS.successSoft,
          borderRadius: 24,
          padding: 16,
          gap: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.text }}>
          Sevdiğin Türler
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {GENRES.map((genre) => (
            <ChipSelect
              key={genre}
              label={genre}
              selected={favoriteGenres.includes(genre)}
              onPress={() => toggleGenre(genre)}
            />
          ))}
        </View>
      </View>

      <View
        style={{
          backgroundColor: COLORS.peachSoft,
          borderRadius: 24,
          padding: 16,
          gap: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.text }}>
          Kitap Zevkin
        </Text>

        <TextInput
          ref={favoriteAuthorsRef}
          value={favoriteAuthorsInput}
          onChangeText={setFavoriteAuthorsInput}
          placeholder="Favori yazarlar (virgülle ayır)"
          placeholderTextColor="#9a9389"
          returnKeyType="next"
          onSubmitEditing={() => favoriteBookRef.current?.focus()}
          style={inputStyle}
        />

        <TextInput
          ref={favoriteBookRef}
          value={favoriteBook}
          onChangeText={setFavoriteBook}
          placeholder="En sevdiğin kitap"
          placeholderTextColor="#9a9389"
          returnKeyType="next"
          onSubmitEditing={() => yearlyGoalRef.current?.focus()}
          style={inputStyle}
        />
      </View>

      <View
        style={{
          backgroundColor: COLORS.lavenderSoft,
          borderRadius: 24,
          padding: 16,
          gap: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.text }}>
          Okur Vibe’ın
        </Text>

        {READER_VIBES.map((item) => (
          <ChipSelect
            key={item}
            label={item}
            selected={readerType === item}
            onPress={() => setReaderType(item)}
          />
        ))}
      </View>

      <View
        style={{
          backgroundColor: COLORS.blueSoft,
          borderRadius: 24,
          padding: 16,
          gap: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.text }}>
          Okuma Modun
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {READING_MOODS.map((item) => (
            <ChipSelect
              key={item}
              label={item}
              selected={readingMood === item}
              onPress={() => setReadingMood(item)}
            />
          ))}
        </View>

        <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text }}>
          Bir kitapta seni en çok ne çeker?
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {BOOK_VALUES.map((item) => (
            <ChipSelect
              key={item}
              label={item}
              selected={bookValue === item}
              onPress={() => setBookValue(item)}
            />
          ))}
        </View>
      </View>

      <View
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 24,
          padding: 16,
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.text }}>
          Hedef
        </Text>

        <TextInput
          value={yearlyGoal}
          onChangeText={setYearlyGoal}
          placeholder="Yıllık kitap hedefin"
          placeholderTextColor="#9a9389"
          keyboardType="numeric"
          style={inputStyle}
        />
      </View>

      <Pressable
        onPress={onSave}
        disabled={saving}
        style={({ pressed }) => ({
          backgroundColor: pressed ? COLORS.primaryDark : COLORS.primary,
          paddingVertical: 16,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: saving ? 0.7 : 1,
        })}
      >
        {saving ? (
          <ActivityIndicator color={COLORS.whiteSoft} />
        ) : (
          <>
            <Ionicons name="save-outline" size={18} color={COLORS.whiteSoft} />
            <Text
              style={{
                color: COLORS.whiteSoft,
                fontWeight: "900",
                fontSize: 15,
              }}
            >
              Kaydet
            </Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}
