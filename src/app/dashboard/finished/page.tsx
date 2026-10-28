"use client";

import { useEffect, useState } from "react";
import type { SVGProps } from "react";
import BookCard from "@/components/books/BookCard";
import BookControls from "@/components/books/BookControls";
import BookFormPage from "@/components/books/BookFormPage";
import ReadingPageHeader from "@/components/ui/ReadingPageHeader";
import { theme } from "@/constants/theme";
import { toast } from "sonner";
import { Book, BookFormValues } from "@/types/books";
import { getBooks } from "@/lib/booksApi";
import BookListControls from "@/components/books/BookListControls";
import { DEFAULT_BOOK_LIST_FILTERS, filterAndSortBooks, type BookListFilters } from "@/lib/bookList";

const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function FinishedBooksPage() {
  // null = loading, [] = loaded but empty
  const [books, setBooks] = useState<Book[] | null>(null);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState<BookListFilters>(DEFAULT_BOOK_LIST_FILTERS);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const data = await getBooks("finished");
        setBooks(data.filter((book) => book.status === "finished"));
      } catch (err) {
        console.error(err);
        setBooks([]);
      }
    }

    fetchBooks();
  }, []);

  const handleAdd = () => {
    setIsAddModalOpen(true);
  };

  const handleAddBook = async (data: BookFormValues) => {
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "finished" }),
      });

      if (!res.ok) throw new Error("Book creation failed");

      const createdBook: Book = await res.json();
      setBooks((prev) => (prev ? [createdBook, ...prev] : [createdBook]));
      setIsAddModalOpen(false);
      toast.success("Book added successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add book");
    }
  };

  const handleEdit = (book: Book) => {
    setBookToEdit(book);
  };

  const handleSaveEdit = async (data: BookFormValues) => {
    if (!bookToEdit) return;

    try {
      const res = await fetch("/api/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, id: bookToEdit.id, status: bookToEdit.status }),
      });

      if (!res.ok) throw new Error("Book update failed");

      const updatedBook: Book = await res.json();
      setBooks((prev) => prev?.map((book) => book.id === updatedBook.id ? updatedBook : book) ?? []);
      setBookToEdit(null);
      toast.success("Book updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update book");
    }
  };

  // DELETE
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/books", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      setBooks((prev) => (prev ? prev.filter((b) => b.id !== id) : []));
      toast.success("Book deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete book");
    }
  };

  const visibleBooks = books ? filterAndSortBooks(books, filters) : [];

  return (
    <div
      className="p-6 min-h-screen"
      style={{ backgroundColor: theme.colors.pageBg }}
    >
      <ReadingPageHeader
        eyebrow="Stories completed"
        title="Finished Books"
        description="The last page is not the end; it is where the story becomes yours."
        detail="Keep the titles that stayed with you, and the moments you found inside them."
      />

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add a finished book"
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-2 shadow-xl sm:p-6"
          >
            <BookFormPage
              defaultStatus="finished"
              onSave={handleAddBook}
              onClose={() => setIsAddModalOpen(false)}
            />
          </div>
        </div>
      )}
      {bookToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit book details"
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-2 shadow-xl sm:p-6"
          >
            <BookFormPage
              key={bookToEdit.id}
              initialData={bookToEdit}
              defaultStatus={bookToEdit.status}
              formTitle="Edit Book Details"
              onSave={handleSaveEdit}
              onClose={() => setBookToEdit(null)}
            />
          </div>
        </div>
      )}

      {/* CONTENT */}
      {books === null ? (
        <p className="mt-20 text-center text-textSecondary">
          Loading your bookshelf…
        </p>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 text-center">
          <p
            className="text-xl font-semibold mb-2"
            style={{ color: theme.colors.textPrimary }}
          >
            No finished books yet… 👀
          </p>
          <p className="mb-6 text-sm text-textSecondary">
            Time to flex those reading muscles 💪📖
          </p>
          <button
            onClick={handleAdd}
            className="px-5 py-2 rounded-md shadow transition hover:opacity-90"
            style={{
              backgroundColor: theme.colors.sidebarBg,
              color: "#FFFFFF",
            }}
          >
            Add your first book
          </button>
        </div>
      ) : (
        <>
          <BookListControls
            books={books}
            filters={filters}
            onChange={setFilters}
            showFinishedDateSort
          />
          {visibleBooks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white px-5 py-10 text-center">
              <p className="font-semibold text-textPrimary">No finished books match these filters.</p>
              <button
                type="button"
                onClick={() => setFilters({ ...DEFAULT_BOOK_LIST_FILTERS })}
                className="mt-3 text-sm font-semibold text-accentHover hover:text-sidebar"
              >
                Clear search and filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {visibleBooks.map((book) => (
                <BookCard
                  key={book.id}
                  title={book.title}
                  author={book.author}
                  genre={book.genre}
                  rating={book.rating}
                  cover={book.imageUrl}
                  href={`/dashboard/finished/${book.id}`}
                  controls={
                    <BookControls
                      onEdit={() => handleEdit(book)}
                      onDelete={() => handleDelete(book.id)}
                    />
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating Add Button */}
      {
        books && books.length > 0 && (
          <button
            onClick={handleAdd}
            title="Add Book"
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex justify-center items-center shadow-lg transition hover:opacity-90"
            style={{
              backgroundColor: theme.colors.sidebarBg,
              color: "#FFFFFF",
            }}
          >
            <PlusIcon className="w-7 h-7" />
          </button>)}
    </div>
  );
}
