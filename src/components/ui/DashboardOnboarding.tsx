"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookHeart, Compass, Library, Sparkles, X } from "lucide-react";

const tourSteps = [
  {
    title: "Your Library",
    description: "Add books you are reading and keep your whole collection organized here.",
    icon: Library,
    target: "library",
  },
  {
    title: "Finished Books",
    description: "Move a book here when you finish reading to keep your reading history together.",
    icon: BookHeart,
    target: "finished",
  },
  {
    title: "Your Reading Room",
    description: "Save books you want to read next in your Wishlist, ready whenever you are.",
    icon: BookHeart,
    target: "wishlist",
  },
  {
    title: "Reading insights",
    description: "See your reading patterns and progress at a glance in Insights.",
    icon: Compass,
    target: "insights",
  },
  {
    title: "Book recommendations",
    description: "Choose favorite genres in your profile to get book recommendations tuned to your taste.",
    icon: Sparkles,
    target: "#recommendations-heading",
  },
];

export default function DashboardOnboarding() {
  const router = useRouter();
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [tourPosition, setTourPosition] = useState({ top: 100, left: 280 });
  const checkedWelcome = useRef(false);
  const highlightedTarget = useRef<HTMLElement | null>(null);
  const previousTargetStyle = useRef({ position: "", zIndex: "", boxShadow: "", borderRadius: "" });

  const clearTourHighlight = useCallback(() => {
    if (!highlightedTarget.current) return;
    Object.assign(highlightedTarget.current.style, previousTargetStyle.current);
    highlightedTarget.current = null;
  }, []);

  const positionTour = useCallback((index: number) => {
    clearTourHighlight();
    const targetKey = tourSteps[index].target;
    const selector = targetKey.startsWith("#") ? targetKey : `[data-app-tour="${targetKey}"]`;
    const target = Array.from(document.querySelectorAll<HTMLElement>(selector))
      .find((element) => element.getBoundingClientRect().width > 0);
    if (!target) {
      setTourPosition({ top: 100, left: Math.max(16, window.innerWidth - 360) });
      return;
    }

    target.scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" });
    previousTargetStyle.current = {
      position: target.style.position,
      zIndex: target.style.zIndex,
      boxShadow: target.style.boxShadow,
      borderRadius: target.style.borderRadius,
    };
    Object.assign(target.style, {
      position: "relative",
      zIndex: "70",
      boxShadow: "0 0 0 4px white, 0 0 0 7px #548C83",
      borderRadius: "8px",
    });
    highlightedTarget.current = target;

    requestAnimationFrame(() => {
      const rect = target.getBoundingClientRect();
      const bubbleWidth = Math.min(352, window.innerWidth - 32);
      const left = rect.right + bubbleWidth + 16 <= window.innerWidth
        ? rect.right + 16
        : Math.max(16, Math.min(rect.left, window.innerWidth - bubbleWidth - 16));
      const top = Math.max(76, Math.min(rect.top, window.innerHeight - 300));
      setTourPosition({ top, left });
    });
  }, [clearTourHighlight]);

  useEffect(() => {
    if (checkedWelcome.current) return;
    checkedWelcome.current = true;

    const url = new URL(window.location.href);
    if (url.searchParams.get("welcome") !== "1") return;

    queueMicrotask(() => setWelcomeOpen(true));
    url.searchParams.delete("welcome");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tour") !== "1") return;
    url.searchParams.delete("tour");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new Event("book-hub-open-mobile-nav"));
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => {
      setTourOpen(true);
      positionTour(0);
    }));
    return () => cancelAnimationFrame(frame);
  }, [positionTour]);

  const closeWelcome = () => setWelcomeOpen(false);
  const skipTour = () => {
    clearTourHighlight();
    setTourOpen(false);
    setTourStep(0);
  };

  const moveTour = (nextStep: number) => {
    setTourStep(nextStep);
    positionTour(nextStep);
  };

  const startTour = () => {
    window.dispatchEvent(new Event("book-hub-open-mobile-nav"));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTourOpen(true);
      positionTour(0);
    }));
  };

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={startTour}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-textPrimary transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentHover"
        >
          <Compass size={16} aria-hidden="true" /> Take a quick tour
        </button>
      </div>

      {welcomeOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-end bg-black/45 p-4 pt-20 sm:pt-24 md:pr-8"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeWelcome();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
            className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 text-textPrimary shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={closeWelcome}
              aria-label="Close welcome dialog"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-textSecondary transition hover:bg-page hover:text-textPrimary"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F0E9] text-[#244A46]">
              <BookHeart size={23} aria-hidden="true" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accentHover">Welcome to Book Hub</p>
            <h2 id="welcome-title" className="mt-2 font-serif text-3xl text-textPrimary">Make Book Hub yours</h2>
            <p className="mt-3 text-sm leading-6 text-textSecondary">
              Pick favorite genres and set a reading goal to make your reading room feel like your own.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeWelcome}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-textPrimary transition hover:bg-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentHover"
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/profile?onboarding=1")}
                className="rounded-lg bg-sidebar px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accentHover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentHover"
              >
                Set up my profile
              </button>
            </div>
          </section>
        </div>
      )}

      {tourOpen && (() => {
        const step = tourSteps[tourStep];
        const Icon = step.icon;
        return (
          <section
            role="dialog"
            aria-modal="false"
            aria-labelledby="tour-title"
            style={{ top: tourPosition.top, left: tourPosition.left }}
            className="fixed z-[110] w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-5 text-textPrimary shadow-2xl"
          >
              <button
                type="button"
                onClick={skipTour}
                aria-label="Skip tour"
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-textSecondary transition hover:bg-page hover:text-textPrimary"
              >
                <X size={18} aria-hidden="true" />
              </button>
              <div className="mb-5 flex items-center justify-between pr-10">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accentHover">A quick tour</p>
                <p className="text-xs tabular-nums text-textSecondary">{tourStep + 1} of {tourSteps.length}</p>
              </div>
              <div className="flex gap-1.5" aria-hidden="true">
                {tourSteps.map((item, index) => (
                  <span key={item.title} className={`h-1 flex-1 rounded-full ${index <= tourStep ? "bg-accentHover" : "bg-border"}`} />
                ))}
              </div>
              <span className="mt-7 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F0E9] text-[#244A46]">
                <Icon size={23} aria-hidden="true" />
              </span>
              <h2 id="tour-title" className="mt-4 font-serif text-2xl text-textPrimary">{step.title}</h2>
              <p className="mt-2 min-h-14 text-sm leading-6 text-textSecondary">{step.description}</p>
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={skipTour}
                  className="text-sm font-medium text-textSecondary transition hover:text-textPrimary"
                >
                  Skip tour
                </button>
                <div className="flex gap-2">
                  {tourStep > 0 && (
                    <button
                      type="button"
                      onClick={() => moveTour(tourStep - 1)}
                      aria-label="Previous tour step"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-textPrimary transition hover:bg-page"
                    >
                      <ArrowLeft size={17} aria-hidden="true" />
                    </button>
                  )}
                  {tourStep < tourSteps.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => moveTour(tourStep + 1)}
                      className="inline-flex items-center gap-2 rounded-lg bg-sidebar px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accentHover"
                    >
                      Next <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={skipTour}
                      className="rounded-lg bg-sidebar px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accentHover"
                    >
                      Finish
                    </button>
                  )}
                </div>
              </div>
          </section>
        );
      })()}
    </>
  );
}