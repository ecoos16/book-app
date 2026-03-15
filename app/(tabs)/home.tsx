import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useBooks } from "../../context/BooksContext";
import { usePosts } from "../../context/PostsContext";
import { CURRENT_USER } from "../../data/mockUsers";
import { buttonStyle, pillButtonStyle } from "../../utils/pressableStyles";

function formatTimeAgo(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "şimdi";
  if (minutes < 60) return `${minutes} dk`;
  if (hours < 24) return `${hours} sa`;
  return `${days} gün`;
}

export default function Home() {
  const { books } = useBooks();
  const { posts, isHydrated, toggleLike, removePost } = usePosts();

  /**
   * Home içinden silme onayı için
   */
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const last3 = useMemo(() => books.slice(0, 3), [books]);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => b.createdAt - a.createdAt);
  }, [posts]);

  const myPosts = useMemo(() => {
    return sortedPosts.filter((p) => p.userId === CURRENT_USER.id);
  }, [sortedPosts]);

  const communityPosts = useMemo(() => {
    return sortedPosts;
  }, [sortedPosts]);

  function getLocalBook(bookId: string) {
    return books.find((b) => b.id === bookId);
  }

  function handleDeletePost(postId: string) {
    removePost(postId);
    setConfirmDeleteId(null);
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 120 }}
      >
        {/* ================= HEADER ================= */}
        <View
          style={{
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#eee",
            backgroundColor: "#fff",
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#111" }}>
            ReadSphere
          </Text>

          <Text style={{ color: "#666", fontSize: 14, lineHeight: 20 }}>
            Kitaplarını keşfet, takip et ve paylaşımlarınla kendi küçük okuma
            dünyanı oluştur.
          </Text>
        </View>

        {/* ================= SEARCH ================= */}
        <Pressable
          onPress={() => router.push("/search" as any)}
          style={buttonStyle("secondary", {
            borderRadius: 16,
            alignItems: "flex-start",
          })}
        >
          <Text style={{ color: "#888", fontSize: 15 }}>
            🔎 Kitap veya yazar ara…
          </Text>
        </Pressable>

        {/* ================= SON EKLENENLER ================= */}
        {last3.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
              Son Eklenenler
            </Text>

            {last3.map((b) => (
              <Pressable
                key={b.id}
                onPress={() =>
                  router.push({
                    pathname: "/book/[id]" as const,
                    params: { id: b.id },
                  })
                }
                style={({ pressed, hovered }) => ({
                  flexDirection: "row",
                  gap: 12,
                  padding: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#eee",
                  backgroundColor: pressed
                    ? "#f1f1f1"
                    : hovered
                      ? "#fafafa"
                      : "#fff",
                  alignItems: "center",
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                })}
              >
                <View
                  style={{
                    width: 54,
                    height: 78,
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: "#f3f3f3",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {b.thumbnail ? (
                    <Image
                      source={{ uri: b.thumbnail }}
                      style={{ width: 54, height: 78 }}
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
                      <Text style={{ fontSize: 20 }}>📚</Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{
                      fontWeight: "900",
                      fontSize: 15,
                      color: "#1a1a1a",
                    }}
                    numberOfLines={2}
                  >
                    {b.title}
                  </Text>

                  <Text style={{ color: "#666" }} numberOfLines={1}>
                    {b.author}
                  </Text>

                  <Text style={{ color: "#888", fontSize: 12 }}>
                    {b.status === "reading"
                      ? "Okumaya devam ediyorsun"
                      : b.status === "read"
                        ? "Okudun"
                        : "Okuma listende"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ================= TOPLULUK ================= */}
        {isHydrated && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
              Topluluk
            </Text>

            {communityPosts.length === 0 ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 18,
                  paddingVertical: 28,
                  paddingHorizontal: 20,
                  backgroundColor: "#fff",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 36 }}>🌍</Text>
                <Text
                  style={{
                    marginTop: 10,
                    fontSize: 17,
                    fontWeight: "800",
                    color: "#222",
                  }}
                >
                  Henüz topluluk paylaşımı yok
                </Text>
              </View>
            ) : (
              communityPosts.map((post) => {
                const localBook = getLocalBook(post.bookId);
                const displayTitle = localBook?.title ?? post.bookTitle;
                const displayAuthor = localBook?.author ?? post.bookAuthor;
                const displayThumbnail =
                  localBook?.thumbnail ?? post.bookThumbnail;

                const isMine = post.userId === CURRENT_USER.id;

                return (
                  <View
                    key={post.id}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "#eee",
                      backgroundColor: "#fff",
                      gap: 10,
                    }}
                  >
                    {/* Üst bilgi */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flexDirection: "row", gap: 10, flex: 1 }}>
                        <Image
                          source={{
                            uri:
                              post.userAvatar ??
                              "https://ui-avatars.com/api/?name=User",
                          }}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: "#f1f1f1",
                          }}
                        />

                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "900", color: "#111" }}>
                            {post.userName}
                          </Text>
                          <Text style={{ color: "#888", fontSize: 12 }}>
                            {formatTimeAgo(post.createdAt)} önce
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Kitap alanı */}
                    <Pressable
                      onPress={() => {
                        if (localBook) {
                          router.push({
                            pathname: "/book/[id]" as const,
                            params: { id: localBook.id },
                          });
                        }
                      }}
                      style={({ pressed, hovered }) => ({
                        flexDirection: "row",
                        gap: 12,
                        borderRadius: 12,
                        padding: 4,
                        backgroundColor: pressed
                          ? "#f3f3f3"
                          : hovered
                            ? "#fafafa"
                            : "transparent",
                        transform: [{ scale: pressed ? 0.99 : 1 }],
                      })}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 80,
                          borderRadius: 10,
                          overflow: "hidden",
                          backgroundColor: "#f3f3f3",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {displayThumbnail ? (
                          <Image
                            source={{ uri: displayThumbnail }}
                            style={{ width: 56, height: 80 }}
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
                            <Text style={{ fontSize: 22 }}>📚</Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flex: 1, gap: 4 }}>
                        <Text
                          style={{
                            fontWeight: "900",
                            fontSize: 15,
                            color: "#1a1a1a",
                          }}
                          numberOfLines={2}
                        >
                          {displayTitle}
                        </Text>

                        <Text style={{ color: "#666" }} numberOfLines={1}>
                          {displayAuthor}
                        </Text>
                      </View>
                    </Pressable>

                    {/* Paylaşım metni */}
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/post-comments/[id]" as const,
                          params: { id: post.id },
                        })
                      }
                      style={({ pressed, hovered }) => ({
                        borderRadius: 12,
                        padding: 4,
                        backgroundColor: pressed
                          ? "#f3f3f3"
                          : hovered
                            ? "#fafafa"
                            : "transparent",
                        transform: [{ scale: pressed ? 0.99 : 1 }],
                      })}
                    >
                      <Text style={{ color: "#555", lineHeight: 20 }}>
                        “{post.shareText || "Paylaşım metni yok"}”
                      </Text>
                    </Pressable>

                    {/* Alt aksiyonlar */}
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Pressable
                        onPress={() => toggleLike(post.id)}
                        style={pillButtonStyle("secondary")}
                      >
                        <Text style={{ fontWeight: "900" }}>
                          {post.isLiked ? "❤️" : "🤍"} {post.likes}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: "/post-comments/[id]" as const,
                            params: { id: post.id },
                          })
                        }
                        style={pillButtonStyle("secondary")}
                      >
                        <Text style={{ fontWeight: "900" }}>
                          💬 {post.comments.length}
                        </Text>
                      </Pressable>

                      {isMine && (
                        <>
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
                        </>
                      )}
                    </View>

                    {/* Silme onayı */}
                    {isMine && confirmDeleteId === post.id && (
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
                            style={buttonStyle("primary", { flex: 1 })}
                          >
                            <Text style={{ fontWeight: "800", color: "#fff" }}>
                              Evet, Sil
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ================= SENİN PAYLAŞIMLARIN ================= */}
        {isHydrated && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
              Senin Paylaşımların
            </Text>

            {myPosts.length === 0 ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 18,
                  paddingVertical: 28,
                  paddingHorizontal: 20,
                  backgroundColor: "#fff",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 36 }}>✨</Text>

                <Text
                  style={{
                    marginTop: 10,
                    fontSize: 17,
                    fontWeight: "800",
                    color: "#222",
                  }}
                >
                  Henüz paylaşım yok
                </Text>

                <Text
                  style={{
                    marginTop: 6,
                    color: "#666",
                    textAlign: "center",
                    lineHeight: 20,
                  }}
                >
                  Bir kitabın detay ekranına girip paylaşım oluşturarak burada
                  görünmesini sağlayabilirsin.
                </Text>
              </View>
            ) : (
              myPosts.map((post) => {
                const localBook = getLocalBook(post.bookId);
                const displayTitle = localBook?.title ?? post.bookTitle;
                const displayAuthor = localBook?.author ?? post.bookAuthor;
                const displayThumbnail =
                  localBook?.thumbnail ?? post.bookThumbnail;

                return (
                  <View
                    key={post.id}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "#eee",
                      backgroundColor: "#fff",
                      gap: 10,
                    }}
                  >
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <Image
                        source={{
                          uri:
                            post.userAvatar ??
                            "https://ui-avatars.com/api/?name=User",
                        }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: "#f1f1f1",
                        }}
                      />

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "900", color: "#111" }}>
                          {post.userName}
                        </Text>
                        <Text style={{ color: "#888", fontSize: 12 }}>
                          {formatTimeAgo(post.createdAt)} önce
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/post-comments/[id]" as const,
                          params: { id: post.id },
                        })
                      }
                      style={({ pressed, hovered }) => ({
                        flexDirection: "row",
                        gap: 12,
                        borderRadius: 12,
                        padding: 4,
                        backgroundColor: pressed
                          ? "#f3f3f3"
                          : hovered
                            ? "#fafafa"
                            : "transparent",
                        transform: [{ scale: pressed ? 0.99 : 1 }],
                      })}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 80,
                          borderRadius: 10,
                          overflow: "hidden",
                          backgroundColor: "#f3f3f3",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {displayThumbnail ? (
                          <Image
                            source={{ uri: displayThumbnail }}
                            style={{ width: 56, height: 80 }}
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
                            <Text style={{ fontSize: 22 }}>📚</Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flex: 1, gap: 4 }}>
                        <Text
                          style={{
                            fontWeight: "900",
                            fontSize: 15,
                            color: "#1a1a1a",
                          }}
                          numberOfLines={2}
                        >
                          {displayTitle}
                        </Text>

                        <Text style={{ color: "#666" }} numberOfLines={1}>
                          {displayAuthor}
                        </Text>
                      </View>
                    </Pressable>

                    <Text style={{ color: "#555", lineHeight: 20 }}>
                      “{post.shareText || "Paylaşım metni yok"}”
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Pressable
                        onPress={() => toggleLike(post.id)}
                        style={pillButtonStyle("secondary")}
                      >
                        <Text style={{ fontWeight: "900" }}>
                          {post.isLiked ? "❤️" : "🤍"} {post.likes}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: "/post-comments/[id]" as const,
                            params: { id: post.id },
                          })
                        }
                        style={pillButtonStyle("secondary")}
                      >
                        <Text style={{ fontWeight: "900" }}>
                          💬 {post.comments.length}
                        </Text>
                      </Pressable>

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
                            style={buttonStyle("primary", { flex: 1 })}
                          >
                            <Text style={{ fontWeight: "800", color: "#fff" }}>
                              Evet, Sil
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ================= FLOATING ADD ================= */}
      <Pressable
        onPress={() => router.push("/add-book")}
        style={({ pressed, hovered }) => ({
          position: "absolute",
          right: 16,
          bottom: 16,
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: pressed ? "#333" : hovered ? "#222" : "#111",
          alignItems: "center",
          justifyContent: "center",
          elevation: 4,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        <Text style={{ color: "white", fontSize: 30, fontWeight: "400" }}>
          +
        </Text>
      </Pressable>
    </View>
  );
}
