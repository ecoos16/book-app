import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Link, router } from "expo-router";
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
import { useAuth } from "../../context/AuthContext";
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

const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const MONTHS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 90 }, (_, i) => String(CURRENT_YEAR - i));

function SimpleSelect({
  value,
  placeholder,
  options,
  onSelect,
}: {
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        style={({ pressed }) => ({
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 14,
          backgroundColor: "#fff",
          opacity: pressed ? 0.95 : 1,
        })}
      >
        <Text
          style={{
            color: value ? COLORS.text : "#9a9389",
            fontSize: 15,
            fontWeight: "600",
          }}
        >
          {value || placeholder}
        </Text>
      </Pressable>

      {open && (
        <View
          style={{
            position: "absolute",
            top: 56,
            left: 0,
            right: 0,
            maxHeight: 180,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 14,
            zIndex: 999,
            elevation: 10,
            overflow: "hidden",
          }}
        >
          <ScrollView nestedScrollEnabled>
            {options.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: pressed ? COLORS.primarySoft : "#fff",
                  borderBottomWidth: 1,
                  borderBottomColor: "#f3eee8",
                })}
              >
                <Text style={{ color: COLORS.text }}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function Register() {
  const { signUp } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [favoriteAuthorsInput, setFavoriteAuthorsInput] = useState("");
  const [favoriteBook, setFavoriteBook] = useState("");
  const [readerVibe, setReaderVibe] = useState("");
  const [readingMood, setReadingMood] = useState("");
  const [bookValue, setBookValue] = useState("");
  const [yearlyGoal, setYearlyGoal] = useState("");
  const [bio, setBio] = useState("");

  const lastNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const favoriteAuthorsRef = useRef<TextInput>(null);
  const favoriteBookRef = useRef<TextInput>(null);
  const yearlyGoalRef = useRef<TextInput>(null);
  const bioRef = useRef<TextInput>(null);

  const favoriteAuthors = useMemo(
    () =>
      favoriteAuthorsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [favoriteAuthorsInput],
  );

  const birthDateString = useMemo(() => {
    if (!birthYear || !birthMonth || !birthDay) return "";
    return `${birthYear}-${birthMonth}-${birthDay}`;
  }, [birthYear, birthMonth, birthDay]);

  const calculatedAge = useMemo(() => {
    if (!birthDateString) return null;

    const date = new Date(`${birthDateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      age--;
    }

    return age;
  }, [birthDateString]);

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

  const sectionTitleStyle = {
    fontSize: 16,
    fontWeight: "800" as const,
    color: COLORS.text,
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

  const checkUsernameAvailability = async () => {
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
      return { available: false, message: "Kullanıcı adı zorunlu." };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", trimmedUsername)
      .limit(1);

    if (error) {
      return {
        available: false,
        message: "Kullanıcı adı kontrol edilirken hata oluştu.",
      };
    }

    if (data && data.length > 0) {
      return {
        available: false,
        message: "Bu kullanıcı adı zaten kullanılıyor.",
      };
    }

    return { available: true, message: "" };
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarUri) return null;

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

  const validateStepOne = () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !username.trim() ||
      !birthDateString ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert("Eksik bilgi", "Devam etmek için tüm alanları doldur.");
      return false;
    }

    if (!calculatedAge || calculatedAge < 13) {
      Alert.alert(
        "Yaş uygun değil",
        "Şu an için 13 yaş ve üzeri kullanıcılar kayıt olabilir.",
      );
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Şifre kısa", "Şifre en az 6 karakter olmalı.");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Şifreler uyuşmuyor", "Şifreleri aynı girdiğine emin ol.");
      return false;
    }

    return true;
  };

  const goNext = async () => {
    if (!validateStepOne()) return;

    const usernameCheck = await checkUsernameAvailability();

    if (!usernameCheck.available) {
      Alert.alert("Kullanıcı adı uygun değil", usernameCheck.message);
      return;
    }

    setStep(2);
  };

  const handleRegister = async () => {
    if (!readerVibe) {
      Alert.alert("Eksik bilgi", "Kendine en yakın okur vibe’ını seç.");
      return;
    }

    setSubmitting(true);

    try {
      const { error, userId } = await signUp({
        email,
        password,
        firstName,
        lastName,
      });

      if (error || !userId) {
        setSubmitting(false);
        Alert.alert("Kayıt başarısız", error ?? "Kullanıcı oluşturulamadı.");
        return;
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      let avatarUrl: string | null = null;

      if (avatarUri) {
        try {
          avatarUrl = await uploadAvatar(userId);
        } catch (avatarError: any) {
          console.log("AVATAR UPLOAD ERROR:", avatarError);
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName,
          username: username.trim().toLowerCase(),
          birth_date: birthDateString || null,
          avatar_url: avatarUrl,
          favorite_genres: favoriteGenres,
          favorite_authors: favoriteAuthors,
          favorite_book: favoriteBook.trim() || null,
          reader_type: readerVibe,
          reading_mood: readingMood || null,
          book_value: bookValue || null,
          yearly_goal: yearlyGoal ? Number(yearlyGoal) : null,
          bio: bio.trim(),
          onboarding_completed: true,
        })
        .eq("id", userId);

      setSubmitting(false);

      if (profileError) {
        Alert.alert("Profil kaydedilemedi", profileError.message);
        return;
      }

      Alert.alert("Hazırsın ✨", "Hesabın oluşturuldu.");
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert("Hata", err?.message ?? "Beklenmeyen bir hata oluştu.");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingVertical: 32,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: "center", marginBottom: 24 }}>
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
            name={step === 1 ? "person-add-outline" : "sparkles-outline"}
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
          {step === 1 ? "Hesabını oluştur" : "Profilini kişiselleştir"}
        </Text>

        <Text
          style={{
            color: COLORS.muted,
            textAlign: "center",
            lineHeight: 22,
            fontSize: 15,
            maxWidth: 330,
          }}
        >
          {step === 1
            ? "Önce temel bilgileri tamamlayalım."
            : "Biraz seni tanıyalım, profilin daha çok seni yansıtsın ✨"}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
          marginBottom: 20,
          alignSelf: "center",
        }}
      >
        <View
          style={{
            width: 34,
            height: 8,
            borderRadius: 999,
            backgroundColor: step === 1 ? COLORS.primary : "#d7c8b8",
          }}
        />
        <View
          style={{
            width: 34,
            height: 8,
            borderRadius: 999,
            backgroundColor: step === 2 ? COLORS.primary : "#d7c8b8",
          }}
        />
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
        {step === 1 ? (
          <>
            <View style={{ alignItems: "center", gap: 10 }}>
              <Pressable
                onPress={pickAvatar}
                style={({ pressed }) => ({
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: COLORS.primarySoft,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={{ width: 96, height: 96 }}
                  />
                ) : (
                  <Ionicons
                    name="camera-outline"
                    size={30}
                    color={COLORS.primary}
                  />
                )}
              </Pressable>

              <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                Profil fotoğrafı ekle
              </Text>
            </View>

            <TextInput
              placeholder="Ad"
              placeholderTextColor="#9a9389"
              value={firstName}
              onChangeText={setFirstName}
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
              style={inputStyle}
            />

            <TextInput
              ref={lastNameRef}
              placeholder="Soyad"
              placeholderTextColor="#9a9389"
              value={lastName}
              onChangeText={setLastName}
              returnKeyType="next"
              onSubmitEditing={() => usernameRef.current?.focus()}
              style={inputStyle}
            />

            <TextInput
              ref={usernameRef}
              placeholder="@kullaniciadi"
              placeholderTextColor="#9a9389"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              style={inputStyle}
            />

            <TextInput
              ref={emailRef}
              placeholder="Email"
              placeholderTextColor="#9a9389"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              style={inputStyle}
            />

            <TextInput
              ref={passwordRef}
              placeholder="Şifre"
              placeholderTextColor="#9a9389"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              style={inputStyle}
            />

            <TextInput
              ref={confirmPasswordRef}
              placeholder="Şifre tekrar"
              placeholderTextColor="#9a9389"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={goNext}
              style={inputStyle}
            />

            <View style={{ gap: 8 }}>
              <Text style={{ fontWeight: "800", color: COLORS.text }}>
                Doğum tarihi
              </Text>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <SimpleSelect
                  value={birthDay}
                  placeholder="Gün"
                  options={DAYS}
                  onSelect={setBirthDay}
                />
                <SimpleSelect
                  value={birthMonth}
                  placeholder="Ay"
                  options={MONTHS}
                  onSelect={setBirthMonth}
                />
                <SimpleSelect
                  value={birthYear}
                  placeholder="Yıl"
                  options={YEARS}
                  onSelect={setBirthYear}
                />
              </View>

              {birthDateString ? (
                <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                  Seçilen tarih: {birthDateString}
                  {calculatedAge ? ` · Yaşın: ${calculatedAge}` : ""}
                </Text>
              ) : (
                <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                  Gün, ay ve yılı seç.
                </Text>
              )}
            </View>

            <Pressable
              onPress={goNext}
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
              })}
            >
              <Ionicons
                name="arrow-forward-outline"
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
                Devam et
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <View
              style={{
                backgroundColor: COLORS.successSoft,
                borderRadius: 18,
                padding: 14,
                gap: 10,
              }}
            >
              <Text style={sectionTitleStyle}>
                En çok hangi türlere düşüyorsun? 📚
              </Text>
              <Text style={{ color: COLORS.muted, lineHeight: 20 }}>
                Profilinde öne çıksın, sana daha iyi öneriler gelsin.
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {GENRES.map((genre) => {
                  const selected = favoriteGenres.includes(genre);

                  return (
                    <Pressable
                      key={genre}
                      onPress={() => toggleGenre(genre)}
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
                        {genre}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View
              style={{
                backgroundColor: COLORS.peachSoft,
                borderRadius: 18,
                padding: 14,
                gap: 12,
              }}
            >
              <Text style={sectionTitleStyle}>
                Takip ettiğin yazarlar kimler? ✍️
              </Text>

              <TextInput
                ref={favoriteAuthorsRef}
                placeholder="Örn: Sabahattin Ali, Matt Haig, Stefan Zweig"
                placeholderTextColor="#9a9389"
                value={favoriteAuthorsInput}
                onChangeText={setFavoriteAuthorsInput}
                returnKeyType="next"
                onSubmitEditing={() => favoriteBookRef.current?.focus()}
                style={inputStyle}
              />

              <TextInput
                ref={favoriteBookRef}
                placeholder="Seni en çok etkileyen kitap"
                placeholderTextColor="#9a9389"
                value={favoriteBook}
                onChangeText={setFavoriteBook}
                returnKeyType="next"
                onSubmitEditing={() => yearlyGoalRef.current?.focus()}
                style={inputStyle}
              />

              <TextInput
                ref={yearlyGoalRef}
                placeholder="Bu yıl kaç kitaplık hedef koyuyorsun? (örn: 24)"
                placeholderTextColor="#9a9389"
                keyboardType="numeric"
                value={yearlyGoal}
                onChangeText={setYearlyGoal}
                returnKeyType="next"
                onSubmitEditing={() => bioRef.current?.focus()}
                style={inputStyle}
              />

              <TextInput
                ref={bioRef}
                placeholder="Profiline kısa bir not bırak... Nasıl bir okursun?"
                placeholderTextColor="#9a9389"
                multiline
                value={bio}
                onChangeText={setBio}
                style={[
                  inputStyle,
                  {
                    minHeight: 110,
                    textAlignVertical: "top",
                  },
                ]}
              />
            </View>

            <View
              style={{
                backgroundColor: COLORS.lavenderSoft,
                borderRadius: 18,
                padding: 14,
                gap: 12,
              }}
            >
              <Text style={sectionTitleStyle}>Okur vibe’ın hangisi? ✨</Text>

              {READER_VIBES.map((item) => {
                const selected = readerVibe === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() => setReaderVibe(item)}
                    style={{
                      borderWidth: 1,
                      borderColor: selected ? COLORS.primary : COLORS.border,
                      borderRadius: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      backgroundColor: selected ? "#fff7f0" : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.text,
                        fontWeight: selected ? "800" : "600",
                      }}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={{
                backgroundColor: COLORS.blueSoft,
                borderRadius: 18,
                padding: 14,
                gap: 12,
              }}
            >
              <Text style={sectionTitleStyle}>
                Son zamanlarda hangi moddasın?
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {READING_MOODS.map((item) => {
                  const selected = readingMood === item;

                  return (
                    <Pressable
                      key={item}
                      onPress={() => setReadingMood(item)}
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
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={sectionTitleStyle}>
                Bir kitapta seni en çok ne çeker?
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {BOOK_VALUES.map((item) => {
                  const selected = bookValue === item;

                  return (
                    <Pressable
                      key={item}
                      onPress={() => setBookValue(item)}
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
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <TextInput
              placeholder="Bu yıl kaç kitaplık hedef koyuyorsun? (örn: 24)"
              placeholderTextColor="#9a9389"
              keyboardType="numeric"
              value={yearlyGoal}
              onChangeText={setYearlyGoal}
              style={inputStyle}
            />

            <TextInput
              placeholder="Profiline kısa bir not bırak... Nasıl bir okursun?"
              placeholderTextColor="#9a9389"
              multiline
              value={bio}
              onChangeText={setBio}
              style={[
                inputStyle,
                {
                  minHeight: 110,
                  textAlignVertical: "top",
                },
              ]}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => setStep(1)}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed ? "#e9dfd3" : "#f3ede6",
                  paddingVertical: 16,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    fontWeight: "800",
                    fontSize: 15,
                  }}
                >
                  Geri
                </Text>
              </Pressable>

              <Pressable
                onPress={handleRegister}
                disabled={submitting}
                style={({ pressed }) => ({
                  flex: 1.3,
                  backgroundColor: pressed
                    ? COLORS.primaryDark
                    : COLORS.primary,
                  paddingVertical: 16,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                  opacity: submitting ? 0.7 : 1,
                })}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.whiteSoft} />
                ) : (
                  <>
                    <Ionicons
                      name="sparkles-outline"
                      size={18}
                      color={COLORS.whiteSoft}
                    />
                    <Text
                      style={{
                        color: COLORS.whiteSoft,
                        fontWeight: "900",
                        fontSize: 15,
                      }}
                    >
                      Profili tamamla
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        )}

        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 4,
          }}
        >
          <Text style={{ color: COLORS.muted, fontSize: 14 }}>
            Zaten hesabın var mı?
          </Text>

          <Link
            href="/(auth)/login"
            style={{
              marginTop: 8,
              color: COLORS.primary,
              fontWeight: "800",
              fontSize: 15,
              textAlign: "center",
            }}
          >
            Giriş yap
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
