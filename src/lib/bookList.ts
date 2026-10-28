import type { Book } from "@/types/books";

export type BookSortOrder =
  | "default"
  | "title-asc"
  | "title-desc"
  | "author-asc"
  | "author-desc"
  | "added-newest"
  | "added-oldest"
  | "rating-highest"
  | "rating-lowest"
  | "finished-newest"
  | "finished-oldest";

export interface BookListFilters {
  query: string;
  genre: string;
  status: Book["status"] | "all";
  sort: BookSortOrder;
}

export const DEFAULT_BOOK_LIST_FILTERS: BookListFilters = {
  query: "",
  genre: "all",
  status: "all",
  sort: "default",
};

export function filterAndSortBooks(
  books: Book[],
  filters: BookListFilters,
): Book[] {
  const query = filters.query.trim().toLocaleLowerCase();
  const matchingBooks = books.filter((book) => {
    const matchesQuery = !query
      || book.title.toLocaleLowerCase().includes(query)
      || book.author.toLocaleLowerCase().includes(query);
    const matchesGenre = filters.genre === "all" || book.genre === filters.genre;
    const matchesStatus = filters.status === "all" || book.status === filters.status;

    return matchesQuery && matchesGenre && matchesStatus;
  });

  if (filters.sort === "default") return matchingBooks;

  return matchingBooks
    .map((book, index) => ({ book, index }))
    .sort((first, second) => {
      const direction = filters.sort.endsWith("desc")
        || filters.sort.endsWith("newest")
        || filters.sort === "rating-highest"
        ? -1
        : 1;
      let comparison = 0;

      if (filters.sort.startsWith("title")) {
        comparison = first.book.title.localeCompare(second.book.title, undefined, { sensitivity: "base" });
      } else if (filters.sort.startsWith("author")) {
        comparison = first.book.author.localeCompare(second.book.author, undefined, { sensitivity: "base" });
      } else if (filters.sort.startsWith("added")) {
        comparison = new Date(first.book.createdAt).getTime() - new Date(second.book.createdAt).getTime();
      } else if (filters.sort.startsWith("finished")) {
        const firstDate = first.book.finishedAt || first.book.updatedAt;
        const secondDate = second.book.finishedAt || second.book.updatedAt;
        comparison = new Date(firstDate).getTime() - new Date(secondDate).getTime();
      } else if (filters.sort.startsWith("rating")) {
        comparison = first.book.rating - second.book.rating;
      }

      return comparison === 0 ? first.index - second.index : comparison * direction;
    })
    .map(({ book }) => book);
}