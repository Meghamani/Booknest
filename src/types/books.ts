// src/types/books.ts
export interface BookFormValues {
  title: string;
  author: string;
  genre: string;
  status: "library" | "finished" | "wishlist";
  rating: number;
  imageUrl?: string;
  review?: string;
  notes?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  status: "library" | "finished" | "wishlist";
  rating: number;
  imageUrl: string;
  review?: string;
  notes?: string;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
