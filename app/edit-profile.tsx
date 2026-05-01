// app/edit-profile.tsx

import { Ionicons } from "@expo/vector-icons";
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
  "Düzenli okuma alışkanlığına sahibim",
  "Yavaş ve sindirerek okumayı tercih ederim",
  "Not alarak ve altını çizerek okurum",
  "Klasik ve nitelikli eserleri tercih ederim",
  "Güncel ve popüler kitapları takip ederim",
  "Kurgu dünyalarında derinleşmeyi severim",
  "Bilgi ve bakış açısı kazandıran kitapları önemserim",
  "Kısa sürede yoğun okuma yapabilirim",
  "Dönemsel olarak okuma alışkanlığım değişebilir",
  "Farklı türleri keşfetmeyi severim",
];
const READING_MOODS = [
  "Klasik eserler okumak istiyorum",
  "Düşündüren ve derinlikli metinler arıyorum",
  "Sürükleyici bir kurgu okumak istiyorum",
  "Gerilim ve gizem türlerine yöneliyorum",
  "Kişisel gelişim ve farkındalık odaklı okuyorum",
  "Tarih ve biyografi okumak istiyorum",
  "Daha hafif ve akıcı kitaplar tercih ediyorum",
  "Farklı türleri keşfetmek istiyorum",
];
const BOOK_VALUES = [
  "Güçlü karakter gelişimi",
  "Akıcı ve anlaşılır anlatım",
  "Derinlikli konu işlenişi",
  "Düşündürücü temalar",
  "Etkileyici atmosfer",
  "Gerçekçi olay örgüsü",
  "Duygusal bağ kurabilme",
  "Özgün bakış açısı",
  "Bilgi ve farkındalık kazandırması",
  "Kalıcı etki bırakması",
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
  const { user, setUser, refreshUser } = useUser();

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
      quality: 0.35,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];

    if (!asset?.base64) {
      Alert.alert("Hata", "Fotoğraf okunamadı.");
      return;
    }

    const mimeType = asset.mimeType || "image/jpeg";
    const base64Url = `data:${mimeType};base64,${asset.base64}`;

    setAvatarUri(base64Url);
  };

  const uploadAvatar = async () => {
    if (!avatarUri) return null;
    return avatarUri;
  };

  const onSave = async () => {
    console.log("SAVE BUTTON PRESSED");

    if (!authUser?.id) {
      Alert.alert("Hata", "Oturum açık değil.");
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      Alert.alert("Eksik bilgi", "Ad, soyad ve kullanıcı adı zorunlu.");
      return;
    }

    try {
      setSaving(true);

      let finalAvatarUrl = user.avatar ?? null;

      if (avatarUri && avatarUri !== user.avatar) {
        setUploadingAvatar(true);
        finalAvatarUrl = await uploadAvatar();
        setUploadingAvatar(false);
      }

      console.log("FINAL AVATAR URL:", finalAvatarUrl);

      const profilePayload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        username: username.trim().toLowerCase(),
        avatar_url: finalAvatarUrl,
        bio: bio.trim(),
        favorite_book: favoriteBook.trim(),
        reader_type: readerType,
        reading_mood: readingMood,
        book_value: bookValue,
        yearly_goal: yearlyGoal ? Number(yearlyGoal) : null,
        favorite_genres: favoriteGenres,
        favorite_authors: favoriteAuthors,
        updated_at: new Date().toISOString(),
      };

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update(profilePayload)
        .eq("id", authUser.id);

      if (profileUpdateError) {
        console.log("PROFILE DIRECT UPDATE ERROR:", profileUpdateError);
        throw new Error(profileUpdateError.message);
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

      if (result?.error) {
        console.log("PROFILE SAVE RESULT ERROR:", result.error);
        throw new Error(result.error);
      }

      await refreshUser();

      router.replace("/profile");
    } catch (err: any) {
      console.log("PROFILE SAVE ERROR:", err);
      Alert.alert("Hata", err?.message ?? "Profil güncellenemedi.");
    } finally {
      setSaving(false);
      setUploadingAvatar(false);
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
            Profil bilgilerini güncelleyerek önerileri
            kişiselleştirebilirsin{" "}
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
          {avatarUri?.trim() ? (
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
            Fotoğraf hazırlanıyor...
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
          placeholder="Kendini kısaca tanıtabilir veya okuma ilgi alanlarını yazabilirsin"
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
          Tercih Ettiğin Türler{" "}
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
          Okuma Tercihlerin{" "}
        </Text>

        <TextInput
          ref={favoriteAuthorsRef}
          value={favoriteAuthorsInput}
          onChangeText={setFavoriteAuthorsInput}
          placeholder="Sevdiğin yazarları virgülle ayırarak yazabilirsin"
          placeholderTextColor="#9a9389"
          returnKeyType="next"
          onSubmitEditing={() => favoriteBookRef.current?.focus()}
          style={inputStyle}
        />

        <TextInput
          ref={favoriteBookRef}
          value={favoriteBook}
          onChangeText={setFavoriteBook}
          placeholder="Seni en çok etkileyen kitap"
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
          Okuma Alışkanlığın{" "}
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
          Okuma Tercihi{" "}
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
          Bir kitapta senin için en önemli özellikler nelerdir?{" "}
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
          Okuma Hedefi
        </Text>

        <TextInput
          value={yearlyGoal}
          onChangeText={setYearlyGoal}
          placeholder="Bu yıl için okuma hedefin (örn: 24)"
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
