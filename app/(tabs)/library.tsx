// app/(tabs)/library.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useBooks } from "../../context/BooksContext";

/**
 * ReadSphere renk paleti
 * Stitch tasarımındaki sıcak ve editorial hisse yakın tonlar
 */
const COLORS = {
  bg: "#fbf9f5",
  card: "#fffdf9",
  border: "#ece7df",
  text: "#2f2a24",
  muted: "#7a7268",
  primary: "#7d5739",
  primarySoft: "#f3e2d2",
  greenSoft: "#dfe7cf",
  peachSoft: "#f7dfcc",
  graySoft: "#f3efe8",
};

/**
 * Kategori kartı için icon tipleri
 */
type LibraryCardIcon = keyof typeof Ionicons.glyphMap;

/**
 * Kitaplıkta kullanılan kategori kartı
 *
 * Her kart:
 * - bir kategori başlığı gösterir
 * - alt açıklama içerir
 * - kaç kitap olduğunu badge ile gösterir
 * - basılabilir görünür
 */
function LibrarySectionCard({
  title,
  subtitle,
  count,
  icon,
  iconBg,
  onPress,
}: {
  title: string;
  subtitle: string;
  count: number;
  icon: LibraryCardIcon;
  iconBg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }) => ({
        padding: 18,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: pressed
          ? "#f6f1ea"
          : hovered
            ? "#fffaf4"
            : COLORS.card,
        gap: 12,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        shadowColor: "#2f2a24",
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
      })}
    >
      {/* Üst satır: ikon + badge */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={20} color={COLORS.primary} />
        </View>

        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 999,
            backgroundColor: COLORS.graySoft,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              fontWeight: "800",
              color: COLORS.text,
              fontSize: 12,
            }}
          >
            {count} kitap
          </Text>
        </View>
      </View>

      {/* Başlıklar */}
      <View style={{ gap: 6 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: COLORS.text,
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            color: COLORS.muted,
            lineHeight: 20,
            fontSize: 14,
          }}
        >
          {subtitle}
        </Text>
      </View>

      {/* Alt satır: dokunma yönlendirmesi */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 2,
        }}
      >
        <Text
          style={{
            color: COLORS.primary,
            fontWeight: "800",
            fontSize: 13,
          }}
        >
          Listeyi aç
        </Text>

        <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
      </View>
    </Pressable>
  );
}

/**
 * Kitaplık ekranı
 *
 * Bu ekran:
 * - kullanıcının kitaplarını 3 ana kategoriye ayırır
 * - okuyorum / okudum / istiyorum mantığını korur
 * - Stitch tasarımındaki premium sıcaklığı taşır
 */
export default function Library() {
  const { books, isHydrated } = useBooks();

  /**
   * Kategori bazlı kitap sayıları
   */
  const counts = useMemo(() => {
    return {
      reading: books.filter((b) => b.status === "reading").length,
      read: books.filter((b) => b.status === "read").length,
      want: books.filter((b) => b.status === "want").length,
    };
  }, [books]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{
        padding: 18,
        gap: 16,
        paddingBottom: 120,
      }}
    >
      {/* ================= ÜST BAŞLIK ================= */}
      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 30,
            fontWeight: "900",
            color: COLORS.primary,
          }}
        >
          Kitaplık
        </Text>

        <Text
          style={{
            color: COLORS.muted,
            lineHeight: 22,
            fontSize: 15,
          }}
        >
          Kitaplarını durumlarına göre düzenle, takip et ve okuma yolculuğunu
          daha görünür hale getir.
        </Text>
      </View>

      {/* ================= LOADING ================= */}
      {!isHydrated ? (
        <View
          style={{
            padding: 18,
            borderRadius: 18,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ color: COLORS.muted, fontSize: 15 }}>Yükleniyor…</Text>
        </View>
      ) : (
        <>
          {/* ================= OKUYORUM ================= */}
          <LibrarySectionCard
            title="Okuyorum"
            subtitle="Şu anda aktif olarak devam ettiğin kitaplar burada."
            count={counts.reading}
            icon="book-outline"
            iconBg={COLORS.peachSoft}
            onPress={() => router.push("/lists/reading")}
          />

          {/* ================= OKUDUM ================= */}
          <LibrarySectionCard
            title="Okudum"
            subtitle="Bitirdiğin, puanladığın veya not aldığın kitaplar."
            count={counts.read}
            icon="checkmark-done-outline"
            iconBg={COLORS.greenSoft}
            onPress={() => router.push("/lists/read")}
          />

          {/* ================= İSTİYORUM ================= */}
          <LibrarySectionCard
            title="İstiyorum"
            subtitle="Daha sonra okumak için kaydettiğin kitap listesi."
            count={counts.want}
            icon="star-outline"
            iconBg={COLORS.graySoft}
            onPress={() => router.push("/lists/want")}
          />
        </>
      )}

      {/* ================= YENİ KİTAP EKLE ================= */}
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/add-book",
            params: { status: "want" },
          })
        }
        style={({ pressed, hovered }) => ({
          marginTop: 6,
          backgroundColor: pressed
            ? "#6b4c33"
            : hovered
              ? "#8a6240"
              : COLORS.primary,
          paddingVertical: 16,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          shadowColor: "#2f2a24",
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 3,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        })}
      >
        <Ionicons name="add" size={20} color="#fff7f4" />
        <Text
          style={{
            color: "#fff7f4",
            fontWeight: "900",
            fontSize: 15,
          }}
        >
          Yeni Kitap Ekle
        </Text>
      </Pressable>
    </ScrollView>
  );
}
