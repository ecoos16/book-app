// app/(tabs)/profile.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useBooks } from "../../context/BooksContext";
import { usePosts } from "../../context/PostsContext";
import { useReadingGoal } from "../../context/ReadingGoalContext";
import type { ReadingLogItem } from "../../context/ReadingLogContext";
import { useReadingLog } from "../../context/ReadingLogContext";
import { useUser } from "../../context/UserContext";

const COLORS = {
  bg: "#fbf9f5",
  card: "#fffdf9",
  border: "#ece7df",
  text: "#2f2a24",
  muted: "#7a7268",
  primary: "#7d5739",
  primaryDark: "#6b4a2f",
  primarySoft: "#f3e2d2",
  greenSoft: "#dfe7cf",
  peachSoft: "#f7dfcc",
  graySoft: "#f3efe8",
  cream: "#f8f4ee",
  dangerSoft: "#fff4f4",
  dangerBorder: "#ffd8d8",
  dangerText: "#a22b2b",
  white: "#fff",
  lavenderSoft: "#f5eefc",
  blueSoft: "#edf4ff",
};

type TabKey = "stats" | "posts";

function getInitials(name?: string) {
  if (!name?.trim()) return "U";

  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getReaderLevel(readCount: number) {
  if (readCount >= 20) {
    return {
      label: "Kitap Kurdu",
      icon: "🏆",
      description: "Düzenli ve güçlü bir okuma temposu yakaladın.",
    };
  }

  if (readCount >= 10) {
    return {
      label: "Düzenli Okur",
      icon: "✨",
      description: "Okuma alışkanlığın güzel şekilde oturuyor.",
    };
  }

  if (readCount >= 3) {
    return {
      label: "İstikrarlı Başlangıç",
      icon: "🌱",
      description: "Harika gidiyorsun, ritim kazanıyorsun.",
    };
  }

  return {
    label: "Yeni Okur",
    icon: "📘",
    description: "Okuma yolculuğunun başındasın.",
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function StatCard({
  label,
  value,
  icon,
  accent = "neutral",
}: {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: "neutral" | "primary" | "green" | "peach";
}) {
  const bg =
    accent === "primary"
      ? COLORS.primarySoft
      : accent === "green"
        ? COLORS.greenSoft
        : accent === "peach"
          ? COLORS.peachSoft
          : COLORS.card;

  return (
    <View
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 20,
        padding: 14,
        backgroundColor: bg,
        gap: 8,
      }}
    >
      {!!icon && <Ionicons name={icon} size={18} color={COLORS.primary} />}

      <Text
        style={{
          color: COLORS.muted,
          fontWeight: "700",
          fontSize: 12,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          fontSize: 22,
          fontWeight: "900",
          color: COLORS.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function SoftButton({
  label,
  onPress,
  icon,
  variant = "secondary",
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "secondary" | "primary" | "danger";
  disabled?: boolean;
}) {
  const backgroundColor =
    variant === "primary"
      ? COLORS.primary
      : variant === "danger"
        ? COLORS.dangerSoft
        : COLORS.graySoft;

  const borderColor =
    variant === "primary"
      ? COLORS.primary
      : variant === "danger"
        ? COLORS.dangerBorder
        : COLORS.border;

  const textColor =
    variant === "primary"
      ? "#fff7f4"
      : variant === "danger"
        ? COLORS.dangerText
        : COLORS.text;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }) => ({
        opacity: disabled ? 0.6 : 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor,
        backgroundColor: pressed
          ? variant === "primary"
            ? COLORS.primaryDark
            : "#ece6dc"
          : hovered
            ? variant === "primary"
              ? "#8b6240"
              : "#f7f2ea"
            : backgroundColor,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {!!icon && <Ionicons name={icon} size={16} color={textColor} />}
      <Text
        style={{
          color: textColor,
          fontWeight: "900",
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ProfileTabButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 13,
        borderRadius: 999,
        backgroundColor: active
          ? COLORS.primary
          : pressed
            ? "#eee7de"
            : COLORS.card,
        borderWidth: 1,
        borderColor: active ? COLORS.primary : COLORS.border,
      })}
    >
      <Text
        style={{
          color: active ? "#fff7f4" : COLORS.text,
          fontWeight: "900",
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Chip({ label, bg = "#fff" }: { label: string; bg?: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: bg,
      }}
    >
      <Text
        style={{
          color: COLORS.text,
          fontWeight: "700",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function Profile() {
  const { refreshUser } = useUser();

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, []),
  );
  const { user: authUser, signOut } = useAuth();
  const { books, isHydrated, clearAll } = useBooks();
  const { posts, removePost } = usePosts();
  const { goal, setGoal } = useReadingGoal();
  const { user } = useUser();
  const { logs, addLog } = useReadingLog();

  const [tab, setTab] = useState<TabKey>("stats");
  const [goalInput, setGoalInput] = useState<string>(String(goal ?? 0));
  const [logDate, setLogDate] = useState<string>(todayKey());
  const [logPages, setLogPages] = useState<string>("");
  const [step, setStep] = useState<number>(10);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const steps = [10, 20, 30, 40, 50];
  const currentUserId = authUser?.id ?? "";

  const getTotalForDate = (dateKey: string) => {
    return logs
      .filter((l: ReadingLogItem) => l.date === dateKey)
      .reduce((sum: number, l: ReadingLogItem) => sum + (l.pages ?? 0), 0);
  };

  const maybeNotifyGoalReached = (dateKey: string, incomingPages: number) => {
    const current = getTotalForDate(dateKey);
    const next = current + incomingPages;
    const g = Number(goal) || 0;

    if (g > 0 && current < g && next >= g) {
      Alert.alert("🎉 Hedef tamamlandı", `${dateKey} için ${g} sayfa tamam!`);
    }
  };

  const onSaveGoal = () => {
    const n = Number(goalInput) || 0;

    if (n <= 0) {
      Alert.alert("Hata", "Günlük hedef 1 veya daha büyük olmalı.");
      return;
    }

    setGoal(n);
    Alert.alert("Kaydedildi", `Günlük hedef ${n} sayfa olarak güncellendi.`);
  };

  const onQuickAdd = (n: number) => {
    const dateKey = logDate.trim();

    if (!dateKey || dateKey.length !== 10) {
      Alert.alert("Hata", "Tarih formatı YYYY-MM-DD olmalı.");
      return;
    }

    const pages = Number(n) || 0;
    if (pages <= 0) return;

    maybeNotifyGoalReached(dateKey, pages);
    addLog(pages, dateKey);

    Alert.alert("✅ Eklendi", `${dateKey} için +${pages} sayfa eklendi.`);
  };

  const onManualAdd = () => {
    const dateKey = logDate.trim();
    const pages = Number(logPages) || 0;

    if (!dateKey || dateKey.length !== 10) {
      Alert.alert("Hata", "Tarih formatı YYYY-MM-DD olmalı.");
      return;
    }

    if (pages <= 0) {
      Alert.alert("Hata", "Sayfa sayısı 1 veya daha büyük olmalı.");
      return;
    }

    maybeNotifyGoalReached(dateKey, pages);
    addLog(pages, dateKey);
    setLogPages("");

    Alert.alert("✅ Eklendi", `${dateKey} için ${pages} sayfa eklendi.`);
  };

  const onLogoutPress = async () => {
    try {
      console.log("LOGOUT BUTTON PRESSED");
      setIsSigningOut(true);

      await signOut();

      console.log("SIGN OUT TAMAMLANDI");
      router.replace("/(auth)/login");
    } catch (error) {
      console.log("PROFILE SIGN OUT ERROR:", error);
      Alert.alert("Hata", "Çıkış yapılırken bir sorun oluştu.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const weekly = useMemo(() => {
    const today = new Date();
    const labels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cts", "Paz"];
    const days: { label: string; pages: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);

      const dayTotal = logs
        .filter((l: ReadingLogItem) => l.date === key)
        .reduce((sum: number, l: ReadingLogItem) => sum + (l.pages ?? 0), 0);

      const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      days.push({ label: labels[idx], pages: dayTotal });
    }

    const total = days.reduce((s, d) => s + d.pages, 0);
    return { days, total };
  }, [logs]);

  const stats = useMemo(() => {
    const total = books.length;
    const reading = books.filter((b) => b.status === "reading").length;
    const read = books.filter((b) => b.status === "read").length;
    const want = books.filter((b) => b.status === "want").length;

    return { total, reading, read, want };
  }, [books]);

  const myShares = useMemo(() => {
    return posts
      .filter((p) => p.userId === currentUserId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, currentUserId]);

  const profileSummary = useMemo(() => {
    const totalPosts = myShares.length;
    const totalLikes = myShares.reduce((sum, p) => sum + (p.likes ?? 0), 0);
    const totalComments = myShares.reduce(
      (sum, p) => sum + (p.comments?.length ?? 0),
      0,
    );
    const completionRate =
      stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0;

    const topPost =
      myShares.length > 0
        ? [...myShares].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0]
        : null;

    return {
      totalPosts,
      totalLikes,
      totalComments,
      completionRate,
      topPost,
    };
  }, [myShares, stats]);

  const userCardSummary = useMemo(() => {
    return {
      readingNow: stats.reading,
      finishedBooks: stats.read,
      wishlistCount: stats.want,
    };
  }, [stats]);

  const readerLevel = useMemo(() => getReaderLevel(stats.read), [stats.read]);

  const weeklyGoal = (Number(goal) || 0) * 7;
  const weeklyPercent =
    weeklyGoal > 0
      ? Math.min(100, Math.round((weekly.total / weeklyGoal) * 100))
      : 0;

  const displayName =
    user?.name?.trim() || authUser?.email || "ReadSphere Kullanıcısı";

  const profileUsername = user?.username?.trim()
    ? `@${user.username.trim()}`
    : "@readsphereuser";

  const favoriteGenres = user?.favoriteGenres ?? [];
  const favoriteAuthors = user?.favoriteAuthors ?? [];
  const favoriteBook = user?.favoriteBook ?? "";
  const readingMood = user?.readingMood ?? "";
  const bookValue = user?.bookValue ?? "";
  const readerType = user?.readerType ?? "";
  const bio = user?.bio ?? "";

  const onDeleteShare = (postId: string) => {
    removePost(postId);
    setConfirmDeleteId(null);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{
        padding: 18,
        gap: 16,
        paddingBottom: 120,
      }}
    >
      <View
        style={{
          borderRadius: 28,
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          overflow: "hidden",
          shadowColor: "#2f2a24",
          shadowOpacity: 0.06,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 2,
        }}
      >
        <View
          style={{
            height: 96,
            backgroundColor: COLORS.primarySoft,
          }}
        />

        <View style={{ padding: 18, paddingTop: 0, gap: 14 }}>
          <View
            style={{
              width: 86,
              height: 86,
              borderRadius: 43,
              backgroundColor: COLORS.primary,
              alignItems: "center",
              justifyContent: "center",
              marginTop: -43,
              borderWidth: 4,
              borderColor: COLORS.card,
              overflow: "hidden",
            }}
          >
            {user?.avatar?.trim() ? (
              <Image
                source={{ uri: user.avatar }}
                style={{ width: 86, height: 86 }}
                resizeMode="cover"
              />
            ) : (
              <Text
                style={{
                  color: "#fff7f4",
                  fontWeight: "900",
                  fontSize: 24,
                }}
              >
                {getInitials(displayName)}
              </Text>
            )}
          </View>

          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "900",
                color: COLORS.text,
              }}
            >
              {displayName}
            </Text>

            <Text
              style={{
                color: COLORS.primary,
                fontWeight: "800",
                fontSize: 14,
              }}
            >
              {profileUsername}
            </Text>

            {!!bio ? (
              <Text
                style={{
                  color: COLORS.muted,
                  lineHeight: 21,
                  fontSize: 14,
                }}
              >
                {bio}
              </Text>
            ) : (
              <Text
                style={{
                  color: COLORS.muted,
                  lineHeight: 21,
                  fontSize: 14,
                }}
              >
                Kitaplarını takip ediyor, paylaşımlar yapıyor ve okuma
                hedeflerini yönetiyorsun.
              </Text>
            )}
          </View>

          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 999,
              backgroundColor: COLORS.graySoft,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontWeight: "900",
                color: COLORS.primary,
              }}
            >
              {readerLevel.icon} {readerLevel.label}
            </Text>
          </View>

          <Text style={{ color: COLORS.muted, lineHeight: 20 }}>
            {readerLevel.description}
          </Text>

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Chip label={`📚 ${userCardSummary.finishedBooks} kitap okundu`} />
            <Chip label={`✍️ ${profileSummary.totalPosts} paylaşım`} />
            <Chip label={`❤️ ${profileSummary.totalLikes} beğeni`} />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <SoftButton
                label="Mesajlara Git"
                icon="chatbubble-ellipses-outline"
                onPress={() => router.push("/(tabs)/chat")}
              />
            </View>

            <View style={{ flex: 1 }}>
              <SoftButton
                label="Profili Düzenle"
                icon="create-outline"
                onPress={() => router.push("/edit-profile")}
              />
            </View>
          </View>

          <SoftButton
            label={isSigningOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
            icon="log-out-outline"
            variant="danger"
            disabled={isSigningOut}
            onPress={onLogoutPress}
          />
        </View>
      </View>

      <View
        style={{
          borderRadius: 24,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
          padding: 16,
          gap: 14,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "900",
            color: COLORS.text,
          }}
        >
          Profil vibe’ın
        </Text>

        {!!readerType && (
          <View style={{ gap: 6 }}>
            <Text style={{ color: COLORS.muted, fontWeight: "700" }}>
              Okur vibe’ın
            </Text>
            <Chip label={readerType} bg={COLORS.lavenderSoft} />
          </View>
        )}

        {!!readingMood && (
          <View style={{ gap: 6 }}>
            <Text style={{ color: COLORS.muted, fontWeight: "700" }}>
              Şu sıralar modun
            </Text>
            <Chip label={readingMood} bg={COLORS.blueSoft} />
          </View>
        )}

        {!!bookValue && (
          <View style={{ gap: 6 }}>
            <Text style={{ color: COLORS.muted, fontWeight: "700" }}>
              Kitapta en çok aradığın şey
            </Text>
            <Chip label={bookValue} bg={COLORS.peachSoft} />
          </View>
        )}

        {!!favoriteBook && (
          <View style={{ gap: 6 }}>
            <Text style={{ color: COLORS.muted, fontWeight: "700" }}>
              Tek kitap seçecek olsan
            </Text>
            <Text
              style={{
                color: COLORS.text,
                fontWeight: "800",
                fontSize: 15,
              }}
            >
              {favoriteBook}
            </Text>
          </View>
        )}

        {favoriteGenres.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ color: COLORS.muted, fontWeight: "700" }}>
              Sevdiğin türler
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {favoriteGenres.map((genre) => (
                <Chip key={genre} label={genre} />
              ))}
            </View>
          </View>
        )}

        {favoriteAuthors.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ color: COLORS.muted, fontWeight: "700" }}>
              Favori yazarların
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {favoriteAuthors.map((author) => (
                <Chip key={author} label={author} bg={COLORS.cream} />
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={{ gap: 4 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "900",
            color: COLORS.text,
          }}
        >
          Profil
        </Text>

        <Text style={{ color: COLORS.muted, lineHeight: 20 }}>
          {stats.read} kitap okudun · {profileSummary.totalPosts} paylaşım
          yaptın
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        <ProfileTabButton
          label="İstatistikler"
          active={tab === "stats"}
          onPress={() => setTab("stats")}
        />
        <ProfileTabButton
          label="Paylaşımlar"
          active={tab === "posts"}
          onPress={() => setTab("posts")}
        />
      </View>

      {tab === "stats" && (
        <>
          {!isHydrated ? (
            <View
              style={{
                borderRadius: 20,
                padding: 18,
                backgroundColor: COLORS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ color: COLORS.muted }}>Yükleniyor…</Text>
            </View>
          ) : (
            <>
              <View style={{ gap: 10 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "900",
                    color: COLORS.text,
                  }}
                >
                  Kitap İstatistikleri
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <StatCard
                    label="Toplam Kitap"
                    value={stats.total}
                    icon="library-outline"
                    accent="primary"
                  />
                  <StatCard
                    label="Okuyorum"
                    value={stats.reading}
                    icon="book-outline"
                    accent="peach"
                  />
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <StatCard
                    label="Okudum"
                    value={stats.read}
                    icon="checkmark-done-outline"
                    accent="green"
                  />
                  <StatCard
                    label="İstiyorum"
                    value={stats.want}
                    icon="star-outline"
                  />
                </View>
              </View>

              <View
                style={{
                  gap: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 24,
                  padding: 16,
                  backgroundColor: COLORS.card,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "900",
                    color: COLORS.text,
                  }}
                >
                  Profil Özeti
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <StatCard
                    label="Paylaşım"
                    value={profileSummary.totalPosts}
                  />
                  <StatCard
                    label="Toplam Yorum"
                    value={profileSummary.totalComments}
                  />
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <StatCard
                    label="Toplam Beğeni"
                    value={profileSummary.totalLikes}
                  />
                  <StatCard
                    label="Tamamlama Oranı"
                    value={`%${profileSummary.completionRate}`}
                  />
                </View>
              </View>

              <View
                style={{
                  gap: 10,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 24,
                  padding: 16,
                  backgroundColor: COLORS.card,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "900",
                    color: COLORS.text,
                  }}
                >
                  En Çok Beğeni Alan Paylaşım
                </Text>

                {!profileSummary.topPost ? (
                  <Text style={{ color: COLORS.muted }}>
                    Henüz paylaşım bulunmuyor.
                  </Text>
                ) : (
                  <>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "900",
                        color: COLORS.text,
                      }}
                    >
                      {profileSummary.topPost.bookTitle}
                    </Text>

                    {!!profileSummary.topPost.shareText && (
                      <Text
                        style={{
                          color: COLORS.muted,
                          lineHeight: 21,
                        }}
                      >
                        {profileSummary.topPost.shareText}
                      </Text>
                    )}

                    <Text style={{ color: COLORS.muted }}>
                      ❤️ {profileSummary.topPost.likes ?? 0} · 💬{" "}
                      {profileSummary.topPost.comments?.length ?? 0}
                    </Text>

                    <SoftButton
                      label="Paylaşımı Aç"
                      onPress={() =>
                        router.push({
                          pathname: "/post-comments/[id]",
                          params: { id: profileSummary.topPost!.id },
                        })
                      }
                    />
                  </>
                )}
              </View>

              <View
                style={{
                  gap: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 24,
                  padding: 16,
                  backgroundColor: COLORS.card,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "900",
                    color: COLORS.text,
                  }}
                >
                  Günlük Hedef
                </Text>

                <TextInput
                  value={goalInput}
                  onChangeText={setGoalInput}
                  keyboardType="numeric"
                  placeholder="Örn: 20"
                  placeholderTextColor="#9b958b"
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.cream,
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    color: COLORS.text,
                  }}
                />

                <SoftButton
                  label="Kaydet"
                  icon="save-outline"
                  variant="primary"
                  onPress={onSaveGoal}
                />

                <Text style={{ color: COLORS.muted }}>
                  Şu anki hedef:{" "}
                  <Text style={{ fontWeight: "900" }}>{goal}</Text> sayfa
                </Text>
              </View>

              <View
                style={{
                  gap: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 24,
                  padding: 16,
                  backgroundColor: COLORS.card,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "900",
                    color: COLORS.text,
                  }}
                >
                  Günlük Okuma Ekle
                </Text>

                <View style={{ gap: 8 }}>
                  <Text style={{ color: COLORS.text, fontWeight: "800" }}>
                    Tarih (YYYY-MM-DD)
                  </Text>
                  <TextInput
                    value={logDate}
                    onChangeText={setLogDate}
                    placeholder="2026-03-24"
                    placeholderTextColor="#9b958b"
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      backgroundColor: COLORS.cream,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      color: COLORS.text,
                    }}
                  />
                </View>

                <View style={{ gap: 8 }}>
                  <Text style={{ color: COLORS.text, fontWeight: "800" }}>
                    Okunan Sayfa Sayısı
                  </Text>
                  <TextInput
                    value={logPages}
                    onChangeText={setLogPages}
                    keyboardType="numeric"
                    placeholder="Örn: 35"
                    placeholderTextColor="#9b958b"
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      backgroundColor: COLORS.cream,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      color: COLORS.text,
                    }}
                  />
                </View>

                <SoftButton
                  label="Ekle"
                  icon="add-outline"
                  variant="primary"
                  onPress={onManualAdd}
                />

                <View style={{ gap: 8 }}>
                  <Text
                    style={{
                      fontWeight: "900",
                      color: COLORS.text,
                    }}
                  >
                    Hızlı Ekle
                  </Text>

                  <View
                    style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}
                  >
                    {steps.map((n) => {
                      const active = step === n;

                      return (
                        <Pressable
                          key={n}
                          onPress={() => {
                            setStep(n);
                            onQuickAdd(n);
                          }}
                          style={({ pressed }) => ({
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: active
                              ? COLORS.primary
                              : COLORS.border,
                            backgroundColor: active
                              ? COLORS.primary
                              : pressed
                                ? "#eee8df"
                                : COLORS.card,
                          })}
                        >
                          <Text
                            style={{
                              color: active ? "#fff7f4" : COLORS.text,
                              fontWeight: "900",
                            }}
                          >
                            +{n}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={{ color: COLORS.muted }}>
                    Hızlı ekle butonlarına basınca direkt eklenir.
                  </Text>
                </View>
              </View>

              <View
                style={{
                  gap: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 24,
                  padding: 16,
                  backgroundColor: COLORS.card,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "900",
                    color: COLORS.text,
                  }}
                >
                  Haftalık Hedef İlerlemesi
                </Text>

                <Text style={{ color: COLORS.muted }}>
                  {weekly.total} / {weeklyGoal} sayfa
                </Text>

                <View
                  style={{
                    height: 12,
                    borderRadius: 999,
                    backgroundColor: COLORS.graySoft,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${weeklyPercent}%`,
                      height: "100%",
                      backgroundColor: COLORS.primary,
                      borderRadius: 999,
                    }}
                  />
                </View>

                <Text style={{ color: COLORS.muted }}>
                  Haftalık hedefin %{weeklyPercent} tamamlandı.
                </Text>
              </View>

              <View
                style={{
                  gap: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 24,
                  padding: 16,
                  backgroundColor: COLORS.card,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "900",
                    color: COLORS.text,
                  }}
                >
                  Bu Hafta Okuma
                </Text>

                <StatCard
                  label="Toplam Sayfa"
                  value={weekly.total}
                  icon="stats-chart-outline"
                  accent="primary"
                />

                <View style={{ gap: 10 }}>
                  {weekly.days.map((d) => (
                    <View
                      key={d.label}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: COLORS.text, fontWeight: "700" }}>
                        {d.label}
                      </Text>
                      <Text style={{ color: COLORS.muted }}>
                        {d.pages} sayfa
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ gap: 10 }}>
                <SoftButton
                  label="Kitap Ekle"
                  icon="add-circle-outline"
                  variant="primary"
                  onPress={() =>
                    router.push({
                      pathname: "/add-book",
                      params: { status: "want" },
                    })
                  }
                />

                <SoftButton
                  label="Tüm Kitapları Sil"
                  icon="trash-outline"
                  variant="danger"
                  onPress={() => {
                    Alert.alert(
                      "Tüm kitaplar silinsin mi?",
                      "Bu işlem geri alınamaz.",
                      [
                        { text: "Vazgeç", style: "cancel" },
                        {
                          text: "Sil",
                          style: "destructive",
                          onPress: () => clearAll(),
                        },
                      ],
                    );
                  }}
                />
              </View>
            </>
          )}
        </>
      )}

      {tab === "posts" && (
        <View style={{ gap: 12 }}>
          {myShares.length === 0 ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 24,
                padding: 24,
                backgroundColor: COLORS.card,
                alignItems: "center",
                gap: 10,
              }}
            >
              <Ionicons
                name="create-outline"
                size={30}
                color={COLORS.primary}
              />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  color: COLORS.text,
                }}
              >
                Henüz paylaşım yapmadın
              </Text>

              <Text
                style={{
                  color: COLORS.muted,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Bir kitap hakkında düşüncelerini paylaşarak topluluğa katıl.
              </Text>
            </View>
          ) : (
            myShares.map((post) => (
              <View
                key={post.id}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 24,
                  padding: 16,
                  backgroundColor: COLORS.card,
                  gap: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "900",
                    color: COLORS.text,
                  }}
                >
                  {post.bookTitle}
                </Text>

                {!!post.bookAuthor && (
                  <Text style={{ color: COLORS.muted }}>{post.bookAuthor}</Text>
                )}

                {!!post.shareText && (
                  <Text style={{ color: COLORS.text, lineHeight: 22 }}>
                    {post.shareText}
                  </Text>
                )}

                <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                  ❤️ {post.likes ?? 0} · 💬 {post.comments?.length ?? 0}
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <SoftButton
                      label="Düzenle"
                      icon="create-outline"
                      onPress={() =>
                        router.push({
                          pathname: "/share/[id]",
                          params: {
                            id: post.bookId,
                            postId: post.id,
                          },
                        })
                      }
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <SoftButton
                      label="Sil"
                      icon="trash-outline"
                      variant="danger"
                      onPress={() =>
                        setConfirmDeleteId((prev) =>
                          prev === post.id ? null : post.id,
                        )
                      }
                    />
                  </View>
                </View>

                {confirmDeleteId === post.id && (
                  <View
                    style={{
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: COLORS.dangerBorder,
                      backgroundColor: COLORS.dangerSoft,
                      gap: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.dangerText,
                        fontWeight: "800",
                      }}
                    >
                      Bu paylaşım silinsin mi?
                    </Text>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <SoftButton
                          label="Vazgeç"
                          onPress={() => setConfirmDeleteId(null)}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <SoftButton
                          label="Evet, Sil"
                          variant="primary"
                          onPress={() => onDeleteShare(post.id)}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}
