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

/**
 * Context'in dışarı açtığı yapı
 */
type BooksContextValue = {
  books: Book[];
  isHydrated: boolean;

  /**
   * Yeni kitap ekler
   * Aynı kitap varsa yeni kayıt açmak yerine mevcut id'yi döner
   */
  addBook: (payload: Omit<Book, "id" | "createdAt">) => string;

  /**
   * Var olan kitabı günceller
   */
  updateBook: (id: string, patch: Partial<Omit<Book, "id">>) => void;

  /**
   * Kitabı siler
   */
  removeBook: (id: string) => void;

  /**
   * ID ile tek kitap getir
   */
  getById: (id: string) => Book | undefined;

  /**
   * Statüye göre filtrele
   */
  getByStatus: (status: BookStatus) => Book[];

  /**
   * Tüm kayıtları temizle
   */
  clearAll: () => Promise<void>;
};

/**
 * AsyncStorage key
 */
const STORAGE_KEY = "BOOKS_V1";

/**
 * Context
 */
const BooksContext = createContext<BooksContextValue | null>(null);

/**
 * Basit benzersiz id üretici
 */
function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Duplicate kontrolünde kullanılacak normalize yardımcı fonksiyonu
 *
 * Örn:
 * " George Orwell " -> "george orwell"
 */
function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLocaleLowerCase("tr").replace(/\s+/g, " ");
}

/**
 * Kitap verisini güvenli ve tutarlı ortak yapıya dönüştürür
 *
 * Storage'dan gelen bozuk / eksik veriler burada temizlenir.
 */
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
    /**
     * Zorunlu alanlar
     */
    id: typeof b?.id === "string" ? b.id : makeId(),
    title: typeof b?.title === "string" ? b.title : "",
    author: typeof b?.author === "string" ? b.author : "",

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

    /**
     * Opsiyonel alanlar
     */
    thumbnail:
      typeof b?.thumbnail === "string" && b.thumbnail.length > 0
        ? b.thumbnail
        : undefined,

    googleId:
      typeof b?.googleId === "string" && b.googleId.length > 0
        ? b.googleId
        : undefined,

    pagesTotal: safePagesTotal,

    /**
     * pagesRead toplam sayfayı aşmasın
     */
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
        ? b.note
        : undefined,

    shareText:
      typeof b?.shareText === "string" && b.shareText.trim().length > 0
        ? b.shareText
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

export function BooksProvider({ children }: { children: ReactNode }) {
  /**
   * Tüm kitaplar
   */
  const [books, setBooks] = useState<Book[]>([]);

  /**
   * Storage yüklemesi tamamlandı mı?
   */
  const [isHydrated, setIsHydrated] = useState(false);

  /**
   * İlk açılışta storage'dan kitapları yükle
   */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (!mounted) return;

        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          const safeBooks = Array.isArray(parsed)
            ? parsed.map(normalizeBook)
            : [];

          /**
           * Yeni -> eski sıralı tut
           */
          safeBooks.sort((a, b) => b.createdAt - a.createdAt);

          setBooks(safeBooks);
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

  /**
   * Kitap listesi değişince storage'a kaydet
   */
  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books)).catch(() => {
      // sessiz geç
    });
  }, [books, isHydrated]);

  /**
   * Yeni kitap ekle
   *
   * Duplicate kontrolü:
   * 1) googleId ile
   * 2) title + author normalize edilerek
   */
  const addBook: BooksContextValue["addBook"] = (payload) => {
    const existingByGoogleId =
      typeof payload.googleId === "string" && payload.googleId.length > 0
        ? books.find((b) => b.googleId === payload.googleId)
        : undefined;

    if (existingByGoogleId) {
      return existingByGoogleId.id;
    }

    const normalizedTitle = normalizeText(payload.title);
    const normalizedAuthor = normalizeText(payload.author);

    const existingByTitleAuthor = books.find(
      (b) =>
        normalizeText(b.title) === normalizedTitle &&
        normalizeText(b.author) === normalizedAuthor,
    );

    if (existingByTitleAuthor) {
      return existingByTitleAuthor.id;
    }

    /**
     * Yeni kayıt oluştur
     */
    const id = makeId();

    const newBook: Book = normalizeBook({
      id,
      createdAt: Date.now(),
      ...payload,
      likes: payload.likes ?? 0,
      isLiked: payload.isLiked ?? false,
      comments: payload.comments ?? [],
    });

    /**
     * Listenin başına ekle
     */
    setBooks((prev) => [newBook, ...prev].map(normalizeBook));

    return id;
  };

  /**
   * Kitap güncelle
   */
  const updateBook: BooksContextValue["updateBook"] = (id, patch) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? normalizeBook({ ...b, ...patch }) : b)),
    );
  };

  /**
   * Kitap sil
   */
  const removeBook: BooksContextValue["removeBook"] = (id) => {
    setBooks((prev) => prev.filter((b) => b.id !== id).map(normalizeBook));
  };

  /**
   * Tüm kayıtları temizle
   */
  const clearAll: BooksContextValue["clearAll"] = async () => {
    setBooks([]);

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // sessiz geç
    }
  };

  /**
   * ID ile tek kitap getir
   */
  const getById: BooksContextValue["getById"] = (id) =>
    books.find((b) => b.id === id);

  /**
   * Statüye göre filtrele
   */
  const getByStatus: BooksContextValue["getByStatus"] = (status) =>
    books.filter((b) => b.status === status);

  /**
   * Context value
   */
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

/**
 * Context hook
 */
export function useBooks() {
  const ctx = useContext(BooksContext);

  if (!ctx) {
    throw new Error("useBooks must be used within BooksProvider");
  }

  return ctx;
}
