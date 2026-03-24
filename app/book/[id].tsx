// app/book/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";

import { ProgressBar } from "../../components/ProgressBar";
import { useBooks } from "../../context/BooksContext";
import { useChat } from "../../context/ChatContext";
import { usePosts } from "../../context/PostsContext";
import { useReadingGoal } from "../../context/ReadingGoalContext";
import { useReadingLog } from "../../context/ReadingLogContext";
import { CURRENT_USER } from "../../data/mockUsers";
import type { BookStatus } from "../../types/book";

/**
 * ReadSphere ortak renk paleti
 * Home / Library / Profile / Chat ile aynı tasarım dilini korur.
 */
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
  whiteSoft: "#fff7f4",
  dangerSoft: "#fff4f4",
  dangerBorder: "#ffd8d8",
  dangerText: "#a22b2b",
};

/**
 * Kitap durum etiketleri
 */
const statusLabel: Record<BookStatus, string> = {
  reading: "Okuyorum",
  read: "Okudum",
  want: "İstiyorum",
};

/**
 * Metni daha güvenli karşılaştırmak için normalize eder
 */
function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";

  return value.trim().toLocaleLowerCase("tr").replace(/\s+/g, " ");
}

/**
 * Avatar yoksa isimden ilk harf çıkarır
 */
function getInitial(name?: string) {
  if (!name?.trim()) return "U";
  return name.trim().charAt(0).toUpperCase();
}

/**
 * Ortak section kartı
 */
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
        gap: 12,
      }}
    >
      <Text
        style={{
          fontWeight: "900",
          color: COLORS.text,
          fontSize: 17,
        }}
      >
        {title}
      </Text>

      {children}
    </View>
  );
}

/**
 * Yumuşak pill buton
 */
function SoftPillButton({
  label,
  icon,
  onPress,
  variant = "secondary",
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "secondary" | "primary" | "danger";
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
      ? COLORS.whiteSoft
      : variant === "danger"
        ? COLORS.dangerText
        : COLORS.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 999,
        borderWidth: 1,
        borderColor,
        backgroundColor: pressed
          ? variant === "primary"
            ? COLORS.primaryDark
            : "#ece6dc"
          : backgroundColor,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
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

export default function BookDetail() {
  /**
   * Route parametresi
   */
  const { id } = useLocalSearchParams<{ id: string }>();

  /**
   * Context verileri
   */
  const { getById, removeBook, updateBook } = useBooks();
  const { posts } = usePosts();
  const { getOrCreateConversationByParticipant } = useChat();
  const { step } = useReadingGoal();
  const { addLog } = useReadingLog();

  /**
   * İlgili kitabı bul
   */
  const book = id ? getById(id) : undefined;

  /**
   * Kitap bulunamazsa güvenli boş durum
   */
  if (!book) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 16 }}
      >
        <View
          style={{
            marginTop: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 24,
            paddingVertical: 32,
            paddingHorizontal: 22,
            backgroundColor: COLORS.card,
            alignItems: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: COLORS.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="book-outline" size={28} color={COLORS.primary} />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: COLORS.text,
            }}
          >
            Kitap bulunamadı
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              textAlign: "center",
              lineHeight: 21,
            }}
          >
            Bu kitap silinmiş olabilir veya geçersiz bir bağlantı açılmış
            olabilir.
          </Text>

          <View style={{ marginTop: 8, minWidth: 140 }}>
            <SoftPillButton
              label="Geri"
              icon="arrow-back-outline"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  /**
   * Aynı kitaba ait paylaşım yapan kullanıcıları bul
   */
  const relatedPeople = useMemo(() => {
    const normalizedBookTitle = normalizeText(book.title);
    const normalizedBookAuthor = normalizeText(book.author);

    const matchingPosts = posts.filter((post) => {
      const sameBookId = post.bookId === book.id;

      const normalizedPostTitle = normalizeText(post.bookTitle);
      const normalizedPostAuthor = normalizeText(post.bookAuthor);

      const sameTitle =
        normalizedPostTitle === normalizedBookTitle ||
        normalizedPostTitle.includes(normalizedBookTitle) ||
        normalizedBookTitle.includes(normalizedPostTitle);

      const sameAuthor =
        normalizedPostAuthor === normalizedBookAuthor ||
        normalizedPostAuthor.includes(normalizedBookAuthor) ||
        normalizedBookAuthor.includes(normalizedPostAuthor);

      return sameBookId || (sameTitle && sameAuthor);
    });

    /**
     * Aynı kişi birden fazla paylaşım yaptıysa
     * en yeni paylaşımı temsilci olarak tut
     */
    const uniqueUsersMap = new Map<
      string,
      {
        userId: string;
        userName: string;
        userAvatar?: string;
        latestPostId: string;
        latestShareText: string;
        latestCreatedAt: number;
      }
    >();

    matchingPosts.forEach((post) => {
      const existing = uniqueUsersMap.get(post.userId);

      if (!existing || post.createdAt > existing.latestCreatedAt) {
        uniqueUsersMap.set(post.userId, {
          userId: post.userId,
          userName: post.userName,
          userAvatar: post.userAvatar,
          latestPostId: post.id,
          latestShareText: post.shareText,
          latestCreatedAt: post.createdAt,
        });
      }
    });

    return Array.from(uniqueUsersMap.values()).sort(
      (a, b) => b.latestCreatedAt - a.latestCreatedAt,
    );
  }, [book.id, book.title, book.author, posts]);

  /**
   * Kendim dışındaki okurlar
   */
  const otherReaders = useMemo(() => {
    return relatedPeople.filter((person) => person.userId !== CURRENT_USER.id);
  }, [relatedPeople]);

  /**
   * Kitabı silme onayı
   */
  const confirmDelete = () => {
    Alert.alert("Kitabı sil", `"${book.title}" silinecek. Emin misin?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          removeBook(book.id);
          router.back();
        },
      },
    ]);
  };

  /**
   * Durumu sırayla değiştir
   * reading -> read -> want -> reading
   */
  const cycleStatus = () => {
    const next: BookStatus =
      book.status === "reading"
        ? "read"
        : book.status === "read"
          ? "want"
          : "reading";

    if (next === "reading") {
      updateBook(book.id, {
        status: "reading",
        rating: undefined,
        note: undefined,
        pagesRead: book.pagesRead ?? 0,
      });
      return;
    }

    if (next === "read") {
      updateBook(book.id, {
        status: "read",
        pagesRead:
          typeof book.pagesTotal === "number" && book.pagesTotal > 0
            ? book.pagesTotal
            : book.pagesRead,
      });
      return;
    }

    updateBook(book.id, {
      status: "want",
      rating: undefined,
      note: undefined,
      pagesRead: undefined,
    });
  };

  /**
   * Hızlı sayfa ekleme
   */
  const addPages = () => {
    if (book.status !== "reading") return;
    if (!book.pagesTotal || book.pagesTotal <= 0) return;

    const current = book.pagesRead ?? 0;

    if (current >= book.pagesTotal) {
      Alert.alert(
        "Tamamlandı",
        "Bu kitap için tüm sayfalar zaten işaretlenmiş.",
      );
      return;
    }

    const next = Math.min(current + step, book.pagesTotal);
    const diff = next - current;

    if (diff <= 0) return;

    updateBook(book.id, { pagesRead: next });
    addLog(diff);
  };

  /**
   * Bu kitabı paylaşan kullanıcıya mesaj gönder
   */
  const handleMessageReader = (person: {
    userId: string;
    userName: string;
    userAvatar?: string;
  }) => {
    const conversationId = getOrCreateConversationByParticipant({
      id: person.userId,
      name: person.userName,
      avatar: person.userAvatar,
    });

    const prefillText = `${
      book.title || "Bu kitap"
    } hakkında paylaşımını gördüm, konuşmak istedim.`;

    router.push({
      pathname: "/chat/[id]",
      params: {
        id: conversationId,
        prefill: prefillText,
      },
    });
  };

  /**
   * İlgili paylaşım ekranına git
   */
  const handleOpenRelatedPost = (postId: string) => {
    router.push({
      pathname: "/post-comments/[id]" as const,
      params: { id: postId },
    });
  };

  /**
   * İlerleme yüzdesi
   */
  const progressPercent =
    book.pagesTotal && book.pagesTotal > 0
      ? Math.round(((book.pagesRead ?? 0) / book.pagesTotal) * 100)
      : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}
    >
      {/* ================= ÜST KİTAP KARTI ================= */}
      <View
        style={{
          flexDirection: "row",
          gap: 14,
          padding: 16,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
        }}
      >
        {/* Kapak alanı */}
        <View
          style={{
            width: 102,
            height: 148,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: COLORS.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {book.thumbnail ? (
            <Image
              source={{ uri: book.thumbnail }}
              style={{ width: 102, height: 148 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name="book-outline" size={28} color={COLORS.primary} />
              <Text style={{ fontSize: 11, color: COLORS.muted }}>
                Kapak yok
              </Text>
            </View>
          )}
        </View>

        {/* Sağ bilgi alanı */}
        <View style={{ flex: 1, gap: 8 }}>
          <Text
            style={{ fontSize: 24, fontWeight: "900", color: COLORS.text }}
            numberOfLines={3}
          >
            {book.title}
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              fontSize: 15,
              fontWeight: "700",
            }}
            numberOfLines={2}
          >
            {book.author}
          </Text>

          {/* Durum rozeti */}
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.graySoft,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: COLORS.primary,
              }}
            >
              {statusLabel[book.status]}
            </Text>
          </View>

          {typeof book.pagesTotal === "number" && book.pagesTotal > 0 ? (
            <Text style={{ color: COLORS.muted, fontSize: 12 }}>
              Toplam sayfa: {book.pagesTotal}
            </Text>
          ) : null}
        </View>
      </View>

      {/* ================= KİTAP BİLGİSİ ================= */}
      <SectionCard title="Kitap Bilgisi">
        <Text style={{ color: COLORS.text }}>
          Durum:{" "}
          <Text style={{ fontWeight: "900" }}>{statusLabel[book.status]}</Text>
        </Text>

        {typeof book.pagesTotal === "number" && book.pagesTotal > 0 ? (
          <Text style={{ color: COLORS.muted }}>
            Sayfa: {book.pagesRead ?? 0} / {book.pagesTotal}
          </Text>
        ) : (
          <Text style={{ color: COLORS.muted }}>Sayfa bilgisi eklenmemiş.</Text>
        )}
      </SectionCard>

      {/* ================= OKUMA İLERLEMESİ ================= */}
      {book.status === "reading" && (
        <SectionCard title="Okuma İlerlemesi">
          <ProgressBar
            pagesRead={book.pagesRead}
            pagesTotal={book.pagesTotal}
          />

          <Text style={{ textAlign: "center", color: COLORS.muted }}>
            %{progressPercent} tamamlandı
          </Text>

          <SoftPillButton
            label={`+${step} Sayfa Okudum`}
            icon="add-outline"
            onPress={addPages}
            variant="primary"
          />
        </SectionCard>
      )}

      {/* ================= OKUNDU ALANI ================= */}
      {book.status === "read" && (
        <>
          <SectionCard title="Puan">
            <Text style={{ color: COLORS.text, fontSize: 16 }}>
              {book.rating && book.rating > 0
                ? "★".repeat(book.rating)
                : "Puan verilmemiş"}
            </Text>
          </SectionCard>

          <SectionCard title="Not">
            <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
              {book.note?.trim()?.length ? book.note : "Henüz not eklenmemiş."}
            </Text>
          </SectionCard>
        </>
      )}

      {/* ================= WANT ALANI ================= */}
      {book.status === "want" && (
        <SectionCard title="Okuma Listesi">
          <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
            Bu kitap daha sonra okunmak üzere listene eklendi.
          </Text>
        </SectionCard>
      )}

      {/* ================= BU KİTABI PAYLAŞANLAR ================= */}
      <SectionCard title="Bu Kitabı Paylaşanlar">
        {relatedPeople.length === 0 ? (
          <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
            Bu kitapla ilgili henüz topluluk paylaşımı bulunamadı.
          </Text>
        ) : (
          <>
            <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
              Toplulukta bu kitapla ilgili {relatedPeople.length} kullanıcı
              paylaşım yapmış.
            </Text>

            {otherReaders.length === 0 ? (
              <Text style={{ color: COLORS.muted, lineHeight: 22 }}>
                Şu an yalnızca senin paylaşımın görünüyor.
              </Text>
            ) : (
              otherReaders.map((person) => (
                <View
                  key={person.userId}
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.graySoft,
                    gap: 12,
                  }}
                >
                  {/* Kullanıcı satırı */}
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    {person.userAvatar ? (
                      <Image
                        source={{ uri: person.userAvatar }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: COLORS.primarySoft,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: COLORS.primarySoft,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{ fontWeight: "900", color: COLORS.primary }}
                        >
                          {getInitial(person.userName)}
                        </Text>
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "900", color: COLORS.text }}>
                        {person.userName}
                      </Text>

                      <Text
                        style={{
                          color: COLORS.muted,
                          fontSize: 13,
                          lineHeight: 18,
                        }}
                        numberOfLines={2}
                      >
                        “{person.latestShareText || "Paylaşım metni yok"}”
                      </Text>
                    </View>
                  </View>

                  {/* Aksiyonlar */}
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <SoftPillButton
                      label="Mesaj Gönder"
                      icon="mail-outline"
                      onPress={() => handleMessageReader(person)}
                    />

                    <SoftPillButton
                      label="Paylaşımı Aç"
                      icon="chatbubble-ellipses-outline"
                      onPress={() => handleOpenRelatedPost(person.latestPostId)}
                    />
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </SectionCard>

      {/* ================= ALT AKSİYONLAR ================= */}
      <SoftPillButton
        label="Düzenle"
        icon="create-outline"
        onPress={() =>
          router.push({
            pathname: "/edit-book/[id]" as const,
            params: { id: book.id },
          })
        }
      />

      <SoftPillButton
        label="Durumu Değiştir"
        icon="swap-horizontal-outline"
        onPress={cycleStatus}
        variant="primary"
      />

      <SoftPillButton
        label="Paylaş"
        icon="share-social-outline"
        onPress={() =>
          router.push({
            pathname: "/share/[id]" as const,
            params: { id: book.id },
          })
        }
        variant="primary"
      />

      <SoftPillButton
        label="Kitabı Sil"
        icon="trash-outline"
        onPress={confirmDelete}
        variant="danger"
      />

      <SoftPillButton
        label="Geri"
        icon="arrow-back-outline"
        onPress={() => router.back()}
      />
    </ScrollView>
  );
}
