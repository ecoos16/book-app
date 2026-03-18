// context/PostsContext.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_USERS } from "../data/mockUsers";
import type { Post, PostComment } from "../types/post";

/**
 * Yeni post oluştururken gereken alanlar
 */
type CreatePostInput = {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookThumbnail?: string;

  userId: string;
  userName: string;
  userAvatar?: string;

  shareText: string;
};

/**
 * Yeni yorum eklerken gereken alanlar
 */
type AddCommentInput = {
  postId: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
};

/**
 * Context dışına açılan fonksiyon ve veriler
 */
type PostsContextValue = {
  posts: Post[];
  isHydrated: boolean;

  addPost: (input: CreatePostInput) => string;
  updatePost: (id: string, patch: Partial<Omit<Post, "id">>) => void;
  removePost: (id: string) => void;

  toggleLike: (id: string) => void;

  addComment: (input: AddCommentInput) => void;
  removeComment: (postId: string, commentId: string) => void;

  getById: (id: string) => Post | undefined;
  getByBookId: (bookId: string) => Post[];
  getByUserId: (userId: string) => Post[];

  clearAll: () => Promise<void>;
};

/**
 * Storage anahtarı
 */
const STORAGE_KEY = "POSTS_V2";

const PostsContext = createContext<PostsContextValue | null>(null);

/**
 * Basit id üretici
 */
function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Yorum verisini güvenli hale getir
 */
function normalizeComment(c: any): PostComment {
  return {
    id: typeof c?.id === "string" ? c.id : makeId(),
    text: typeof c?.text === "string" ? c.text : "",
    createdAt:
      typeof c?.createdAt === "number"
        ? c.createdAt
        : typeof c?.createdAt === "string"
          ? new Date(c.createdAt).getTime() || Date.now()
          : Date.now(),
    userId: typeof c?.userId === "string" ? c.userId : "unknown",
    userName: typeof c?.userName === "string" ? c.userName : "Kullanıcı",
    userAvatar:
      typeof c?.userAvatar === "string" && c.userAvatar.length > 0
        ? c.userAvatar
        : undefined,
  };
}

/**
 * Post verisini güvenli hale getir
 */
function normalizePost(p: any): Post {
  return {
    id: typeof p?.id === "string" ? p.id : makeId(),

    bookId: typeof p?.bookId === "string" ? p.bookId : "",
    bookTitle: typeof p?.bookTitle === "string" ? p.bookTitle : "Kitap",
    bookAuthor:
      typeof p?.bookAuthor === "string" ? p.bookAuthor : "Yazar bilinmiyor",
    bookThumbnail:
      typeof p?.bookThumbnail === "string" && p.bookThumbnail.length > 0
        ? p.bookThumbnail
        : undefined,

    userId: typeof p?.userId === "string" ? p.userId : "unknown",
    userName: typeof p?.userName === "string" ? p.userName : "Kullanıcı",
    userAvatar:
      typeof p?.userAvatar === "string" && p.userAvatar.length > 0
        ? p.userAvatar
        : undefined,

    shareText: typeof p?.shareText === "string" ? p.shareText : "",

    createdAt:
      typeof p?.createdAt === "number"
        ? p.createdAt
        : typeof p?.createdAt === "string"
          ? new Date(p.createdAt).getTime() || Date.now()
          : Date.now(),

    likes: typeof p?.likes === "number" ? p.likes : 0,
    isLiked: typeof p?.isLiked === "boolean" ? p.isLiked : false,
    comments: Array.isArray(p?.comments)
      ? p.comments.map(normalizeComment)
      : [],
  };
}

/**
 * Başlangıç topluluk postları
 */
function createSeedPosts(): Post[] {
  const now = Date.now();

  return [
    normalizePost({
      id: "seed_post_1",
      bookId: "seed_book_1",
      bookTitle: "Kürk Mantolu Madonna",
      bookAuthor: "Sabahattin Ali",
      bookThumbnail:
        "https://covers.openlibrary.org/b/title/K%C3%BCrk%20Mantolu%20Madonna-M.jpg",
      userId: MOCK_USERS[0].id,
      userName: MOCK_USERS[0].name,
      userAvatar: MOCK_USERS[0].avatar,
      shareText: "Bitirince uzun süre etkisinden çıkamadım. Dili çok akıcıydı.",
      createdAt: now - 1000 * 60 * 45,
      likes: 12,
      isLiked: false,
      comments: [
        {
          id: "seed_comment_1",
          text: "Ben de çok sevmiştim.",
          createdAt: now - 1000 * 60 * 30,
          userId: MOCK_USERS[2].id,
          userName: MOCK_USERS[2].name,
          userAvatar: MOCK_USERS[2].avatar,
        },
      ],
    }),
    normalizePost({
      id: "seed_post_2",
      bookId: "seed_book_2",
      bookTitle: "1984",
      bookAuthor: "George Orwell",
      bookThumbnail: "https://covers.openlibrary.org/b/title/1984-M.jpg",
      userId: MOCK_USERS[1].id,
      userName: MOCK_USERS[1].name,
      userAvatar: MOCK_USERS[1].avatar,
      shareText: "Bazı cümleler gerçekten bugünü anlatıyor gibi hissettirdi.",
      createdAt: now - 1000 * 60 * 60 * 3,
      likes: 9,
      isLiked: false,
      comments: [],
    }),
    normalizePost({
      id: "seed_post_3",
      bookId: "seed_book_3",
      bookTitle: "Simyacı",
      bookAuthor: "Paulo Coelho",
      bookThumbnail:
        "https://covers.openlibrary.org/b/title/Simyac%C4%B1-M.jpg",
      userId: MOCK_USERS[3].id,
      userName: MOCK_USERS[3].name,
      userAvatar: MOCK_USERS[3].avatar,
      shareText: "Başlangıcı biraz yavaş ama sonlara doğru çok akıyor.",
      createdAt: now - 1000 * 60 * 60 * 8,
      likes: 5,
      isLiked: false,
      comments: [],
    }),
  ];
}

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  /**
   * Storage'dan verileri yükle
   * Veri yoksa seed postları kullan
   */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (!mounted) return;

        if (raw) {
          const parsed = JSON.parse(raw) as unknown;

          if (Array.isArray(parsed)) {
            setPosts((parsed as any[]).map(normalizePost));
          } else {
            setPosts(createSeedPosts());
          }
        } else {
          setPosts(createSeedPosts());
        }
      } catch {
        setPosts(createSeedPosts());
      } finally {
        if (mounted) setIsHydrated(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Değişiklikleri storage'a yaz
   */
  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(posts.map(normalizePost)),
    ).catch(() => {});
  }, [posts, isHydrated]);

  /**
   * Yeni post ekle
   */
  const addPost: PostsContextValue["addPost"] = (input) => {
    const id = makeId();

    const newPost = normalizePost({
      id,
      ...input,
      createdAt: Date.now(),
      likes: 0,
      isLiked: false,
      comments: [],
    });

    setPosts((prev) => [newPost, ...prev]);
    return id;
  };

  /**
   * Post güncelle
   */
  const updatePost: PostsContextValue["updatePost"] = (id, patch) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? normalizePost({ ...p, ...patch }) : p)),
    );
  };

  /**
   * Post sil
   */
  const removePost: PostsContextValue["removePost"] = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  /**
   * Like toggle
   */
  const toggleLike: PostsContextValue["toggleLike"] = (id) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const liked = p.isLiked ?? false;
        const likes = p.likes ?? 0;

        return normalizePost({
          ...p,
          isLiked: !liked,
          likes: liked ? Math.max(0, likes - 1) : likes + 1,
        });
      }),
    );
  };

  /**
   * Posta yorum ekle
   */
  const addComment: PostsContextValue["addComment"] = ({
    postId,
    text,
    userId,
    userName,
    userAvatar,
  }) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const nextComment = normalizeComment({
          id: makeId(),
          text: trimmed,
          createdAt: Date.now(),
          userId,
          userName,
          userAvatar,
        });

        return normalizePost({
          ...p,
          comments: [...p.comments, nextComment],
        });
      }),
    );
  };

  /**
   * Post yorumunu sil
   */
  const removeComment: PostsContextValue["removeComment"] = (
    postId,
    commentId,
  ) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        return normalizePost({
          ...p,
          comments: p.comments.filter((c) => c.id !== commentId),
        });
      }),
    );
  };

  /**
   * Tek post getir
   */
  const getById: PostsContextValue["getById"] = (id) =>
    posts.find((p) => p.id === id);

  /**
   * BookId'ye göre postları getir
   */
  const getByBookId: PostsContextValue["getByBookId"] = (bookId) =>
    posts.filter((p) => p.bookId === bookId);

  /**
   * Kullanıcıya göre postları getir
   */
  const getByUserId: PostsContextValue["getByUserId"] = (userId) =>
    posts.filter((p) => p.userId === userId);

  /**
   * Tüm postları temizle
   * Seed postlara geri döndür
   */
  const clearAll: PostsContextValue["clearAll"] = async () => {
    const seed = createSeedPosts();
    setPosts(seed);

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const value = useMemo<PostsContextValue>(
    () => ({
      posts,
      isHydrated,
      addPost,
      updatePost,
      removePost,
      toggleLike,
      addComment,
      removeComment,
      getById,
      getByBookId,
      getByUserId,
      clearAll,
    }),
    [posts, isHydrated],
  );

  return (
    <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);

  if (!ctx) {
    throw new Error("usePosts must be used within PostsProvider");
  }

  return ctx;
}
