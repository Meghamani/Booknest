import { Book } from "@/types/books";

const BOOKS_API = "/api/books";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Books API request failed: ${response.status}`);
  }

  return response.json();
}

export async function getBooks(status?: Book["status"]): Promise<Book[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(`${BOOKS_API}${query}`);
  const books = await parseResponse<unknown>(response);

  return Array.isArray(books) ? (books as Book[]) : [];
}

export async function getBook(id: string): Promise<Book> {
  const response = await fetch(`${BOOKS_API}/${id}`);
  return parseResponse<Book>(response);
}

