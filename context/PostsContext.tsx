// context/PostsContext.tsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import type { AddCommentOptions, Post, PostComment } from "../types/post";
type AddPostInput = {
  bookId?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookThumbnail?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  shareText: string;
  sourceType?: "manual" | "book-share";
};

type UpdatePostInput = {
  shareText?: string;
};

type PostsContextType = {
  posts: Post[];
  loading: boolean;
  isHydrated: boolean;
  addPost: (input: AddPostInput) => Promise<string | null>;
  updatePost: (postId: string, input: UpdatePostInput) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  removePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (
    postId: string,
    text: string,
    options?: AddCommentOptions,
  ) => Promise<void>;
  removeComment: (postId: string, commentId: string) => Promise<void>;
  getById: (postId: string) => Post | undefined;
  getByBookId: (bookId: string) => Post[];
  refreshPosts: () => Promise<void>;
};

const PostsContext = createContext<PostsContextType | undefined>(undefined);

type DbProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type DbBook = {
  id: string;
  title: string | null;
  author: string | null;
  thumbnail: string | null;
};

type DbPostRow = {
  id: string;
  user_id: string;
  book_id: string | null;
  book_title: string | null;
  book_author: string | null;
  book_thumbnail: string | null;
  content: string | null;
  created_at: string;
  updated_at: string | null;
  profiles: DbProfile | DbProfile[] | null;
  books: DbBook | DbBook[] | null;
};

type DbLikeRow = {
  post_id: string;
  user_id: string;
};

type DbCommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  reply_to_user_name: string | null;
  created_at: string;
  profiles: DbProfile | DbProfile[] | null;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalizeName(profile: DbProfile | null) {
  return profile?.full_name?.trim() || profile?.username?.trim() || "Kullanıcı";
}

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const likeLocksRef = useRef<Set<string>>(new Set());
  const commentLocksRef = useRef<Set<string>>(new Set());

  const mapRowsToPosts = useCallback(
    (
      postRows: DbPostRow[],
      likeRows: DbLikeRow[],
      commentRows: DbCommentRow[],
      currentUserId?: string,
    ): Post[] => {
      return postRows.map((row) => {
        const profile = pickOne(row.profiles);
        const book = pickOne(row.books);

        const postLikes = likeRows.filter((like) => like.post_id === row.id);
        const postCommentsRaw = commentRows.filter(
          (comment) => comment.post_id === row.id,
        );

        const mappedComments: PostComment[] = postCommentsRaw.map((comment) => {
          const commentProfile = pickOne(comment.profiles);

          return {
            id: comment.id,
            postId: comment.post_id,
            userId: comment.user_id,
            userName: normalizeName(commentProfile),
            userAvatar: commentProfile?.avatar_url ?? undefined,
            text: comment.content,
            parentId: comment.parent_id ?? undefined,
            replyToUserName: comment.reply_to_user_name ?? undefined,
            createdAt: new Date(comment.created_at).getTime(),
          };
        });

        return {
          id: row.id,
          userId: row.user_id,
          userName: normalizeName(profile),
          userAvatar: profile?.avatar_url ?? undefined,
          bookId: row.book_id ?? undefined,
          bookTitle: row.book_title?.trim() || book?.title?.trim() || "Kitap",
          bookAuthor:
            row.book_author?.trim() ||
            book?.author?.trim() ||
            "Yazar bilinmiyor",
          bookThumbnail: row.book_thumbnail || book?.thumbnail || undefined,
          shareText: row.content?.trim() || "",
          likes: postLikes.length,
          isLiked: !!currentUserId
            ? postLikes.some((like) => like.user_id === currentUserId)
            : false,
          comments: mappedComments.sort((a, b) => a.createdAt - b.createdAt),
          createdAt: new Date(row.created_at).getTime(),
          updatedAt: row.updated_at
            ? new Date(row.updated_at).getTime()
            : undefined,
          sourceType: "book-share",
        };
      });
    },
    [],
  );

  const refreshPosts = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const currentUserId = user?.id;

      const { data: postRowsRaw, error: postError } = await supabase
        .from("posts")
        .select(
          `
          id,
          user_id,
          book_id,
          book_title,
          book_author,
          book_thumbnail,
          content,
          created_at,
          updated_at,
          profiles:user_id (
            id,
            full_name,
            username,
            avatar_url
          ),
          books:book_id (
            id,
            title,
            author,
            thumbnail
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (postError) {
        console.log("REFRESH POSTS ERROR:", postError);
        throw new Error(postError.message);
      }

      const { data: likeRowsRaw, error: likeError } = await supabase
        .from("post_likes")
        .select("post_id, user_id");

      if (likeError) {
        console.log("REFRESH LIKES ERROR:", likeError);
        throw new Error(likeError.message);
      }

      const { data: commentRowsRaw, error: commentError } = await supabase
        .from("post_comments")
        .select(
          `
          id,
post_id,
user_id,
content,
parent_id,
reply_to_user_name,
created_at,
          profiles:user_id (
            id,
            full_name,
            username,
            avatar_url
          )
        `,
        )
        .order("created_at", { ascending: true });

      if (commentError) {
        console.log("REFRESH COMMENTS ERROR:", commentError);
        throw new Error(commentError.message);
      }

      const nextPosts = mapRowsToPosts(
        (postRowsRaw ?? []) as DbPostRow[],
        (likeRowsRaw ?? []) as DbLikeRow[],
        (commentRowsRaw ?? []) as DbCommentRow[],
        currentUserId,
      );

      setPosts(nextPosts);
    } catch (error) {
      console.log("REFRESH POSTS CATCH ERROR:", error);
    } finally {
      setLoading(false);
    }
  }, [mapRowsToPosts]);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  const addPost = useCallback(
    async (input: AddPostInput) => {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: input.userId,
          book_id: input.bookId ?? null,
          book_title: input.bookTitle ?? null,
          book_author: input.bookAuthor ?? null,
          book_thumbnail: input.bookThumbnail ?? null,
          content: input.shareText,
        })
        .select("id")
        .single();

      if (error) {
        console.log("ADD POST ERROR:", error);
        throw new Error(error.message);
      }

      await refreshPosts();
      return data?.id ?? null;
    },
    [refreshPosts],
  );

  const updatePost = useCallback(
    async (postId: string, input: UpdatePostInput) => {
      const { error } = await supabase
        .from("posts")
        .update({
          content: input.shareText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      if (error) {
        console.log("UPDATE POST ERROR:", error);
        throw new Error(error.message);
      }

      await refreshPosts();
    },
    [refreshPosts],
  );

  const deletePost = useCallback(async (postId: string) => {
    const { error: likesError } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId);

    if (likesError) {
      console.log("DELETE POST LIKES ERROR:", likesError);
      throw new Error(likesError.message);
    }

    const { error: commentsError } = await supabase
      .from("post_comments")
      .delete()
      .eq("post_id", postId);

    if (commentsError) {
      console.log("DELETE POST COMMENTS ERROR:", commentsError);
      throw new Error(commentsError.message);
    }

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      console.log("DELETE POST ERROR:", error);
      throw new Error(error.message);
    }

    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);
  const removePost = useCallback(
    async (postId: string) => {
      await deletePost(postId);
    },
    [deletePost],
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      if (likeLocksRef.current.has(postId)) return;
      likeLocksRef.current.add(postId);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) {
          throw new Error("Oturum açık değil.");
        }

        const { data: existingLike, error: checkError } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (checkError) {
          console.log("CHECK LIKE ERROR:", checkError);
          throw new Error(checkError.message);
        }

        if (existingLike?.id) {
          const { error: deleteError } = await supabase
            .from("post_likes")
            .delete()
            .eq("id", existingLike.id);

          if (deleteError) {
            console.log("DELETE LIKE ERROR:", deleteError);
            throw new Error(deleteError.message);
          }
        } else {
          const { error: insertError } = await supabase
            .from("post_likes")
            .insert({
              post_id: postId,
              user_id: user.id,
            });

          if (insertError && (insertError as any).code !== "23505") {
            console.log("INSERT LIKE ERROR:", insertError);
            throw new Error(insertError.message);
          }
        }

        await refreshPosts();
      } finally {
        likeLocksRef.current.delete(postId);
      }
    },
    [refreshPosts],
  );
  const addComment = useCallback(
    async (postId: string, text: string, options?: AddCommentOptions) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (commentLocksRef.current.has(postId)) return;

      commentLocksRef.current.add(postId);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) {
          throw new Error("Oturum açık değil.");
        }

        const { data: insertedComment, error } = await supabase
          .from("post_comments")
          .insert({
            post_id: postId,
            user_id: user.id,
            content: trimmed,
            parent_id: options?.parentId ?? null,
            reply_to_user_name: options?.replyToUserName ?? null,
          })
          .select(
            `
          id,
          post_id,
          user_id,
          content,
          parent_id,
          reply_to_user_name,
          created_at,
          profiles:user_id (
            id,
            full_name,
            username,
            avatar_url
          )
        `,
          )
          .single();

        if (error) {
          console.log("ADD COMMENT ERROR:", error);
          throw new Error(error.message);
        }

        const profile = pickOne(
          (insertedComment as DbCommentRow | null)?.profiles ?? null,
        );

        const newComment: PostComment = {
          id: insertedComment.id,
          postId: insertedComment.post_id,
          userId: insertedComment.user_id,
          userName: normalizeName(profile),
          userAvatar: profile?.avatar_url ?? undefined,
          text: insertedComment.content,
          parentId: insertedComment.parent_id ?? undefined,
          replyToUserName: insertedComment.reply_to_user_name ?? undefined,
          createdAt: new Date(insertedComment.created_at).getTime(),
        };

        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: [...(post.comments ?? []), newComment].sort(
                    (a, b) => a.createdAt - b.createdAt,
                  ),
                }
              : post,
          ),
        );
      } finally {
        commentLocksRef.current.delete(postId);
      }
    },
    [],
  );

  const removeComment = useCallback(
    async (postId: string, commentId: string) => {
      const { error } = await supabase.rpc("delete_post_comment", {
        p_post_id: postId,
        p_comment_id: commentId,
      });

      if (error) {
        console.log("RPC REMOVE COMMENT ERROR:", error);
        throw error;
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: (post.comments ?? []).filter(
                  (comment) => comment.id !== commentId,
                ),
              }
            : post,
        ),
      );
    },
    [],
  );

  const getById = useCallback(
    (postId: string) => posts.find((post) => post.id === postId),
    [posts],
  );

  const getByBookId = useCallback(
    (bookId: string) => posts.filter((post) => post.bookId === bookId),
    [posts],
  );

  const value = useMemo<PostsContextType>(
    () => ({
      posts,
      loading,
      isHydrated: !loading,
      addPost,
      updatePost,
      deletePost,
      removePost,
      toggleLike,
      addComment,
      removeComment,
      getById,
      getByBookId,
      refreshPosts,
    }),
    [
      posts,
      loading,
      addPost,
      updatePost,
      deletePost,
      removePost,
      toggleLike,
      addComment,
      removeComment,
      getById,
      getByBookId,
      refreshPosts,
    ],
  );

  return (
    <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);

  if (!context) {
    throw new Error("usePosts must be used within PostsProvider");
  }

  return context;
}
