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

// Book modeli ve status tipi
import type { Book, BookStatus } from "../types/book";

/**
 * Context'in dışarıya sunacağı değerler
 */
type BooksContextValue = {
  books: Book[];
  isHydrated: boolean;

  /**
   * Yeni kitap ekler
   * Eğer aynı kitap daha önce eklenmişse mevcut id'yi döner
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
   * id ile tek kitap getir
   */
  getById: (id: string) => Book | undefined;

  /**
   * Statüye göre filtrele
   */
  getByStatus: (status: BookStatus) => Book[];

  /**
   * Tüm kitapları temizle
   */
  clearAll: () => Promise<void>;
};

/**
 * AsyncStorage anahtarı
 */
const STORAGE_KEY = "BOOKS_V1";

/**
 * React Context
 */
const BooksContext = createContext<BooksContextValue | null>(null);

/**
 * Basit benzersiz id üretici
 */
function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Duplicate kontrolü için normalize yardımcı fonksiyon
 */
function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";

  return value.trim().toLocaleLowerCase("tr").replace(/\s+/g, " ");
}

/**
 * Kitap kaydını güvenli ortak yapıya çevirir
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
    ...b,

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

    note: typeof b?.note === "string" && b.note.length > 0 ? b.note : undefined,

    rating: typeof b?.rating === "number" ? b.rating : undefined,

    pagesTotal: safePagesTotal,

    pagesRead:
      typeof safePagesRead === "number"
        ? safePagesTotal
          ? Math.min(safePagesRead, safePagesTotal)
          : safePagesRead
        : undefined,

    /**
     * Sosyal alanlar
     */
    likes: typeof b?.likes === "number" ? b.likes : 0,
    isLiked: typeof b?.isLiked === "boolean" ? b.isLiked : false,
    comments: Array.isArray(b?.comments) ? b.comments : [],
  };
}

/**
 * Provider
 */
export function BooksProvider({ children }: { children: ReactNode }) {
  /**
   * Tüm kitap listesi
   */
  const [books, setBooks] = useState<Book[]>([]);

  /**
   * Storage'dan ilk veri yüklemesi tamamlandı mı?
   */
  const [isHydrated, setIsHydrated] = useState(false);

  /**
   * Uygulama açıldığında AsyncStorage'dan kayıtları oku
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
            setBooks((parsed as any[]).map(normalizeBook));
          } else {
            setBooks([]);
          }
        } else {
          setBooks([]);
        }
      } catch {
        /**
         * Hata olursa uygulama kırılmasın
         */
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
   * books değiştiğinde storage'a kaydet
   */
  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(books.map(normalizeBook)),
    ).catch(() => {
      // sessiz geç
    });
  }, [books, isHydrated]);

  /**
   * Yeni kitap ekleme
   */
  const addBook: BooksContextValue["addBook"] = (payload) => {
    const incomingGoogleId =
      typeof payload.googleId === "string" && payload.googleId.length > 0
        ? payload.googleId
        : undefined;

    /**
     * Önce googleId ile duplicate kontrolü
     */
    if (incomingGoogleId) {
      const existingByGoogleId = books.find(
        (b) => b.googleId === incomingGoogleId,
      );

      if (existingByGoogleId) {
        return existingByGoogleId.id;
      }
    }

    /**
     * Sonra title + author ile kontrol
     */
    const normalizedIncomingTitle = normalizeText(payload.title);
    const normalizedIncomingAuthor = normalizeText(payload.author);

    const existingByTitleAuthor = books.find((b) => {
      return (
        normalizeText(b.title) === normalizedIncomingTitle &&
        normalizeText(b.author) === normalizedIncomingAuthor
      );
    });

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
     * Yeni kitabı listenin başına ekle
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
   * id ile tek kitap getir
   */
  const getById: BooksContextValue["getById"] = (id) =>
    books.find((b) => b.id === id);

  /**
   * Duruma göre filtrele
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
