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
import type { ReadingLogItem } from "../../context/ReadingLogContext"; // ✅ type import (var)
import { useReadingLog } from "../../context/ReadingLogContext";
import { useUser } from "../../context/UserContext";

/**
 * ✅ Basit istatistik kutusu
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
 * ✅ Chip (profilde step seçimi için)
 */
function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? "#111" : "#ddd",
        backgroundColor: active ? "#111" : "#fff",
      }}
    >
      <Text style={{ color: active ? "#fff" : "#111", fontWeight: "800" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Profile() {
  /**
   * GLOBAL STATE
   */
  const { books, isHydrated, clearAll } = useBooks();

  // ✅ goal + step + setStep aldık (kişiye özel buton)
  const { goal, setGoal, step, setStep } = useReadingGoal();
  const { user } = useUser();

  // ✅ Haftalık loglar + manuel ekleme
  const { logs, addLog } = useReadingLog();

  /**
   * ✅ Günlük okuma manuel giriş
   */
  const [logDate, setLogDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [logPages, setLogPages] = useState<string>("");
  /**
   * ✅ Goal edit (kullanıcı hedefini değiştirecek)
   * goalInput: input text
   */
  const [goalInput, setGoalInput] = useState<string>(String(goal));

  /**
   * ✅ goal değişirse input da güncellensin (storage yüklenince vs.)
   */
  React.useEffect(() => {
    setGoalInput(String(goal));
  }, [goal]);
  /**
   * ✅ Haftalık okuma hesabı (son 7 gün)
   */
  const weekly = useMemo(() => {
    const today = new Date();
    const labels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cts", "Paz"];
    const days: { label: string; pages: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);

      const key = d.toISOString().slice(0, 10); // "YYYY-MM-DD"

      const dayTotal = logs
        .filter((l: ReadingLogItem) => l.date === key)
        .reduce((sum: number, l: ReadingLogItem) => sum + l.pages, 0);

      const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;

      days.push({
        label: labels[idx],
        pages: dayTotal,
      });
    }

    const total = days.reduce((s: number, d) => s + d.pages, 0);

    return { days, total };
  }, [logs]);

  /**
   * ✅ Normal istatistikler
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
   * ✅ Manuel log ekle
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

    // ✅ seçilen güne ekle
    addLog(pages, logDate.trim());

    setLogPages("");
    Alert.alert("✅ Eklendi", `${logDate.trim()} için ${pages} sayfa eklendi.`);
  };

  /**
   * ✅ Tüm kitapları sil
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
      {/* ✅ NORMAL İSTATİSTİK */}
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

          {/* ✅ Günlük hedef düzenleme */}
          <View
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#eee",
              borderRadius: 14,
              padding: 12,
              backgroundColor: "#fff",
              gap: 8,
            }}
          >
            <Text style={{ color: "#666", fontWeight: "700", fontSize: 12 }}>
              Günlük Hedef
            </Text>

            {/* Input */}
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="Örn: 20"
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: "#fff",
                fontWeight: "800",
              }}
            />

            {/* Kaydet */}
            <Pressable
              onPress={() => {
                const n = Number(goalInput);
                if (!Number.isFinite(n) || n <= 0) {
                  Alert.alert("Hata", "Hedef 1 veya daha büyük olmalı.");
                  return;
                }
                setGoal(Math.round(n));
                Alert.alert(
                  "✅ Kaydedildi",
                  `Günlük hedef: ${Math.round(n)} sayfa`,
                );
              }}
              style={{
                backgroundColor: "#111",
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Kaydet</Text>
            </Pressable>

            {/* Bilgi */}
            <Text style={{ color: "#666", fontSize: 12 }}>
              Şu anki hedef: <Text style={{ fontWeight: "900" }}>{goal}</Text>{" "}
              sayfa
            </Text>
          </View>
        </>
      )}

      {/* ------------------------------------------------ */}
      {/* ✅ KİŞİYE ÖZEL STEP SEÇİMİ */}
      {/* ------------------------------------------------ */}
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
          Hızlı Ekle Butonu
        </Text>
        <Text style={{ color: "#666" }}>
          Kitap detay ekranındaki “+X sayfa okudum” butonu senin seçtiğin değere
          göre değişir.
        </Text>

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {[10, 20, 30, 40, 50].map((n) => (
            <Chip
              key={n}
              label={`+${n}`}
              active={step === n}
              onPress={() => setStep(n)}
            />
          ))}
        </View>

        <Text style={{ color: "#666" }}>
          Seçili: <Text style={{ fontWeight: "900" }}>{step}</Text> sayfa
        </Text>
      </View>

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
