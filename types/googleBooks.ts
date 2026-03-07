export type GoogleBook = {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  categories?: string[];
  pageCount?: number;
  thumbnail?: string;
  publishedDate?: string;
  language?: string;
  source?: "google" | "openlibrary";
};
