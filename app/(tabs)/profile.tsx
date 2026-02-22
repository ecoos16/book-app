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
import type { ReadingLogItem } from "../../context/ReadingLogContext"; // ✅ type import
import { useReadingLog } from "../../context/ReadingLogContext";
import { useUser } from "../../context/UserContext";

/**
 * Basit istatistik kutusu bileşeni
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

export default function Profile() {
  /**
   * GLOBAL STATE
   */
  const { books, isHydrated, clearAll } = useBooks();
  const { goal } = useReadingGoal();
  const { user } = useUser();

  // ✅ Haftalık okuma logları + log ekleme fonksiyonu
  const { logs, addLog } = useReadingLog();

  /**
   * ------------------------------------------------
   * ✅ GÜNLÜK OKUMA GİRİŞİ (MANUEL)
   * ------------------------------------------------
   * logDate: hangi güne yazacağım? (default: bugün)
   * logPages: kaç sayfa?
   */
  const [logDate, setLogDate] = useState<string>(
    new Date().toISOString().slice(0, 10), // "YYYY-MM-DD"
  );
  const [logPages, setLogPages] = useState<string>("");

  /**
   * ------------------------------------------------
   * HAFTALIK OKUMA HESABI
   * ------------------------------------------------
   */
  const weekly = useMemo(() => {
    const today = new Date();
    const labels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cts", "Paz"];
    const days: { label: string; pages: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);

      // "YYYY-MM-DD"
      const key = d.toISOString().slice(0, 10);

      // ✅ Gün toplamı
      const dayTotal = logs
        .filter((l: ReadingLogItem) => l.date === key)
        .reduce((sum: number, l: ReadingLogItem) => sum + l.pages, 0);

      // JS getDay(): 0=Pazar ... 6=Cumartesi
      // Bizim labels: 0=Pzt ... 6=Paz
      const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;

      days.push({
        label: labels[idx],
        pages: dayTotal,
      });
    }

    const total = days.reduce(
      (s: number, d: { label: string; pages: number }) => s + d.pages,
      0,
    );

    return { days, total };
  }, [logs]);

  /**
   * ------------------------------------------------
   * NORMAL İSTATİSTİKLER
   * ------------------------------------------------
   */
  const stats = useMemo(() => {
    const total = books.length;
    const reading = books.filter((b) => b.status === "reading").length;
    const read = books.filter((b) => b.status === "read").length;
    const want = books.filter((b) => b.status === "want").length;

    const rated = books.filter(
      (b) => typeof b.rating === "number" && (b.rating ?? 0) > 0,
    );

    const avgRating =
      rated.length === 0
        ? null
        : Math.round(
            (rated.reduce((sum: number, b) => sum + (b.rating ?? 0), 0) /
              rated.length) *
              10,
          ) / 10;

    return { total, reading, read, want, avgRating };
  }, [books]);

  /**
   * ✅ Günlük okuma ekle butonu
   */
  const onAddDailyLog = () => {
    const pages = Number(logPages) || 0;

    if (!logDate.trim() || logDate.trim().length !== 10) {
      Alert.alert("Hata", "Tarih formatı: YYYY-MM-DD olmalı. Örn: 2026-02-22");
      return;
    }

    if (pages <= 0) {
      Alert.alert("Hata", "Sayfa sayısı 1 veya daha büyük olmalı.");
      return;
    }

    // ✅ seçilen güne ekle (aynı gün varsa birleştirecek şekilde context yazdık)
    addLog(pages, logDate.trim());

    setLogPages("");
    Alert.alert("✅ Eklendi", `${logDate.trim()} için ${pages} sayfa eklendi.`);
  };

  /**
   * TÜM KİTAPLARI SİL
   */
  const onClearAll = () => {
    Alert.alert("Tüm kitaplar silinsin mi?", "Bu işlem geri alınamaz.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: async () => clearAll() },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      {/* 👤 kullanıcı */}
      <Text style={{ fontSize: 18 }}>👋 {user.name}</Text>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Profil</Text>

      {/* ------------------------------------------------ */}
      {/* NORMAL İSTATİSTİK */}
      {/* ------------------------------------------------ */}
      {!isHydrated ? (
        <Text style={{ color: "#666" }}>Yükleniyor…</Text>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <StatBox label="Toplam Kitap" value={stats.total} />
            <StatBox label="Okuyorum" value={stats.reading} />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <StatBox label="Okudum" value={stats.read} />
            <StatBox label="İstiyorum" value={stats.want} />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <StatBox label="Ortalama Puan" value={stats.avgRating ?? "Yok"} />
            <StatBox label="Günlük Hedef" value={`${goal} sayfa`} />
          </View>
        </>
      )}

      {/* ------------------------------------------------ */}
      {/* ✅ GÜNLÜK OKUMA GİR (MANUEL) */}
      {/* ------------------------------------------------ */}
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
          Günlük Okuma Ekle
        </Text>

        {/* Tarih */}
        <Text style={{ fontWeight: "700" }}>Tarih (YYYY-MM-DD)</Text>
        <TextInput
          value={logDate}
          onChangeText={setLogDate}
          placeholder="2026-02-22"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 10,
            backgroundColor: "#fff",
          }}
        />

        {/* Sayfa */}
        <Text style={{ fontWeight: "700" }}>Okunan Sayfa</Text>
        <TextInput
          value={logPages}
          onChangeText={setLogPages}
          placeholder="Örn: 20"
          keyboardType="numeric"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 10,
            backgroundColor: "#fff",
          }}
        />

        {/* Ekle */}
        <Pressable
          onPress={onAddDailyLog}
          style={{
            backgroundColor: "#111",
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 6,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>Ekle</Text>
        </Pressable>
      </View>

      {/* ------------------------------------------------ */}
      {/* ✅ HAFTALIK OKUMA */}
      {/* ------------------------------------------------ */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "900" }}>Bu Hafta Okuma</Text>

        <StatBox label="Toplam Sayfa" value={weekly.total} />

        {weekly.days.map((d: { label: string; pages: number }, i: number) => (
          <View
            key={`${d.label}_${i}`}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 4,
            }}
          >
            <Text>{d.label}</Text>
            <Text style={{ fontWeight: "700" }}>{d.pages} sayfa</Text>
          </View>
        ))}
      </View>

      {/* ------------------------------------------------ */}
      {/* NAV */}
      {/* ------------------------------------------------ */}
      <Pressable
        onPress={() => router.push("/add-book")}
        style={{
          backgroundColor: "#111",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>+ Kitap Ekle</Text>
      </Pressable>

      <Pressable
        style={{ padding: 14, backgroundColor: "#eee", borderRadius: 10 }}
        onPress={() => router.push("/lists/reading")}
      >
        <Text>Okuyorum</Text>
      </Pressable>

      <Pressable
        style={{ padding: 14, backgroundColor: "#eee", borderRadius: 10 }}
        onPress={() => router.push("/lists/read")}
      >
        <Text>Okudum</Text>
      </Pressable>

      <Pressable
        style={{ padding: 14, backgroundColor: "#eee", borderRadius: 10 }}
        onPress={() => router.push("/lists/want")}
      >
        <Text>Okumak İstiyorum</Text>
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
    </ScrollView>
  );
}
