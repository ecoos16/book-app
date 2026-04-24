// types/post.ts

export type PostComment = {
  id: string;
  postId: string;
  text: string;
  createdAt: number;
  userId: string;
  userName: string;
  userAvatar?: string;
};

export type Post = {
  id: string;

  bookId?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookThumbnail?: string;

  userId: string;
  userName: string;
  userAvatar?: string;

  shareText: string;

  createdAt: number;
  updatedAt?: number;

  likes: number;
  isLiked?: boolean;
  comments: PostComment[];

  sourceType?: "manual" | "book-share";
};
