"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Menu, Moon, Sun } from "lucide-react";
import Avatar from "../ui/Avatar";

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("book-hub-theme-change", onChange);
  return () => window.removeEventListener("book-hub-theme-change", onChange);
}

function getThemeSnapshot(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): "light" | "dark" {
  return "light";
}

export default function TopNavBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [open, setOpen] = useState(false);
  const themeMode = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const [profile, setProfile] = useState<{ name: string; email: string; avatarUrl: string | null }>({
    name: "Reader",
    email: "",
    avatarUrl: null,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("book-hub-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      document.documentElement.dataset.theme = savedTheme;
      window.dispatchEvent(new Event("book-hub-theme-change"));
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = themeMode === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("book-hub-theme", nextTheme);
    window.dispatchEvent(new Event("book-hub-theme-change"));
  };

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) return;
        const result = await response.json();
        if (!cancelled) setProfile(result.user);
      } catch (error) {
        console.error("Could not load navbar profile", error);
      }
    }

    const handleProfileUpdated = (event: Event) => {
      const updatedProfile = (event as CustomEvent<typeof profile>).detail;
      if (updatedProfile) setProfile(updatedProfile);
    };

    void loadProfile();
    window.addEventListener("profile-updated", handleProfileUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("profile-updated", handleProfileUpdated);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-border bg-page px-4 sm:px-6 md:left-64">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-textPrimary transition hover:bg-accent md:hidden"
        >
          <Menu size={21} aria-hidden="true" />
        </button>
        <span className="font-semibold text-textPrimary md:hidden">Book Hub</span>
      </div>

      <div className="relative flex items-center" ref={dropdownRef}>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${themeMode === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${themeMode === "light" ? "dark" : "light"} mode`}
          className="mr-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-textPrimary transition hover:bg-accent hover:text-accentHover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentHover"
        >
          {themeMode === "light" ? <Moon size={17} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
        </button>

        {/* Profile Avatar */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          type="button"
          aria-label="Open account menu"
          aria-expanded={open}
          className="h-9 w-9 overflow-hidden rounded-full border border-border transition hover:ring-2 hover:ring-accentHover"
        >
          <Avatar
            name={profile.name}
            imageUrl={profile.avatarUrl || undefined}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-12 w-56 rounded-lg border border-border bg-card py-2 shadow-md">
            <div className="border-b border-border px-4 pb-3 pt-1">
              <p className="truncate text-sm font-semibold text-textPrimary">{profile.name}</p>
              <p className="truncate text-xs text-textSecondary">{profile.email}</p>
            </div>
            <Link
              href="/dashboard/profile"
              className="block px-4 py-2 text-sm text-textPrimary transition hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              View Profile
            </Link>

          </div>
        )}
      </div>
    </header>
  );
}
