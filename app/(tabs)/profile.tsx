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
import { useReadingGoal } from "../../context/ReadingGoalContext";
import type { ReadingLogItem } from "../../context/ReadingLogContext";
import { useReadingLog } from "../../context/ReadingLogContext";
import { useUser } from "../../context/UserContext";

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

/** YYYY-MM-DD */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

type TabKey = "stats" | "posts";

export default function Profile() {
  const { books, isHydrated, clearAll } = useBooks();
  const { goal, setGoal } = useReadingGoal();
  const { user } = useUser();
  const { logs, addLog } = useReadingLog();

  /** Sekme: stats / posts */
  const [tab, setTab] = useState<TabKey>("stats");

  /** Günlük hedef input */
  const [goalInput, setGoalInput] = useState<string>(String(goal ?? 0));

  /** Log inputları */
  const [logDate, setLogDate] = useState<string>(todayKey());
  const [logPages, setLogPages] = useState<string>("");

  /** Hızlı ekle butonları */
  const steps = [10, 20, 30, 40, 50];
  const [step, setStep] = useState<number>(10);

  /**
   * Yardımcı: belirli bir günün toplam sayfası
   */
  const getTotalForDate = (dateKey: string) => {
    return logs
      .filter((l: ReadingLogItem) => l.date === dateKey)
      .reduce((sum: number, l: ReadingLogItem) => sum + (l.pages ?? 0), 0);
  };

  /**
   * Günlük hedef kontrol:
   * Aynı gün içinde hedef ilk kez geçilince uyarı ver
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
   * ✅ Hızlı ekle:
   * Chip'e basınca direkt n sayfa ekler.
   * (Burada parametre var -> senin hatayı çözüyor)
   */
  const onQuickAdd = (n: number) => {
    const dateKey = logDate.trim();

    if (!dateKey || dateKey.length !== 10) {
      Alert.alert("Hata", "Tarih formatı: YYYY-MM-DD olmalı. Örn: 2026-02-23");
      return;
    }

    const pages = Number(n) || 0;
    if (pages <= 0) return;

    // hedef bildirim kontrol
    maybeNotifyGoalReached(dateKey, pages);

    // log’a ekle
    addLog(pages, dateKey);

    Alert.alert("✅ Eklendi", `${dateKey} için +${pages} sayfa eklendi.`);
  };

  /**
   * ✅ Manuel ekle:
   * Input'taki sayfa sayısını ekler
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
   * Haftalık okuma hesabı (son 7 gün)
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
   * Normal istatistik
   */
  const stats = useMemo(() => {
    const total = books.length;
    const reading = books.filter((b) => b.status === "reading").length;
    const read = books.filter((b) => b.status === "read").length;
    const want = books.filter((b) => b.status === "want").length;
    return { total, reading, read, want };
  }, [books]);

  /**
   * Paylaşımlarım
   */
  const myShares = useMemo(() => {
    return books
      .filter((b) => typeof b.sharedAt === "number")
      .sort((a, b) => (b.sharedAt ?? 0) - (a.sharedAt ?? 0));
  }, [books]);

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
      { text: "Sil", style: "destructive", onPress: async () => clearAll() },
    ]);
  };

  /**
   * Sekme switch (ikonlar)
   */
  const TabSwitch = (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <Pressable
        onPress={() => setTab("stats")}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: tab === "stats" ? "#111" : "#ddd",
          backgroundColor: tab === "stats" ? "#111" : "#fff",
          alignItems: "center",
        }}
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
        style={{
          flex: 1,
          paddingVertical: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: tab === "posts" ? "#111" : "#ddd",
          backgroundColor: tab === "posts" ? "#111" : "#fff",
          alignItems: "center",
        }}
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
      <Text style={{ fontSize: 18 }}>👋 {user?.name ?? "Misafir"}</Text>
      <Text style={{ fontSize: 24, fontWeight: "900" }}>Profil</Text>

      {TabSwitch}

      {/* ================= TAB 1: STATS ================= */}
      {tab === "stats" && (
        <>
          {!isHydrated ? (
            <Text style={{ color: "#666" }}>Yükleniyor…</Text>
          ) : (
            <>
              {/* İstatistikler */}
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

                <Pressable
                  onPress={onSaveGoal}
                  style={{
                    backgroundColor: "#111",
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900" }}>
                    Kaydet
                  </Text>
                </Pressable>

                <Text style={{ color: "#666" }}>
                  Şu anki hedef:{" "}
                  <Text style={{ fontWeight: "900" }}>{goal}</Text> sayfa
                </Text>
              </View>

              {/* Günlük okuma ekle (tek kutu) */}
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

                {/* Tarih */}
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

                {/* Manuel */}
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

                <Pressable
                  onPress={onManualAdd}
                  style={{
                    backgroundColor: "#111",
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900" }}>Ekle</Text>
                </Pressable>

                {/* Hızlı ekle */}
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
                          // sadece UI için seçiliyi göster
                          setStep(n);
                          // ve direkt o sayıyı ekle
                          onQuickAdd(n);
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: active ? "#111" : "#ddd",
                          backgroundColor: active ? "#111" : "#fff",
                        }}
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

              {/* Haftalık okuma */}
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

              {/* Nav */}
              <Pressable
                onPress={() => router.push("/add-book")}
                style={{
                  backgroundColor: "#111",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  + Kitap Ekle
                </Text>
              </Pressable>

              <Pressable
                onPress={onClearAll}
                style={{
                  marginTop: 10,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#ffdddd",
                }}
              >
                <Text style={{ fontWeight: "900", color: "#c00" }}>
                  Tüm Kitapları Sil
                </Text>
              </Pressable>
            </>
          )}
        </>
      )}

      {/* ================= TAB 2: POSTS ================= */}
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
            myShares.map((b) => (
              <Pressable
                key={b.id}
                onPress={() =>
                  router.push({
                    pathname: "/book/[id]" as const,
                    params: { id: b.id },
                  })
                }
                style={{
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#eee",
                  backgroundColor: "#fff",
                  gap: 6,
                }}
              >
                <Text style={{ fontWeight: "900" }}>{b.title}</Text>
                <Text style={{ color: "#666" }}>{b.author}</Text>

                <Text style={{ color: "#666" }} numberOfLines={3}>
                  “{b.shareText ?? "Paylaşım metni yok"}”
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "#666" }}>❤️ {b.likes ?? 0}</Text>
                  <Text style={{ color: "#666" }}>
                    💬 {b.comments?.length ?? 0}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}
