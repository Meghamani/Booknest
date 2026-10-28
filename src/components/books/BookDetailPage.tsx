"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { theme } from "@/constants/theme";
import { getBook } from "@/lib/booksApi";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import BookFormPage from "@/components/books/BookFormPage";
import { Book, BookFormValues } from "@/types/books";

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBook() {
      try {
        const result = await getBook(id);
        if (!cancelled) setBook(result);
      } catch (error) {
        console.error(error);
        if (!cancelled) toast.error("Failed to load book details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchBook();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!book) return;

    try {
      const response = await fetch("/api/books", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: book.id }),
      });

      if (!response.ok) throw new Error("Delete failed");

      toast.success("Book deleted");
      router.push(`/dashboard/${book.status}`);
    } catch (error) {
      console.error(error);
      toast.error("Could not delete book");
    }
  };

  const handleSaveEdit = async (data: BookFormValues) => {
    if (!book) return;

    try {
      const response = await fetch("/api/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, id: book.id, status: book.status }),
      });

      if (!response.ok) throw new Error("Book update failed");

      setBook(await response.json());
      setIsEditModalOpen(false);
      toast.success("Book updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update book");
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse p-6" aria-label="Loading book details">
        <div className="mb-6 h-64 rounded-xl bg-accent" />
        <div className="mb-3 h-5 w-1/2 bg-accent" />
        <div className="mb-6 h-5 w-1/4 bg-accent" />
        <div className="h-32 rounded-lg bg-accent" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-serif text-2xl text-textPrimary">This book is not on your shelf.</p>
        <Link href="/dashboard/library" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accentHover hover:text-sidebar">
          <ArrowLeft size={16} aria-hidden="true" /> Back to your library
        </Link>
      </div>
    );
  }

  const shelfName = book.status === "finished"
    ? "Finished books"
    : book.status === "wishlist"
      ? "Wishlist"
      : "My library";
  const storyNote = book.status === "finished"
    ? "A story brought to its final page."
    : book.status === "wishlist"
      ? "A story saved for the right moment."
      : "A story waiting in your reading room.";
  const addedDate = new Date(book.createdAt).toLocaleDateString("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:py-10" style={{ backgroundColor: theme.colors.pageBg }}>
      <article className="mx-auto w-full max-w-5xl">
        <Link
          href={`/dashboard/${book.status}`}
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-textSecondary transition hover:text-accentHover"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to {shelfName.toLowerCase()}
        </Link>

        <div className="grid items-start gap-8 md:grid-cols-[minmax(220px,0.72fr)_minmax(0,1.28fr)] md:gap-12 lg:gap-16">
          <div className="mx-auto w-full max-w-[320px] md:sticky md:top-24">
            <div className="relative aspect-[5/7] overflow-hidden rounded-lg bg-accent shadow-[0_20px_50px_rgba(28,50,43,0.18)] ring-1 ring-black/5">
              <Image
                src={book.imageUrl || "/default-img.png"}
                alt={`Cover of ${book.title}`}
                fill
                sizes="(max-width: 768px) 80vw, 30vw"
                className="object-cover"
              />
            </div>
            <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-accentHover">{shelfName}</p>
          </div>

          <div className="min-w-0 pt-1 md:pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accentHover">{storyNote}</p>
            <h1 className="mt-3 break-words font-serif text-4xl leading-tight text-textPrimary sm:text-5xl">{book.title}</h1>
            <p className="mt-3 text-lg text-textSecondary">by {book.author}</p>

            <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-border py-5 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-textSecondary">Genre</p>
                <p className="mt-1 text-sm font-medium text-textPrimary">{book.genre || "Unsorted"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-textSecondary">Status</p>
                <p className="mt-1 text-sm font-medium capitalize text-textPrimary">{book.status}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-textSecondary">Added</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-textPrimary"><CalendarDays size={14} aria-hidden="true" />{addedDate}</p>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-textSecondary">Your rating</p>
                {book.rating > 0 ? (
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-textPrimary">
                    <span className="tracking-[0.1em] text-[#B78930]" aria-label={`Rated ${book.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, index) => index < book.rating ? "★" : "☆").join("")}
                    </span>
                    <span>{book.rating}/5</span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-textSecondary">Not rated yet</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: theme.colors.sidebarBg }}
              >
                <Pencil size={15} aria-hidden="true" /> Edit details
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmationOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-textSecondary transition hover:border-coral hover:text-coral"
              >
                <Trash2 size={15} aria-hidden="true" /> Remove book
              </button>
            </div>
          </div>
        </div>

        {(book.review || book.notes) ? (
          <div className="mt-10 grid gap-8 border-t border-border pt-8 md:grid-cols-2 md:gap-12">
            {book.review && (
              <section aria-labelledby="book-review-heading">
                <h2 id="book-review-heading" className="inline-flex items-center gap-2 font-serif text-2xl text-textPrimary"><Star size={17} className="text-secondaryAccent" aria-hidden="true" />Review</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-textSecondary">{book.review}</p>
              </section>
            )}
            {book.notes && (
              <section aria-labelledby="book-notes-heading">
                <h2 id="book-notes-heading" className="inline-flex items-center gap-2 font-serif text-2xl text-textPrimary"><BookOpen size={17} className="text-accentHover" aria-hidden="true" />Notes &amp; quotes</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-textSecondary">{book.notes}</p>
              </section>
            )}
          </div>
        ) : (
          <div className="mt-10 border-t border-border pt-6 text-sm text-textSecondary">
            <p className="font-serif text-xl text-textPrimary">Leave a thought for later.</p>
            <p className="mt-1">Your review and notes can be added whenever you are ready.</p>
          </div>
        )}

        <ConfirmationDialog
          open={isDeleteConfirmationOpen}
          title="Delete book?"
          message="Are you sure you want to delete this book?"
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
          onCancel={() => setIsDeleteConfirmationOpen(false)}
          onConfirm={() => {
            setIsDeleteConfirmationOpen(false);
            void handleDelete();
          }}
        />

        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div role="dialog" aria-modal="true" aria-label="Edit book details" className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-2 shadow-xl sm:p-6">
              <BookFormPage
                key={book.id}
                initialData={book}
                defaultStatus={book.status}
                formTitle="Edit Book Details"
                onSave={handleSaveEdit}
                onClose={() => setIsEditModalOpen(false)}
              />
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
