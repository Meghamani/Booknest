"use client";

import { Search, X } from "lucide-react";
import type { Book } from "@/types/books";
import type { BookListFilters, BookSortOrder } from "@/lib/bookList";

interface BookListControlsProps {
  books: Book[];
  filters: BookListFilters;
  onChange: (filters: BookListFilters) => void;
  showStatusFilter?: boolean;
  showFinishedDateSort?: boolean;
}

const baseSortOptions: { value: BookSortOrder; label: string }[] = [
  { value: "default", label: "Recently added order" },
  { value: "title-asc", label: "Title: A to Z" },
  { value: "title-desc", label: "Title: Z to A" },
  { value: "author-asc", label: "Author: A to Z" },
  { value: "author-desc", label: "Author: Z to A" },
  { value: "added-newest", label: "Date added: newest" },
  { value: "added-oldest", label: "Date added: oldest" },
  { value: "rating-highest", label: "Rating: highest first" },
  { value: "rating-lowest", label: "Rating: lowest first" },
];

export default function BookListControls({
  books,
  filters,
  onChange,
  showStatusFilter = false,
  showFinishedDateSort = false,
}: BookListControlsProps) {
  const genres = [...new Set(books.map((book) => book.genre.trim()).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second, undefined, { sensitivity: "base" }));
  const sortOptions = showFinishedDateSort
    ? [
      ...baseSortOptions,
      { value: "finished-newest" as const, label: "Date finished: newest" },
      { value: "finished-oldest" as const, label: "Date finished: oldest" },
    ]
    : baseSortOptions;

  function updateFilter<Key extends keyof BookListFilters>(key: Key, value: BookListFilters[Key]) {
    onChange({ ...filters, [key]: value });
  }

  function clearFilters() {
    onChange({ query: "", genre: "all", status: "all", sort: "default" });
  }

  const hasActiveFilters = filters.query.trim() !== ""
    || filters.genre !== "all"
    || filters.status !== "all"
    || filters.sort !== "default";

  return (
    <section aria-label="Search, filter, and sort books" className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <label className="relative min-w-0 sm:mr-auto sm:w-64">
        <span className="sr-only">Search title or author</span>
        <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" aria-hidden="true" />
        <input
          type="search"
          value={filters.query}
          onChange={(event) => updateFilter("query", event.target.value)}
          placeholder="Search title or author"
          className="w-full rounded-md bg-white/75 py-2.5 pl-10 pr-3 text-sm text-textPrimary outline-none transition focus-visible:ring-2 focus-visible:ring-accentHover"
        />
      </label>

      <label className="min-w-0 sm:w-40">
        <span className="sr-only">Filter by genre</span>
        <select
          value={filters.genre}
          onChange={(event) => updateFilter("genre", event.target.value)}
          className="w-full rounded-md bg-white/75 px-3 py-2.5 text-sm text-textPrimary outline-none transition focus-visible:ring-2 focus-visible:ring-accentHover"
        >
          <option value="all">All genres</option>
          {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
        </select>
      </label>

      {showStatusFilter && (
        <label className="min-w-0 sm:w-40">
          <span className="sr-only">Filter by shelf status</span>
          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value as BookListFilters["status"])}
            className="w-full rounded-md bg-white/75 px-3 py-2.5 text-sm text-textPrimary outline-none transition focus-visible:ring-2 focus-visible:ring-accentHover"
          >
            <option value="all">All statuses</option>
            <option value="library">In progress</option>
            <option value="finished">Finished</option>
          </select>
        </label>
      )}

      <label className="min-w-0 sm:w-48">
        <span className="sr-only">Sort books</span>
        <select
          value={filters.sort}
          onChange={(event) => updateFilter("sort", event.target.value as BookSortOrder)}
          className="w-full rounded-md bg-white/75 px-3 py-2.5 text-sm text-textPrimary outline-none transition focus-visible:ring-2 focus-visible:ring-accentHover"
        >
          {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 px-2 text-sm font-medium text-accentHover transition hover:text-sidebar"
        >
          <X size={15} aria-hidden="true" /> Clear
        </button>
      )}
    </section>
  );
}