// context/BooksContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Book, BookStatus } from "../types/book";

type BooksContextValue = {
  books: Book[];
  isHydrated: boolean;

  addBook: (payload: Omit<Book, "id" | "createdAt">) => string;
  updateBook: (id: string, patch: Partial<Omit<Book, "id">>) => void;
  removeBook: (id: string) => void;

  getById: (id: string) => Book | undefined;
  getByStatus: (status: BookStatus) => Book[];
  clearAll: () => Promise<void>;
};

const STORAGE_KEY = "BOOKS_V1";

const BooksContext = createContext<BooksContextValue | null>(null);

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * ✅ Migration / Normalize
 * - Eski kayıtlarda olmayan alanlara default verir.
 * - Böylece UI hiçbir zaman undefined yüzünden patlamaz.
 */
function normalizeBook(b: any): Book {
  return {
    ...b,

    // required basics (safe fallback)
    id: typeof b?.id === "string" ? b.id : makeId(),
    title: typeof b?.title === "string" ? b.title : "",
    author: typeof b?.author === "string" ? b.author : "",
    status:
      b?.status === "reading" || b?.status === "read" || b?.status === "want"
        ? b.status
        : "reading",

    createdAt: typeof b?.createdAt === "number" ? b.createdAt : Date.now(),

    // ✅ new fields (optional)
    thumbnail:
      typeof b?.thumbnail === "string" && b.thumbnail.length > 0
        ? b.thumbnail
        : undefined,
    googleId:
      typeof b?.googleId === "string" && b.googleId.length > 0
        ? b.googleId
        : undefined,

    // ✅ social defaults
    likes: typeof b?.likes === "number" ? b.likes : 0,
    isLiked: typeof b?.isLiked === "boolean" ? b.isLiked : false,
    comments: Array.isArray(b?.comments) ? b.comments : [],
  };
}

export function BooksProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // ✅ App açılınca storage'tan oku (normalize + migration)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;

        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            setBooks((parsed as any[]).map(normalizeBook));
          } else {
            setBooks([]);
          }
        } else {
          setBooks([]);
        }
      } catch {
        setBooks([]);
      } finally {
        if (mounted) setIsHydrated(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ books değişince storage'a yaz (normalize ederek)
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(books.map(normalizeBook)),
    ).catch(() => {});
  }, [books, isHydrated]);

  // ✅ Kitap ekleme (default + normalize + duplicate prevention)
  const addBook: BooksContextValue["addBook"] = (payload) => {
    const incomingGoogleId =
      typeof payload.googleId === "string" && payload.googleId.length > 0
        ? payload.googleId
        : undefined;

    // ✅ Duplicate check: aynı googleId ile kitap varsa yeni ekleme
    if (incomingGoogleId) {
      const existing = books.find((b) => b.googleId === incomingGoogleId);
      if (existing) {
        // yeni id üretmiyoruz, mevcut id döndürüyoruz
        return existing.id;
      }
    }

    const id = makeId();

    const newBook: Book = normalizeBook({
      id,
      createdAt: Date.now(),

      // payload'tan gelenler
      ...payload,

      // sosyal defaults
      likes: payload.likes ?? 0,
      isLiked: payload.isLiked ?? false,
      comments: payload.comments ?? [],
    });

    setBooks((prev) => [newBook, ...prev].map(normalizeBook));
    return id;
  };

  const updateBook: BooksContextValue["updateBook"] = (id, patch) => {
    setBooks((prev) =>
      prev
        .map((b) => (b.id === id ? normalizeBook({ ...b, ...patch }) : b))
        .map(normalizeBook),
    );
  };

  const removeBook: BooksContextValue["removeBook"] = (id) => {
    setBooks((prev) => prev.filter((b) => b.id !== id).map(normalizeBook));
  };

  const clearAll: BooksContextValue["clearAll"] = async () => {
    setBooks([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const getById: BooksContextValue["getById"] = (id) =>
    books.find((b) => b.id === id);

  const getByStatus: BooksContextValue["getByStatus"] = (status) =>
    books.filter((b) => b.status === status);

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
