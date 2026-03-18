// app/book/[id].tsx

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
import { buttonStyle, pillButtonStyle } from "../../utils/pressableStyles";

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
 * Örn:
 * "1984 " -> "1984"
 * " George Orwell " -> "george orwell"
 */
function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";

  return value.trim().toLocaleLowerCase("tr").replace(/\s+/g, " ");
}

/**
 * Avatar yoksa isimden baş harf çıkarır
 */
function getInitial(name?: string) {
  if (!name?.trim()) return "U";
  return name.trim().charAt(0).toUpperCase();
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
   * Kitabı bul
   */
  const book = id ? getById(id) : undefined;

  /**
   * Kitap bulunamazsa fallback ekranı
   */
  if (!book) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            marginTop: 20,
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 18,
            paddingVertical: 30,
            paddingHorizontal: 20,
            backgroundColor: "#fff",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 40 }}>📚</Text>

          <Text
            style={{
              marginTop: 10,
              fontSize: 18,
              fontWeight: "800",
              color: "#222",
            }}
          >
            Kitap bulunamadı
          </Text>

          <Text
            style={{
              marginTop: 6,
              color: "#666",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Bu kitap silinmiş olabilir veya geçersiz bir bağlantı açılmış
            olabilir.
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={buttonStyle("secondary", { marginTop: 16, minWidth: 120 })}
          >
            <Text style={{ fontWeight: "800" }}>Geri</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  /**
   * Aynı kitaba ait paylaşımları bul
   *
   * Eşleşme mantığı:
   * 1) bookId birebir aynıysa
   * 2) ya da title + author normalize edilince eşleşiyorsa
   * 3) includes ile biraz daha toleranslı davranır
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

      const sameTitleAndAuthor = sameTitle && sameAuthor;

      return sameBookId || sameTitleAndAuthor;
    });

    /**
     * Aynı kullanıcı birden fazla paylaşım yaptıysa
     * sadece en güncel olanı göster
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
   * Kendim dışındaki kullanıcılar
   */
  const otherReaders = useMemo(() => {
    return relatedPeople.filter((person) => person.userId !== CURRENT_USER.id);
  }, [relatedPeople]);

  /**
   * Kitabı sil
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
   * Sohbet ekranına hazır metin de taşınır
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
   * İlgili paylaşımı aç
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
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      {/* ================= KİTAP KARTI ================= */}
      <View
        style={{
          flexDirection: "row",
          gap: 14,
          padding: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
        }}
      >
        <View
          style={{
            width: 100,
            height: 144,
            borderRadius: 14,
            overflow: "hidden",
            backgroundColor: "#f3f3f3",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {book.thumbnail ? (
            <Image
              source={{ uri: book.thumbnail }}
              style={{ width: 100, height: 144 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f1f1f1",
              }}
            >
              <Text style={{ fontSize: 28 }}>📚</Text>
              <Text style={{ fontSize: 11, color: "#777", marginTop: 4 }}>
                No cover
              </Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1, gap: 8 }}>
          <Text
            style={{ fontSize: 22, fontWeight: "900", color: "#1a1a1a" }}
            numberOfLines={3}
          >
            {book.title}
          </Text>

          <Text
            style={{ color: "#666", fontSize: 15, fontWeight: "700" }}
            numberOfLines={2}
          >
            {book.author}
          </Text>

          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#ddd",
              backgroundColor: "#fafafa",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#444" }}>
              {statusLabel[book.status]}
            </Text>
          </View>

          {typeof book.pagesTotal === "number" && book.pagesTotal > 0 ? (
            <Text style={{ color: "#777", fontSize: 12 }}>
              Toplam sayfa: {book.pagesTotal}
            </Text>
          ) : null}
        </View>
      </View>

      {/* ================= KİTAP BİLGİSİ ================= */}
      <View
        style={{
          padding: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
          gap: 8,
        }}
      >
        <Text style={{ fontWeight: "800", color: "#222" }}>Kitap Bilgisi</Text>

        <Text style={{ color: "#555" }}>Durum: {statusLabel[book.status]}</Text>

        {typeof book.pagesTotal === "number" && book.pagesTotal > 0 ? (
          <Text style={{ color: "#555" }}>
            Sayfa: {book.pagesRead ?? 0} / {book.pagesTotal}
          </Text>
        ) : (
          <Text style={{ color: "#777" }}>Sayfa bilgisi eklenmemiş.</Text>
        )}
      </View>

      {/* ================= OKUMA İLERLEMESİ ================= */}
      {book.status === "reading" && (
        <View
          style={{
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#eee",
            backgroundColor: "#fff",
            gap: 12,
          }}
        >
          <Text style={{ fontWeight: "800", color: "#222" }}>
            Okuma İlerlemesi
          </Text>

          <ProgressBar
            pagesRead={book.pagesRead}
            pagesTotal={book.pagesTotal}
          />

          <Text style={{ textAlign: "center", color: "#666" }}>
            %{progressPercent} tamamlandı
          </Text>

          <Pressable
            onPress={addPages}
            disabled={!book.pagesTotal}
            style={buttonStyle("primary", {
              opacity: book.pagesTotal ? 1 : 0.6,
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              +{step} Sayfa Okudum
            </Text>
          </Pressable>
        </View>
      )}

      {/* ================= OKUNDU ALANI ================= */}
      {book.status === "read" && (
        <>
          <View
            style={{
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#eee",
              backgroundColor: "#fff",
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: "800", color: "#222" }}>Puan</Text>

            <Text style={{ color: "#666", fontSize: 16 }}>
              {book.rating && book.rating > 0
                ? "★".repeat(book.rating)
                : "Puan verilmemiş"}
            </Text>
          </View>

          <View
            style={{
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#eee",
              backgroundColor: "#fff",
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: "800", color: "#222" }}>Not</Text>

            <Text style={{ color: "#666", lineHeight: 21 }}>
              {book.note?.trim()?.length ? book.note : "Henüz not eklenmemiş."}
            </Text>
          </View>
        </>
      )}

      {/* ================= OKUMA LİSTESİ ================= */}
      {book.status === "want" && (
        <View
          style={{
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#eee",
            backgroundColor: "#fff",
            gap: 8,
          }}
        >
          <Text style={{ fontWeight: "800", color: "#222" }}>
            Okuma Listesi
          </Text>

          <Text style={{ color: "#666", lineHeight: 21 }}>
            Bu kitap daha sonra okunmak üzere listene eklendi.
          </Text>
        </View>
      )}

      {/* ================= AYNI KİTABI PAYLAŞANLAR ================= */}
      <View
        style={{
          padding: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
          gap: 10,
        }}
      >
        <Text style={{ fontWeight: "800", color: "#222" }}>
          Bu Kitabı Paylaşanlar
        </Text>

        {relatedPeople.length === 0 ? (
          <Text style={{ color: "#666", lineHeight: 21 }}>
            Bu kitapla ilgili henüz topluluk paylaşımı bulunamadı.
          </Text>
        ) : (
          <>
            <Text style={{ color: "#666", lineHeight: 21 }}>
              Toplulukta bu kitapla ilgili {relatedPeople.length} kullanıcı
              paylaşım yapmış.
            </Text>

            {otherReaders.length === 0 ? (
              <Text style={{ color: "#666", lineHeight: 21 }}>
                Şu an yalnızca senin paylaşımın görünüyor.
              </Text>
            ) : (
              otherReaders.map((person) => (
                <View
                  key={person.userId}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#eee",
                    backgroundColor: "#fafafa",
                    gap: 10,
                  }}
                >
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
                          width: 42,
                          height: 42,
                          borderRadius: 21,
                          backgroundColor: "#f1f1f1",
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 21,
                          backgroundColor: "#e5e7eb",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontWeight: "800", color: "#374151" }}>
                          {getInitial(person.userName)}
                        </Text>
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "800", color: "#111" }}>
                        {person.userName}
                      </Text>

                      <Text
                        style={{ color: "#666", fontSize: 13, lineHeight: 18 }}
                        numberOfLines={2}
                      >
                        “{person.latestShareText || "Paylaşım metni yok"}”
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <Pressable
                      onPress={() => handleMessageReader(person)}
                      style={pillButtonStyle("secondary")}
                    >
                      <Text style={{ fontWeight: "800" }}>✉️ Mesaj Gönder</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleOpenRelatedPost(person.latestPostId)}
                      style={pillButtonStyle("secondary")}
                    >
                      <Text style={{ fontWeight: "800" }}>📣 Paylaşımı Aç</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </View>

      {/* ================= AKSİYONLAR ================= */}
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/edit-book/[id]" as const,
            params: { id: book.id },
          })
        }
        style={buttonStyle("secondary")}
      >
        <Text style={{ fontWeight: "900" }}>Düzenle</Text>
      </Pressable>

      <Pressable onPress={cycleStatus} style={buttonStyle("primary")}>
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          Durumu Değiştir
        </Text>
      </Pressable>

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/share/[id]" as const,
            params: { id: book.id },
          })
        }
        style={buttonStyle("primary")}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>Paylaş</Text>
      </Pressable>

      <Pressable onPress={confirmDelete} style={buttonStyle("danger")}>
        <Text style={{ fontWeight: "900", color: "#c00" }}>Kitabı Sil</Text>
      </Pressable>

      <Pressable onPress={() => router.back()} style={buttonStyle("secondary")}>
        <Text style={{ fontWeight: "900" }}>Geri</Text>
      </Pressable>
    </ScrollView>
  );
}
