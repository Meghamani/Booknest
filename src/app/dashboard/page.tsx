"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Bookmark, BookOpen, Check, Heart, Library, Sparkles, Target } from "lucide-react";
import ReadingPageHeader from "@/components/ui/ReadingPageHeader";
import DashboardOnboarding from "@/components/ui/DashboardOnboarding";
import { getBooks } from "@/lib/booksApi";
import { Book } from "@/types/books";
import { toast } from "sonner";

const shelves = [
  {
    title: "My Library",
    description: "Books waiting between the pages.",
    href: "/dashboard/library",
    status: "library" as const,
    icon: Library,
    color: "bg-[#E6F0E9] text-[#244A46]",
    iconColor: "text-[#548C83]",
  },
  {
    title: "Finished Books",
    description: "Stories that have stayed with you.",
    href: "/dashboard/finished",
    status: "finished" as const,
    icon: Check,
    color: "bg-[#FCE9DF] text-[#733F31]",
    iconColor: "text-[#E9785B]",
  },
  {
    title: "Wishlist",
    description: "Good things to read, when the time comes.",
    href: "/dashboard/wishlist",
    status: "wishlist" as const,
    icon: Bookmark,
    color: "bg-[#FBF0D7] text-[#73591F]",
    iconColor: "text-[#B78930]",
  },
];

type Recommendation = {
  title: string;
  author: string;
  genre: string;
  reason: string;
  coverUrl: string | null;
};

type RecommendationCache = {
  genres: string[];
  recommendations: Recommendation[];
};

export default function DashboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [userId, setUserId] = useState("");
  const [readingGoal, setReadingGoal] = useState(12);
  const [favoriteGenreCount, setFavoriteGenreCount] = useState(0);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationError, setRecommendationError] = useState("");
  const [hasLoadedRecommendations, setHasLoadedRecommendations] = useState(false);
  const [savingRecommendationTitles, setSavingRecommendationTitles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBooks() {
      try {
        const [bookResult, profileResponse] = await Promise.allSettled([
          getBooks(),
          fetch("/api/profile").then(async (response) => {
            if (!response.ok) throw new Error("Could not load profile preferences");
            return response.json();
          }),
        ]);
        if (bookResult.status === "fulfilled" && !cancelled) {
          setBooks(bookResult.value);
        } else if (bookResult.status === "rejected" && !cancelled) {
          console.error(bookResult.reason);
          setHasError(true);
        }
        if (profileResponse.status === "fulfilled" && !cancelled) {
          setUserId(profileResponse.value.user.id);
          setReadingGoal(profileResponse.value.user.readingGoal || 12);
          const genres = profileResponse.value.user.favoriteGenres ?? [];
          setFavoriteGenres(genres);
          setFavoriteGenreCount(genres.length);
          setHasLoadedProfile(true);
        } else if (profileResponse.status === "rejected" && !cancelled) {
          setRecommendationError("Could not load your favorite genres for recommendations.");
          setHasLoadedProfile(true);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setHasError(true);
          setHasLoadedProfile(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadBooks();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedProfile || !userId || favoriteGenres.length === 0 || recommendationError) return;
    let cancelled = false;

    async function generateRecommendations() {
      const normalizedGenres = favoriteGenres.map((genre) => genre.trim().toLocaleLowerCase()).sort();
      const cacheKey = `book-hub:recommendations:${userId}`;

      try {
        let cached: RecommendationCache | null = null;
        try {
          const cachedValue = window.localStorage.getItem(cacheKey);
          cached = cachedValue ? JSON.parse(cachedValue) as RecommendationCache : null;
        } catch {
          cached = null;
        }
        const cachedGenresMatch = cached && Array.isArray(cached.genres)
          && JSON.stringify(cached.genres) === JSON.stringify(normalizedGenres);
        if (cached && cachedGenresMatch && Array.isArray(cached.recommendations) && cached.recommendations.length >= 3) {
          if (!cancelled) {
            setRecommendations(cached.recommendations);
            setHasLoadedRecommendations(true);
          }
          return;
        }

        const response = await fetch("/api/recommendations", { method: "POST" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not generate recommendations.");
        if (!cancelled) {
          const nextRecommendations = result.recommendations as Recommendation[];
          setRecommendations(nextRecommendations);
          try {
            window.localStorage.setItem(cacheKey, JSON.stringify({
              genres: normalizedGenres,
              recommendations: nextRecommendations,
            } satisfies RecommendationCache));
          } catch (storageError) {
            console.error("[dashboard] Could not cache recommendations", storageError);
          }
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) setRecommendationError(error instanceof Error ? error.message : "Could not generate recommendations.");
      } finally {
        if (!cancelled) setHasLoadedRecommendations(true);
      }
    }

    void generateRecommendations();
    return () => {
      cancelled = true;
    };
  }, [favoriteGenres, hasLoadedProfile, recommendationError, userId]);

  async function addRecommendationToWishlist(recommendation: Recommendation) {
    const normalizedTitle = recommendation.title.trim().toLocaleLowerCase();
    if (books.some((book) => book.status === "wishlist" && book.title.trim().toLocaleLowerCase() === normalizedTitle)) {
      return;
    }

    setSavingRecommendationTitles((titles) => [...titles, normalizedTitle]);
    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recommendation.title,
          author: recommendation.author,
          genre: recommendation.genre,
          status: "wishlist",
          rating: 0,
          imageUrl: recommendation.coverUrl || "",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not add this book to your wishlist.");

      setBooks((currentBooks) => [...currentBooks, result as Book]);
      toast.success("Added to your wishlist");
    } catch (error) {
      console.error("[dashboard] Could not save recommendation", error);
      toast.error(error instanceof Error ? error.message : "Could not add this book to your wishlist.");
    } finally {
      setSavingRecommendationTitles((titles) => titles.filter((title) => title !== normalizedTitle));
    }
  }

  const recentBooks = [...books]
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .slice(0, 4);
  const currentYear = new Date().getFullYear();
  const booksReadThisYear = books.filter((book) =>
    book.status === "finished" && new Date(book.finishedAt || book.updatedAt).getFullYear() === currentYear
  ).length;
  const remainingBooks = Math.max(0, readingGoal - booksReadThisYear);
  const goalProgress = Math.min(100, Math.round((booksReadThisYear / readingGoal) * 100));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-10">
      <DashboardOnboarding />
      <ReadingPageHeader
        eyebrow="Make yourself at home"
        title="Welcome to your reading room."
        description="A quiet place for the stories you are reading, the ones you have finished, and all the ones you cannot wait to begin."
        detail="There is no right pace here. Just turn to the page that feels right today."
      />

      <section aria-labelledby="shelves-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accentHover">Your shelves</p>
            <h2 id="shelves-heading" className="mt-1 font-serif text-2xl text-textPrimary">Where would you like to wander?</h2>
          </div>
          <Link href="/dashboard/insights" className="inline-flex items-center gap-1 text-sm font-semibold text-accentHover transition hover:text-sidebar">
            Reading insights <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {shelves.map((shelf) => {
            const Icon = shelf.icon;
            const count = books.filter((book) => shelf.status === "library"
              ? book.status === "library" || book.status === "finished"
              : book.status === shelf.status).length;

            return (
              <Link
                key={shelf.href}
                href={shelf.href}
                className={`group flex min-h-36 items-center justify-between gap-4 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-md ${shelf.color}`}
              >
                <div className="min-w-0">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon size={18} className={shelf.iconColor} aria-hidden="true" />
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] opacity-75">
                      {isLoading ? "Your shelf" : `${count} ${count === 1 ? "book" : "books"}`}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{shelf.title}</h3>
                  <p className="mt-1 text-sm leading-5 opacity-80">{shelf.description}</p>
                </div>
                <ArrowUpRight size={20} className="shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="yearly-goal-heading" className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(220px,0.8fr)]">
        <div className="rounded-2xl bg-sidebar p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondaryAccent">
                <Target size={15} aria-hidden="true" /> This year’s reading goal
              </p>
              <h2 id="yearly-goal-heading" className="mt-2 font-serif text-2xl">A year of good stories</h2>
            </div>
            <p className="rounded-full border border-white/20 px-3 py-1.5 text-sm font-semibold tabular-nums">
              {booksReadThisYear} <span className="font-normal text-white/70">/ {readingGoal}</span>
            </p>
          </div>

          <div
            className="mt-5 h-3 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-label={`Yearly reading goal: ${booksReadThisYear} of ${readingGoal} books`}
            aria-valuemin={0}
            aria-valuemax={readingGoal}
            aria-valuenow={Math.min(booksReadThisYear, readingGoal)}
          >
            <div className="h-full rounded-full bg-secondaryAccent transition-[width] duration-500" style={{ width: `${goalProgress}%` }} />
          </div>

          <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-[#E1ECE6]">
            <Sparkles size={16} className="mt-1 shrink-0 text-secondaryAccent" aria-hidden="true" />
            {booksReadThisYear === 0
              ? `You haven’t started your ${currentYear} goal yet. Read your first book to begin working toward ${readingGoal}.`
              : remainingBooks === 0
                ? `You completed your ${currentYear} reading goal. Amazing work, and here’s to the next story!`
                : `${remainingBooks} ${remainingBooks === 1 ? "book" : "books"} to go to complete your ${currentYear} goal. Keep turning those pages!`}
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FCE9DF] text-[#E9785B]">
            <Heart size={21} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-textSecondary">Favorite genres</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-textPrimary">{favoriteGenreCount}</p>
            <p className="text-xs text-textSecondary">{favoriteGenreCount === 1 ? "genre saved" : "genres saved"}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="recommendations-heading" className="border-t border-border pt-7">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accentHover">
              <Sparkles size={14} aria-hidden="true" /> Curated for your taste
            </p>
            <h2 id="recommendations-heading" className="mt-1 font-serif text-2xl text-textPrimary">For your next chapter</h2>
            <p className="mt-1 text-sm text-textSecondary">AI book picks shaped by your favorite genres.</p>
          </div>
        </div>

        {!favoriteGenres.length ? (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[#C9D9CE] bg-white/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-textSecondary">{hasLoadedProfile ? "Choose a few favorite genres in your profile to get recommendations tailored to you." : "Loading your reading preferences…"}</p>
            {hasLoadedProfile && <Link href="/dashboard/profile" className="shrink-0 text-sm font-semibold text-accentHover hover:text-sidebar">Choose genres <ArrowUpRight size={15} className="ml-1 inline" aria-hidden="true" /></Link>}
          </div>
        ) : recommendationError ? (
          <div role="alert" className="rounded-xl border border-[#F1C4B8] bg-[#FFF6F2] px-5 py-4 text-sm leading-6 text-[#89594D]">
            {recommendationError}
          </div>
        ) : !hasLoadedRecommendations ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[5/7] rounded-xl bg-accent" />
                <div className="mt-3 h-4 w-3/4 rounded bg-accent" />
                <div className="mt-2 h-3 w-1/2 rounded bg-accent" />
              </div>
            ))}
          </div>
        ) : recommendations.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recommendations.map((recommendation) => {
              const normalizedTitle = recommendation.title.trim().toLocaleLowerCase();
              const isWishlisted = books.some((book) => book.status === "wishlist" && book.title.trim().toLocaleLowerCase() === normalizedTitle);
              const isSaving = savingRecommendationTitles.includes(normalizedTitle);

              return (
              <article key={`${recommendation.title}-${recommendation.author}`} className="group min-w-0">
                <div className="relative aspect-[5/7] overflow-hidden rounded-xl bg-accent shadow-sm">
                  <Image
                    src={recommendation.coverUrl || "/default-img.png"}
                    alt={`Cover of ${recommendation.title}`}
                    fill
                    unoptimized={Boolean(recommendation.coverUrl)}
                    sizes="(max-width: 640px) 45vw, 25vw"
                    className="object-cover transition duration-300 hover:scale-[1.03]"
                  />
                  <span className="absolute left-2 top-2 max-w-[calc(100%-3rem)] truncate rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-accentHover">{recommendation.genre}</span>
                  <button
                    type="button"
                    title={isWishlisted ? "Already in your wishlist" : "Add to wishlist"}
                    aria-label={isWishlisted ? `${recommendation.title} is in your wishlist` : `Add ${recommendation.title} to wishlist`}
                    disabled={isWishlisted || isSaving}
                    onClick={() => void addRecommendationToWishlist(recommendation)}
                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#733F31] shadow-sm transition hover:scale-105 hover:bg-white disabled:cursor-default disabled:opacity-100"
                  >
                    <Heart size={18} aria-hidden="true" fill={isWishlisted ? "currentColor" : "none"} />
                  </button>
                </div>
                <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-textPrimary">{recommendation.title}</h3>
                <p className="line-clamp-1 text-xs text-textSecondary">{recommendation.author}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-4 text-textSecondary">{recommendation.reason}</p>
              </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-white px-5 py-6 text-sm leading-6 text-textSecondary">
            We couldn’t find fresh suggestions from your favorite genres this time. Try again later.
          </div>
        )}
      </section>

      <section aria-labelledby="recent-heading" className="border-t border-border pt-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accentHover">Fresh on the shelf</p>
            <h2 id="recent-heading" className="mt-1 font-serif text-2xl text-textPrimary">Recently added</h2>
          </div>
          <Link href="/dashboard/library" className="inline-flex items-center gap-1 text-sm font-semibold text-accentHover transition hover:text-sidebar">
            Visit your library <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {hasError ? (
          <p className="rounded-xl border border-border bg-white px-5 py-8 text-center text-sm text-textSecondary">
            Your shelves could not be loaded right now. Please refresh to try again.
          </p>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="aspect-[5/7] animate-pulse rounded-xl bg-accent" />
            ))}
          </div>
        ) : recentBooks.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#C9D9CE] bg-white/70 px-5 py-10 text-center">
            <BookOpen size={28} className="text-accentHover" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-textPrimary">Your reading room is ready.</h3>
            <p className="mt-1 max-w-md text-sm leading-6 text-textSecondary">
              Add a book to your library, save a future read, or begin with a story you have already finished.
            </p>
            <Link href="/dashboard/library" className="mt-4 rounded-lg bg-sidebar px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentHover">
              Explore your library
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recentBooks.map((book) => {
              const shelf = shelves.find((item) => item.status === book.status);
              return (
                <Link key={book.id} href={shelf?.href ?? "/dashboard/library"} className="group min-w-0">
                  <div className="relative aspect-[5/7] overflow-hidden rounded-xl bg-[#E6F0E9] shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-md">
                    <Image
                      src={book.imageUrl?.trim() || "/default-img.png"}
                      alt={`Cover of ${book.title}`}
                      fill
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 20vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-2 min-w-0">
                    <h3 className="truncate text-sm font-semibold text-textPrimary">{book.title}</h3>
                    <p className="truncate text-xs text-textSecondary">{book.author}</p>
                    <p className="mt-1 text-xs font-medium text-accentHover">{shelf?.title}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
