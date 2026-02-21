// types/book.ts
export type BookStatus = "reading" | "read" | "want";

export type Book = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;

  // opsiyonel alanlar (şimdilik boş bırakılabilir)
  pagesTotal?: number;
  pagesRead?: number;
  note?: string;
  rating?: number; // 1-5
  createdAt: number; // Date.now()
};
