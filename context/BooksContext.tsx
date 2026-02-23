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

export function BooksProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // ✅ App açılınca storage'tan oku
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;

        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) setBooks(parsed as Book[]);
          else setBooks([]);
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

  // ✅ books değişince storage'a yaz
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books)).catch(() => {});
  }, [books, isHydrated]);

  // ✅ Kitap ekleme
  const addBook: BooksContextValue["addBook"] = (payload) => {
    const id = makeId();

    const newBook: Book = {
      id,
      createdAt: Date.now(),

      // ✅ payload'tan gelenler
      ...payload,

      // ✅ paylaşım/etkileşim alanları default
      likes: 0,
      commentsCount: 0,
    };

    setBooks((prev) => [newBook, ...prev]);
    return id;
  };

  const updateBook: BooksContextValue["updateBook"] = (id, patch) => {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const removeBook: BooksContextValue["removeBook"] = (id) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
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
    // Bu hata varsa %99 RootLayout provider devrede değildir.
    throw new Error("useBooks must be used within BooksProvider");
  }
  return ctx;
}
