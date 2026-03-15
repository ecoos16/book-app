import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useBooks } from "../../context/BooksContext";
import { usePosts } from "../../context/PostsContext";
import { useReadingGoal } from "../../context/ReadingGoalContext";
import type { ReadingLogItem } from "../../context/ReadingLogContext";
import { useReadingLog } from "../../context/ReadingLogContext";
import { useUser } from "../../context/UserContext";
import { CURRENT_USER } from "../../data/mockUsers";
import { buttonStyle, pillButtonStyle } from "../../utils/pressableStyles";

/**
 * Basit istatistik kutusu
 */
function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 14,
        padding: 12,
        backgroundColor: "#fff",
        gap: 6,
      }}
    >
      <Text style={{ color: "#666", fontWeight: "700", fontSize: 12 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 18, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

/**
 * İsimden baş harf üretir
 * Örn: "Ecesu Orhan" -> EO
 */
function getInitials(name?: string) {
  if (!name?.trim()) return "U";

  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

/**
 * Toplam okunan kitaba göre seviye etiketi döndürür
 */
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

/**
 * YYYY-MM-DD formatında bugünün tarihi
 */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

type TabKey = "stats" | "posts";

export default function Profile() {
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

  const steps = [10, 20, 30, 40, 50];

  /**
   * Belirli tarihte toplam okunan sayfa
   */
  const getTotalForDate = (dateKey: string) => {
    return logs
      .filter((l: ReadingLogItem) => l.date === dateKey)
      .reduce((sum: number, l: ReadingLogItem) => sum + (l.pages ?? 0), 0);
  };

  /**
   * Günlük hedef ilk kez geçildiyse uyar
   */
  const maybeNotifyGoalReached = (dateKey: string, addedPages: number) => {
    const g = Number(goal) || 0;
    if (g <= 0) return;

    const before = getTotalForDate(dateKey);
    const after = before + addedPages;

    if (before < g && after >= g) {
      Alert.alert("🎉 Hedefe ulaşıldı!", `${dateKey} için ${g} sayfa tamam!`);
    }
  };

  /**
   * Hızlı sayfa ekleme
   */
  const onQuickAdd = (n: number) => {
    const dateKey = logDate.trim();

    if (!dateKey || dateKey.length !== 10) {
      Alert.alert("Hata", "Tarih formatı: YYYY-MM-DD olmalı. Örn: 2026-02-23");
      return;
    }

    const pages = Number(n) || 0;
    if (pages <= 0) return;

    maybeNotifyGoalReached(dateKey, pages);
    addLog(pages, dateKey);

    Alert.alert("✅ Eklendi", `${dateKey} için +${pages} sayfa eklendi.`);
  };

  /**
   * Manuel sayfa ekleme
   */
  const onManualAdd = () => {
    const dateKey = logDate.trim();
    const pages = Number(logPages) || 0;

    if (!dateKey || dateKey.length !== 10) {
      Alert.alert("Hata", "Tarih formatı: YYYY-MM-DD olmalı. Örn: 2026-02-23");
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

  /**
   * Haftalık okuma özeti
   */
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

  /**
   * Kitap istatistikleri
   */
  const stats = useMemo(() => {
    const total = books.length;
    const reading = books.filter((b) => b.status === "reading").length;
    const read = books.filter((b) => b.status === "read").length;
    const want = books.filter((b) => b.status === "want").length;
    return { total, reading, read, want };
  }, [books]);

  /**
   * Kullanıcının paylaşımları
   */
  const myShares = useMemo(() => {
    return posts
      .filter((p) => p.userId === CURRENT_USER.id)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts]);

  /**
   * Profil özeti
   */
  const profileSummary = useMemo(() => {
    const totalPosts = myShares.length;

    const totalComments = myShares.reduce(
      (sum, post) => sum + (post.comments?.length ?? 0),
      0,
    );

    const totalLikes = myShares.reduce(
      (sum, post) => sum + (post.likes ?? 0),
      0,
    );

    const topPost =
      myShares.length > 0
        ? [...myShares].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0]
        : null;

    const completionRate =
      stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0;

    const weeklyGoalTarget = (Number(goal) || 0) * 7;

    const weeklyGoalPercent =
      weeklyGoalTarget > 0
        ? Math.min(100, Math.round((weekly.total / weeklyGoalTarget) * 100))
        : 0;

    return {
      totalPosts,
      totalComments,
      totalLikes,
      topPost,
      completionRate,
      weeklyGoalTarget,
      weeklyGoalPercent,
    };
  }, [myShares, stats.total, stats.read, weekly.total, goal]);

  /**
   * Kullanıcı kartı özeti
   */
  const userCardSummary = useMemo(() => {
    return {
      readingNow: stats.reading,
      finishedBooks: stats.read,
      wishlistCount: stats.want,
    };
  }, [stats.reading, stats.read, stats.want]);

  /**
   * Okuma seviyesi
   */
  const readerLevel = useMemo(() => {
    return getReaderLevel(stats.read);
  }, [stats.read]);

  /**
   * Hedef kaydet
   */
  const onSaveGoal = () => {
    const n = Number(goalInput);

    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert("Hata", "Günlük hedef 1 veya daha büyük olmalı.");
      return;
    }

    setGoal(Math.floor(n));
    Alert.alert("✅ Kaydedildi", `Günlük hedef: ${Math.floor(n)} sayfa`);
  };

  /**
   * Tüm kitapları sil
   */
  const onClearAll = () => {
    Alert.alert("Tüm kitaplar silinsin mi?", "Bu işlem geri alınamaz.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => clearAll(),
      },
    ]);
  };

  /**
   * Paylaşım sil
   */
  const handleDeletePost = (postId: string) => {
    removePost(postId);
    setConfirmDeleteId(null);
  };

  /**
   * Sekme butonları
   */
  const TabSwitch = (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <Pressable
        onPress={() => setTab("stats")}
        style={({ pressed, hovered }) => ({
          flex: 1,
          paddingVertical: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: tab === "stats" ? "#111" : "#ddd",
          backgroundColor:
            tab === "stats"
              ? pressed
                ? "#333"
                : hovered
                  ? "#222"
                  : "#111"
              : pressed
                ? "#f1f1f1"
                : hovered
                  ? "#fafafa"
                  : "#fff",
          alignItems: "center",
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <Text
          style={{
            fontWeight: "900",
            color: tab === "stats" ? "#fff" : "#111",
          }}
        >
          📚
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setTab("posts")}
        style={({ pressed, hovered }) => ({
          flex: 1,
          paddingVertical: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: tab === "posts" ? "#111" : "#ddd",
          backgroundColor:
            tab === "posts"
              ? pressed
                ? "#333"
                : hovered
                  ? "#222"
                  : "#111"
              : pressed
                ? "#f1f1f1"
                : hovered
                  ? "#fafafa"
                  : "#fff",
          alignItems: "center",
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <Text
          style={{
            fontWeight: "900",
            color: tab === "posts" ? "#fff" : "#111",
          }}
        >
          📣
        </Text>
      </Pressable>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      {/* ================= ÜST PROFİL KARTI ================= */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#eee",
          borderRadius: 18,
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        {/* Üst renkli alan / mini cover */}
        <View
          style={{
            height: 58,
            backgroundColor: "#111",
          }}
        />

        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            marginTop: -22,
            gap: 14,
          }}
        >
          {/* Avatar + isim */}
          <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
            <Pressable
              style={({ pressed, hovered }) => ({
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: pressed ? "#333" : hovered ? "#222" : "#111",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: "#fff",
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>
                {getInitials(user?.name)}
              </Text>
            </Pressable>

            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 22, fontWeight: "900", color: "#111" }}>
                {user?.name ?? "Misafir"}
              </Text>

              <Text style={{ color: "#666", lineHeight: 20 }}>
                Kitaplarını takip ediyor, paylaşımlar yapıyor ve okuma
                hedeflerini yönetiyorsun.
              </Text>
            </View>
          </View>

          {/* Seviye rozeti */}
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#ddd",
              backgroundColor: "#fafafa",
            }}
          >
            <Text style={{ fontWeight: "800", color: "#333" }}>
              {readerLevel.icon} {readerLevel.label}
            </Text>
          </View>

          <Text style={{ color: "#666", lineHeight: 20 }}>
            {readerLevel.description}
          </Text>

          {/* Küçük rozetler */}
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#ddd",
                backgroundColor: "#fafafa",
              }}
            >
              <Text style={{ fontWeight: "800", color: "#333" }}>
                📚 {userCardSummary.finishedBooks} kitap okundu
              </Text>
            </View>

            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#ddd",
                backgroundColor: "#fafafa",
              }}
            >
              <Text style={{ fontWeight: "800", color: "#333" }}>
                ✍️ {profileSummary.totalPosts} paylaşım
              </Text>
            </View>

            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#ddd",
                backgroundColor: "#fafafa",
              }}
            >
              <Text style={{ fontWeight: "800", color: "#333" }}>
                ❤️ {profileSummary.totalLikes} beğeni
              </Text>
            </View>
          </View>

          {/* Mini kullanıcı özeti */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <StatBox label="Okuyor" value={userCardSummary.readingNow} />
            <StatBox label="Bitti" value={userCardSummary.finishedBooks} />
            <StatBox label="Listemde" value={userCardSummary.wishlistCount} />
          </View>
        </View>
      </View>

      {/* Başlık alanı */}
      <Text style={{ fontSize: 24, fontWeight: "900" }}>Profil</Text>
      <Text style={{ color: "#666" }}>
        {stats.read} kitap okudun · {profileSummary.totalPosts} paylaşım yaptın
      </Text>

      {TabSwitch}

      {/* ================= TAB: STATS ================= */}
      {tab === "stats" && (
        <>
          {!isHydrated ? (
            <Text style={{ color: "#666" }}>Yükleniyor…</Text>
          ) : (
            <>
              {/* Temel kitap istatistikleri */}
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <StatBox label="Toplam Kitap" value={stats.total} />
                  <StatBox label="Okuyorum" value={stats.reading} />
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <StatBox label="Okudum" value={stats.read} />
                  <StatBox label="İstiyorum" value={stats.want} />
                </View>
              </View>

              {/* Profil özeti */}
              <View
                style={{
                  gap: 10,
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 14,
                  padding: 12,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "900" }}>
                  Profil Özeti
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <StatBox label="Paylaşım" value={profileSummary.totalPosts} />
                  <StatBox
                    label="Toplam Yorum"
                    value={profileSummary.totalComments}
                  />
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <StatBox
                    label="Toplam Beğeni"
                    value={profileSummary.totalLikes}
                  />
                  <StatBox
                    label="Tamamlama Oranı"
                    value={`%${profileSummary.completionRate}`}
                  />
                </View>
              </View>

              {/* En çok beğeni alan paylaşım */}
              <View
                style={{
                  gap: 8,
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 14,
                  padding: 12,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "900" }}>
                  En Çok Beğeni Alan Paylaşım
                </Text>

                {!profileSummary.topPost ? (
                  <Text style={{ color: "#666" }}>Henüz paylaşım yok.</Text>
                ) : (
                  <>
                    <Text style={{ fontWeight: "900", color: "#111" }}>
                      {profileSummary.topPost.bookTitle}
                    </Text>

                    <Text style={{ color: "#666" }} numberOfLines={2}>
                      “
                      {profileSummary.topPost.shareText || "Paylaşım metni yok"}
                      ”
                    </Text>

                    <Text style={{ color: "#666" }}>
                      ❤️ {profileSummary.topPost.likes ?? 0} · 💬{" "}
                      {profileSummary.topPost.comments.length}
                    </Text>

                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/post-comments/[id]" as const,
                          params: { id: profileSummary.topPost!.id },
                        })
                      }
                      style={buttonStyle("secondary")}
                    >
                      <Text style={{ fontWeight: "900" }}>Paylaşımı Aç</Text>
                    </Pressable>
                  </>
                )}
              </View>

              {/* Günlük hedef */}
              <View
                style={{
                  gap: 8,
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 14,
                  padding: 12,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "900" }}>
                  Günlük Hedef
                </Text>

                <TextInput
                  value={goalInput}
                  onChangeText={setGoalInput}
                  keyboardType="numeric"
                  placeholder="Örn: 20"
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 12,
                    padding: 10,
                    backgroundColor: "#fff",
                  }}
                />

                <Pressable onPress={onSaveGoal} style={buttonStyle("primary")}>
                  <Text style={{ color: "#fff", fontWeight: "900" }}>
                    Kaydet
                  </Text>
                </Pressable>

                <Text style={{ color: "#666" }}>
                  Şu anki hedef:{" "}
                  <Text style={{ fontWeight: "900" }}>{goal}</Text> sayfa
                </Text>
              </View>

              {/* Günlük okuma ekleme */}
              <View
                style={{
                  gap: 10,
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 14,
                  padding: 12,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "900" }}>
                  Günlük Okuma Ekle
                </Text>

                <Text style={{ fontWeight: "900" }}>Tarih (YYYY-MM-DD)</Text>
                <TextInput
                  value={logDate}
                  onChangeText={setLogDate}
                  placeholder="2026-02-23"
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 12,
                    padding: 10,
                    backgroundColor: "#fff",
                  }}
                />

                <Text style={{ fontWeight: "900" }}>Okunan Sayfa Sayısı</Text>
                <TextInput
                  value={logPages}
                  onChangeText={setLogPages}
                  placeholder="Örn: 35"
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 12,
                    padding: 10,
                    backgroundColor: "#fff",
                  }}
                />

                <Pressable onPress={onManualAdd} style={buttonStyle("primary")}>
                  <Text style={{ color: "#fff", fontWeight: "900" }}>Ekle</Text>
                </Pressable>

                <Text style={{ fontWeight: "900" }}>Hızlı Ekle</Text>

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
                        style={({ pressed, hovered }) => ({
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: active ? "#111" : "#ddd",
                          backgroundColor: active
                            ? pressed
                              ? "#333"
                              : hovered
                                ? "#222"
                                : "#111"
                            : pressed
                              ? "#f1f1f1"
                              : hovered
                                ? "#fafafa"
                                : "#fff",
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                        })}
                      >
                        <Text
                          style={{
                            fontWeight: "900",
                            color: active ? "#fff" : "#111",
                          }}
                        >
                          +{n}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={{ color: "#666" }}>
                  Hızlı ekle butonlarına basınca direkt eklenir.
                </Text>
              </View>

              {/* Haftalık hedef ilerlemesi */}
              <View
                style={{
                  gap: 10,
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 14,
                  padding: 12,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "900" }}>
                  Haftalık Hedef İlerlemesi
                </Text>

                <Text style={{ color: "#666" }}>
                  {weekly.total} / {profileSummary.weeklyGoalTarget} sayfa
                </Text>

                <View
                  style={{
                    width: "100%",
                    height: 10,
                    backgroundColor: "#ececec",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${profileSummary.weeklyGoalPercent}%`,
                      height: "100%",
                      backgroundColor: "#111",
                      borderRadius: 999,
                    }}
                  />
                </View>

                <Text style={{ color: "#666", fontSize: 12 }}>
                  Haftalık hedefin %{profileSummary.weeklyGoalPercent}{" "}
                  tamamlandı.
                </Text>
              </View>

              {/* Bu hafta okuma */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "900" }}>
                  Bu Hafta Okuma
                </Text>

                <StatBox label="Toplam Sayfa" value={weekly.total} />

                {weekly.days.map((d, i) => (
                  <View
                    key={`${d.label}_${i}`}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: 4,
                    }}
                  >
                    <Text>{d.label}</Text>
                    <Text style={{ fontWeight: "900" }}>{d.pages} sayfa</Text>
                  </View>
                ))}
              </View>

              {/* Alt butonlar */}
              <Pressable
                onPress={() => router.push("/add-book")}
                style={buttonStyle("primary")}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  + Kitap Ekle
                </Text>
              </Pressable>

              <Pressable onPress={onClearAll} style={buttonStyle("danger")}>
                <Text style={{ fontWeight: "900", color: "#c00" }}>
                  Tüm Kitapları Sil
                </Text>
              </Pressable>
            </>
          )}
        </>
      )}

      {/* ================= TAB: POSTS ================= */}
      {tab === "posts" && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: "900" }}>Paylaşımlarım</Text>

          {!isHydrated ? (
            <Text style={{ color: "#666" }}>Yükleniyor…</Text>
          ) : myShares.length === 0 ? (
            <Text style={{ color: "#666" }}>
              Henüz paylaşım yok. Kitap detayından “Paylaş” diyebilirsin.
            </Text>
          ) : (
            myShares.map((post) => (
              <View
                key={post.id}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#eee",
                  backgroundColor: "#fff",
                  gap: 8,
                }}
              >
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/post-comments/[id]" as const,
                      params: { id: post.id },
                    })
                  }
                  style={{ gap: 6 }}
                >
                  <Text style={{ fontWeight: "900" }}>{post.bookTitle}</Text>
                  <Text style={{ color: "#666" }}>{post.bookAuthor}</Text>

                  <Text
                    style={{ color: "#444", lineHeight: 20 }}
                    numberOfLines={3}
                  >
                    “{post.shareText || "Paylaşım metni yok"}”
                  </Text>
                </Pressable>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 4,
                  }}
                >
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/share/[id]" as const,
                        params: {
                          id: post.bookId,
                          postId: post.id,
                        },
                      })
                    }
                    style={pillButtonStyle("secondary")}
                  >
                    <Text style={{ fontWeight: "800", color: "#333" }}>
                      Düzenle
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      setConfirmDeleteId((prev) =>
                        prev === post.id ? null : post.id,
                      )
                    }
                    style={pillButtonStyle("danger")}
                  >
                    <Text style={{ fontWeight: "800", color: "#c00" }}>
                      Sil
                    </Text>
                  </Pressable>

                  <View
                    style={{
                      marginLeft: "auto",
                      flexDirection: "row",
                      gap: 12,
                    }}
                  >
                    <Text style={{ color: "#666" }}>❤️ {post.likes}</Text>
                    <Text style={{ color: "#666" }}>
                      💬 {post.comments.length}
                    </Text>
                  </View>
                </View>

                {confirmDeleteId === post.id && (
                  <View
                    style={{
                      marginTop: 6,
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#ffd6d6",
                      backgroundColor: "#fff7f7",
                      gap: 10,
                    }}
                  >
                    <Text style={{ color: "#8b0000", fontWeight: "800" }}>
                      Bu paylaşım silinsin mi?
                    </Text>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <Pressable
                        onPress={() => setConfirmDeleteId(null)}
                        style={buttonStyle("secondary", { flex: 1 })}
                      >
                        <Text style={{ fontWeight: "800", color: "#333" }}>
                          Vazgeç
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleDeletePost(post.id)}
                        style={buttonStyle("primary", {
                          flex: 1,
                          backgroundColor: "#c00",
                        })}
                      >
                        <Text style={{ fontWeight: "800", color: "#fff" }}>
                          Evet, Sil
                        </Text>
                      </Pressable>
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
