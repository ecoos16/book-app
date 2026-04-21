// context/PostsContext.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Post, PostComment } from "../types/post";

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

type AddCommentInput = {
  postId: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
};

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

const STORAGE_KEY = "POSTS_V3";
const PostsContext = createContext<PostsContextValue | null>(null);

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

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

function sortPosts(items: Post[]) {
  return [...items].sort((a, b) => b.createdAt - a.createdAt);
}

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const postsRef = useRef<Post[]>([]);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (!mounted) return;

        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          const safePosts = Array.isArray(parsed)
            ? sortPosts(parsed.map(normalizePost))
            : [];

          setPosts(safePosts);
        } else {
          setPosts([]);
        }
      } catch {
        setPosts([]);
      } finally {
        if (mounted) setIsHydrated(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts)).catch(() => {});
  }, [posts, isHydrated]);

  const addPost: PostsContextValue["addPost"] = (input) => {
    const newPost = normalizePost({
      id: makeId(),
      ...input,
      createdAt: Date.now(),
      likes: 0,
      isLiked: false,
      comments: [],
    });

    setPosts((prev) => {
      const next = sortPosts([newPost, ...prev].map(normalizePost));
      postsRef.current = next;
      return next;
    });

    return newPost.id;
  };

  const updatePost: PostsContextValue["updatePost"] = (id, patch) => {
    setPosts((prev) => {
      const next = prev.map((p) =>
        p.id === id ? normalizePost({ ...p, ...patch }) : p,
      );
      postsRef.current = next;
      return next;
    });
  };

  const removePost: PostsContextValue["removePost"] = (id) => {
    setPosts((prev) => {
      const next = prev.filter((p) => p.id !== id).map(normalizePost);
      postsRef.current = next;
      return next;
    });
  };

  const toggleLike: PostsContextValue["toggleLike"] = (id) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        if (p.id !== id) return p;

        const nextLiked = !p.isLiked;
        const nextLikes = Math.max(0, (p.likes ?? 0) + (nextLiked ? 1 : -1));

        return normalizePost({
          ...p,
          isLiked: nextLiked,
          likes: nextLikes,
        });
      });

      postsRef.current = next;
      return next;
    });
  };

  const addComment: PostsContextValue["addComment"] = (input) => {
    const trimmed = input.text.trim();
    if (!trimmed) return;

    const newComment = normalizeComment({
      id: makeId(),
      text: trimmed,
      userId: input.userId,
      userName: input.userName,
      userAvatar: input.userAvatar,
      createdAt: Date.now(),
    });

    setPosts((prev) => {
      const next = prev.map((p) => {
        if (p.id !== input.postId) return p;

        return normalizePost({
          ...p,
          comments: [...(p.comments ?? []), newComment],
        });
      });

      postsRef.current = next;
      return next;
    });
  };

  const removeComment: PostsContextValue["removeComment"] = (
    postId,
    commentId,
  ) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        if (p.id !== postId) return p;

        return normalizePost({
          ...p,
          comments: (p.comments ?? []).filter((c) => c.id !== commentId),
        });
      });

      postsRef.current = next;
      return next;
    });
  };

  const getById: PostsContextValue["getById"] = (id) =>
    posts.find((p) => p.id === id);

  const getByBookId: PostsContextValue["getByBookId"] = (bookId) =>
    posts.filter((p) => p.bookId === bookId);

  const getByUserId: PostsContextValue["getByUserId"] = (userId) =>
    posts.filter((p) => p.userId === userId);

  const clearAll: PostsContextValue["clearAll"] = async () => {
    postsRef.current = [];
    setPosts([]);

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // sessiz geç
    }
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
