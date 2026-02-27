export type GoogleBook = {
  id: string; // volumeId
  title: string;
  authors: string[];
  description?: string;
  categories?: string[];
  pageCount?: number;
  thumbnail?: string;
  publishedDate?: string;
  language?: string;
};
