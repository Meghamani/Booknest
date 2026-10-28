"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getBooks } from "@/lib/booksApi";
import { Book } from "@/types/books";
import ReadingPageHeader from "@/components/ui/ReadingPageHeader";

type Period = "week" | "month" | "year";
type ChartPoint = { label: string; date: Date; completed: number };

const periodOptions: { value: Period; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
];

const shelfColors: Record<Book["status"], string> = {
  finished: "#E9785B",
  library: "#548C83",
  wishlist: "#E8B653",
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getChartPoints(period: Period, now: Date): ChartPoint[] {
  if (period === "week") {
    const today = startOfDay(now);
    const mondayOffset = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        label: date.toLocaleDateString("en", { weekday: "short" }),
        date,
        completed: 0,
      };
    });
  }

  if (period === "month") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth(), index + 1);
      return { label: String(index + 1), date, completed: 0 };
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), index, 1);
    return {
      label: date.toLocaleDateString("en", { month: "short" }),
      date,
      completed: 0,
    };
  });
}

function getActivityDate(book: Book) {
  return new Date(book.updatedAt || book.createdAt);
}

function getPageTitle(period: Period, date: Date) {
  if (period === "week") return "Your week in pages";
  if (period === "month") {
    return date.toLocaleDateString("en", { month: "long" }) + " reading rhythm";
  }
  return `${date.getFullYear()} in books`;
}

export default function InsightsPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBooks() {
      try {
        const result = await getBooks();
        if (!cancelled) setBooks(result);
      } catch (error) {
        console.error(error);
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadBooks();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date();
  const chartPoints = getChartPoints(period, today);
  const periodStart = chartPoints[0]?.date ?? startOfDay(today);
  const periodEnd = period === "year"
    ? new Date(today.getFullYear() + 1, 0, 1)
    : period === "month"
      ? new Date(today.getFullYear(), today.getMonth() + 1, 1)
      : new Date(chartPoints[6]?.date ?? today);

  if (period === "week") periodEnd.setDate(periodEnd.getDate() + 1);

  const finishedBooks = books.filter((book) => book.status === "finished");
  const periodFinishedBooks = finishedBooks.filter((book) => {
    const activityDate = getActivityDate(book);
    return activityDate >= periodStart && activityDate < periodEnd;
  });

  for (const book of periodFinishedBooks) {
    const activityDate = getActivityDate(book);
    let point: ChartPoint | undefined;

    if (period === "year") {
      point = chartPoints[activityDate.getMonth()];
    } else {
      point = chartPoints.find((item) => item.date.getTime() === startOfDay(activityDate).getTime());
    }

    if (point) point.completed += 1;
  }

  const shelfData = (["finished", "library", "wishlist"] as const)
    .map((status) => ({
      name: status === "finished" ? "Finished" : status === "library" ? "In library" : "Wishlist",
      value: books.filter((book) => book.status === status).length,
      color: shelfColors[status],
    }))
    .filter((entry) => entry.value > 0);

  const genreCounts = finishedBooks.reduce<Record<string, number>>((counts, book) => {
    const genre = book.genre?.trim() || "Unsorted";
    counts[genre] = (counts[genre] ?? 0) + 1;
    return counts;
  }, {});
  const topGenres = Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((first, second) => second.count - first.count || first.genre.localeCompare(second.genre))
    .slice(0, 5);
  const mostReadGenre = topGenres[0];

  const averageRating = finishedBooks.length
    ? finishedBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / finishedBooks.length
    : 0;
  const periodDescription = period === "week" ? "this week" : period === "month" ? "this month" : "this year";
  const formattedPeriod = period === "week"
    ? "Monday to Sunday"
    : period === "month"
      ? today.toLocaleDateString("en", { month: "long", year: "numeric" })
      : String(today.getFullYear());

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 pb-10">
      <ReadingPageHeader
        eyebrow="A little perspective"
        title="Your reading, in full color."
        description="Every finished story becomes part of your own. Follow the pages you have turned, notice the genres you return to, and make room for whatever comes next."
        detail={isLoading ? "Gathering your reading history…" : hasError ? "Your reading history could not be loaded." : mostReadGenre ? `You have a soft spot for ${mostReadGenre.genre.toLowerCase()} so far.` : "Your next favorite genre is waiting to be discovered."}
      />

      <section aria-label="Reading period" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#283B37]">Reading snapshot</h2>
          <p className="mt-1 text-sm text-[#75817C]">A view of your shelf and recent reading pace.</p>
        </div>
        <div className="inline-flex w-full rounded-xl border border-[#D9E2DC] bg-white p-1 sm:w-auto" role="group" aria-label="Choose reading period">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              aria-pressed={period === option.value}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition sm:flex-none sm:px-4 ${period === option.value ? "bg-[#244A46] text-white shadow-sm" : "text-[#52635D] hover:bg-[#EEF4EF]"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {hasError ? (
        <div className="rounded-2xl border border-[#F1C4B8] bg-[#FFF6F2] px-5 py-8 text-center text-sm text-[#89594D]">
          We could not load your book stats just now. Refresh the page to try again.
        </div>
      ) : (
        <>
          <section aria-label="Book totals" className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-2xl bg-[#E6F0E9] p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#517464]">Finished</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-[#244A46]">{isLoading ? "–" : finishedBooks.length}</p>
              <p className="mt-1 text-xs text-[#648071]">{isLoading ? "Loading" : `${periodFinishedBooks.length} ${periodDescription}`}</p>
            </div>
            <div className="rounded-2xl bg-[#FCE9DF] p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#A95C45]">In library</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-[#733F31]">{isLoading ? "–" : books.filter((book) => book.status === "library").length}</p>
              <p className="mt-1 text-xs text-[#A06A58]">On your current shelf</p>
            </div>
            <div className="rounded-2xl bg-[#FBF0D7] p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A762A]">Wishlist</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-[#73591F]">{isLoading ? "–" : books.filter((book) => book.status === "wishlist").length}</p>
              <p className="mt-1 text-xs text-[#967A3E]">Stories still to come</p>
            </div>
            <div className="rounded-2xl bg-[#E6F0E9] p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#517464]">Average rating</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-[#244A46]">{isLoading || !finishedBooks.length ? "–" : averageRating.toFixed(1)}<span className="ml-1 text-lg text-[#648071]">{!isLoading && finishedBooks.length ? "/5" : ""}</span></p>
              <p className="mt-1 text-xs text-[#648071]">Across finished books</p>
            </div>
          </section>

          <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
            <div className="min-w-0 rounded-2xl border border-[#E7E6DE] bg-white p-4 shadow-[0_8px_25px_rgba(49,63,55,0.04)] sm:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#283B37]">{getPageTitle(period, today)}</h2>
                  <p className="mt-1 text-sm text-[#7B8580]">Books marked finished · {formattedPeriod}</p>
                </div>
                <div className="rounded-full bg-[#FCE9DF] px-3 py-1.5 text-sm font-semibold text-[#A95C45]">
                  {periodFinishedBooks.length} {periodFinishedBooks.length === 1 ? "book" : "books"}
                </div>
              </div>
              <div className="h-[250px] w-full sm:h-[300px]">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-[#8A938E]">Loading your reading pace…</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPoints} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E9785B" stopOpacity={0.32} />
                          <stop offset="95%" stopColor="#E9785B" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#EDF0EB" strokeDasharray="4 5" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#7B8580", fontSize: 12 }} interval={period === "month" ? 4 : 0} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#7B8580", fontSize: 12 }} width={34} />
                      <Tooltip
                        cursor={{ stroke: "#E9785B", strokeDasharray: "4 4" }}
                        contentStyle={{ border: "1px solid #E7E6DE", borderRadius: 12, boxShadow: "0 8px 20px rgba(40,59,55,0.08)" }}
                        labelStyle={{ color: "#283B37", fontWeight: 600 }}
                        formatter={(value) => [`${value} ${value === 1 ? "book" : "books"}`, "Finished"]}
                      />
                      <Area type="monotone" dataKey="completed" stroke="#D9654B" strokeWidth={3} fill="url(#completedFill)" activeDot={{ r: 6, fill: "#D9654B", stroke: "#fff", strokeWidth: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-[#E7E6DE] bg-white p-4 shadow-[0_8px_25px_rgba(49,63,55,0.04)] sm:p-6">
              <div>
                <h2 className="text-lg font-semibold text-[#283B37]">Your shelves</h2>
                <p className="mt-1 text-sm text-[#7B8580]">Where your books are right now</p>
              </div>
              {isLoading ? (
                <div className="flex h-[220px] items-center justify-center text-sm text-[#8A938E]">Counting your books…</div>
              ) : books.length === 0 ? (
                <div className="flex h-[220px] items-center justify-center text-center text-sm text-[#8A938E]">Your first book will appear here.</div>
              ) : (
                <>
                  <div className="relative mx-auto mt-2 h-[220px] max-w-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={shelfData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={92} paddingAngle={4} stroke="none">
                          {shelfData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ border: "1px solid #E7E6DE", borderRadius: 12 }} formatter={(value, name) => [`${value} ${value === 1 ? "book" : "books"}`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-semibold tabular-nums text-[#283B37]">{books.length}</span>
                      <span className="text-xs text-[#7B8580]">total books</span>
                    </div>
                  </div>
                  <div className="mt-1 space-y-2">
                    {([
                      { name: "Finished", value: finishedBooks.length, color: shelfColors.finished },
                      { name: "In library", value: books.filter((book) => book.status === "library").length, color: shelfColors.library },
                      { name: "Wishlist", value: books.filter((book) => book.status === "wishlist").length, color: shelfColors.wishlist },
                    ]).map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-[#66716B]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />{entry.name}</span>
                        <span className="font-semibold tabular-nums text-[#35443E]">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
            <div className="min-w-0 rounded-2xl border border-[#E7E6DE] bg-white p-4 shadow-[0_8px_25px_rgba(49,63,55,0.04)] sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-[#283B37]">The genres you return to</h2>
                  <p className="mt-1 text-sm text-[#7B8580]">Most read, based on finished books</p>
                </div>
                {mostReadGenre && <span className="rounded-full bg-[#E6F0E9] px-3 py-1 text-xs font-semibold text-[#517464]">Your top genre: {mostReadGenre.genre}</span>}
              </div>
              {isLoading ? (
                <div className="flex h-[230px] items-center justify-center text-sm text-[#8A938E]">Finding your favorite genres…</div>
              ) : topGenres.length === 0 ? (
                <div className="flex h-[230px] items-center justify-center text-center text-sm text-[#8A938E]">Finish a book to start discovering your most-read genres.</div>
              ) : (
                <div className="h-[230px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topGenres} layout="vertical" margin={{ top: 0, right: 18, left: 6, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke="#EDF0EB" />
                      <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#7B8580", fontSize: 12 }} />
                      <YAxis type="category" dataKey="genre" width={100} axisLine={false} tickLine={false} tick={{ fill: "#59665F", fontSize: 12 }} />
                      <Tooltip cursor={{ fill: "#F6F7F3" }} contentStyle={{ border: "1px solid #E7E6DE", borderRadius: 12 }} formatter={(value) => [`${value} ${value === 1 ? "book" : "books"}`, "Finished"]} />
                      <Bar dataKey="count" name="Finished" radius={[0, 8, 8, 0]} barSize={22}>
                        {topGenres.map((entry, index) => <Cell key={entry.genre} fill={["#548C83", "#E9785B", "#E8B653", "#7583B2", "#87A66E"][index % 5]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-[#F2E7D6] p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#987044]">A note to your future self</p>
                <h2 className="mt-3 font-serif text-2xl leading-snug text-[#283B37]">
                  {finishedBooks.length === 0 ? "The first page is its own kind of progress." : periodFinishedBooks.length === 0 ? "A quiet chapter still belongs to the story." : `${periodFinishedBooks.length} ${periodFinishedBooks.length === 1 ? "story" : "stories"} found their way to your finished shelf.`}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#75695C]">
                  {finishedBooks.length === 0
                    ? "There is no pace to keep and no list to race. Start wherever curiosity takes you."
                    : periodFinishedBooks.length === 0
                      ? `Your finished shelf holds ${finishedBooks.length} ${finishedBooks.length === 1 ? "book" : "books"}. Pick up a story when the moment feels right; the pages will be here.`
                      : `That is ${periodDescription}, one page at a time. Your reading path does not need to look like anyone else's to be worth celebrating.`}
                </p>
              </div>
              <div className="mt-7 border-t border-[#DCCBB1] pt-4 text-sm text-[#806F5A]">
                {mostReadGenre ? `Your most-read genre is ${mostReadGenre.genre}, with ${mostReadGenre.count} ${mostReadGenre.count === 1 ? "finished book" : "finished books"}.` : "Every finished book will add another detail to your reading portrait."}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
