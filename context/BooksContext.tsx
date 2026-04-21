// context/BooksContext.tsx

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

import { supabase } from "../lib/supabase";
import type { Book, BookStatus } from "../types/book";
import { useAuth } from "./AuthContext";

type AddBookPayload = Omit<Book, "id" | "createdAt">;

type AddBookResult = {
  id: string;
  created: boolean;
  book: Book;
};

type BooksContextValue = {
  books: Book[];
  isHydrated: boolean;
  addBook: (payload: AddBookPayload) => AddBookResult;
  updateBook: (id: string, patch: Partial<Omit<Book, "id">>) => void;
  removeBook: (id: string) => void;
  getById: (id: string) => Book | undefined;
  getByStatus: (status: BookStatus) => Book[];
  clearAll: () => Promise<void>;
};

const STORAGE_KEY = "BOOKS_V1";
const BooksContext = createContext<BooksContextValue | null>(null);

type DbBookRow = {
  id: string;
  user_id: string;
  google_book_id: string | null;
  title: string | null;
  author: string | null;
  thumbnail: string | null;
  description: string | null;
  page_count: number | null;
  published_date: string | null;
  status: string | null;
  pages_read: number | null;
  rating: number | null;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLocaleLowerCase("tr").replace(/\s+/g, " ");
}

function normalizeString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  const safeArray = value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );

  return safeArray.length > 0 ? safeArray : undefined;
}

function normalizeBook(b: any): Book {
  const safePagesTotal =
    typeof b?.pagesTotal === "number" && b.pagesTotal > 0
      ? b.pagesTotal
      : undefined;

  const safePagesRead =
    typeof b?.pagesRead === "number" && b.pagesRead >= 0
      ? b.pagesRead
      : undefined;

  return {
    id: typeof b?.id === "string" ? b.id : makeId(),
    title: typeof b?.title === "string" ? b.title : "",
    author: typeof b?.author === "string" ? b.author : "",

    thumbnail:
      typeof b?.thumbnail === "string" && b.thumbnail.length > 0
        ? b.thumbnail
        : undefined,

    googleId:
      typeof b?.googleId === "string" && b.googleId.length > 0
        ? b.googleId
        : undefined,

    description: normalizeString(b?.description),
    categories: normalizeStringArray(b?.categories),
    publishedDate: normalizeString(b?.publishedDate),
    language: normalizeString(b?.language),

    status:
      b?.status === "reading" || b?.status === "read" || b?.status === "want"
        ? b.status
        : "reading",

    createdAt:
      typeof b?.createdAt === "number"
        ? b.createdAt
        : typeof b?.createdAt === "string"
          ? new Date(b.createdAt).getTime() || Date.now()
          : Date.now(),

    pagesTotal: safePagesTotal,

    pagesRead:
      typeof safePagesRead === "number"
        ? typeof safePagesTotal === "number"
          ? Math.min(safePagesRead, safePagesTotal)
          : safePagesRead
        : undefined,

    rating:
      typeof b?.rating === "number" && b.rating >= 1 && b.rating <= 5
        ? b.rating
        : undefined,

    note:
      typeof b?.note === "string" && b.note.trim().length > 0
        ? b.note.trim()
        : undefined,

    shareText:
      typeof b?.shareText === "string" && b.shareText.trim().length > 0
        ? b.shareText.trim()
        : undefined,

    sharedAt:
      typeof b?.sharedAt === "number"
        ? b.sharedAt
        : typeof b?.sharedAt === "string"
          ? new Date(b.sharedAt).getTime() || undefined
          : undefined,

    likes: typeof b?.likes === "number" ? b.likes : 0,
    isLiked: typeof b?.isLiked === "boolean" ? b.isLiked : false,
    comments: Array.isArray(b?.comments) ? b.comments : [],
  };
}

function sortBooksNewestFirst(items: Book[]) {
  return [...items].sort((a, b) => b.createdAt - a.createdAt);
}

function findDuplicateBook(books: Book[], payload: AddBookPayload) {
  const existingByGoogleId =
    typeof payload.googleId === "string" && payload.googleId.length > 0
      ? books.find((book) => book.googleId === payload.googleId)
      : undefined;

  if (existingByGoogleId) {
    return existingByGoogleId;
  }

  const normalizedTitle = normalizeText(payload.title);
  const normalizedAuthor = normalizeText(payload.author);

  return books.find(
    (book) =>
      normalizeText(book.title) === normalizedTitle &&
      normalizeText(book.author) === normalizedAuthor,
  );
}

function mapDbRowToBook(row: DbBookRow): Book {
  return normalizeBook({
    id: row.id,
    googleId: row.google_book_id ?? undefined,
    title: row.title ?? "",
    author: row.author ?? "",
    thumbnail: row.thumbnail ?? undefined,
    description: row.description ?? undefined,
    publishedDate: row.published_date ?? undefined,
    status:
      row.status === "reading" || row.status === "read" || row.status === "want"
        ? row.status
        : "reading",
    pagesTotal:
      typeof row.page_count === "number" && row.page_count > 0
        ? row.page_count
        : undefined,
    pagesRead:
      typeof row.pages_read === "number" && row.pages_read >= 0
        ? row.pages_read
        : undefined,
    rating:
      typeof row.rating === "number" && row.rating >= 1 && row.rating <= 5
        ? row.rating
        : undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at ?? row.updated_at ?? Date.now(),
  });
}

export function BooksProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const userId = authUser?.id ?? null;

  const [books, setBooks] = useState<Book[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const booksRef = useRef<Book[]>([]);
  const hydratedRef = useRef(false);

  useEffect(() => {
    booksRef.current = books;
  }, [books]);

  useEffect(() => {
    hydratedRef.current = isHydrated;
  }, [isHydrated]);

  function mapBookToSupabaseRow(book: Book, safeUserId: string) {
    return {
      user_id: safeUserId,
      google_book_id: book.googleId ?? null,
      title: book.title,
      author: book.author,
      thumbnail: book.thumbnail ?? null,
      description: book.description ?? null,
      page_count: book.pagesTotal ?? null,
      published_date: book.publishedDate ?? null,
      status: book.status,
      pages_read: book.pagesRead ?? 0,
      rating: book.rating ?? null,
      note: book.note ?? null,
      updated_at: new Date().toISOString(),
    };
  }

  async function upsertBookToSupabase(book: Book, safeUserId: string | null) {
    if (!safeUserId) return;

    const row = mapBookToSupabaseRow(book, safeUserId);

    if (book.googleId) {
      const { error } = await supabase.from("books").upsert(row, {
        onConflict: "user_id,google_book_id",
        ignoreDuplicates: false,
      });

      if (error) {
        console.log("SUPABASE UPSERT BOOK ERROR:", error);
      }

      return;
    }

    const { data: existing, error: findError } = await supabase
      .from("books")
      .select("id")
      .eq("user_id", safeUserId)
      .eq("title", book.title)
      .eq("author", book.author)
      .maybeSingle();

    if (findError) {
      console.log("SUPABASE FIND BOOK ERROR:", findError);
      return;
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("books")
        .update(row)
        .eq("id", existing.id);

      if (updateError) {
        console.log("SUPABASE UPDATE BOOK ERROR:", updateError);
      }
      return;
    }

    const { error: insertError } = await supabase.from("books").insert({
      ...row,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.log("SUPABASE INSERT BOOK ERROR:", insertError);
    }
  }

  async function deleteBookFromSupabase(book: Book, safeUserId: string | null) {
    if (!safeUserId) return;

    if (book.googleId) {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("user_id", safeUserId)
        .eq("google_book_id", book.googleId);

      if (error) {
        console.log("SUPABASE DELETE BOOK ERROR:", error);
      }
      return;
    }

    const { error } = await supabase
      .from("books")
      .delete()
      .eq("user_id", safeUserId)
      .eq("title", book.title)
      .eq("author", book.author);

    if (error) {
      console.log("SUPABASE DELETE FALLBACK ERROR:", error);
    }
  }

  async function fetchBooksFromSupabase(safeUserId: string) {
    const { data, error } = await supabase
      .from("books")
      .select(
        `
        id,
        user_id,
        google_book_id,
        title,
        author,
        thumbnail,
        description,
        page_count,
        published_date,
        status,
        pages_read,
        rating,
        note,
        created_at,
        updated_at
      `,
      )
      .eq("user_id", safeUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("SUPABASE FETCH BOOKS ERROR:", error);
      return null;
    }

    const rows = (data ?? []) as DbBookRow[];
    return sortBooksNewestFirst(rows.map(mapDbRowToBook));
  }

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setIsHydrated(false);

      try {
        if (!userId) {
          if (mounted) {
            setBooks([]);
            setIsHydrated(true);
          }
          return;
        }

        const remoteBooks = await fetchBooksFromSupabase(userId);

        if (!mounted) return;

        if (remoteBooks && remoteBooks.length > 0) {
          setBooks(remoteBooks);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remoteBooks));
          setIsHydrated(true);
          return;
        }

        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (!mounted) return;

        if (!raw) {
          setBooks([]);
          setIsHydrated(true);
          return;
        }

        const parsed = JSON.parse(raw) as unknown;
        const safeBooks = Array.isArray(parsed)
          ? sortBooksNewestFirst(parsed.map(normalizeBook))
          : [];

        setBooks(safeBooks);
        setIsHydrated(true);

        if (safeBooks.length > 0) {
          for (const book of safeBooks) {
            await upsertBookToSupabase(book, userId);
          }

          const syncedRemoteBooks = await fetchBooksFromSupabase(userId);
          if (mounted && syncedRemoteBooks) {
            setBooks(syncedRemoteBooks);
            await AsyncStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(syncedRemoteBooks),
            );
          }
        }
      } catch (error) {
        console.log("BOOKS BOOTSTRAP ERROR:", error);

        if (mounted) {
          setBooks([]);
          setIsHydrated(true);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books)).catch(() => {
      // sessiz geç
    });
  }, [books, isHydrated]);

  const addBook: BooksContextValue["addBook"] = (payload) => {
    const currentBooks = booksRef.current;
    const duplicate = findDuplicateBook(currentBooks, payload);

    if (duplicate) {
      const mergedDuplicate = normalizeBook({
        ...duplicate,
        ...payload,
        id: duplicate.id,
        createdAt: duplicate.createdAt,
      });

      const nextBooks = sortBooksNewestFirst(
        currentBooks.map((book) =>
          book.id === duplicate.id ? mergedDuplicate : book,
        ),
      );

      booksRef.current = nextBooks;
      setBooks(nextBooks);

      if (hydratedRef.current) {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextBooks)).catch(
          () => {
            // sessiz geç
          },
        );
      }

      void upsertBookToSupabase(mergedDuplicate, userId);

      return {
        id: mergedDuplicate.id,
        created: false,
        book: mergedDuplicate,
      };
    }

    const newBook = normalizeBook({
      id: makeId(),
      createdAt: Date.now(),
      ...payload,
      likes: payload.likes ?? 0,
      isLiked: payload.isLiked ?? false,
      comments: payload.comments ?? [],
    });

    const nextBooks = sortBooksNewestFirst([newBook, ...currentBooks]);

    booksRef.current = nextBooks;
    setBooks(nextBooks);

    if (hydratedRef.current) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextBooks)).catch(() => {
        // sessiz geç
      });
    }

    void upsertBookToSupabase(newBook, userId);

    return {
      id: newBook.id,
      created: true,
      book: newBook,
    };
  };

  const updateBook: BooksContextValue["updateBook"] = (id, patch) => {
    setBooks((prev) => {
      let updatedBook: Book | null = null;

      const nextBooks = prev.map((book) => {
        if (book.id !== id) return book;

        updatedBook = normalizeBook({ ...book, ...patch });
        return updatedBook;
      });

      booksRef.current = nextBooks;

      if (updatedBook) {
        void upsertBookToSupabase(updatedBook, userId);
      }

      return nextBooks;
    });
  };

  const removeBook: BooksContextValue["removeBook"] = (id) => {
    setBooks((prev) => {
      const target = prev.find((book) => book.id === id);
      const nextBooks = prev.filter((book) => book.id !== id);

      booksRef.current = nextBooks;

      if (target) {
        void deleteBookFromSupabase(target, userId);
      }

      return nextBooks;
    });
  };

  const clearAll: BooksContextValue["clearAll"] = async () => {
    if (userId) {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("user_id", userId);
      if (error) {
        console.log("SUPABASE CLEAR ALL BOOKS ERROR:", error);
      }
    }

    booksRef.current = [];
    setBooks([]);

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // sessiz geç
    }
  };

  const getById: BooksContextValue["getById"] = (id) =>
    books.find((book) => book.id === id);

  const getByStatus: BooksContextValue["getByStatus"] = (status) =>
    books.filter((book) => book.status === status);

  const value = useMemo<BooksContextValue>(
    () => ({
      books,
      isHydrated,
      addBook,
      updateBook,
      removeBook,
      getById,
      getByStatus,
      clearAll,
    }),
    [books, isHydrated],
  );

  return (
    <BooksContext.Provider value={value}>{children}</BooksContext.Provider>
  );
}

export function useBooks() {
  const ctx = useContext(BooksContext);

  if (!ctx) {
    throw new Error("useBooks must be used within BooksProvider");
  }

  return ctx;
}
